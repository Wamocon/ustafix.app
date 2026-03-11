"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: "amber" | "red" | "blue" | "green" | "purple" | "slate";
  delay?: number;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
}

const COLORS = {
  amber: "bg-amber-50 text-amber-600 border border-amber-200",
  red: "bg-red-50 text-red-600 border border-red-200",
  blue: "bg-blue-50 text-blue-600 border border-blue-200",
  green: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  purple: "bg-purple-50 text-purple-600 border border-purple-200",
  slate: "bg-stone-100 text-stone-500 border border-stone-200",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "amber",
  delay = 0,
  subtitle,
  href,
  onClick,
}: StatCardProps) {
  const content = (
    <>
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
    </>
  );

  const cardClass =
    "rounded-2xl border border-border bg-card p-4 flex items-start gap-3 card-elevated";

  const interactiveClass =
    "card-hover transition-colors hover:border-muted-foreground/20 cursor-pointer";

  const motionProps = {
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] } as const,
  };

  if (href) {
    return (
      <Link href={href} className="block">
        <motion.div
          {...motionProps}
          className={`${cardClass} ${interactiveClass}`}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  if (onClick) {
    return (
      <motion.div
        {...motionProps}
        className={`${cardClass} ${interactiveClass}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div {...motionProps} className={cardClass}>
      {content}
    </motion.div>
  );
}
