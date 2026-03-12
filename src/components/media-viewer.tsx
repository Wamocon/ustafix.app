"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Mic, ImageIcon, Play } from "lucide-react";
import { deleteMedia } from "@/lib/actions/media";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLightbox, type LightboxItem } from "./media-lightbox";

interface MediaItem {
  id: string;
  type: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_by?: string | null;
}

interface MediaViewerProps {
  media: MediaItem[];
  projectId: string;
  defectId: string;
  currentUserId: string | null;
  canDeleteAll: boolean;
}

export function MediaViewer({
  media,
  projectId,
  defectId,
  currentUserId,
  canDeleteAll,
}: MediaViewerProps) {
  const urls = useMemo(() => {
    const supabase = createClient();
    const result: Record<string, string> = {};
    for (const item of media) {
      const { data } = supabase.storage
        .from("defect-media")
        .getPublicUrl(item.storage_path);
      result[item.id] = data.publicUrl;
    }
    return result;
  }, [media]);

  const lightboxItems: LightboxItem[] = useMemo(
    () =>
      media
        .filter((item) => urls[item.id])
        .map((item) => ({ id: item.id, type: item.type, url: urls[item.id] })),
    [media, urls]
  );

  const { openLightbox, lightboxElement } = useLightbox(lightboxItems);

  function canDeleteItem(item: MediaItem): boolean {
    if (canDeleteAll) return true;
    if (!currentUserId) return false;
    return item.created_by === currentUserId;
  }

  async function handleDelete(e: React.MouseEvent, item: MediaItem) {
    e.stopPropagation();
    if (!canDeleteItem(item)) return;
    try {
      await deleteMedia(item.id, item.storage_path, defectId, projectId);
      toast.success("Datei gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  function getLightboxIndex(item: MediaItem): number {
    return lightboxItems.findIndex((li) => li.id === item.id);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Medien ({media.length})
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {media.map((item, i) => {
          const showDelete = canDeleteItem(item);
          const lbIdx = getLightboxIndex(item);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl bg-muted aspect-square border border-border cursor-pointer"
              onClick={() => lbIdx >= 0 && openLightbox(lbIdx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (lbIdx >= 0) openLightbox(lbIdx);
                }
              }}
            >
              {item.type === "image" && urls[item.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[item.id]}
                  alt="Mangel-Foto"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              )}

              {item.type === "video" && urls[item.id] && (
                <div className="relative h-full w-full">
                  <video
                    src={urls[item.id]}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <Play className="h-5 w-5 text-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
              )}

              {item.type === "audio" && urls[item.id] && (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-3 bg-linear-to-br from-amber-500/10 to-orange-500/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Audio
                  </span>
                </div>
              )}

              {showDelete && (
                <button
                  onClick={(e) => handleDelete(e, item)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-all sm:opacity-0 sm:group-hover:opacity-100 hover:bg-destructive cursor-pointer"
                  aria-label="Datei löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
      {lightboxElement}
    </div>
  );
}
