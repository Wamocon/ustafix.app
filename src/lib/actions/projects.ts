"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberRole } from "@/lib/db/schema";

export async function getProjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("project_members")
    .select("project_id, role, projects(*)")
    .eq("user_id", user.id);

  return (data ?? []).map((pm) => ({
    ...pm.projects,
    role: pm.role as MemberRole,
  }));
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("*, organizations(name), units(*)")
    .eq("id", id)
    .single();

  if (!project) return null;

  let myRole: MemberRole | null = null;
  if (user) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .single();
    myRole = (membership?.role as MemberRole) ?? null;
  }

  return { ...project, myRole };
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;

  let orgId: string;

  const { data: existingMembership } = await supabase
    .from("project_members")
    .select("projects(organization_id)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (existingMembership?.projects) {
    orgId = (existingMembership.projects as unknown as { organization_id: string }).organization_id;
  } else {
    const admin = createAdminClient();
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: user.user_metadata?.full_name ?? "Meine Firma" })
      .select()
      .single();

    if (orgError || !org) throw new Error("Fehler beim Erstellen der Organisation");
    orgId = org.id;
  }

  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("projects")
    .insert({ name, address, organization_id: orgId })
    .select()
    .single();

  if (error || !project) {
    console.error("Project creation error:", error);
    throw new Error(`Fehler beim Erstellen des Projekts: ${error?.message || "Unbekannt"}`);
  }

  const { error: memberError } = await admin.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberError) {
    console.error("Member creation error:", memberError);
  }

  revalidatePath("/dashboard");
  return project;
}

export async function createUnit(projectId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  const role = membership?.role as MemberRole | undefined;
  if (role !== "admin" && role !== "manager") {
    throw new Error("Nur Admin oder Manager dürfen Einheiten anlegen.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("units")
    .insert({ project_id: projectId, name })
    .select()
    .single();

  if (error) throw new Error("Fehler beim Erstellen der Einheit");

  revalidatePath(`/project/${projectId}`, "layout");
  return data;
}

export async function getProjectMembers(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_project_members_with_info", {
    p_project_id: projectId,
  });

  return data ?? [];
}

export async function removeProjectMember(projectId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const { data: myMembership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  const myRole = myMembership?.role as MemberRole | undefined;
  if (myRole !== "admin" && myRole !== "manager") {
    throw new Error("Nur Admin oder Manager dürfen Mitglieder entfernen.");
  }

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) throw new Error("Fehler beim Entfernen des Mitglieds");
  revalidatePath(`/project/${projectId}`);
}

/** Rolle beim Hinzufügen: nur manager oder worker (admin wird nicht vergeben). */
export type InviteRole = "manager" | "worker";

export async function addProjectMember(
  projectId: string,
  email: string,
  role: InviteRole
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht authentifiziert" };

  const { data: myMembership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  const myRole = myMembership?.role as MemberRole | undefined;
  if (myRole !== "admin" && myRole !== "manager") {
    return { error: "Nur Admin oder Manager dürfen Nutzer hinzufügen." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "Bitte eine E-Mail-Adresse angeben." };

  const { data: foundUserId, error: lookupError } = await supabase.rpc(
    "get_user_id_by_email",
    { p_email: normalizedEmail }
  );

  if (lookupError) {
    console.error("user lookup error:", lookupError);
    return { error: "Nutzer-Suche fehlgeschlagen." };
  }

  if (!foundUserId) {
    return { error: "Nutzer existiert nicht im System. Die Person muss sich zuerst registrieren." };
  }

  const { error: insertError } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: foundUserId,
    role,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "Diese Person ist bereits im Projekt." };
    }
    return { error: insertError.message || "Fehler beim Hinzufügen." };
  }

  revalidatePath(`/project/${projectId}`);
  return {};
}
