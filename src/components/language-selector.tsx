"use client";

import { useTranslations } from "@/hooks/use-translations";
import { Globe } from "lucide-react";
import { LOCALES } from "@/lib/i18n/translations";

const LOCALE_LABEL_KEYS: Record<string, string> = {
  de: "settings.languageDe",
  ru: "settings.languageRu",
  tr: "settings.languageTr",
};

export function LanguageSelector() {
  const { language, setLanguage, t } = useTranslations();

  return (
    <div className="section-card space-y-4">
      <h2 className="font-bold flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
          <Globe className="h-4 w-4 text-amber-600" />
        </div>
        {t("settings.language")}
      </h2>
      <div className="flex gap-2">
        {LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => setLanguage(locale)}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              language === locale
                ? "gradient-primary text-white shadow-md shadow-amber-500/20"
                : "border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {t(LOCALE_LABEL_KEYS[locale])}
          </button>
        ))}
      </div>
    </div>
  );
}
