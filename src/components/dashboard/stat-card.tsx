"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: "amber" | "red" | "blue" | "green" | "purple" | "slate";
  delay?: number;
  subtitle?: string;
}

const COLORS = {
  amber: "bg-amber-500/10 text-amber-500",
  red: "bg-red-500/10 text-red-500",
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-emerald-500/10 text-emerald-500",
  purple: "bg-purple-500/10 text-purple-500",
  slate: "bg-slate-500/10 text-slate-400",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "amber",
  delay = 0,
  subtitle,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${COLORS[color]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tracking-tight leading-none">
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground truncate">
          {label}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
