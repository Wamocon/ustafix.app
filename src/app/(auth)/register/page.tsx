"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HardHat, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { claimPendingInvitations } from "@/lib/actions/invitations";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      if (error.message?.includes("email")) {
        setError(
          "E-Mail-Bestätigung erforderlich. Bitte deaktivieren Sie die E-Mail-Bestätigung in den Supabase Auth-Einstellungen für die Entwicklung."
        );
      } else if (error.message?.includes("already registered")) {
        setError("Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.");
      } else {
        setError(`Registrierung fehlgeschlagen: ${error.message}`);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    claimPendingInvitations().catch(() => {});
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1000);
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] h-[500px] w-[500px] rounded-full bg-orange-500/8 blur-[100px]" />
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
            className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-lg shadow-amber-500/25"
          >
            <HardHat className="h-10 w-10 text-white" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Konto erstellen
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Erstellen Sie ein Konto, um Mängel zu erfassen.
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
              Konto erstellt! Sie werden weitergeleitet...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
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
              <label htmlFor="name" className="text-sm font-semibold">
                Vollständiger Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Max Mustermann"
                className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firma.de"
                className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl gradient-primary font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Registrieren
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Bereits ein Konto?{" "}
          <Link
            href="/login"
            className="font-semibold text-amber-500 hover:text-amber-400 transition-colors"
          >
            Anmelden
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
