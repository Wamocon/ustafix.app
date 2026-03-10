"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MediaPhase, MemberRole } from "@/lib/db/schema";

export async function createPhaseUpdate(params: {
  defectId: string;
  projectId: string;
  phase: MediaPhase;
  note: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  if (params.phase === "abnahme") {
    const { data: member } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", params.projectId)
      .eq("user_id", user.id)
      .single();

    const role = member?.role as MemberRole | undefined;
    if (role !== "admin" && role !== "manager") {
      throw new Error(
        "Nur Admin oder Manager duerfen Abnahme-Dokumentation erstellen."
      );
    }
  }

  if (!params.note.trim()) {
    throw new Error("Bitte eine Beschreibung eingeben.");
  }

  const { data: update, error } = await supabase
    .from("phase_updates")
    .insert({
      defect_id: params.defectId,
      project_id: params.projectId,
      phase: params.phase,
      note: params.note.trim(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !update) {
    throw new Error("Fehler beim Speichern des Updates.");
  }

  revalidatePath(`/project/${params.projectId}/defect/${params.defectId}`);
  return update;
}

export async function uploadPhaseUpdateMedia(params: {
  phaseUpdateId: string;
  defectId: string;
  projectId: string;
  phase: MediaPhase;
  formData: FormData;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const file = params.formData.get("file") as File;
  if (!file) throw new Error("Keine Datei ausgewaehlt");

  const type = file.type.startsWith("image/") ? "image" : "video";
  const ext = file.name.split(".").pop() || "bin";
  const path = `${params.projectId}/${params.defectId}/${params.phase}/${params.phaseUpdateId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("defect-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error("Fehler beim Hochladen der Datei");

  const { error: dbError } = await supabase
    .from("phase_update_media")
    .insert({
      phase_update_id: params.phaseUpdateId,
      type,
      storage_path: path,
      file_size: file.size,
      mime_type: file.type,
    });

  if (dbError) throw new Error("Fehler beim Speichern der Mediendaten");

  revalidatePath(
    `/project/${params.projectId}/defect/${params.defectId}`
  );
  return path;
}

export async function getPhaseUpdates(defectId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("phase_updates")
    .select("*, phase_update_media(*)")
    .eq("defect_id", defectId)
    .order("created_at", { ascending: true });

  return data ?? [];
}
