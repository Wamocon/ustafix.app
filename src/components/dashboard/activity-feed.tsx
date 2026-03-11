"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
} from "lucide-react";
import type { RecentTransition } from "@/lib/actions/dashboard";

const STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  in_arbeit: "In Arbeit",
  erledigt: "Erledigt",
};

const STATUS_COLORS: Record<string, string> = {
  offen: "text-red-500",
  in_arbeit: "text-amber-500",
  erledigt: "text-emerald-500",
};

interface ActivityFeedProps {
  transitions: RecentTransition[];
  projectId: string;
  projectName: string;
}

export function ActivityFeed({
  transitions,
  projectId,
  projectName,
}: ActivityFeedProps) {
  if (transitions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {projectName}
      </h4>
      {transitions.map((t, i) => {
        const timeAgo = getTimeAgo(t.created_at);
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <Link
              href={`/project/${projectId}/defect/${t.defect_id}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-2.5 hover:bg-muted/30 transition-colors card-elevated"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-semibold">{t.changed_by_name}</span>{" "}
                  <span className={STATUS_COLORS[t.from_status]}>
                    {STATUS_LABELS[t.from_status]}
                  </span>
                  {" → "}
                  <span className={STATUS_COLORS[t.to_status]}>
                    {STATUS_LABELS[t.to_status]}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {t.defect_title}
                </p>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Jetzt";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}
