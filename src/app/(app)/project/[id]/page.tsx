import { getProject, getProjectMembers } from "@/lib/actions/projects";
import { getDefects } from "@/lib/actions/defects";
import { getProtocols } from "@/lib/actions/protocols";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/db/schema";
import { ProjectPageContent } from "@/components/project-page-content";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const [project, defects, members, protocols] = await Promise.all([
    getProject(id),
    getDefects(id),
    getProjectMembers(id),
    getProtocols(id),
  ]);

  if (!project) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const myRole = (project.myRole as MemberRole) ?? null;
  const isAdminOrManager = myRole === "admin" || myRole === "manager";

  const counts = {
    offen: defects.filter((d) => d.status === "offen").length,
    in_arbeit: defects.filter((d) => d.status === "in_arbeit").length,
    erledigt: defects.filter((d) => d.status === "erledigt").length,
  };

  const total = defects.length;
  const donePercent = total > 0 ? Math.round((counts.erledigt / total) * 100) : 0;
  const units = (project.units as { id: string; name: string }[]) ?? [];

  return (
    <ProjectPageContent
      projectId={id}
      projectName={project.name}
      projectAddress={project.address}
      units={units}
      counts={counts}
      donePercent={donePercent}
      total={total}
      defects={defects as Array<Record<string, unknown>>}
      members={members as { id: string; user_id: string; role: string; email: string | null; full_name: string | null; created_at: string }[]}
      protocols={protocols}
      currentUserId={user?.id ?? null}
      isAdminOrManager={isAdminOrManager}
    />
  );
}
