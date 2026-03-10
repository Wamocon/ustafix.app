import { createClient } from "@/lib/supabase/client";

export async function uploadFileClient(
  file: File,
  defectId: string,
  projectId: string
): Promise<{ path: string; type: "image" | "video" | "audio" }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const type: "image" | "video" | "audio" = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
    ? "video"
    : "audio";

  const ext = file.name.split(".").pop() || "bin";
  const path = `${projectId}/${defectId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("defect-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);
  }

  const { error: dbError } = await supabase.from("defect_media").insert({
    defect_id: defectId,
    type,
    storage_path: path,
    file_size: file.size,
    mime_type: file.type,
    created_by: user?.id ?? null,
  });

  if (dbError) {
    throw new Error(`Metadaten speichern fehlgeschlagen: ${dbError.message}`);
  }

  return { path, type };
}
