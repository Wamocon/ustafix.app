"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translations";

export type LegalConsentState = {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dsgvoAccepted: boolean;
};

interface LegalConsentFieldsProps {
  value: LegalConsentState;
  onChange: (next: LegalConsentState) => void;
  disabled?: boolean;
}

export function hasAcceptedAllLegalConsents(value: LegalConsentState) {
  return value.termsAccepted && value.privacyAccepted && value.dsgvoAccepted;
}

export function LegalConsentFields({
  value,
  onChange,
  disabled = false,
}: LegalConsentFieldsProps) {
  const t = useTranslation();

  function update<K extends keyof LegalConsentState>(key: K, checked: boolean) {
    onChange({ ...value, [key]: checked });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-sm">
      <p className="mb-3 font-semibold text-foreground">{t("auth.legalConsentTitle")}</p>
      <div className="space-y-3 text-muted-foreground">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={value.termsAccepted}
            onChange={(e) => update("termsAccepted", e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
          />
          <span>
            {t("auth.acceptTermsPrefix")} {" "}
            <Link href="/agb" className="font-medium text-amber-700 hover:underline">
              {t("legal.terms")}
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={value.privacyAccepted}
            onChange={(e) => update("privacyAccepted", e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
          />
          <span>
            {t("auth.acceptPrivacyPrefix")} {" "}
            <Link href="/datenschutz" className="font-medium text-amber-700 hover:underline">
              {t("legal.privacy")}
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={value.dsgvoAccepted}
            onChange={(e) => update("dsgvoAccepted", e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
          />
          <span>{t("auth.acceptDsgvoConsent")}</span>
        </label>
      </div>
    </div>
  );
}