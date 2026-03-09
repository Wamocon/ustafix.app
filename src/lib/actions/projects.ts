"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
    role: pm.role,
  }));
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, organizations(name), units(*)")
    .eq("id", id)
    .single();

  return data;
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
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: user.user_metadata?.full_name ?? "Meine Firma" })
      .select()
      .single();

    if (orgError || !org) throw new Error("Fehler beim Erstellen der Organisation");
    orgId = org.id;
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name, address, organization_id: orgId })
    .select()
    .single();

  if (error || !project) {
    console.error("Project creation error:", error);
    throw new Error(`Fehler beim Erstellen des Projekts: ${error?.message || "Unbekannt"}`);
  }

  const { error: memberError } = await supabase.from("project_members").insert({
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

  const { data, error } = await supabase
    .from("units")
    .insert({ project_id: projectId, name })
    .select()
    .single();

  if (error) throw new Error("Fehler beim Erstellen der Einheit");

  revalidatePath(`/project/${projectId}`);
  return data;
}
