"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  cn,
  getTransitionRule,
  MAX_IMAGE_SIZE,
  formatFileSize,
  IMAGE_COMPRESSION_MAX_MB,
  IMAGE_COMPRESSION_MAX_PX,
} from "@/lib/utils";
import type { DefectStatus, MemberRole } from "@/lib/db/schema";
import {
  performStatusTransition,
  uploadTransitionMedia,
} from "@/lib/actions/transitions";
import { validateVideoConstraints } from "@/lib/utils/validate-media";
import { compressVideo } from "@/lib/utils/compress-video";
import imageCompression from "browser-image-compression";
import { saveTransitionOffline } from "@/lib/offline/hooks";
import { syncEngine } from "@/lib/offline/sync-engine";

interface StatusTransitionModalProps {
  open: boolean;
  onClose: () => void;
  defectId: string;
  projectId: string;
  fromStatus: DefectStatus;
  toStatus: DefectStatus;
  userRole: MemberRole;
  userId?: string;
}

const STATUS_LABELS: Record<DefectStatus, { label: string; emoji: string }> = {
  offen: { label: "Offen", emoji: "🔴" },
  in_arbeit: { label: "In Arbeit", emoji: "🟡" },
  erledigt: { label: "Erledigt", emoji: "🟢" },
};

export function StatusTransitionModal({
  open,
  onClose,
  defectId,
  projectId,
  fromStatus,
  toStatus,
  userRole,
  userId,
}: StatusTransitionModalProps) {
  const rule = getTransitionRule(fromStatus, toStatus);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls: Record<number, string> = {};
    files.forEach((f, i) => {
      if (f.type.startsWith("image/") || f.type.startsWith("video/")) {
        urls[i] = URL.createObjectURL(f);
      }
    });
    setPreviewUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    if (!open) {
      setNote("");
      setFiles([]);
      setUploadProgress(null);
      setCompressionProgress(null);
    }
  }, [open]);

  if (!rule) return null;

  const isAllowed = rule.allowedRoles.includes(userRole);
  const hasRequiredMedia = !rule.requiresMedia || files.length > 0;
  const hasRequiredNote = !rule.requiresNote || note.trim().length > 0;
  const canSubmit = isAllowed && hasRequiredMedia && hasRequiredNote && !isPending;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (e.target) e.target.value = "";

    let addedCount = 0;

    for (const file of selected) {
      if (files.length + addedCount >= 5) {
        toast.error("Maximal 5 Dateien erlaubt.");
        break;
      }

      if (file.type.startsWith("video/")) {
        const result = await validateVideoConstraints(file);
        if (!result.valid) {
          toast.error(result.error);
          continue;
        }

        setCompressionProgress(0);
        try {
          const compressed = await compressVideo(file, (p) =>
            setCompressionProgress(p)
          );
          setFiles((prev) => [...prev, compressed]);
          addedCount++;
        } catch {
          setFiles((prev) => [...prev, file]);
          addedCount++;
        }
        setCompressionProgress(null);
      } else if (file.type.startsWith("image/")) {
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
          setFiles((prev) => [...prev, compressed]);
          addedCount++;
        } catch {
          if (file.size <= MAX_IMAGE_SIZE) {
            setFiles((prev) => [...prev, file]);
            addedCount++;
          } else {
            toast.error("Bild konnte nicht komprimiert werden und ist zu groß.");
          }
        }
      } else {
        toast.error("Nur Fotos und Videos sind erlaubt.");
      }
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        if (!navigator.onLine && userId) {
          setUploadProgress("Offline speichern...");
          await saveTransitionOffline({
            defectId,
            projectId,
            fromStatus,
            toStatus,
            note: note.trim(),
            changedBy: userId,
            files,
          });
          syncEngine.refreshCounts();
          setUploadProgress(null);
          const toL = STATUS_LABELS[toStatus].label;
          toast.success(`Status auf "${toL}" offline gespeichert. Wird synchronisiert.`);
          onClose();
          return;
        }

        setUploadProgress("Statuswechsel wird gespeichert...");

        const transition = await performStatusTransition({
          defectId,
          projectId,
          fromStatus,
          toStatus,
          note: note.trim(),
        });

        if (files.length > 0) {
          setUploadProgress(`Dateien werden hochgeladen (0/${files.length})...`);

          for (let i = 0; i < files.length; i++) {
            setUploadProgress(
              `Dateien werden hochgeladen (${i + 1}/${files.length})...`
            );
            const formData = new FormData();
            formData.append("file", files[i]);
            await uploadTransitionMedia({
              transitionId: transition.id,
              defectId,
              projectId,
              formData,
            });
          }
        }

        setUploadProgress(null);
        const toLabel = STATUS_LABELS[toStatus].label;
        toast.success(`Status auf "${toLabel}" geaendert`);
        onClose();
      } catch (err) {
        if (!navigator.onLine && userId) {
          try {
            await saveTransitionOffline({
              defectId,
              projectId,
              fromStatus,
              toStatus,
              note: note.trim(),
              changedBy: userId,
              files,
            });
            syncEngine.refreshCounts();
            setUploadProgress(null);
            toast.success("Status offline gespeichert.");
            onClose();
            return;
          } catch {
            // fall through
          }
        }
        setUploadProgress(null);
        const message =
          err instanceof Error ? err.message : "Fehler beim Statuswechsel";
        toast.error(message);
      }
    });
  }

  const fromLabel = STATUS_LABELS[fromStatus];
  const toLabel = STATUS_LABELS[toStatus];

  const notePlaceholders: Record<string, string> = {
    "offen->in_arbeit": "z.B. Bin vor Ort, beginne mit der Reparatur...",
    "in_arbeit->erledigt":
      "z.B. Reparatur abgeschlossen, Riss wurde verspachtelt und gestrichen...",
    "erledigt->offen": "z.B. Mangel tritt erneut auf, muss nachgebessert werden...",
    "in_arbeit->offen": "z.B. Material fehlt, Arbeit wird unterbrochen...",
    "offen->erledigt": "z.B. War bereits behoben, Dokumentation nachgeholt...",
    "erledigt->in_arbeit": "z.B. Nachbesserung erforderlich...",
  };

  return (
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
              <h2 className="text-lg font-extrabold">Statuswechsel</h2>
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* Status transition visual */}
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-5 py-3">
                  <span className="text-lg">{fromLabel.emoji}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {fromLabel.label}
                  </span>
                </div>
                <span className="text-2xl text-muted-foreground">→</span>
                <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 px-5 py-3">
                  <span className="text-lg">{toLabel.emoji}</span>
                  <span className="text-xs font-bold">{toLabel.label}</span>
                </div>
              </div>

              {/* Permission warning */}
              {!isAllowed && (
                <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">
                      Keine Berechtigung
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nur{" "}
                      {rule.allowedRoles
                        .map((r) =>
                          r === "admin"
                            ? "Admins"
                            : r === "manager"
                              ? "Manager"
                              : "Arbeiter"
                        )
                        .join(" und ")}{" "}
                      können diesen Statuswechsel durchführen.
                    </p>
                  </div>
                </div>
              )}

              {/* Note field */}
              {isAllowed && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Beschreibung{rule.requiresNote ? " *" : ""}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      notePlaceholders[`${fromStatus}->${toStatus}`] ??
                      "Beschreibung eingeben..."
                    }
                    rows={3}
                    className="flex w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground resize-none"
                  />
                </div>
              )}

              {/* Media upload (when required) */}
              {isAllowed && rule.requiresMedia && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">
                      Foto / Video Nachweis *
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {files.length}/5
                    </span>
                  </div>

                  {files.length === 0 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-8 transition-all hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                        <Camera className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold">
                          Foto oder Video aufnehmen
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Video max. 30 Sek, 720p • Bild max. 5 MB
                        </p>
                      </div>
                    </button>
                  )}

                  {files.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="relative shrink-0 h-24 w-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border"
                        >
                          {f.type.startsWith("image/") && previewUrls[i] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={previewUrls[i]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : f.type.startsWith("video/") && previewUrls[i] ? (
                            <video
                              src={previewUrls[i]}
                              className="h-full w-full object-cover"
                              preload="metadata"
                            />
                          ) : (
                            <span className="text-[10px] text-muted-foreground px-1 text-center truncate">
                              {f.name}
                            </span>
                          )}
                          <button
                            onClick={() => removeFile(i)}
                            disabled={isPending}
                            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white text-xs shadow-md cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {files.length < 5 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-amber-500/40 transition-colors cursor-pointer"
                        >
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  )}

                  {compressionProgress !== null && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        Video wird komprimiert... {compressionProgress}%
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-primary transition-all duration-300"
                          style={{ width: `${compressionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload progress */}
              {uploadProgress && (
                <div className="flex items-center gap-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                  <p className="text-sm font-medium">{uploadProgress}</p>
                </div>
              )}
            </div>

            {/* Bottom submit */}
            {isAllowed && (
              <div className="border-t border-border p-4 safe-area-bottom">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-primary text-lg font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      {rule.label}
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
