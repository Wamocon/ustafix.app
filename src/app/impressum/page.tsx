import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Impressum | Ustafix.app",
  description: "Impressum der Ustafix.app der WAMOCON GmbH.",
};

export default function ImpressumPage() {
  return (
    <LegalPageShell title="Impressum" updatedAt="März 2026">
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold">WAMOCON GmbH</h2>
        <div className="mt-4 space-y-1 text-sm leading-relaxed text-muted-foreground">
          <p>Mergenthalerallee 79 – 81</p>
          <p>65760 Eschborn</p>
          <p>Deutschland</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold">Kontakt</h2>
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            Telefon: <a className="font-medium text-amber-700 hover:underline" href="tel:+4961965838311">+49 6196 5838311</a>
          </p>
          <p>
            E-Mail: <a className="font-medium text-amber-700 hover:underline" href="mailto:info@wamocon.com">info@wamocon.com</a>
          </p>
          <p>
            Projektkontakt Ustafix.app: <a className="font-medium text-amber-700 hover:underline" href="mailto:info@ustafix.app">info@ustafix.app</a>
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold">Vertretungsberechtigter Geschäftsführer</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Dipl.-Ing. Waleri Moretz</p>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold">Registereintrag</h2>
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>Sitz der Gesellschaft: Eschborn</p>
          <p>Handelsregister: Eschborn HRB 123666</p>
          <p>Umsatzsteuer-Identifikationsnummer: DE344930486</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold">Angaben zum Angebot</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ustafix.app ist eine webbasierte Software-as-a-Service-Plattform für digitales Baustellen- und Mängelmanagement. Das Angebot richtet sich primär an Unternehmen, Bauleiter, Generalunternehmer, Handwerksbetriebe und projektbezogene Ausführungsteams.
        </p>
      </section>
    </LegalPageShell>
  );
}