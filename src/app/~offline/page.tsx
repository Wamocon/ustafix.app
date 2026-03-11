"use client";

import { WifiOff } from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";

export default function OfflinePage() {
  const t = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10">
        <WifiOff className="h-12 w-12 text-amber-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold">{t("offline.title")}</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t("offline.subtitle")}
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="h-12 rounded-2xl gradient-primary px-8 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl active:scale-[0.98] cursor-pointer"
      >
        {t("offline.tryAgain")}
      </button>
    </div>
  );
}
