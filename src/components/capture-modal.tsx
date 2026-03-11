"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { X, Camera, Loader2, Mic, Plus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FAB } from "./fab";
import { createDefect } from "@/lib/actions/defects";
import { uploadFileClient } from "@/lib/upload-client";
import { AudioRecorder } from "./audio-recorder";
import { toast } from "sonner";
import {
  cn,
  MAX_IMAGE_SIZE,
  IMAGE_COMPRESSION_MAX_MB,
  IMAGE_COMPRESSION_MAX_PX,
  formatFileSize,
} from "@/lib/utils";
import imageCompression from "browser-image-compression";
import { validateVideoConstraints } from "@/lib/utils/validate-media";
import { compressVideo } from "@/lib/utils/compress-video";
import {
  saveDefectOffline,
  saveMediaOffline,
  saveVoiceOffline,
} from "@/lib/offline/hooks";
import { syncEngine } from "@/lib/offline/sync-engine";

interface CaptureModalProps {
  projectId: string;
  units: { id: string; name: string }[];
  userId?: string;
}

type Mode = "idle" | "voice" | "media";

export function CaptureModal({ projectId, units, userId }: CaptureModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState("");
  const [priority, setPriority] = useState<"niedrig" | "mittel" | "hoch">(
    "mittel"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const [transcribedText, setTranscribedText] = useState("");
  const [translations, setTranslations] = useState<{
    de?: string;
    tr?: string;
    ru?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls: Record<number, string> = {};
    files.forEach((f, i) => {
      if (f.type.startsWith("image/")) {
        urls[i] = URL.createObjectURL(f);
      }
    });
    queueMicrotask(() => setPreviewUrls(urls));
    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  function reset() {
    setMode("idle");
    setTitle("");
    setUnitId("");
    setPriority("mittel");
    setFiles([]);
    setTranscribedText("");
    setTranslations({});
  }

  function handleClose() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (e.target) e.target.value = "";
    const processed: File[] = [];

    for (const file of selected) {
      if (file.type.startsWith("image/")) {
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: IMAGE_COMPRESSION_MAX_MB,
            maxWidthOrHeight: IMAGE_COMPRESSION_MAX_PX,
            useWebWorker: true,
          });
          if (compressed.size > MAX_IMAGE_SIZE) {
            toast.error(
              `Bild zu groß nach Kompression (${formatFileSize(compressed.size)}). Maximal ${formatFileSize(MAX_IMAGE_SIZE)}.`
            );
            continue;
          }
          processed.push(compressed);
        } catch {
          if (file.size <= MAX_IMAGE_SIZE) {
            processed.push(file);
          } else {
            toast.error("Bild konnte nicht komprimiert werden und ist zu groß.");
          }
        }
      } else if (file.type.startsWith("video/")) {
        const result = await validateVideoConstraints(file);
        if (!result.valid) {
          toast.error(result.error);
          continue;
        }
        try {
          const compressed = await compressVideo(file);
          processed.push(compressed);
        } catch {
          processed.push(file);
        }
      } else {
        processed.push(file);
      }
    }

    setFiles((prev) => [...prev, ...processed]);
    setMode("media");
  }

  function handleVoiceResult(result: {
    transcript: string;
    translations: { de?: string; tr?: string; ru?: string };
    audioBlob: Blob;
  }) {
    setTranscribedText(result.transcript);
    setTranslations(result.translations);
    if (!title) {
      const summary = result.translations.de || result.transcript;
      setTitle(summary.slice(0, 100));
    }
    const audioFile = new File([result.audioBlob], "recording.webm", {
      type: result.audioBlob.type,
    });
    setFiles((prev) => [...prev, audioFile]);
    setMode("media");
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Bitte geben Sie einen Titel ein.");
      return;
    }

    startTransition(async () => {
      try {
        if (!navigator.onLine) {
          if (!userId) {
            toast.error("Offline-Speicherung nicht moeglich. Bitte anmelden.");
            return;
          }
          const defectId = await saveDefectOffline({
            projectId,
            title: title.trim(),
            descriptionOriginal: transcribedText || undefined,
            descriptionDe: translations.de,
            descriptionTr: translations.tr,
            descriptionRu: translations.ru,
            unitId: unitId || undefined,
            priority,
            createdBy: userId,
          });

          for (const file of files) {
            const type = file.type.startsWith("image/")
              ? "image" as const
              : file.type.startsWith("video/")
                ? "video" as const
                : "audio" as const;

            if (type === "audio") {
              await saveVoiceOffline({
                defectId,
                projectId,
                blob: file,
                fileName: file.name,
              });
            } else {
              await saveMediaOffline({ defectId, projectId, file, type });
            }
          }

          syncEngine.refreshCounts();
          toast.success("Mangel offline gespeichert. Wird synchronisiert, sobald online.");
          handleClose();
          return;
        }

        const defect = await createDefect({
          projectId,
          title: title.trim(),
          descriptionOriginal: transcribedText || undefined,
          descriptionDe: translations.de,
          descriptionTr: translations.tr,
          descriptionRu: translations.ru,
          unitId: unitId || undefined,
          priority,
        });

        await Promise.all(
          files.map((file) => uploadFileClient(file, defect.id, projectId))
        );

        toast.success("Mangel erfasst!");
        handleClose();
      } catch {
        if (!navigator.onLine && userId) {
          try {
            const defectId = await saveDefectOffline({
              projectId,
              title: title.trim(),
              descriptionOriginal: transcribedText || undefined,
              descriptionDe: translations.de,
              descriptionTr: translations.tr,
              descriptionRu: translations.ru,
              unitId: unitId || undefined,
              priority,
              createdBy: userId,
            });

            for (const file of files) {
              const type = file.type.startsWith("image/")
                ? "image" as const
                : file.type.startsWith("video/")
                  ? "video" as const
                  : "audio" as const;
              await saveMediaOffline({ defectId, projectId, file, type });
            }

            syncEngine.refreshCounts();
            toast.success("Mangel offline gespeichert.");
            handleClose();
            return;
          } catch {
            // fall through
          }
        }
        toast.error("Fehler beim Speichern des Mangels.");
      }
    });
  }

  return (
    <>
      <FAB onClick={() => setOpen(true)} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <motion.div
              initial={{ y: "3%" }}
              animate={{ y: 0 }}
              exit={{ y: "3%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="flex h-full flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-extrabold">Mangel erfassen</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Schließen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
                {/* Quick action buttons */}
                {mode === "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <button
                      onClick={() => setMode("voice")}
                      className="group flex flex-col items-center gap-4 rounded-3xl bg-linear-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/20 p-8 transition-all hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 active:scale-[0.97] cursor-pointer"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 transition-transform group-hover:scale-105">
                        <Mic className="h-9 w-9" />
                      </div>
                      <span className="text-sm font-bold">Sprechen</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex flex-col items-center gap-4 rounded-3xl bg-linear-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-500/20 p-8 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.97] cursor-pointer"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105">
                        <Camera className="h-9 w-9" />
                      </div>
                      <span className="text-sm font-bold">Foto / Video</span>
                    </button>
                  </motion.div>
                )}

                {/* Voice recorder */}
                {mode === "voice" && (
                  <AudioRecorder
                    onResult={handleVoiceResult}
                    onCancel={() => setMode("idle")}
                  />
                )}

                {/* File previews */}
                {files.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-muted-foreground">
                      Anhänge ({files.length})
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="relative shrink-0 h-20 w-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border"
                        >
                          {f.type.startsWith("image/") && previewUrls[i] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={previewUrls[i]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-muted-foreground px-1 text-center truncate">
                              {f.name}
                            </span>
                          )}
                          <button
                            onClick={() =>
                              setFiles((prev) =>
                                prev.filter((_, idx) => idx !== i)
                              )
                            }
                            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white text-xs shadow-md cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-amber-500/40 transition-colors cursor-pointer"
                      >
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Title & details */}
                {(mode === "media" || title || transcribedText) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="defect-title"
                        className="text-sm font-semibold"
                      >
                        Titel *
                      </label>
                      <input
                        id="defect-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="z.B. Glasscheibe wackelt"
                        className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                      />
                    </div>

                    {transcribedText && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold">
                            Transkription
                          </label>
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <textarea
                          value={transcribedText}
                          onChange={(e) => setTranscribedText(e.target.value)}
                          rows={3}
                          className="flex w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground resize-none"
                        />
                        {translations.de && (
                          <p className="text-xs text-muted-foreground rounded-xl bg-muted px-3 py-2">
                            🇩🇪 {translations.de}
                          </p>
                        )}
                      </div>
                    )}

                    {units.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">
                          Einheit / Bereich
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setUnitId("")}
                            className={cn(
                              "rounded-full px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer",
                              !unitId
                                ? "gradient-primary text-white shadow-md shadow-amber-500/20"
                                : "bg-card border border-border text-muted-foreground"
                            )}
                          >
                            Keine
                          </button>
                          {units.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => setUnitId(u.id)}
                              className={cn(
                                "rounded-full px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer",
                                unitId === u.id
                                  ? "gradient-primary text-white shadow-md shadow-amber-500/20"
                                  : "bg-card border border-border text-muted-foreground"
                              )}
                            >
                              {u.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Priorität</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { value: "niedrig", label: "Niedrig", emoji: "🟢" },
                            { value: "mittel", label: "Mittel", emoji: "🟡" },
                            { value: "hoch", label: "Hoch", emoji: "🔴" },
                          ] as const
                        ).map((p) => (
                          <button
                            key={p.value}
                            onClick={() => setPriority(p.value)}
                            className={cn(
                              "h-12 rounded-2xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                              priority === p.value
                                ? "gradient-primary text-white shadow-md shadow-amber-500/20"
                                : "bg-card border border-border text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="text-xs">{p.emoji}</span>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bottom submit */}
              {(mode === "media" || title) && (
                <div className="border-t border-border p-4 safe-area-bottom">
                  <button
                    onClick={handleSubmit}
                    disabled={isPending || !title.trim()}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-primary text-lg font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Mangel speichern
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
