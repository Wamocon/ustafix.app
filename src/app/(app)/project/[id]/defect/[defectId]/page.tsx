import { getDefect } from "@/lib/actions/defects";
import { getProject } from "@/lib/actions/projects";
import { getDefectComments } from "@/lib/actions/comments";
import { StatusToggle } from "@/components/status-toggle";
import { MediaViewer } from "@/components/media-viewer";
import { DefectActions } from "@/components/defect-actions";
import { DefectComments } from "@/components/defect-comments";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/db/schema";

interface Props {
  params: Promise<{ id: string; defectId: string }>;
}

const PRIORITY_CONFIG = {
  niedrig: { label: "Niedrig", emoji: "🟢", className: "bg-status-done/10 text-status-done border-status-done/20" },
  mittel: { label: "Mittel", emoji: "🟡", className: "bg-status-progress/10 text-status-progress border-status-progress/20" },
  hoch: { label: "Hoch", emoji: "🔴", className: "bg-status-open/10 text-status-open border-status-open/20" },
};

export default async function DefectDetailPage({ params }: Props) {
  const { id: projectId, defectId } = await params;
  const [defect, project, commentsResult] = await Promise.all([
    getDefect(defectId),
    getProject(projectId),
    getDefectComments(defectId),
  ]);

  if (!defect) notFound();
  if (!project) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const myRole = (project.myRole as MemberRole) ?? null;
  const canDeleteDefect = myRole === "admin" || myRole === "manager";
  const canDeleteAllMedia = canDeleteDefect;
  const canDeleteAnyComment = canDeleteDefect;

  const media =
    (defect.defect_media as Array<{
      id: string;
      type: string;
      storage_path: string;
      file_size: number;
      mime_type: string;
      created_by?: string | null;
    }>) ?? [];

  const unitName = (defect.units as { name: string } | null)?.name;
  const priorityCfg = PRIORITY_CONFIG[(defect.priority as keyof typeof PRIORITY_CONFIG) || "mittel"];

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-28">
      <Link
        href={`/project/${projectId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Liste
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
          {priorityCfg.emoji} {priorityCfg.label}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDate(defect.created_at)}
        </span>
      </div>

      {/* Status Toggle */}
      <div className="mt-6">
        <StatusToggle
          defectId={defect.id}
          projectId={projectId}
          currentStatus={defect.status as "offen" | "in_arbeit" | "erledigt"}
        />
      </div>

      {/* Media */}
      {media.length > 0 && (
        <div className="mt-6">
          <MediaViewer
            media={media}
            projectId={projectId}
            defectId={defectId}
            currentUserId={user?.id ?? null}
            canDeleteAll={canDeleteAllMedia}
          />
        </div>
      )}

      {/* Descriptions / Translations */}
      <div className="mt-6 space-y-3">
        {defect.description_original && (
          <DescriptionBlock
            label="Original"
            flag="🎤"
            text={defect.description_original}
          />
        )}
        {defect.description_de && (
          <DescriptionBlock
            label="Deutsch"
            flag="🇩🇪"
            text={defect.description_de}
          />
        )}
        {defect.description_tr && (
          <DescriptionBlock
            label="Türkçe"
            flag="🇹🇷"
            text={defect.description_tr}
          />
        )}
        {defect.description_ru && (
          <DescriptionBlock
            label="Русский"
            flag="🇷🇺"
            text={defect.description_ru}
          />
        )}
      </div>

      {/* Kommentare (Fragen & Anweisungen) */}
      <DefectComments
        projectId={projectId}
        defectId={defectId}
        comments={commentsResult}
        currentUserId={user?.id ?? null}
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

function DescriptionBlock({
  label,
  flag,
  text,
}: {
  label: string;
  flag: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span>{flag}</span>
        {label}
      </p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
