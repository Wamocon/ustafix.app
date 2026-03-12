"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  ArrowRight,
  Users,
  FileCheck,
  WifiOff,
  Languages,
  ClipboardCheck,
  Building2,
  Search,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { UstafixLogo } from "@/components/ustafix-logo";
import { GermanyStamp } from "@/components/germany-stamp";
import { useTranslation } from "@/hooks/use-translations";
import { useLanguageContext } from "@/contexts/language-context";
import type { Locale } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";

const LANG_OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "ru", label: "Русский", flag: "🇷🇺" },
  { value: "tr", label: "Türkçe", flag: "🇹🇷" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  { icon: Camera, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { icon: ClipboardCheck, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { icon: Users, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { icon: FileCheck, titleKey: "landing.feature4Title", descKey: "landing.feature4Desc", color: "bg-green-50 text-green-600 border-green-200" },
  { icon: WifiOff, titleKey: "landing.feature5Title", descKey: "landing.feature5Desc", color: "bg-red-50 text-red-600 border-red-200" },
  { icon: Languages, titleKey: "landing.feature6Title", descKey: "landing.feature6Desc", color: "bg-stone-100 text-stone-600 border-stone-200" },
];

const STEPS = [
  { icon: Building2, titleKey: "landing.step1Title", descKey: "landing.step1Desc", step: "01" },
  { icon: Search, titleKey: "landing.step2Title", descKey: "landing.step2Desc", step: "02" },
  { icon: CheckCircle2, titleKey: "landing.step3Title", descKey: "landing.step3Desc", step: "03" },
];

export default function LandingPage() {
  const t = useTranslation();
  const { language, setLanguage } = useLanguageContext();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsLoggedIn(true);
    });
  }, []);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    if (langOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [langOpen]);

  const currentLang = LANG_OPTIONS.find((l) => l.value === language) ?? LANG_OPTIONS[0];

  return (
    <div className="min-h-dvh bg-background">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 glass">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-lg shadow-md shadow-amber-500/15">
              <UstafixLogo className="h-full w-full" />
            </div>
            <span className="text-base font-extrabold tracking-tight">
              Ustafix<span className="gradient-text">.app</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm font-medium transition-colors hover:border-stone-300 cursor-pointer"
              >
                <span className="text-sm">{currentLang.flag}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-border bg-card p-1 shadow-lg"
                >
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setLanguage(opt.value);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        language === opt.value
                          ? "bg-amber-50 text-amber-700"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span>{opt.flag}</span>
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-sm font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:brightness-110 active:scale-[0.97]"
              >
                {t("landing.ctaDashboard")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-sm font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:brightness-110 active:scale-[0.97]"
              >
                {t("landing.ctaLogin")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[30%] -right-[20%] h-[350px] w-[350px] sm:h-[550px] sm:w-[550px] rounded-full bg-amber-500/10 blur-[80px] sm:blur-[120px]" />
          <div className="absolute -bottom-[20%] -left-[20%] h-[280px] w-[280px] sm:h-[450px] sm:w-[450px] rounded-full bg-orange-500/8 blur-[60px] sm:blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-lg sm:max-w-2xl text-center">
          {mounted ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, delay: 0.1 }}
              className="mx-auto mb-6 h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] shadow-xl shadow-amber-500/25"
            >
              <UstafixLogo className="h-full w-full" />
            </motion.div>
          ) : (
            <div className="mx-auto mb-6 h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] shadow-xl shadow-amber-500/25">
              <UstafixLogo className="h-full w-full" />
            </div>
          )}

          {mounted ? (
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.2 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              {t("landing.heroLine1")}
              <br />
              <span className="gradient-text">{t("landing.heroLine2")}</span>
            </motion.h1>
          ) : (
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              {t("landing.heroLine1")}
              <br />
              <span className="gradient-text">{t("landing.heroLine2")}</span>
            </h1>
          )}

          {mounted ? (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.35 }}
              className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {t("landing.heroSubtitle")}
            </motion.p>
          ) : (
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("landing.heroSubtitle")}
            </p>
          )}

          {mounted ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.5 }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4"
            >
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 active:scale-[0.97] sm:w-auto"
              >
                {t("landing.ctaDashboard")}
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 active:scale-[0.97] sm:w-auto"
                >
                  {t("landing.ctaRegister")}
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-base font-semibold shadow-sm transition-all hover:border-stone-300 active:scale-[0.97] sm:w-auto"
                >
                  {t("landing.ctaLogin")}
                </Link>
              </>
            )}
            </motion.div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 active:scale-[0.97] sm:w-auto"
                >
                  {t("landing.ctaDashboard")}
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 active:scale-[0.97] sm:w-auto"
                  >
                    {t("landing.ctaRegister")}
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-base font-semibold shadow-sm transition-all hover:border-stone-300 active:scale-[0.97] sm:w-auto"
                  >
                    {t("landing.ctaLogin")}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-4 py-14 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease }}
            className="text-center"
          >
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground sm:max-w-lg sm:text-base">
              {t("landing.featuresSubtitle")}
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, ease, delay: i * 0.06 }}
                className="rounded-2xl border border-border bg-card p-5 card-elevated"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold sm:text-base">{t(feature.titleKey)}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  {t(feature.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="px-4 py-14 sm:py-24 bg-muted/40">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease }}
            className="text-center"
          >
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t("landing.howTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground sm:max-w-lg sm:text-base">
              {t("landing.howSubtitle")}
            </p>
          </motion.div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, ease, delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border shadow-sm">
                    <step.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-[10px] font-extrabold text-white shadow-md shadow-amber-500/20">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-base font-bold">{t(step.titleKey)}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground max-w-[260px] sm:text-sm">
                  {t(step.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 py-14 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease }}
            className="rounded-2xl sm:rounded-3xl gradient-primary p-8 sm:p-14 text-center text-white shadow-xl shadow-amber-500/20"
          >
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Ustafix<span className="opacity-80">.app</span>
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-white/80 sm:text-base">
              {t("landing.heroSubtitle")}
            </p>
            <div className="mt-6">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-amber-600 shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
                >
                  {t("landing.ctaDashboard")}
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-amber-600 shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
                >
                  {t("landing.ctaRegister")}
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 overflow-hidden rounded-lg shadow-sm">
                <UstafixLogo className="h-full w-full" />
              </div>
              <span className="text-sm font-bold">
                Ustafix<span className="gradient-text">.app</span>
              </span>
            </div>

            <GermanyStamp size={44} showLabel />

            <span className="text-xs text-muted-foreground/70">
              &copy; {new Date().getFullYear()} Ustafix. {t("landing.copyright")}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
