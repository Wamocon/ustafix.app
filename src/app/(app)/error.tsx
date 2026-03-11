"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translations";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10 border border-destructive/20 mb-5">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-extrabold">{t("error.title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        {t("error.subtitle")}
      </p>
      <button
        onClick={reset}
        className="mt-6 flex items-center gap-2 rounded-2xl gradient-primary px-6 py-3 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] cursor-pointer"
      >
        <RotateCcw className="h-4 w-4" />
        {t("error.tryAgain")}
      </button>
    </motion.div>
  );
}
