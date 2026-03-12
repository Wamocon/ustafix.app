"use client";

import { useState } from "react";
import { DefectCard } from "./defect-card";
import { Search, Inbox } from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";
import type { DefectStatus } from "@/lib/db/schema";

interface DefectListProps {
  defects: Array<Record<string, unknown>>;
  projectId: string;
}

const STATUS_FILTERS: { value: DefectStatus | "alle"; labelKey: string; emoji?: string }[] = [
  { value: "alle", labelKey: "common.all" },
  { value: "offen", labelKey: "status.offen", emoji: "🔴" },
  { value: "in_arbeit", labelKey: "status.in_arbeit", emoji: "🟡" },
  { value: "erledigt", labelKey: "status.erledigt", emoji: "🟢" },
  { value: "problem", labelKey: "status.problem", emoji: "🟣" },
];

export function DefectList({ defects, projectId }: DefectListProps) {
  const [statusFilter, setStatusFilter] = useState<DefectStatus | "alle">(
    "alle"
  );
  const [search, setSearch] = useState("");
  const t = useTranslation();

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
          placeholder={t("defectList.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground shadow-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2 min-w-0">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
              statusFilter === f.value
                ? "gradient-primary text-white shadow-md shadow-amber-500/20"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {f.emoji && <span className="text-[10px]">{f.emoji}</span>}
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted border border-border">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">
              {defects.length === 0
                ? t("defectList.noDefects")
                : t("defectList.noResults")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {defects.length === 0
                ? t("defectList.emptyHint")
                : t("defectList.searchHint")}
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
