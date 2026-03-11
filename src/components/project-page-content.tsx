"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { DefectList } from "@/components/defect-list";
import { CaptureModal } from "@/components/capture-modal";
import { RealtimeWrapper } from "@/components/realtime-wrapper";
import { ProjectTeamSection } from "@/components/project-team-section";
import { AddUnitForm } from "@/components/add-unit-form";
import { ProtocolSection } from "@/components/protocol-section";
import { useTranslation } from "@/hooks/use-translations";

interface ProjectPageContentProps {
  projectId: string;
  projectName: string;
  projectAddress: string | null;
  units: { id: string; name: string }[];
  counts: { offen: number; in_arbeit: number; erledigt: number };
  donePercent: number;
  total: number;
  defects: Array<Record<string, unknown>>;
  members: { id: string; user_id: string; role: string; email: string | null; full_name: string | null; created_at: string }[];
  protocols: Array<{ id: string; title: string; inspection_date: string; integrity_hash?: string; created_at: string }>;
  currentUserId: string | null;
  isAdminOrManager: boolean;
}

function StatusBadge({
  count,
  label,
  emoji,
  className,
}: {
  count: number;
  label: string;
  emoji: string;
  className: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-center ${className}`}
    >
      <span className="text-lg">{emoji}</span>
      <span className="text-xl font-extrabold">{count}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </span>
    </div>
  );
}

export function ProjectPageContent({
  projectId,
  projectName,
  projectAddress,
  units,
  counts,
  donePercent,
  total,
  defects,
  members,
  protocols,
  currentUserId,
  isAdminOrManager,
}: ProjectPageContentProps) {
  const t = useTranslation();

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="mb-6">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.projects")}
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight">
          {projectName}
        </h1>
        {projectAddress && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-amber-500/60" />
            {projectAddress}
          </p>
        )}

        {total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{t("project.progress")}</span>
              <span className="font-semibold text-foreground">{donePercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
                style={{ width: `${donePercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatusBadge
            count={counts.offen}
            label={t("project.open")}
            emoji="🔴"
            className="bg-status-open/8 text-status-open border border-status-open/15"
          />
          <StatusBadge
            count={counts.in_arbeit}
            label={t("project.inProgress")}
            emoji="🟡"
            className="bg-status-progress/8 text-status-progress border border-status-progress/15"
          />
          <StatusBadge
            count={counts.erledigt}
            label={t("project.done")}
            emoji="🟢"
            className="bg-status-done/8 text-status-done border border-status-done/15"
          />
        </div>
      </header>

      {isAdminOrManager && (
        <>
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              {t("project.units")}
            </h2>
            <AddUnitForm projectId={projectId} />
            {units.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {units.map((unit) => (
                  <li
                    key={unit.id}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2.5 text-sm"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500/60" />
                    {unit.name}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="mb-6">
            <ProjectTeamSection
              projectId={projectId}
              members={members}
              currentUserId={currentUserId ?? ""}
            />
          </section>
        </>
      )}

      {isAdminOrManager && (
        <section className="mb-6">
          <ProtocolSection
            projectId={projectId}
            units={units}
            defects={defects.map((d) => ({
              id: d.id as string,
              title: d.title as string,
              status: d.status as string,
              priority: d.priority as string,
            }))}
            protocols={protocols}
            canCreate={isAdminOrManager}
          />
        </section>
      )}

      <RealtimeWrapper projectId={projectId} />
      <DefectList defects={defects} projectId={projectId} />
      <CaptureModal
        projectId={projectId}
        units={units}
        userId={currentUserId ?? undefined}
      />
    </div>
  );
}
