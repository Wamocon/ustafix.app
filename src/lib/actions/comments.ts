"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyProjectMembers } from "@/lib/push/send";

export async function getDefectComments(defectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_defect_comments_with_info", {
    p_defect_id: defectId,
  });

  const comments = data ?? [];
  return comments.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
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

  notifyProjectMembers({
    projectId,
    excludeUserId: user.id,
    type: "new_comments",
    payload: {
      title: "Neuer Kommentar",
      body: trimmed.length > 80 ? trimmed.slice(0, 80) + "..." : trimmed,
      url: `/project/${projectId}/defect/${defectId}`,
      tag: `comment-${defectId}`,
    },
  }).catch(() => {});
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
