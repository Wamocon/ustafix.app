"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronRight,
  AlertTriangle,
  Users,
  FileCheck,
  Clock,
} from "lucide-react";
import type { ProjectStats } from "@/lib/actions/dashboard";

interface ProjectHealthCardProps {
  project: ProjectStats;
  index: number;
  showTeamDetails?: boolean;
}

export function ProjectHealthCard({
  project,
  index,
  showTeamDetails = false,
}: ProjectHealthCardProps) {
  const { defect_counts: dc, priority_counts: pc } = project;
  const completionRate =
    dc.total > 0 ? Math.round((dc.erledigt / dc.total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/project/${project.id}`}
        className="group block rounded-2xl border border-border bg-card p-4 card-hover"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Building2 className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold truncate text-sm">{project.name}</h3>
              {project.address && (
                <p className="text-xs text-muted-foreground truncate">
                  {project.address}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 mt-1" />
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Fortschritt</span>
            <span className="font-semibold">{completionRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionRate}%`,
                background:
                  completionRate === 100
                    ? "var(--color-status-done)"
                    : completionRate > 60
                      ? "linear-gradient(90deg, #f59e0b, #22c55e)"
                      : "linear-gradient(90deg, #ef4444, #f59e0b)",
              }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">
              {dc.offen} Offen
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">
              {dc.in_arbeit} In Arbeit
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">
              {dc.erledigt} Erledigt
            </span>
          </div>
          {pc.hoch > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-500 font-semibold">
              <AlertTriangle className="h-3 w-3" />
              {pc.hoch} Hoch
            </div>
          )}
        </div>

        {/* Team & meta row */}
        {showTeamDetails && (
          <div className="mt-2.5 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.member_count} Mitglieder
            </span>
            {project.pending_invitations > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Clock className="h-3 w-3" />
                {project.pending_invitations} Einladungen
              </span>
            )}
            {project.protocol_count > 0 && (
              <span className="flex items-center gap-1">
                <FileCheck className="h-3 w-3" />
                {project.protocol_count} Protokolle
              </span>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
