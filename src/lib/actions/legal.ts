"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectMembers } from "@/lib/actions/projects";

export interface AdminLegalConsentRecord {
  projectId: string;
  projectName: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string;
  acceptedAt: string | null;
  version: string | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dsgvoAccepted: boolean;
  allAccepted: boolean;
}

export interface AdminLegalConsentOverview {
  projectCount: number;
  totalMembers: number;
  fullyAccepted: number;
  missingConsents: number;
  records: AdminLegalConsentRecord[];
}

type MemberRow = {
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
};

export async function getAdminLegalConsentOverview(): Promise<AdminLegalConsentOverview | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: adminProjects, error } = await supabase
    .from("project_members")
    .select("project_id, projects(name)")
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (error || !adminProjects || adminProjects.length === 0) {
    return null;
  }

  const projects = adminProjects.map((item) => ({
    id: item.project_id as string,
    name: ((item.projects as { name?: string } | null)?.name ?? "Projekt") as string,
  }));

  const memberGroups = await Promise.all(
    projects.map(async (project) => ({
      project,
      members: (await getProjectMembers(project.id)) as MemberRow[],
    }))
  );

  const userIds = Array.from(
    new Set(memberGroups.flatMap((group) => group.members.map((member) => member.user_id)))
  );

  let authUsers = new Map<string, { email: string | null; metadata: Record<string, unknown> | null }>();

  try {
    const admin = createAdminClient();
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const result = await admin.auth.admin.getUserById(userId);
        return {
          userId,
          email: result.data.user?.email ?? null,
          metadata: (result.data.user?.user_metadata as Record<string, unknown> | undefined) ?? null,
        };
      })
    );

    authUsers = new Map(users.map((entry) => [entry.userId, { email: entry.email, metadata: entry.metadata }]));
  } catch (adminError) {
    console.error("Admin consent overview error:", adminError);
  }

  const records = memberGroups
    .flatMap(({ project, members }) =>
      members.map((member) => {
        const authUser = authUsers.get(member.user_id);
        const metadata = authUser?.metadata ?? null;
        const termsAccepted = Boolean(metadata?.terms_accepted);
        const privacyAccepted = Boolean(metadata?.privacy_accepted);
        const dsgvoAccepted = Boolean(metadata?.dsgvo_accepted);
        const allAccepted = termsAccepted && privacyAccepted && dsgvoAccepted;

        return {
          projectId: project.id,
          projectName: project.name,
          userId: member.user_id,
          fullName: member.full_name,
          email: member.email ?? authUser?.email ?? null,
          role: member.role,
          acceptedAt:
            typeof metadata?.legal_consents_accepted_at === "string"
              ? metadata.legal_consents_accepted_at
              : null,
          version:
            typeof metadata?.legal_consent_version === "string"
              ? metadata.legal_consent_version
              : null,
          termsAccepted,
          privacyAccepted,
          dsgvoAccepted,
          allAccepted,
        } satisfies AdminLegalConsentRecord;
      })
    )
    .sort((a, b) => {
      const projectCompare = a.projectName.localeCompare(b.projectName, "de");
      if (projectCompare !== 0) return projectCompare;
      const aName = a.fullName ?? a.email ?? "";
      const bName = b.fullName ?? b.email ?? "";
      return aName.localeCompare(bName, "de");
    });

  const fullyAccepted = records.filter((record) => record.allAccepted).length;

  return {
    projectCount: projects.length,
    totalMembers: records.length,
    fullyAccepted,
    missingConsents: records.length - fullyAccepted,
    records,
  };
}