"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Images,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
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

const STATUS_KEYS: Record<DefectStatus, string> = {
  offen: "status.offen",
  in_arbeit: "status.in_arbeit",
  erledigt: "status.erledigt",
  problem: "status.problem",
};

const DELETE_CONFIRM_MESSAGE = "Bist du sicher, dass du das löschen willst?";

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
  const t = useTranslation();
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
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls: Record<number, string> = {};
    files.forEach((f, i) => {
      if (f.type.startsWith("image/") || f.type.startsWith("video/")) {
        urls[i] = URL.createObjectURL(f);
      }
    });
    queueMicrotask(() => setPreviewUrls(urls));
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setNote("");
        setFiles([]);
        setUploadProgress(null);
        setCompressionProgress(null);
      });
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
        toast.error(t("statusModal.maxFiles"));
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
            toast.error(t("statusModal.imageTooBig"));
            continue;
          }
          setFiles((prev) => [...prev, compressed]);
          addedCount++;
        } catch {
          if (file.size <= MAX_IMAGE_SIZE) {
            setFiles((prev) => [...prev, file]);
            addedCount++;
          } else {
            toast.error(t("statusModal.imageCompressFailed"));
          }
        }
      } else {
        toast.error(t("statusModal.onlyPhotosVideos"));
      }
    }
  }

  function removeFile(index: number) {
    if (!window.confirm(DELETE_CONFIRM_MESSAGE)) return;
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        if (!navigator.onLine && userId) {
          setUploadProgress(t("statusModal.offlineSaving"));
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
          const toL = t(STATUS_KEYS[toStatus]);
          toast.success(t("statusModal.statusSavedOffline", { label: toL }));
          onClose();
          return;
        }

        setUploadProgress(t("statusModal.saving"));

        const transition = await performStatusTransition({
          defectId,
          projectId,
          fromStatus,
          toStatus,
          note: note.trim(),
        });

        if (files.length > 0) {
          setUploadProgress(t("statusModal.uploading", { current: "0", total: String(files.length) }));

          for (let i = 0; i < files.length; i++) {
            setUploadProgress(
              t("statusModal.uploading", { current: String(i + 1), total: String(files.length) })
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
        const toLabel = t(STATUS_KEYS[toStatus]);
        toast.success(t("statusModal.statusChanged", { label: toLabel }));
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
            toast.success(t("statusModal.offlineSaved"));
            onClose();
            return;
          } catch {
            // fall through
          }
        }
        setUploadProgress(null);
        const message =
          err instanceof Error ? err.message : t("statusModal.transitionError");
        toast.error(message);
      }
    });
  }

  const fromLabel = t(STATUS_KEYS[fromStatus]);
  const toLabel = t(STATUS_KEYS[toStatus]);

  const notePlaceholderKey = `statusModal.placeholders.${fromStatus}->${toStatus}`;
  const notePlaceholder = t(notePlaceholderKey) !== notePlaceholderKey
    ? t(notePlaceholderKey)
    : t("statusModal.enterDescription");

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
              <h2 className="text-lg font-extrabold">{t("statusModal.title")}</h2>
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* Status transition visual */}
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-5 py-3">
                  <span className="text-lg">{fromStatus === "offen" ? "🔴" : fromStatus === "in_arbeit" ? "🟡" : fromStatus === "problem" ? "🟣" : "🟢"}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {fromLabel}
                  </span>
                </div>
                <span className="text-2xl text-muted-foreground">→</span>
                <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 px-5 py-3">
                  <span className="text-lg">{toStatus === "offen" ? "🔴" : toStatus === "in_arbeit" ? "🟡" : toStatus === "problem" ? "🟣" : "🟢"}</span>
                  <span className="text-xs font-bold">{toLabel}</span>
                </div>
              </div>

              {/* Permission warning */}
              {!isAllowed && (
                <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">
                      {t("statusModal.noPermission")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("status.onlyRoles")}{" "}
                      {rule.allowedRoles
                        .map((r) =>
                          r === "admin"
                            ? t("status.admins")
                            : r === "manager"
                              ? t("status.manager")
                              : t("status.worker")
                        )
                        .join(` ${t("status.and")} `)}{" "}
                      {t("status.canTransition")}
                    </p>
                  </div>
                </div>
              )}

              {/* Note field */}
              {isAllowed && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    {t("statusModal.description")}{rule.requiresNote ? " *" : ""}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={notePlaceholder}
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
                      {t("statusModal.photoVideo")} *
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {files.length}/5
                    </span>
                  </div>

                  {files.length === 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-6 transition-all hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                          <Camera className="h-6 w-6 text-amber-600" />
                        </div>
                        <p className="text-xs font-semibold">
                          {t("statusModal.capturePhotoVideo")}
                        </p>
                      </button>
                      <button
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-6 transition-all hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                          <Images className="h-6 w-6 text-amber-600" />
                        </div>
                        <p className="text-xs font-semibold">
                          Galerie
                        </p>
                      </button>
                    </div>
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
                        <div className="flex shrink-0 h-24 flex-col gap-1">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-1 w-20 items-center justify-center rounded-t-2xl border-2 border-dashed border-border hover:border-amber-500/40 transition-colors cursor-pointer"
                          >
                            <Camera className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => galleryInputRef.current?.click()}
                            className="flex flex-1 w-20 items-center justify-center rounded-b-2xl border-2 border-dashed border-border hover:border-amber-500/40 transition-colors cursor-pointer"
                          >
                            <Images className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {compressionProgress !== null && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        {t("statusModal.videoCompressing")} {compressionProgress}%
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
                      {t(rule.labelKey)}
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
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
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
