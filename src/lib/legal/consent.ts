import type { LegalConsentState } from "@/components/legal/legal-consent-fields";

export const LEGAL_CONSENT_VERSION = "2026-03-15";

export function createLegalConsentMetadata(consent: LegalConsentState) {
  const acceptedAt = new Date().toISOString();

  return {
    legal_consent_version: LEGAL_CONSENT_VERSION,
    legal_consents_accepted_at: acceptedAt,
    terms_accepted: consent.termsAccepted,
    privacy_accepted: consent.privacyAccepted,
    dsgvo_accepted: consent.dsgvoAccepted,
  };
}