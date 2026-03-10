"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getDefectComments(defectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("defect_comments")
    .select("id, defect_id, user_id, message, created_at")
    .eq("defect_id", defectId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function createDefectComment(
  projectId: string,
  defectId: string,
  message: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const trimmed = message.trim();
  if (!trimmed) throw new Error("Nachricht darf nicht leer sein.");

  const { error } = await supabase.from("defect_comments").insert({
    defect_id: defectId,
    user_id: user.id,
    message: trimmed,
  });

  if (error) throw new Error("Fehler beim Speichern des Kommentars.");

  revalidatePath(`/project/${projectId}/defect/${defectId}`);
}

export async function deleteDefectComment(
  projectId: string,
  commentId: string,
  defectId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("defect_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw new Error("Fehler beim Löschen des Kommentars.");
  revalidatePath(`/project/${projectId}/defect/${defectId}`);
}
