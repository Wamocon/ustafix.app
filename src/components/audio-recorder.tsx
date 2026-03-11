"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, ArrowLeft, Sparkles } from "lucide-react";
import { MAX_AUDIO_SIZE, formatFileSize } from "@/lib/utils";
import { motion } from "framer-motion";

interface AudioRecorderProps {
  onResult: (result: {
    transcript: string;
    translations: { de?: string; tr?: string; ru?: string };
    audioBlob: Blob;
  }) => void;
  onCancel: () => void;
}

type RecordingState = "idle" | "recording" | "processing";

export function AudioRecorder({ onResult, onCancel }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
      setState("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError(
        "Mikrofon-Zugriff verweigert. Bitte erlauben Sie den Zugriff in den Einstellungen."
      );
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    return new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  async function handleStop() {
    setState("processing");
    const blob = await stopRecording();
    if (!blob || blob.size === 0) {
      setError("Aufnahme leer. Bitte versuchen Sie es erneut.");
      setState("idle");
      return;
    }

    if (blob.size > MAX_AUDIO_SIZE) {
      setError(`Aufnahme zu groß (${formatFileSize(blob.size)}). Maximal ${formatFileSize(MAX_AUDIO_SIZE)} erlaubt.`);
      setState("idle");
      return;
    }

    try {
      const formData = new FormData();
      const ext = blob.type.includes("webm") ? "webm" : "m4a";
      formData.append("audio", blob, `recording.${ext}`);

      const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
      const voiceUrl = isDev ? "http://localhost:3001/api/voice" : "/api/voice";

      console.log(`[recorder] Sending ${blob.size} bytes (${blob.type}) to ${voiceUrl}`);

      const response = await fetch(voiceUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error ${response.status}`);
      }

      if (!data.transcript) {
        throw new Error("Kein Text erkannt. Bitte deutlicher sprechen.");
      }

      onResult({
        transcript: data.transcript,
        translations: data.translations || {},
        audioBlob: blob,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      console.error("[recorder] Voice API error:", msg);
      setError(msg);
      setState("idle");
    }
  }

  function formatDuration(s: number) {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-6"
    >
      <button
        onClick={onCancel}
        className="self-start flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center"
        >
          {error}
        </motion.div>
      )}

      {/* Recording visualization */}
      <div className="relative flex h-36 w-36 items-center justify-center">
        {state === "recording" && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/15"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-3 rounded-full bg-red-500/20"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                delay: 0.15,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-6 rounded-full bg-red-500/25"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                delay: 0.3,
                ease: "easeInOut",
              }}
            />
          </>
        )}
        {state === "processing" && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        )}
        <div
          className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full text-white shadow-xl ${
            state === "recording"
              ? "bg-linear-to-br from-red-500 to-red-600 shadow-red-500/40"
              : state === "processing"
                ? "gradient-primary shadow-amber-500/30"
                : "bg-linear-to-br from-red-500 to-red-600 shadow-red-500/30"
          }`}
        >
          {state === "processing" ? (
            <Sparkles className="h-10 w-10 animate-pulse" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </div>
      </div>

      {/* Timer / Status text */}
      {state === "recording" && (
        <div className="text-center">
          <p className="text-3xl font-mono font-extrabold tabular-nums text-red-500">
            {formatDuration(duration)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Aufnahme läuft...</p>
        </div>
      )}
      {state === "processing" && (
        <div className="text-center">
          <p className="text-sm font-semibold gradient-text">
            KI verarbeitet...
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Transkription und Übersetzung
          </p>
        </div>
      )}
      {state === "idle" && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Tippen Sie auf die Taste und sprechen Sie in beliebiger Sprache. Die KI
          transkribiert und übersetzt automatisch.
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {state === "idle" && (
          <motion.button
            onClick={startRecording}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="flex h-18 w-18 items-center justify-center rounded-full bg-linear-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-500/30 cursor-pointer"
            aria-label="Aufnahme starten"
          >
            <Mic className="h-8 w-8" />
          </motion.button>
        )}
        {state === "recording" && (
          <motion.button
            onClick={handleStop}
            whileTap={{ scale: 0.92 }}
            className="flex h-18 w-18 items-center justify-center rounded-full bg-foreground text-background shadow-xl cursor-pointer"
            aria-label="Aufnahme stoppen"
          >
            <Square className="h-7 w-7" fill="currentColor" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
