import { NextRequest, NextResponse } from "next/server";
import https from "node:https";

export const runtime = "nodejs";
export const maxDuration = 30;

function httpsPost(
  url: string,
  headers: Record<string, string>,
  body: Buffer | string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 500,
            body: Buffer.concat(chunks).toString("utf-8"),
          });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function buildMultipartBody(
  fields: { name: string; value: string }[],
  file: { name: string; filename: string; type: string; data: Buffer }
): { contentType: string; body: Buffer } {
  const boundary = "----VoiceUpload" + Date.now();
  const parts: Buffer[] = [];
  const CRLF = "\r\n";

  for (const field of fields) {
    parts.push(
      Buffer.from(
        `--${boundary}${CRLF}Content-Disposition: form-data; name="${field.name}"${CRLF}${CRLF}${field.value}${CRLF}`
      )
    );
  }

  parts.push(
    Buffer.from(
      `--${boundary}${CRLF}Content-Disposition: form-data; name="${file.name}"; filename="${file.filename}"${CRLF}Content-Type: ${file.type}${CRLF}${CRLF}`
    )
  );
  parts.push(file.data);
  parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`));

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat(parts),
  };
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "Keine Audiodatei empfangen" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API-Key nicht konfiguriert" },
        { status: 500 }
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const ext = audioFile.type?.includes("webm") ? "webm" : "m4a";
    const mimeType = audioFile.type || "audio/webm";

    console.log(`[voice] Audio: ${audioBuffer.length} bytes (${mimeType})`);

    // Step 1: Transcribe with Groq Whisper (using native https)
    const t1 = Date.now();
    const { contentType, body: multipartBody } = buildMultipartBody(
      [
        { name: "model", value: "whisper-large-v3-turbo" },
        { name: "response_format", value: "verbose_json" },
      ],
      {
        name: "file",
        filename: `recording.${ext}`,
        type: mimeType,
        data: audioBuffer,
      }
    );

    const whisperRes = await httpsPost(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": contentType,
      },
      multipartBody
    );

    console.log(`[voice] Whisper: ${Date.now() - t1}ms (status ${whisperRes.status})`);

    if (whisperRes.status !== 200) {
      console.error("[voice] Whisper error:", whisperRes.body.slice(0, 300));
      return NextResponse.json(
        { error: "Transkription fehlgeschlagen" },
        { status: 500 }
      );
    }

    const whisperData = JSON.parse(whisperRes.body);
    const transcript = whisperData.text?.trim();
    const detectedLang = whisperData.language || "unknown";

    console.log(`[voice] lang=${detectedLang} | "${transcript?.slice(0, 80)}"`);

    if (!transcript) {
      return NextResponse.json(
        { error: "Kein Text erkannt. Bitte deutlicher sprechen." },
        { status: 400 }
      );
    }

    // Step 2: Translate with Groq LLM (fast 8B model) using native https
    const t2 = Date.now();
    let translations: { de?: string; tr?: string; ru?: string } = {};

    const deepLKey = process.env.DEEPL_API_KEY;
    const useDeepL = deepLKey && deepLKey !== "your_deepl_api_key";

    if (useDeepL) {
      const langs = [
        { code: "DE", key: "de" as const },
        { code: "TR", key: "tr" as const },
        { code: "RU", key: "ru" as const },
      ];

      const results = await Promise.allSettled(
        langs.map(async (lang) => {
          const params = new URLSearchParams({
            auth_key: deepLKey,
            text: transcript,
            target_lang: lang.code,
          });
          const res = await httpsPost(
            "https://api-free.deepl.com/v2/translate",
            { "Content-Type": "application/x-www-form-urlencoded" },
            params.toString()
          );
          if (res.status !== 200) return null;
          const data = JSON.parse(res.body);
          return { key: lang.key, text: data.translations?.[0]?.text || null };
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          translations[r.value.key] = r.value.text;
        }
      }
    } else {
      const chatBody = JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              'Translate into German (de), Turkish (tr), Russian (ru). Return ONLY JSON: {"de":"...","tr":"...","ru":"..."}',
          },
          { role: "user", content: transcript },
        ],
        temperature: 0,
        max_tokens: 512,
        response_format: { type: "json_object" },
      });

      const chatRes = await httpsPost(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        chatBody
      );

      if (chatRes.status === 200) {
        try {
          const chatData = JSON.parse(chatRes.body);
          translations = JSON.parse(
            chatData.choices?.[0]?.message?.content || "{}"
          );
        } catch {
          // ignore parse errors
        }
      }
    }

    const totalMs = Date.now() - t0;
    console.log(`[voice] Translate: ${Date.now() - t2}ms | Total: ${totalMs}ms`);

    return NextResponse.json({
      transcript,
      translations,
      language: detectedLang,
    });
  } catch (error) {
    console.error("[voice] Error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler bei der Sprachverarbeitung" },
      { status: 500 }
    );
  }
}
