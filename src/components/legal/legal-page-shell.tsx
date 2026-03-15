import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { UstafixLogo } from "@/components/ustafix-logo";
import { LegalLinks } from "@/components/legal/legal-links";

interface LegalPageShellProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#fafaf9_0%,#f8fafc_100%)] text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-xl shadow-sm shadow-amber-500/20">
              <UstafixLogo className="h-full w-full" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight">
                Ustafix<span className="gradient-text">.app</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Rechtliche Informationen</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/40 sm:inline-flex"
            >
              Zur Startseite
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3 py-2 text-sm font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:brightness-110"
            >
              Zur App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 rounded-[2rem] border border-amber-200/70 bg-white/80 p-6 shadow-lg shadow-amber-500/5 sm:p-8">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Link>
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Rechtliches
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Stand: {updatedAt}</p>
          </div>

          <div className="space-y-5">{children}</div>
        </div>
      </main>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-4 text-center">
          <LegalLinks />
          <p className="text-xs text-muted-foreground">
            &copy; 2026 WAMOCON GmbH. Alle Rechte vorbehalten. Entwickelt in Deutschland.
          </p>
        </div>
      </footer>
    </div>
  );
}