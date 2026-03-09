import http from "node:http";
import https from "node:https";

const PORT = 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY not set. Run: set GROQ_API_KEY=your_key");
  process.exit(1);
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            body: Buffer.concat(chunks).toString(),
          })
        );
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function parseMultipart(buf, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  let start = buf.indexOf(boundaryBuf) + boundaryBuf.length;

  while (start < buf.length) {
    const nextBoundary = buf.indexOf(boundaryBuf, start);
    if (nextBoundary === -1) break;

    const part = buf.subarray(start, nextBoundary);
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) { start = nextBoundary + boundaryBuf.length; continue; }

    const headerStr = part.subarray(0, headerEnd).toString();
    let data = part.subarray(headerEnd + 4);
    if (data[data.length - 1] === 10 && data[data.length - 2] === 13) {
      data = data.subarray(0, data.length - 2);
    }

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const typeMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    parts.push({
      name: nameMatch?.[1],
      filename: filenameMatch?.[1],
      type: typeMatch?.[1]?.trim(),
      data,
    });

    start = nextBoundary + boundaryBuf.length;
  }
  return parts;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/voice") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const t0 = Date.now();

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    const ct = req.headers["content-type"] || "";
    const boundaryMatch = ct.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No boundary" }));
      return;
    }

    const parts = parseMultipart(body, boundaryMatch[1]);
    const audioPart = parts.find((p) => p.name === "audio");

    if (!audioPart || audioPart.data.length === 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No audio" }));
      return;
    }

    console.log(`[voice] Audio: ${audioPart.data.length} bytes (${audioPart.type})`);

    // Step 1: Whisper transcription
    const t1 = Date.now();
    const boundary = "----Groq" + Date.now();
    const mp = [];
    for (const f of [
      { name: "model", val: "whisper-large-v3-turbo" },
      { name: "response_format", val: "verbose_json" },
    ]) {
      mp.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"\r\n\r\n${f.val}\r\n`));
    }
    mp.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${audioPart.filename || "audio.webm"}"\r\nContent-Type: ${audioPart.type || "audio/webm"}\r\n\r\n`
      )
    );
    mp.push(audioPart.data);
    mp.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    const mpBody = Buffer.concat(mp);

    const wRes = await httpsPost(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      mpBody
    );

    console.log(`[voice] Whisper: ${Date.now() - t1}ms (${wRes.status})`);

    if (wRes.status !== 200) {
      console.error("[voice] Whisper error:", wRes.body.slice(0, 200));
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Transkription fehlgeschlagen" }));
      return;
    }

    const wData = JSON.parse(wRes.body);
    const transcript = wData.text?.trim();
    const lang = wData.language || "unknown";
    console.log(`[voice] lang=${lang} | "${transcript?.slice(0, 80)}"`);

    if (!transcript) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Kein Text erkannt" }));
      return;
    }

    // Step 2: Translation with Groq LLM
    const t2 = Date.now();
    let translations = {};

    const chatBody = JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: 'Translate into German (de), Turkish (tr), Russian (ru). Return ONLY JSON: {"de":"...","tr":"...","ru":"..."}',
        },
        { role: "user", content: transcript },
      ],
      temperature: 0,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const tRes = await httpsPost(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      chatBody
    );

    if (tRes.status === 200) {
      try {
        const tData = JSON.parse(tRes.body);
        translations = JSON.parse(tData.choices?.[0]?.message?.content || "{}");
      } catch {}
    }

    console.log(`[voice] Translate: ${Date.now() - t2}ms | Total: ${Date.now() - t0}ms`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ transcript, translations, language: lang }));
  } catch (err) {
    console.error("[voice] Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`[voice-server] Running on http://localhost:${PORT}/api/voice`);
});
