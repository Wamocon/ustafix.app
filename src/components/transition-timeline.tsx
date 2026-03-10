"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
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

interface Transition {
  id: string;
  defect_id: string;
  from_status: string;
  to_status: string;
  note: string;
  changed_by: string;
  created_at: string;
  transition_media: MediaItem[];
}

interface PhaseUpdate {
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

const STATUS_DISPLAY: Record<string, { label: string; emoji: string }> = {
  offen: { label: "Offen", emoji: "🔴" },
  in_arbeit: { label: "In Arbeit", emoji: "🟡" },
  erledigt: { label: "Erledigt", emoji: "🟢" },
};

const PHASE_DISPLAY: Record<
  string,
  { label: string; color: string; icon: typeof FileText }
> = {
  erfassung: { label: "Erfassung", color: "text-blue-500", icon: FileText },
  fortschritt: {
    label: "Fortschritt",
    color: "text-amber-500",
    icon: FileText,
  },
  abnahme: {
    label: "Abnahme",
    color: "text-green-500",
    icon: ClipboardCheck,
  },
};

export function TransitionTimeline({
  transitions,
  phaseUpdates = [],
}: UnifiedTimelineProps) {
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transitions.length === 0 && phaseUpdates.length === 0) return;
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

    setMediaUrls(urls);
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
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <History className="h-4 w-4" />
        Verlauf ({entries.length})
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
              />
            );
          }
          return (
            <PhaseUpdateCard
              key={`p-${entry.data.id}`}
              update={entry.data}
              index={i}
              mediaUrls={mediaUrls}
            />
          );
        })}
      </div>
    </div>
  );
}

function TransitionCard({
  transition: t,
  index,
  mediaUrls,
}: {
  transition: Transition;
  index: number;
  mediaUrls: Record<string, string>;
}) {
  const from = STATUS_DISPLAY[t.from_status] ?? {
    label: t.from_status,
    emoji: "⚪",
  };
  const to = STATUS_DISPLAY[t.to_status] ?? {
    label: t.to_status,
    emoji: "⚪",
  };
  const media = t.transition_media ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span>
            {from.emoji} {from.label}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold">
            {to.emoji} {to.label}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(t.created_at)}
        </span>
      </div>

      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
        {t.note}
      </p>

      <MediaRow media={media} mediaUrls={mediaUrls} />
    </motion.div>
  );
}

function PhaseUpdateCard({
  update,
  index,
  mediaUrls,
}: {
  update: PhaseUpdate;
  index: number;
  mediaUrls: Record<string, string>;
}) {
  const phase = PHASE_DISPLAY[update.phase] ?? PHASE_DISPLAY.fortschritt;
  const Icon = phase.icon;
  const media = update.phase_update_media ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-dashed border-border bg-card/50 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Icon className={`h-4 w-4 ${phase.color}`} />
          <span className={`font-semibold ${phase.color}`}>
            {phase.label}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(update.created_at)}
        </span>
      </div>

      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
        {update.note}
      </p>

      <MediaRow media={media} mediaUrls={mediaUrls} />
    </motion.div>
  );
}

function MediaRow({
  media,
  mediaUrls,
}: {
  media: MediaItem[];
  mediaUrls: Record<string, string>;
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
              alt="Nachweis"
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
