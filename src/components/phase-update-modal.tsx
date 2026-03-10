"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Loader2,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  cn,
  MAX_IMAGE_SIZE,
  formatFileSize,
  IMAGE_COMPRESSION_MAX_MB,
  IMAGE_COMPRESSION_MAX_PX,
} from "@/lib/utils";
import type { MemberRole, MediaPhase } from "@/lib/db/schema";
import {
  createPhaseUpdate,
  uploadPhaseUpdateMedia,
} from "@/lib/actions/phase-updates";
import { savePhaseUpdateOffline } from "@/lib/offline/hooks";
import { validateVideoConstraints } from "@/lib/utils/validate-media";
import { compressVideo } from "@/lib/utils/compress-video";
import imageCompression from "browser-image-compression";

interface PhaseUpdateModalProps {
  open: boolean;
  onClose: () => void;
  defectId: string;
  projectId: string;
  userRole: MemberRole;
  currentStatus: string;
  userId?: string;
}

const PHASE_OPTIONS: {
  value: MediaPhase;
  label: string;
  icon: typeof FileText;
  color: string;
  roles: MemberRole[];
}[] = [
  {
    value: "fortschritt",
    label: "Fortschritt",
    icon: FileText,
    color: "text-amber-500 border-amber-500/30 bg-amber-500/5",
    roles: ["admin", "manager", "worker"],
  },
  {
    value: "abnahme",
    label: "Abnahme",
    icon: ClipboardCheck,
    color: "text-green-500 border-green-500/30 bg-green-500/5",
    roles: ["admin", "manager"],
  },
];

export function PhaseUpdateModal({
  open,
  onClose,
  defectId,
  projectId,
  userRole,
  currentStatus,
  userId,
}: PhaseUpdateModalProps) {
  const [phase, setPhase] = useState<MediaPhase>("fortschritt");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
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
      setPhase("fortschritt");
      setNote("");
      setFiles([]);
      setUploadProgress(null);
    }
  }, [open]);

  const availablePhases = PHASE_OPTIONS.filter((p) =>
    p.roles.includes(userRole)
  );

  const canSubmit = note.trim().length > 0 && !isPending;

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
        try {
          const compressed = await compressVideo(file);
          setFiles((prev) => [...prev, compressed]);
          addedCount++;
        } catch {
          setFiles((prev) => [...prev, file]);
          addedCount++;
        }
      } else if (file.type.startsWith("image/")) {
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: IMAGE_COMPRESSION_MAX_MB,
            maxWidthOrHeight: IMAGE_COMPRESSION_MAX_PX,
            useWebWorker: true,
          });
          if (compressed.size > MAX_IMAGE_SIZE) {
            toast.error(
              `Bild zu gross (${formatFileSize(compressed.size)}).`
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
            toast.error("Bild konnte nicht komprimiert werden.");
          }
        }
      } else {
        toast.error("Nur Fotos und Videos sind erlaubt.");
      }
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        if (!navigator.onLine && userId) {
          await savePhaseUpdateOffline({
            defectId,
            projectId,
            phase,
            note: note.trim(),
            createdBy: userId,
            files,
          });
          toast.success("Update offline gespeichert");
          onClose();
          return;
        }

        setUploadProgress("Update wird gespeichert...");

        const update = await createPhaseUpdate({
          defectId,
          projectId,
          phase,
          note: note.trim(),
        });

        if (files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            setUploadProgress(
              `Dateien hochladen (${i + 1}/${files.length})...`
            );
            const formData = new FormData();
            formData.append("file", files[i]);
            await uploadPhaseUpdateMedia({
              phaseUpdateId: update.id,
              defectId,
              projectId,
              phase,
              formData,
            });
          }
        }

        setUploadProgress(null);
        toast.success("Update gespeichert");
        onClose();
      } catch (err) {
        setUploadProgress(null);
        const message =
          err instanceof Error ? err.message : "Fehler beim Speichern";
        toast.error(message);
      }
    });
  }

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
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-extrabold">Update hinzufuegen</h2>
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* Phase selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Phase</label>
                <div className="flex gap-2">
                  {availablePhases.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.value}
                        onClick={() => setPhase(p.value)}
                        className={cn(
                          "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all cursor-pointer",
                          phase === p.value
                            ? `${p.color} border-2`
                            : "border-border bg-card text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Beschreibung *
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    phase === "abnahme"
                      ? "z.B. Abnahme durchgefuehrt, Mangel ist behoben..."
                      : "z.B. Fortschritt: Putz wurde aufgetragen..."
                  }
                  rows={3}
                  className="flex w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground resize-none"
                />
              </div>

              {/* Media */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">
                    Fotos / Videos (optional)
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {files.length}/5
                  </span>
                </div>

                {files.length === 0 ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border p-6 transition-all hover:border-amber-500/40 cursor-pointer"
                  >
                    <Camera className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Foto oder Video hinzufuegen
                    </span>
                  </button>
                ) : (
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
                          onClick={() =>
                            setFiles((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          disabled={isPending}
                          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white text-xs shadow-md cursor-pointer"
                        >
                          x
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
              </div>

              {uploadProgress && (
                <div className="flex items-center gap-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                  <p className="text-sm font-medium">{uploadProgress}</p>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4 safe-area-bottom">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-primary text-lg font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Update speichern"
                )}
              </button>
            </div>

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
