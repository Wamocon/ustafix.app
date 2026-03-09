"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Mic, ImageIcon } from "lucide-react";
import { deleteMedia } from "@/lib/actions/media";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface MediaItem {
  id: string;
  type: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
}

interface MediaViewerProps {
  media: MediaItem[];
  projectId: string;
  defectId: string;
}

export function MediaViewer({ media, projectId, defectId }: MediaViewerProps) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    const newUrls: Record<string, string> = {};

    for (const item of media) {
      const { data } = supabase.storage
        .from("defect-media")
        .getPublicUrl(item.storage_path);
      newUrls[item.id] = data.publicUrl;
    }

    setUrls(newUrls);
  }, [media]);

  async function handleDelete(item: MediaItem) {
    try {
      await deleteMedia(item.id, item.storage_path, defectId, projectId);
      toast.success("Datei gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Medien ({media.length})
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {media.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl bg-muted aspect-square border border-border"
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
              <video
                src={urls[item.id]}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
                playsInline
              />
            )}

            {item.type === "audio" && urls[item.id] && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-3 bg-linear-to-br from-amber-500/10 to-orange-500/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <audio
                  src={urls[item.id]}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              </div>
            )}

            <button
              onClick={() => handleDelete(item)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive cursor-pointer"
              aria-label="Datei löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
