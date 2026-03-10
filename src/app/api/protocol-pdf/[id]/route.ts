import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderProtocolPdf } from "@/lib/pdf/protocol-pdf";
import { updateProtocolPdf } from "@/lib/actions/protocols";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: protocolId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { data: protocol } = await supabase
    .from("acceptance_protocols")
    .select(
      "*, protocol_defect_verdicts(*, defects(id, title, status, priority))"
    )
    .eq("id", protocolId)
    .single();

  if (!protocol) {
    return NextResponse.json({ error: "Protokoll nicht gefunden" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", protocol.project_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  if (protocol.pdf_storage_path) {
    const { data: signedUrl } = await supabase.storage
      .from("protocols")
      .createSignedUrl(protocol.pdf_storage_path, 300);

    if (signedUrl?.signedUrl) {
      return NextResponse.redirect(signedUrl.signedUrl);
    }
  }

  const pdfBuffer = await renderProtocolPdf(protocol);

  const storagePath = `${protocol.project_id}/${protocolId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("protocols")
    .upload(storagePath, new Uint8Array(pdfBuffer), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (!uploadError) {
    try {
      await updateProtocolPdf({
        protocolId,
        projectId: protocol.project_id,
        pdfPath: storagePath,
      });
    } catch {
      // non-critical
    }
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${protocol.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "")}.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
