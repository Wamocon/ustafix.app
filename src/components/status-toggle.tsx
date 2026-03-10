"use client";

import { useState } from "react";
import { cn, getTransitionRule } from "@/lib/utils";
import type { DefectStatus, MemberRole } from "@/lib/db/schema";
import { motion } from "framer-motion";
import { StatusTransitionModal } from "./status-transition-modal";
import { toast } from "sonner";

interface StatusToggleProps {
  defectId: string;
  projectId: string;
  currentStatus: DefectStatus;
  userRole: MemberRole;
  userId?: string;
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
  userRole,
  userId,
}: StatusToggleProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<DefectStatus | null>(null);

  function handleStatusClick(newStatus: DefectStatus) {
    if (newStatus === currentStatus) return;

    const rule = getTransitionRule(currentStatus, newStatus);
    if (!rule) {
      toast.error("Dieser Statuswechsel ist nicht möglich.");
      return;
    }

    if (!rule.allowedRoles.includes(userRole)) {
      const roleNames = rule.allowedRoles.map((r) =>
        r === "admin" ? "Admins" : r === "manager" ? "Manager" : "Arbeiter"
      );
      toast.error(
        `Nur ${roleNames.join(" und ")} können diesen Statuswechsel durchführen.`
      );
      return;
    }

    setTargetStatus(newStatus);
    setModalOpen(true);
  }

  return (
    <>
      <div className="space-y-3">
        <label className="text-sm font-semibold text-muted-foreground">
          Status
        </label>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isActive = currentStatus === option.value;
            return (
              <motion.button
                key={option.value}
                onClick={() => handleStatusClick(option.value)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 text-sm font-bold transition-all cursor-pointer",
                  isActive
                    ? `${option.activeClass} ${option.glowClass}`
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
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

      {targetStatus && (
        <StatusTransitionModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setTargetStatus(null);
          }}
          defectId={defectId}
          projectId={projectId}
          fromStatus={currentStatus}
          toStatus={targetStatus}
          userRole={userRole}
          userId={userId}
        />
      )}
    </>
  );
}
