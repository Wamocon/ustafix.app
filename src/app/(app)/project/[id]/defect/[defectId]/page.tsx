import { getDefect } from "@/lib/actions/defects";
import { getProject } from "@/lib/actions/projects";
import { getDefectComments } from "@/lib/actions/comments";
import { getTransitionHistory } from "@/lib/actions/transitions";
import { getPhaseUpdates } from "@/lib/actions/phase-updates";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/db/schema";
import { DefectDetailContent } from "@/components/defect-detail-content";

interface Props {
  params: Promise<{ id: string; defectId: string }>;
}

export default async function DefectDetailPage({ params }: Props) {
  const { id: projectId, defectId } = await params;
  const [defect, project, commentsResult, transitions, phaseUpdates] =
    await Promise.all([
      getDefect(defectId),
      getProject(projectId),
      getDefectComments(defectId),
      getTransitionHistory(defectId),
      getPhaseUpdates(defectId),
    ]);

  if (!defect) notFound();
  if (!project) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const myRole = (project.myRole as MemberRole) ?? null;
  const canDeleteDefect = myRole === "admin" || myRole === "manager";

  return (
    <DefectDetailContent
      projectId={projectId}
      defectId={defectId}
      defect={{
        id: defect.id,
        title: defect.title,
        status: defect.status,
        priority: defect.priority,
        created_at: defect.created_at,
        description_original: defect.description_original,
        description_de: defect.description_de,
        description_tr: defect.description_tr,
        description_ru: defect.description_ru,
        units: defect.units as { name: string } | null,
        defect_media: (defect.defect_media ?? []) as Array<{
          id: string;
          type: string;
          storage_path: string;
          file_size: number;
          mime_type: string;
          created_by?: string | null;
        }>,
      }}
      comments={commentsResult}
      transitions={transitions as Parameters<typeof DefectDetailContent>[0]["transitions"]}
      phaseUpdates={phaseUpdates as Parameters<typeof DefectDetailContent>[0]["phaseUpdates"]}
      currentUserId={user?.id ?? null}
      canDeleteDefect={canDeleteDefect}
      canDeleteAllMedia={canDeleteDefect}
      canDeleteAnyComment={canDeleteDefect}
      userRole={(myRole ?? "worker") as string}
    />
  );
}
