"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translations";
import {
  History,
  ArrowRight,
  ImageIcon,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { motion } from "framer-motion";

interface MediaItem {
  id: string;
  type: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
}

export interface Transition {
  id: string;
  defect_id: string;
  from_status: string;
  to_status: string;
  note: string;
  changed_by: string;
  created_at: string;
  transition_media: MediaItem[];
}

export interface PhaseUpdate {
  id: string;
  defect_id: string;
  phase: string;
  note: string;
  created_by: string;
  created_at: string;
  phase_update_media: MediaItem[];
}

interface UnifiedTimelineProps {
  transitions: Transition[];
  phaseUpdates?: PhaseUpdate[];
}

type TimelineEntry =
  | { kind: "transition"; data: Transition }
  | { kind: "phase"; data: PhaseUpdate };

const STATUS_KEYS: Record<string, string> = {
  offen: "status.offen",
  in_arbeit: "status.in_arbeit",
  erledigt: "status.erledigt",
};

const PHASE_KEYS: Record<string, string> = {
  erfassung: "timeline.phaseErfassung",
  fortschritt: "timeline.phaseFortschritt",
  abnahme: "timeline.phaseAbnahme",
};

const PHASE_COLORS: Record<string, string> = {
  erfassung: "text-blue-500",
  fortschritt: "text-amber-500",
  abnahme: "text-green-500",
};

const PHASE_ICONS: Record<string, typeof FileText> = {
  erfassung: FileText,
  fortschritt: FileText,
  abnahme: ClipboardCheck,
};

export function TransitionTimeline({
  transitions,
  phaseUpdates = [],
}: UnifiedTimelineProps) {
  const t = useTranslation();
  const mediaUrls = useMemo(() => {
    if (transitions.length === 0 && phaseUpdates.length === 0)
      return {} as Record<string, string>;
    const supabase = createClient();
    const urls: Record<string, string> = {};

    for (const t of transitions) {
      for (const m of t.transition_media ?? []) {
        const { data } = supabase.storage
          .from("defect-media")
          .getPublicUrl(m.storage_path);
        urls[m.id] = data.publicUrl;
      }
    }

    for (const pu of phaseUpdates) {
      for (const m of pu.phase_update_media ?? []) {
        const { data } = supabase.storage
          .from("defect-media")
          .getPublicUrl(m.storage_path);
        urls[m.id] = data.publicUrl;
      }
    }

    return urls;
  }, [transitions, phaseUpdates]);

  const entries: TimelineEntry[] = [
    ...transitions.map(
      (t) => ({ kind: "transition" as const, data: t })
    ),
    ...phaseUpdates.map(
      (pu) => ({ kind: "phase" as const, data: pu })
    ),
  ].sort(
    (a, b) =>
      new Date(a.data.created_at).getTime() -
      new Date(b.data.created_at).getTime()
  );

  if (entries.length === 0) return null;

  return (
    <div className="mt-6 space-y-3 min-w-0 overflow-hidden">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <History className="h-4 w-4" />
        {t("timeline.history")} ({entries.length})
      </h3>

      <div className="space-y-3">
        {entries.map((entry, i) => {
          if (entry.kind === "transition") {
            return (
              <TransitionCard
                key={`t-${entry.data.id}`}
                transition={entry.data}
                index={i}
                mediaUrls={mediaUrls}
                t={t}
              />
            );
          }
          return (
            <PhaseUpdateCard
              key={`p-${entry.data.id}`}
              update={entry.data}
              index={i}
              mediaUrls={mediaUrls}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}

function TransitionCard({
  transition: trans,
  index,
  mediaUrls,
  t: translate,
}: {
  transition: Transition;
  index: number;
  mediaUrls: Record<string, string>;
  t: (key: string) => string;
}) {
  const fromLabel = STATUS_KEYS[trans.from_status]
    ? translate(STATUS_KEYS[trans.from_status])
    : trans.from_status;
  const toLabel = STATUS_KEYS[trans.to_status]
    ? translate(STATUS_KEYS[trans.to_status])
    : trans.to_status;
  const fromEmoji = trans.from_status === "offen" ? "🔴" : trans.from_status === "in_arbeit" ? "🟡" : "🟢";
  const toEmoji = trans.to_status === "offen" ? "🔴" : trans.to_status === "in_arbeit" ? "🟡" : "🟢";
  const media = trans.transition_media ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card p-4 space-y-3 card-elevated"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span>
            {fromEmoji} {fromLabel}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">
            {toEmoji} {toLabel}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(trans.created_at)}
        </span>
      </div>

      <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words min-w-0">
        {trans.note}
      </p>

      <MediaRow media={media} mediaUrls={mediaUrls} t={translate} />
    </motion.div>
  );
}

function PhaseUpdateCard({
  update,
  index,
  mediaUrls,
  t,
}: {
  update: PhaseUpdate;
  index: number;
  mediaUrls: Record<string, string>;
  t: (key: string) => string;
}) {
  const phaseKey = PHASE_KEYS[update.phase] ?? PHASE_KEYS.fortschritt;
  const phaseColor = PHASE_COLORS[update.phase] ?? PHASE_COLORS.fortschritt;
  const Icon = PHASE_ICONS[update.phase] ?? FileText;
  const media = update.phase_update_media ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-dashed border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Icon className={`h-4 w-4 ${phaseColor}`} />
          <span className={`font-semibold ${phaseColor}`}>
            {t(phaseKey)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(update.created_at)}
        </span>
      </div>

      <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words min-w-0">
        {update.note}
      </p>

      <MediaRow media={media} mediaUrls={mediaUrls} t={t} />
    </motion.div>
  );
}

function MediaRow({
  media,
  mediaUrls,
  t,
}: {
  media: MediaItem[];
  mediaUrls: Record<string, string>;
  t: (key: string) => string;
}) {
  if (media.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none">
      {media.map((m) => (
        <div
          key={m.id}
          className="shrink-0 h-20 w-20 rounded-xl overflow-hidden border border-border bg-muted"
        >
          {m.type === "image" && mediaUrls[m.id] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrls[m.id]}
              alt={t("timeline.proofAlt")}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : m.type === "video" && mediaUrls[m.id] ? (
            <video
              src={mediaUrls[m.id]}
              className="h-full w-full object-cover"
              preload="metadata"
              controls
              playsInline
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
