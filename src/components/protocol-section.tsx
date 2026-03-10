"use client";

import { useState } from "react";
import { ClipboardCheck, FileText, Shield, Download, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AcceptanceProtocolForm } from "./acceptance-protocol-form";

interface Protocol {
  id: string;
  title: string;
  inspection_date: string;
  integrity_hash?: string;
  created_at: string;
}

interface Defect {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface ProtocolSectionProps {
  projectId: string;
  units: { id: string; name: string }[];
  defects: Defect[];
  protocols: Protocol[];
  canCreate: boolean;
}

export function ProtocolSection({
  projectId,
  units,
  defects,
  protocols,
  canCreate,
}: ProtocolSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownloadPdf(protocolId: string) {
    setDownloadingId(protocolId);
    try {
      const res = await fetch(`/api/protocol-pdf/${protocolId}`, {
        redirect: "follow",
      });
      if (!res.ok) throw new Error("PDF konnte nicht generiert werden");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        protocols.find((p) => p.id === protocolId)?.title ?? "Protokoll";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Fehler beim Herunterladen des PDFs");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Abnahmeprotokolle ({protocols.length})
        </h2>
        {canCreate && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-500/20 transition-all hover:bg-green-500/20 cursor-pointer"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Neues Protokoll
          </button>
        )}
      </div>

      {protocols.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Noch keine Abnahmeprotokolle erstellt.
        </p>
      ) : (
        <div className="space-y-2">
          {protocols.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(p.inspection_date)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {p.integrity_hash && (
                  <Shield className="h-4 w-4 text-green-500" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPdf(p.id);
                  }}
                  disabled={downloadingId === p.id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                  title="PDF herunterladen"
                >
                  {downloadingId === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AcceptanceProtocolForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        projectId={projectId}
        units={units}
        defects={defects}
      />
    </section>
  );
}
