"use client";

import { useState, useTransition } from "react";
import {
  X,
  Loader2,
  ClipboardCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AcceptanceVerdict } from "@/lib/db/schema";
import { createAcceptanceProtocol } from "@/lib/actions/protocols";
import { SignatureCanvas } from "./signature-canvas";

interface DefectItem {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface AcceptanceProtocolFormProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  units: { id: string; name: string }[];
  defects: DefectItem[];
}

interface DefectVerdictState {
  defectId: string;
  verdict: AcceptanceVerdict;
  correctionDeadline: string;
  note: string;
}

const VERDICT_OPTIONS: {
  value: AcceptanceVerdict;
  label: string;
  icon: typeof CheckCircle2;
  color: string;
}[] = [
  {
    value: "akzeptiert",
    label: "Akzeptiert",
    icon: CheckCircle2,
    color: "text-green-500 bg-green-500/10 border-green-500/30",
  },
  {
    value: "beanstandet",
    label: "Beanstandet",
    icon: AlertTriangle,
    color: "text-red-500 bg-red-500/10 border-red-500/30",
  },
  {
    value: "zurueckgestellt",
    label: "Zurueckgestellt",
    icon: Clock,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
];

export function AcceptanceProtocolForm({
  open,
  onClose,
  projectId,
  units,
  defects,
}: AcceptanceProtocolFormProps) {
  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState("");
  const [location, setLocation] = useState("");
  const [participants, setParticipants] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [signatureContractor, setSignatureContractor] = useState("");
  const [signatureClient, setSignatureClient] = useState("");
  const [verdicts, setVerdicts] = useState<DefectVerdictState[]>(
    defects.map((d) => ({
      defectId: d.id,
      verdict: d.status === "erledigt" ? "akzeptiert" : "beanstandet",
      correctionDeadline: "",
      note: "",
    }))
  );
  const [isPending, startTransition] = useTransition();

  const filteredDefects = unitId
    ? defects
    : defects;

  function updateVerdict(
    defectId: string,
    updates: Partial<DefectVerdictState>
  ) {
    setVerdicts((prev) =>
      prev.map((v) => (v.defectId === defectId ? { ...v, ...updates } : v))
    );
  }

  const canSubmit =
    !isPending &&
    title.trim() &&
    participants.trim() &&
    signatureContractor &&
    signatureClient;

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        await createAcceptanceProtocol({
          projectId,
          unitId: unitId || undefined,
          title: title.trim(),
          location: location.trim() || undefined,
          inspectionDate: new Date().toISOString(),
          participants: participants.trim(),
          generalNotes: generalNotes.trim() || undefined,
          signatureContractor,
          signatureClient,
          defectVerdicts: verdicts.map((v) => ({
            defectId: v.defectId,
            verdict: v.verdict,
            correctionDeadline: v.correctionDeadline || undefined,
            note: v.note || undefined,
          })),
        });

        toast.success("Abnahmeprotokoll erstellt");
        onClose();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Fehler beim Erstellen";
        toast.error(message);
      }
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          <motion.div
            initial={{ y: "3%" }}
            animate={{ y: 0 }}
            exit={{ y: "3%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="flex h-full flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-extrabold">Abnahmeprotokoll</h2>
              </div>
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* Basic info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Titel *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z.B. Abnahmeprotokoll Wohnung 3.OG"
                    className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                  />
                </div>

                {units.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Einheit</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setUnitId("")}
                        className={cn(
                          "rounded-full px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer",
                          !unitId
                            ? "gradient-primary text-white shadow-md"
                            : "bg-card border border-border text-muted-foreground"
                        )}
                      >
                        Alle
                      </button>
                      {units.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setUnitId(u.id)}
                          className={cn(
                            "rounded-full px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer",
                            unitId === u.id
                              ? "gradient-primary text-white shadow-md"
                              : "bg-card border border-border text-muted-foreground"
                          )}
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Ort</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="z.B. Musterstrasse 42, 10115 Berlin"
                    className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Teilnehmer *
                  </label>
                  <textarea
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="z.B. Herr Mueller (Auftraggeber), Frau Schmidt (Bauleitung)"
                    rows={2}
                    className="flex w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Allgemeine Anmerkungen
                  </label>
                  <textarea
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="Optionale Anmerkungen zum Gesamtzustand..."
                    rows={2}
                    className="flex w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground resize-none"
                  />
                </div>
              </div>

              {/* Defect verdicts */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Maengelbewertung ({filteredDefects.length})
                </h3>

                {filteredDefects.map((defect) => {
                  const v = verdicts.find((vd) => vd.defectId === defect.id);
                  if (!v) return null;

                  return (
                    <div
                      key={defect.id}
                      className="rounded-2xl border border-border bg-card p-4 space-y-3"
                    >
                      <p className="text-sm font-semibold">{defect.title}</p>

                      <div className="flex gap-1.5">
                        {VERDICT_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              onClick={() =>
                                updateVerdict(defect.id, {
                                  verdict: opt.value,
                                })
                              }
                              className={cn(
                                "flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                                v.verdict === opt.value
                                  ? `${opt.color} border-2`
                                  : "border-border text-muted-foreground"
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {v.verdict === "beanstandet" && (
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={v.correctionDeadline}
                            onChange={(e) =>
                              updateVerdict(defect.id, {
                                correctionDeadline: e.target.value,
                              })
                            }
                            className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none"
                            placeholder="Frist"
                          />
                          <input
                            value={v.note}
                            onChange={(e) =>
                              updateVerdict(defect.id, { note: e.target.value })
                            }
                            placeholder="Anmerkung..."
                            className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Consent clause */}
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-xs text-muted-foreground italic">
                  Beide Parteien stimmen der elektronischen Form dieses
                  Protokolls zu. Dieses Dokument ist durch einen SHA-256 Hash
                  gegen Manipulation geschuetzt.
                </p>
              </div>

              {/* Signatures */}
              <SignatureCanvas
                label="Unterschrift Auftragnehmer *"
                value={signatureContractor}
                onSignature={setSignatureContractor}
              />
              <SignatureCanvas
                label="Unterschrift Auftraggeber *"
                value={signatureClient}
                onSignature={setSignatureClient}
              />
            </div>

            <div className="border-t border-border p-4 safe-area-bottom">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-primary text-lg font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ClipboardCheck className="h-5 w-5" />
                    Protokoll erstellen
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
