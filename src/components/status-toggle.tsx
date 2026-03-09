"use client";

import { useTransition, useOptimistic } from "react";
import { updateDefectStatus } from "@/lib/actions/defects";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DefectStatus } from "@/lib/db/schema";
import { motion } from "framer-motion";

interface StatusToggleProps {
  defectId: string;
  projectId: string;
  currentStatus: DefectStatus;
}

const STATUS_OPTIONS: {
  value: DefectStatus;
  label: string;
  emoji: string;
  activeClass: string;
  glowClass: string;
}[] = [
  {
    value: "offen",
    label: "Offen",
    emoji: "🔴",
    activeClass:
      "bg-linear-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30",
    glowClass: "status-glow-open",
  },
  {
    value: "in_arbeit",
    label: "In Arbeit",
    emoji: "🟡",
    activeClass:
      "bg-linear-to-br from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/30",
    glowClass: "status-glow-progress",
  },
  {
    value: "erledigt",
    label: "Erledigt",
    emoji: "🟢",
    activeClass:
      "bg-linear-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30",
    glowClass: "status-glow-done",
  },
];

export function StatusToggle({
  defectId,
  projectId,
  currentStatus,
}: StatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);

  function handleStatusChange(newStatus: DefectStatus) {
    if (newStatus === optimisticStatus) return;

    setOptimisticStatus(newStatus);

    startTransition(async () => {
      try {
        await updateDefectStatus(defectId, newStatus, projectId);
        toast.success("Status aktualisiert");
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-muted-foreground">
        Status
      </label>
      <div className="grid grid-cols-3 gap-2">
        {STATUS_OPTIONS.map((option) => {
          const isActive = optimisticStatus === option.value;
          return (
            <motion.button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={isPending}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 text-sm font-bold transition-all cursor-pointer",
                isActive
                  ? `${option.activeClass} ${option.glowClass}`
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                isPending && "opacity-70"
              )}
              aria-pressed={isActive}
              aria-label={`Status: ${option.label}`}
            >
              <span className="text-lg">{option.emoji}</span>
              <span>{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
