"use client";

import { useState } from "react";
import { DefectCard } from "./defect-card";
import { Search, Inbox } from "lucide-react";
import type { DefectStatus } from "@/lib/db/schema";

interface DefectListProps {
  defects: Array<Record<string, unknown>>;
  projectId: string;
}

const STATUS_FILTERS: { value: DefectStatus | "alle"; label: string; emoji?: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "offen", label: "Offen", emoji: "🔴" },
  { value: "in_arbeit", label: "In Arbeit", emoji: "🟡" },
  { value: "erledigt", label: "Erledigt", emoji: "🟢" },
];

export function DefectList({ defects, projectId }: DefectListProps) {
  const [statusFilter, setStatusFilter] = useState<DefectStatus | "alle">(
    "alle"
  );
  const [search, setSearch] = useState("");

  const filtered = defects.filter((d) => {
    if (statusFilter !== "alle" && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const title = ((d.title as string) || "").toLowerCase();
      const desc = ((d.description_de as string) || "").toLowerCase();
      const unit = (
        (d.units as { name: string } | null)?.name || ""
      ).toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !unit.includes(q))
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-3 pb-28">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Mangel suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === f.value
                ? "gradient-primary text-white shadow-md shadow-amber-500/20"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {f.emoji && <span className="text-[10px]">{f.emoji}</span>}
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">
              {defects.length === 0
                ? "Noch keine Mängel erfasst"
                : "Keine Mängel gefunden"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {defects.length === 0
                ? "Tippen Sie auf + um den ersten Mangel zu erfassen."
                : "Versuchen Sie einen anderen Suchbegriff."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((defect, i) => (
            <DefectCard
              key={defect.id as string}
              defect={defect}
              projectId={projectId}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
