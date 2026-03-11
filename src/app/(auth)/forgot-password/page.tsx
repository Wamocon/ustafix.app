"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { UstafixLogo } from "@/components/ustafix-logo";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const t = useTranslation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(t("auth.forgotPasswordError"));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute -bottom-[30%] -left-[20%] h-[500px] w-[500px] rounded-full bg-orange-500/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm space-y-8"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl overflow-hidden shadow-lg shadow-amber-500/25"
          >
            <UstafixLogo className="h-full w-full" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {t("auth.forgotPasswordTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.forgotPasswordSubtitle")}
            </p>
          </div>
        </div>

        {success ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-2xl bg-status-done/10 border border-status-done/20 px-6 py-8 text-center"
          >
            <CheckCircle2 className="h-12 w-12 text-status-done" />
            <p className="text-sm font-semibold text-status-done">
              {t("auth.emailSent")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("auth.emailSentNote")}
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">
                {t("auth.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="flex h-13 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl gradient-primary font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t("auth.sendLink")
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-semibold text-amber-500 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("auth.backToLogin")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
