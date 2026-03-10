"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadMedia(
  defectId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const file = formData.get("file") as File;
  if (!file) throw new Error("Keine Datei ausgewählt");

  const type = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
    ? "video"
    : "audio";

  const ext = file.name.split(".").pop() || "bin";
  const path = `${projectId}/${defectId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("defect-media")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new Error("Fehler beim Hochladen der Datei");

  const { error: dbError } = await supabase.from("defect_media").insert({
    defect_id: defectId,
    type,
    storage_path: path,
    file_size: file.size,
    mime_type: file.type,
    created_by: user.id,
  });

  if (dbError) throw new Error("Fehler beim Speichern der Mediendaten");

  revalidatePath(`/project/${projectId}/defect/${defectId}`);
  return path;
}

export async function getMediaUrl(path: string) {
  const supabase = await createClient();
  const { data } = supabase.storage.from("defect-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteMedia(
  mediaId: string,
  storagePath: string,
  defectId: string,
  projectId: string
) {
  const supabase = await createClient();

  await supabase.storage.from("defect-media").remove([storagePath]);

  const { error } = await supabase
    .from("defect_media")
    .delete()
    .eq("id", mediaId);

  if (error) throw new Error("Fehler beim Löschen der Datei");

  revalidatePath(`/project/${projectId}/defect/${defectId}`);
}
