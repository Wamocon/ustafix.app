"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DefectStatus, DefectPriority } from "@/lib/db/schema";

export async function getDefects(projectId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("defects")
    .select("*, units(name), defect_media(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getDefect(defectId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("defects")
    .select("*, units(name), defect_media(*)")
    .eq("id", defectId)
    .single();

  return data;
}

export async function createDefect(params: {
  projectId: string;
  title: string;
  descriptionOriginal?: string;
  descriptionDe?: string;
  descriptionTr?: string;
  descriptionRu?: string;
  unitId?: string;
  priority?: DefectPriority;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const { data, error } = await supabase
    .from("defects")
    .insert({
      project_id: params.projectId,
      title: params.title,
      description_original: params.descriptionOriginal,
      description_de: params.descriptionDe,
      description_tr: params.descriptionTr,
      description_ru: params.descriptionRu,
      unit_id: params.unitId || null,
      priority: params.priority ?? "mittel",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error("Fehler beim Erstellen des Mangels");

  revalidatePath(`/project/${params.projectId}`);
  return data;
}

export async function updateDefectStatus(
  defectId: string,
  status: DefectStatus,
  projectId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("defects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", defectId);

  if (error) throw new Error("Fehler beim Aktualisieren des Status");

  revalidatePath(`/project/${projectId}`);
  revalidatePath(`/project/${projectId}/defect/${defectId}`);
}

export async function updateDefect(
  defectId: string,
  projectId: string,
  updates: {
    title?: string;
    descriptionOriginal?: string;
    descriptionDe?: string;
    descriptionTr?: string;
    descriptionRu?: string;
    unitId?: string | null;
    priority?: DefectPriority;
  }
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.descriptionOriginal !== undefined) updateData.description_original = updates.descriptionOriginal;
  if (updates.descriptionDe !== undefined) updateData.description_de = updates.descriptionDe;
  if (updates.descriptionTr !== undefined) updateData.description_tr = updates.descriptionTr;
  if (updates.descriptionRu !== undefined) updateData.description_ru = updates.descriptionRu;
  if (updates.unitId !== undefined) updateData.unit_id = updates.unitId;
  if (updates.priority !== undefined) updateData.priority = updates.priority;

  const { error } = await supabase
    .from("defects")
    .update(updateData)
    .eq("id", defectId);

  if (error) throw new Error("Fehler beim Aktualisieren des Mangels");

  revalidatePath(`/project/${projectId}`);
  revalidatePath(`/project/${projectId}/defect/${defectId}`);
}

export async function deleteDefect(defectId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("defects")
    .delete()
    .eq("id", defectId);

  if (error) throw new Error("Fehler beim Löschen des Mangels");

  revalidatePath(`/project/${projectId}`);
}
