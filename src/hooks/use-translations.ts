"use client";

import { useLanguageContext } from "@/contexts/language-context";

/**
 * Returns the translation function, current language, and setLanguage.
 */
export function useTranslations() {
  return useLanguageContext();
}

/**
 * Convenience hook that returns only the translation function.
 */
export function useTranslation() {
  const { t } = useLanguageContext();
  return t;
}
