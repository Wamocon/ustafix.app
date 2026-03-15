"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { AdminLegalConsentOverview } from "@/lib/actions/legal";
import { useTranslation } from "@/hooks/use-translations";

interface AdminLegalConsentPanelProps {
  overview: AdminLegalConsentOverview | null;
}

export function AdminLegalConsentPanel({ overview }: AdminLegalConsentPanelProps) {
  const t = useTranslation();

  if (!overview || overview.records.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {t("dashboard.legalNoData")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label={t("dashboard.projects")} value={overview.projectCount} tone="neutral" />
        <SummaryCard label={t("dashboard.teamMembers")} value={overview.totalMembers} tone="neutral" />
        <SummaryCard label={t("dashboard.legalAccepted")} value={overview.fullyAccepted} tone="success" />
        <SummaryCard label={t("dashboard.legalMissing")} value={overview.missingConsents} tone={overview.missingConsents > 0 ? "danger" : "success"} />
      </div>

      <div className="space-y-2">
        {overview.records.map((record) => {
          const statusClass = record.allAccepted
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-amber-200 bg-amber-50/70";

          return (
            <div
              key={`${record.projectId}-${record.userId}`}
              className={`rounded-2xl border p-4 ${statusClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {record.fullName ?? record.email ?? record.userId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.projectName} · {record.role}
                  </p>
                  {record.email && (
                    <p className="mt-1 text-xs text-muted-foreground">{record.email}</p>
                  )}
                </div>

                <div className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                  {record.allAccepted ? t("dashboard.legalStatusComplete") : t("dashboard.legalStatusMissing")}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <ConsentBadge label={t("legal.terms")} ok={record.termsAccepted} />
                <ConsentBadge label={t("legal.privacy")} ok={record.privacyAccepted} />
                <ConsentBadge label="DSGVO" ok={record.dsgvoAccepted} />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{t("dashboard.legalVersion")}: {record.version ?? "-"}</span>
                <span>{t("dashboard.legalAcceptedAt")}: {record.acceptedAt ? new Date(record.acceptedAt).toLocaleString() : "-"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "danger";
}) {
  const tones = {
    neutral: "border-border bg-card text-foreground",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    danger: "border-amber-200 bg-amber-50 text-amber-900",
  } as const;

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function ConsentBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
        ok
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-900"
      }`}
    >
      {ok ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}