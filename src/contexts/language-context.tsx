"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Locale } from "@/lib/i18n/translations";

const STORAGE_KEY = "ustafix-locale";

type TranslationParams = Record<string, string | number>;

interface LanguageContextValue {
  language: Locale;
  setLanguage: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "de";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "ru" || stored === "tr") return stored;
  } catch {
    // ignore
  }
  return "de";
}

function interpolate(
  template: string,
  params?: TranslationParams
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    const val = params[name];
    return val !== undefined ? String(val) : `{{${name}}}`;
  });
}

export function LanguageContextProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Locale>("de");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLanguageState(getStoredLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((locale: Locale) => {
    setLanguageState(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      const locale = mounted ? language : "de";
      const dict = translations[locale] as Record<string, string>;
      const raw = dict[key];
      if (raw === undefined) return key;
      return interpolate(raw, params);
    },
    [language, mounted]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguageContext must be used within LanguageContextProvider");
  }
  return ctx;
}
