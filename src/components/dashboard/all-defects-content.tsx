"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { AggregateDefect } from "@/lib/actions/aggregate";
import { useTranslation } from "@/hooks/use-translations";

const STATUS_STYLES: Record<string, string> = {
  offen: "bg-red-50 text-red-600 border-red-200",
  in_arbeit: "bg-amber-50 text-amber-600 border-amber-200",
  erledigt: "bg-emerald-50 text-emerald-600 border-emerald-200",
  problem: "bg-purple-50 text-purple-600 border-purple-200",
};

const STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  in_arbeit: "In Bearbeitung",
  erledigt: "Erledigt",
  problem: "Problem",
};

const PRIORITY_STYLES: Record<string, string> = {
  hoch: "bg-red-50 text-red-600 border-red-200",
  mittel: "bg-amber-50 text-amber-600 border-amber-200",
  niedrig: "bg-blue-50 text-blue-600 border-blue-200",
};

const PRIORITY_LABELS: Record<string, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

const FILTERS = ["all", "offen", "in_arbeit", "erledigt", "problem"] as const;

interface Props {
  defects: AggregateDefect[];
}

export function AllDefectsContent({ defects }: Props) {
  const t = useTranslation();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? "all";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>(initialFilter);

  const filtered = defects.filter((d) => {
    if (filter !== "all" && d.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.project_name.toLowerCase().includes(q) ||
        (d.unit_name && d.unit_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const counts = {
    all: defects.length,
    offen: defects.filter((d) => d.status === "offen").length,
    in_arbeit: defects.filter((d) => d.status === "in_arbeit").length,
    erledigt: defects.filter((d) => d.status === "erledigt").length,
    problem: defects.filter((d) => d.status === "problem").length,
  };

  return (
    <div className="mx-auto max-w-lg lg:max-w-4xl px-4 lg:px-8 pt-6 pb-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card card-elevated"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            {t("dashboard.totalDefects")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {defects.length} Mängel insgesamt
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
              filter === f
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:border-foreground/20"
            }`}
          >
            {f === "all" ? "Alle" : STATUS_LABELS[f]} (
            {counts[f as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
          >
            <Link
              href={`/project/${d.project_id}/defect/${d.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 card-elevated card-hover"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{d.title}</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border truncate max-w-[140px]">
                    {d.project_name}
                  </span>
                  {d.unit_name && (
                    <span className="text-[11px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200 truncate max-w-[100px]">
                      {d.unit_name}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[d.status] || ""}`}
                  >
                    {STATUS_LABELS[d.status] || d.status}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[d.priority] || ""}`}
                  >
                    {PRIORITY_LABELS[d.priority] || d.priority}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Keine Mängel gefunden
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
