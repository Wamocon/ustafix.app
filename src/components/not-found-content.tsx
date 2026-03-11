"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { UstafixLogo } from "@/components/ustafix-logo";
import { useTranslation } from "@/hooks/use-translations";

export function NotFoundContent() {
  const t = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl overflow-hidden shadow-lg shadow-amber-500/25 mb-6">
        <UstafixLogo className="h-full w-full" />
      </div>
      <h1 className="text-7xl font-extrabold gradient-text">{t("notFound.title")}</h1>
      <p className="mt-3 text-lg font-semibold text-muted-foreground">
        {t("notFound.pageNotFound")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("notFound.subtitle")}
      </p>
      <Link
        href="/dashboard"
        className="mt-8 flex items-center gap-2 rounded-2xl gradient-primary px-6 py-3 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] cursor-pointer"
      >
        <Home className="h-4 w-4" />
        {t("notFound.toDashboard")}
      </Link>
    </div>
  );
}
