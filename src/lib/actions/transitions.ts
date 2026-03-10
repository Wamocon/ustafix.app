"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DefectStatus, MemberRole } from "@/lib/db/schema";
import { getTransitionRule } from "@/lib/utils";
import { notifyProjectMembers } from "@/lib/push/send";

export async function performStatusTransition(params: {
  defectId: string;
  projectId: string;
  fromStatus: DefectStatus;
  toStatus: DefectStatus;
  note: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const rule = getTransitionRule(params.fromStatus, params.toStatus);
  if (!rule) throw new Error("Ungültiger Statuswechsel");

  // Verify role
  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", params.projectId)
    .eq("user_id", user.id)
    .single();

  if (!member) throw new Error("Kein Projektmitglied");

  const role = member.role as MemberRole;
  if (!rule.allowedRoles.includes(role)) {
    throw new Error("Keine Berechtigung für diesen Statuswechsel");
  }

  // Verify current status hasn't changed (optimistic lock)
  const { data: defect } = await supabase
    .from("defects")
    .select("status, title")
    .eq("id", params.defectId)
    .single();

  if (!defect || defect.status !== params.fromStatus) {
    throw new Error(
      "Der Status wurde bereits von jemand anderem geändert. Bitte Seite neu laden."
    );
  }

  if (!params.note.trim()) {
    throw new Error("Bitte eine Beschreibung eingeben");
  }

  // Insert transition record
  const { data: transition, error: transError } = await supabase
    .from("defect_status_transitions")
    .insert({
      defect_id: params.defectId,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      note: params.note.trim(),
      changed_by: user.id,
    })
    .select()
    .single();

  if (transError || !transition) {
    throw new Error("Fehler beim Speichern des Statuswechsels");
  }

  // Update defect status
  const { error: updateError } = await supabase
    .from("defects")
    .update({
      status: params.toStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.defectId);

  if (updateError) {
    throw new Error("Fehler beim Aktualisieren des Status");
  }

  revalidatePath(`/project/${params.projectId}`);
  revalidatePath(`/project/${params.projectId}/defect/${params.defectId}`);

  const statusLabels: Record<string, string> = {
    offen: "Offen",
    in_arbeit: "In Arbeit",
    erledigt: "Erledigt",
  };

  notifyProjectMembers({
    projectId: params.projectId,
    excludeUserId: user.id,
    type: "status_changes",
    payload: {
      title: "Statusaenderung",
      body: `Mangel "${defect.title}" ist jetzt "${statusLabels[params.toStatus] ?? params.toStatus}"`,
      url: `/project/${params.projectId}/defect/${params.defectId}`,
      tag: `transition-${params.defectId}`,
    },
  }).catch(() => {});

  return transition;
}

export async function uploadTransitionMedia(params: {
  transitionId: string;
  defectId: string;
  projectId: string;
  formData: FormData;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const file = params.formData.get("file") as File;
  if (!file) throw new Error("Keine Datei ausgewählt");

  const type = file.type.startsWith("image/") ? "image" : "video";
  const ext = file.name.split(".").pop() || "bin";
  const path = `${params.projectId}/${params.defectId}/transitions/${params.transitionId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("defect-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error("Fehler beim Hochladen der Datei");

  const { error: dbError } = await supabase.from("transition_media").insert({
    transition_id: params.transitionId,
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

export async function getTransitionHistory(defectId: string) {
  const supabase = await createClient();

  const { data: transitions } = await supabase
    .from("defect_status_transitions")
    .select("*, transition_media(*)")
    .eq("defect_id", defectId)
    .order("created_at", { ascending: true });

  return transitions ?? [];
}
