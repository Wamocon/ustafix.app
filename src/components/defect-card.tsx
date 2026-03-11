"use client";

import Link from "next/link";
import { Camera, Mic, Video, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

interface DefectCardProps {
  defect: Record<string, unknown>;
  projectId: string;
  index?: number;
}

const STATUS_CONFIG = {
  offen: { dot: "bg-status-open status-glow-open", emoji: "🔴", labelKey: "status.offen" },
  in_arbeit: { dot: "bg-status-progress status-glow-progress", emoji: "🟡", labelKey: "status.in_arbeit" },
  erledigt: { dot: "bg-status-done status-glow-done", emoji: "🟢", labelKey: "status.erledigt" },
} as const;

const PRIORITY_CONFIG = {
  hoch: { className: "bg-status-open/10 text-status-open border-status-open/20", labelKey: "defect.priorityHigh" },
  mittel: { className: "bg-status-progress/10 text-status-progress border-status-progress/20", labelKey: "defect.priorityMedium" },
  niedrig: { className: "bg-muted text-muted-foreground border-transparent", labelKey: "defect.priorityLow" },
} as const;

export function DefectCard({ defect, projectId, index = 0 }: DefectCardProps) {
  const t = useTranslation();
  const status =
    STATUS_CONFIG[(defect.status as keyof typeof STATUS_CONFIG) || "offen"];
  const priority =
    PRIORITY_CONFIG[(defect.priority as keyof typeof PRIORITY_CONFIG) || "mittel"];
  const media = (defect.defect_media as Array<{ type: string }>) ?? [];
  const hasImages = media.some((m) => m.type === "image");
  const hasVideos = media.some((m) => m.type === "video");
  const hasAudio = media.some((m) => m.type === "audio");
  const unitName = (defect.units as { name: string } | null)?.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/project/${projectId}/defect/${defect.id}`}
        className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 card-hover cursor-pointer"
      >
        <span className="mt-0.5 text-base shrink-0">{status.emoji}</span>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold leading-snug truncate">
            {defect.title as string}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {unitName && (
              <span className="inline-flex items-center rounded-lg bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                {unitName}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${priority.className}`}
            >
              {t(priority.labelKey)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatDate(defect.created_at as string)}
            </span>
          </div>

          {media.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              {hasImages && <Camera className="h-3.5 w-3.5" />}
              {hasVideos && <Video className="h-3.5 w-3.5" />}
              {hasAudio && <Mic className="h-3.5 w-3.5" />}
              <span className="text-[11px] font-medium">
                {media.length} {media.length === 1 ? t("defectCard.file") : t("defectCard.files")}
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
      </Link>
    </motion.div>
  );
}
