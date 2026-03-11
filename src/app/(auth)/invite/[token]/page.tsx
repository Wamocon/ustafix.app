"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Mail,
  Shield,
  Users,
} from "lucide-react";
import { UstafixLogo } from "@/components/ustafix-logo";
import { motion } from "framer-motion";
import {
  getInvitationInfo,
  acceptInvitationByToken,
} from "@/lib/actions/invitations";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  worker: "Mitarbeiter",
};

type InviteInfo = {
  valid?: boolean;
  email?: string;
  role?: string;
  project_name?: string;
  inviter_name?: string;
  expires_at?: string;
  error?: string;
  status?: string;
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mode, setMode] = useState<"loading" | "info" | "register" | "accepted" | "error">("loading");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function init() {
      const [info, supabase] = await Promise.all([
        getInvitationInfo(token),
        Promise.resolve(createClient()),
      ]);

      setInviteInfo(info);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (info.error) {
        setMode("error");
        setLoading(false);
        return;
      }

      if (currentUser) {
        setUser({ email: currentUser.email });

        if (currentUser.email?.toLowerCase() === info.email?.toLowerCase()) {
          // Auto-accept
          const result = await acceptInvitationByToken(token);
          if (result.error) {
            setFormError(result.error);
            setMode("error");
          } else {
            setMode("accepted");
            setTimeout(() => {
              router.push(`/project/${result.projectId}`);
              router.refresh();
            }, 1500);
          }
        } else {
          setFormError(
            `Sie sind als ${currentUser.email} angemeldet, aber diese Einladung gilt für ${info.email}. Bitte melden Sie sich ab und mit der richtigen Adresse an.`
          );
          setMode("error");
        }
      } else {
        setEmail(info.email ?? "");
        setMode("info");
      }

      setLoading(false);
    }

    init();
  }, [token, router]);

  function handleRegister() {
    setFormError("");

    if (!fullName.trim()) {
      setFormError("Bitte geben Sie Ihren Namen ein.");
      return;
    }
    if (password.length < 6) {
      setFormError("Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        if (error.message?.includes("already registered")) {
          setFormError(
            "Diese E-Mail ist bereits registriert. Bitte melden Sie sich an."
          );
          return;
        }
        setFormError(`Registrierung fehlgeschlagen: ${error.message}`);
        return;
      }

      const result = await acceptInvitationByToken(token);
      if (result.error) {
        setFormError(result.error);
        return;
      }

      setMode("accepted");
      setTimeout(() => {
        router.push(`/project/${result.projectId}`);
        router.refresh();
      }, 1500);
    });
  }

  function handleLogin() {
    setFormError("");

    if (password.length < 1) {
      setFormError("Bitte geben Sie Ihr Passwort ein.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFormError("E-Mail oder Passwort ist falsch.");
        return;
      }

      const result = await acceptInvitationByToken(token);
      if (result.error) {
        setFormError(result.error);
        return;
      }

      setMode("accepted");
      setTimeout(() => {
        router.push(`/project/${result.projectId}`);
        router.refresh();
      }, 1500);
    });
  }

  if (loading || mode === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
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
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl overflow-hidden shadow-lg shadow-amber-500/25"
          >
            <UstafixLogo className="h-full w-full" />
          </motion.div>
        </div>

        {/* Error state */}
        {mode === "error" && (
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 px-6 py-8">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {formError || inviteInfo?.error || "Einladung ungültig"}
              </p>
            </div>
            {user && (
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/dashboard"
                  className="font-semibold text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Zum Dashboard
                </Link>
              </p>
            )}
            {!user && (
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="font-semibold text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Zur Anmeldung
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Accepted state */}
        {mode === "accepted" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-2xl bg-status-done/10 border border-status-done/20 px-6 py-8 text-center"
          >
            <CheckCircle2 className="h-12 w-12 text-status-done" />
            <p className="text-sm font-semibold text-status-done">
              Einladung angenommen! Sie werden weitergeleitet...
            </p>
          </motion.div>
        )}

        {/* Invite info + register/login */}
        {mode === "info" && inviteInfo && (
          <div className="space-y-5">
            {/* Invite card */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                <Users className="h-4 w-4" />
                Projekteinladung
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold">{inviteInfo.project_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  Rolle: {ROLE_LABELS[inviteInfo.role ?? "worker"] ?? inviteInfo.role}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Eingeladen von {inviteInfo.inviter_name}
                </div>
              </div>
            </div>

            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20"
              >
                {formError}
              </motion.div>
            )}

            {/* Registration/Login form */}
            <InviteAuthForm
              email={email}
              fullName={fullName}
              password={password}
              onFullNameChange={setFullName}
              onPasswordChange={setPassword}
              onRegister={handleRegister}
              onLogin={handleLogin}
              isPending={isPending}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function InviteAuthForm({
  email,
  fullName,
  password,
  onFullNameChange,
  onPasswordChange,
  onRegister,
  onLogin,
  isPending,
}: {
  email: string;
  fullName: string;
  password: string;
  onFullNameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onRegister: () => void;
  onLogin: () => void;
  isPending: boolean;
}) {
  const [tab, setTab] = useState<"register" | "login">("register");

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex rounded-xl bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => setTab("register")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all cursor-pointer ${
            tab === "register"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Konto erstellen
        </button>
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all cursor-pointer ${
            tab === "login"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Anmelden
        </button>
      </div>

      {/* Email (read-only, from invitation) */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">E-Mail</label>
        <div className="flex h-13 w-full items-center rounded-2xl border border-border bg-muted/30 px-4 text-sm text-muted-foreground">
          <Mail className="mr-2 h-4 w-4" />
          {email}
        </div>
      </div>

      {tab === "register" && (
        <div className="space-y-2">
          <label htmlFor="invite-name" className="text-sm font-semibold">
            Vollständiger Name
          </label>
          <input
            id="invite-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Max Mustermann"
            className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
            autoComplete="name"
            disabled={isPending}
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="invite-password" className="text-sm font-semibold">
          Passwort
        </label>
        <input
          id="invite-password"
          type="password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder={tab === "register" ? "Mindestens 6 Zeichen" : "••••••••"}
          className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
          autoComplete={tab === "register" ? "new-password" : "current-password"}
          disabled={isPending}
        />
      </div>

      <button
        type="button"
        onClick={tab === "register" ? onRegister : onLogin}
        disabled={isPending}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl gradient-primary font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {tab === "register" ? "Registrieren & Beitreten" : "Anmelden & Beitreten"}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
