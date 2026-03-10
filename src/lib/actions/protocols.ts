"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AcceptanceVerdict, MemberRole } from "@/lib/db/schema";

interface DefectVerdictInput {
  defectId: string;
  verdict: AcceptanceVerdict;
  correctionDeadline?: string;
  note?: string;
}

export async function createAcceptanceProtocol(params: {
  projectId: string;
  unitId?: string;
  title: string;
  location?: string;
  inspectionDate: string;
  participants: string;
  generalNotes?: string;
  signatureContractor?: string;
  signatureClient?: string;
  defectVerdicts: DefectVerdictInput[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", params.projectId)
    .eq("user_id", user.id)
    .single();

  const role = member?.role as MemberRole | undefined;
  if (role !== "admin" && role !== "manager") {
    throw new Error(
      "Nur Admin oder Manager duerfen Abnahmeprotokolle erstellen."
    );
  }

  const hashInput = [
    ...params.defectVerdicts.map(
      (v) => `${v.defectId}:${v.verdict}`
    ),
    params.inspectionDate,
    params.signatureContractor ?? "",
    params.signatureClient ?? "",
    params.participants,
  ].join("|");

  const encoder = new TextEncoder();
  const data = encoder.encode(hashInput);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const integrityHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data: protocol, error } = await supabase
    .from("acceptance_protocols")
    .insert({
      project_id: params.projectId,
      unit_id: params.unitId || null,
      title: params.title,
      location: params.location || null,
      inspection_date: params.inspectionDate,
      participants: params.participants,
      general_notes: params.generalNotes || null,
      signature_contractor: params.signatureContractor || null,
      signature_client: params.signatureClient || null,
      integrity_hash: integrityHash,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !protocol) {
    throw new Error("Fehler beim Erstellen des Protokolls.");
  }

  if (params.defectVerdicts.length > 0) {
    const verdicts = params.defectVerdicts.map((v) => ({
      protocol_id: protocol.id,
      defect_id: v.defectId,
      verdict: v.verdict,
      correction_deadline: v.correctionDeadline || null,
      note: v.note || null,
    }));

    const { error: verdictError } = await supabase
      .from("protocol_defect_verdicts")
      .insert(verdicts);

    if (verdictError) {
      throw new Error("Fehler beim Speichern der Mangel-Bewertungen.");
    }
  }

  revalidatePath(`/project/${params.projectId}`);
  return protocol;
}

export async function updateProtocolPdf(params: {
  protocolId: string;
  projectId: string;
  pdfPath: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("acceptance_protocols")
    .update({ pdf_storage_path: params.pdfPath })
    .eq("id", params.protocolId);

  if (error) throw new Error("Fehler beim Aktualisieren des Protokolls.");

  revalidatePath(`/project/${params.projectId}`);
}

export async function getProtocols(projectId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("acceptance_protocols")
    .select("*, protocol_defect_verdicts(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getProtocol(protocolId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("acceptance_protocols")
    .select(
      "*, protocol_defect_verdicts(*, defects(id, title, status, priority))"
    )
    .eq("id", protocolId)
    .single();

  return data;
}
