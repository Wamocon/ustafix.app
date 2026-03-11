"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { StatusToggle } from "@/components/status-toggle";
import { MediaViewer } from "@/components/media-viewer";
import { DefectActions } from "@/components/defect-actions";
import { DefectComments } from "@/components/defect-comments";
import { TransitionTimeline } from "@/components/transition-timeline";
import { PhaseUpdateButton } from "@/components/phase-update-button";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translations";
import type { Transition, PhaseUpdate } from "@/components/transition-timeline";

const PRIORITY_CONFIG: Record<string, { labelKey: string; emoji: string; className: string }> = {
  niedrig: { labelKey: "defect.priorityLow", emoji: "🟢", className: "bg-status-done/10 text-status-done border-status-done/20" },
  mittel: { labelKey: "defect.priorityMedium", emoji: "🟡", className: "bg-status-progress/10 text-status-progress border-status-progress/20" },
  hoch: { labelKey: "defect.priorityHigh", emoji: "🔴", className: "bg-status-open/10 text-status-open border-status-open/20" },
};

const DESC_LABELS: Record<string, string> = {
  original: "defect.descriptionsOriginal",
  de: "defect.descriptionsDe",
  tr: "defect.descriptionsTr",
  ru: "defect.descriptionsRu",
};

interface DefectDetailContentProps {
  projectId: string;
  defectId: string;
  defect: {
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    description_original?: string | null;
    description_de?: string | null;
    description_tr?: string | null;
    description_ru?: string | null;
    units: { name: string } | null;
    defect_media: Array<{ id: string; type: string; storage_path: string; file_size: number; mime_type: string; created_by?: string | null }>;
  };
  comments: unknown;
  transitions: Transition[];
  phaseUpdates: PhaseUpdate[];
  currentUserId: string | null;
  canDeleteDefect: boolean;
  canDeleteAllMedia: boolean;
  canDeleteAnyComment: boolean;
  userRole: string;
}

function DescriptionBlock({
  labelKey,
  flag,
  text,
  t,
}: {
  labelKey: string;
  flag: string;
  text: string;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 min-w-0 overflow-hidden">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span>{flag}</span>
        {t(labelKey)}
      </p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words min-w-0">{text}</p>
    </div>
  );
}

export function DefectDetailContent({
  projectId,
  defectId,
  defect,
  comments,
  transitions,
  phaseUpdates,
  currentUserId,
  canDeleteDefect,
  canDeleteAllMedia,
  canDeleteAnyComment,
  userRole,
}: DefectDetailContentProps) {
  const t = useTranslation();
  const unitName = defect.units?.name;
  const priorityCfg = PRIORITY_CONFIG[defect.priority] ?? PRIORITY_CONFIG.mittel;
  const media =
    defect.defect_media ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-28">
      <Link
        href={`/project/${projectId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("project.backToList")}
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">{defect.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {unitName && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <MapPin className="h-3 w-3" />
            {unitName}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold ${priorityCfg.className}`}>
          {priorityCfg.emoji} {t(priorityCfg.labelKey)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDate(defect.created_at)}
        </span>
      </div>

      <div className="mt-6">
        <StatusToggle
          defectId={defect.id}
          projectId={projectId}
          currentStatus={defect.status as "offen" | "in_arbeit" | "erledigt"}
          userRole={userRole as "admin" | "manager" | "worker"}
          userId={currentUserId ?? undefined}
        />
      </div>

      {media.length > 0 && (
        <div className="mt-6">
          <MediaViewer
            media={media}
            projectId={projectId}
            defectId={defectId}
            currentUserId={currentUserId}
            canDeleteAll={canDeleteAllMedia}
          />
        </div>
      )}

      <div className="mt-4">
        <PhaseUpdateButton
          defectId={defectId}
          projectId={projectId}
          userRole={userRole as "admin" | "manager" | "worker"}
          currentStatus={defect.status}
          userId={currentUserId ?? undefined}
        />
      </div>

      <TransitionTimeline
        transitions={transitions}
        phaseUpdates={phaseUpdates}
      />

      <div className="mt-6 space-y-3">
        {defect.description_original && (
          <DescriptionBlock
            labelKey={DESC_LABELS.original}
            flag="🎤"
            text={defect.description_original}
            t={t}
          />
        )}
        {defect.description_de && (
          <DescriptionBlock
            labelKey={DESC_LABELS.de}
            flag="🇩🇪"
            text={defect.description_de}
            t={t}
          />
        )}
        {defect.description_tr && (
          <DescriptionBlock
            labelKey={DESC_LABELS.tr}
            flag="🇹🇷"
            text={defect.description_tr}
            t={t}
          />
        )}
        {defect.description_ru && (
          <DescriptionBlock
            labelKey={DESC_LABELS.ru}
            flag="🇷🇺"
            text={defect.description_ru}
            t={t}
          />
        )}
      </div>

      <DefectComments
        projectId={projectId}
        defectId={defectId}
        comments={comments as Parameters<typeof DefectComments>[0]["comments"]}
        currentUserId={currentUserId}
        canDeleteAnyComment={canDeleteAnyComment}
      />

      <div className="mt-8">
        <DefectActions
          defectId={defect.id}
          projectId={projectId}
          canDelete={canDeleteDefect}
        />
      </div>
    </div>
  );
}
