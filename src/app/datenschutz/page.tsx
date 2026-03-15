import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Ustafix.app",
  description: "Datenschutzerklärung der Ustafix.app der WAMOCON GmbH.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <LegalPageShell title="Datenschutzerklärung" updatedAt="März 2026">
      <Section title="1. Verantwortlicher">
        <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze der Mitgliedstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist:</p>
        <div className="space-y-1 pt-1">
          <p className="font-medium text-foreground">WAMOCON GmbH</p>
          <p>Mergenthalerallee 79 – 81</p>
          <p>65760 Eschborn</p>
          <p>Telefon: <a className="font-medium text-amber-700 hover:underline" href="tel:+4961965838311">+49 6196 5838311</a></p>
          <p>E-Mail: <a className="font-medium text-amber-700 hover:underline" href="mailto:info@wamocon.com">info@wamocon.com</a></p>
          <p>Projektkontakt: <a className="font-medium text-amber-700 hover:underline" href="mailto:info@ustafix.app">info@ustafix.app</a></p>
          <p>Geschäftsführer: Dipl.-Ing. Waleri Moretz</p>
          <p>Handelsregister: Eschborn HRB 123666</p>
          <p>USt-ID: DE344930486</p>
        </div>
      </Section>

      <Section title="2. Überblick über die Datenverarbeitung">
        <p>Diese Datenschutzerklärung gilt für die Website und Webanwendung Ustafix.app. Ustafix.app ist eine digitale Plattform für Baustellenmängelmanagement, Projektdokumentation, Statusverfolgung, Teamkoordination und Abnahmeprotokolle.</p>
        <p>Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Plattform sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten erfolgt regelmäßig nur nach Einwilligung des Nutzers oder auf einer anderen gesetzlichen Grundlage.</p>
      </Section>

      <Section title="3. Rechtsgrundlagen der Verarbeitung">
        <p>Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung einholen, dient Art. 6 Abs. 1 lit. a DSGVO als Rechtsgrundlage.</p>
        <p>Bei der Verarbeitung personenbezogener Daten, die zur Erfüllung eines Vertrages oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist, dient Art. 6 Abs. 1 lit. b DSGVO als Rechtsgrundlage.</p>
        <p>Soweit eine Verarbeitung personenbezogener Daten zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist, dient Art. 6 Abs. 1 lit. c DSGVO als Rechtsgrundlage.</p>
        <p>Ist die Verarbeitung zur Wahrung eines berechtigten Interesses unseres Unternehmens oder eines Dritten erforderlich und überwiegen die Interessen, Grundrechte und Grundfreiheiten des Betroffenen nicht, dient Art. 6 Abs. 1 lit. f DSGVO als Rechtsgrundlage.</p>
      </Section>

      <Section title="4. Hosting und Infrastruktur">
        <p>Unsere Plattform wird über moderne Cloud-Infrastruktur bereitgestellt. Wir nutzen folgende Dienste:</p>
        <div>
          <p className="font-medium text-foreground">Vercel Inc.</p>
          <p>Die Website und Webanwendung werden über Vercel gehostet. Dabei verarbeitet Vercel technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitstempel und Browserinformationen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Supabase Inc.</p>
          <p>Für Datenbank, Authentifizierung, Dateispeicher und Teile der Backend-Infrastruktur nutzen wir Supabase. Verarbeitet werden insbesondere Authentifizierungsdaten, Session-Informationen, Projektdaten sowie gespeicherte Medien. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Groq LLC</p>
          <p>Für die KI-gestützte Sprachtranskription und Übersetzung nutzen wir die API von Groq. Dabei werden Audiodaten und daraus abgeleitete Texte an Groq übertragen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO bei Nutzung der Sprachfunktion sowie Art. 6 Abs. 1 lit. b DSGVO für die gewünschte Funktionsausführung.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Resend Inc.</p>
          <p>Für den Versand von Einladungs-E-Mails nutzen wir Resend. Verarbeitet werden dabei insbesondere E-Mail-Adresse, Projektbezug und der Einladungsinhalt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
        </div>
      </Section>

      <Section title="5. Registrierung und Authentifizierung">
        <p>Für die Nutzung von Ustafix.app ist eine Registrierung erforderlich. Bei der Registrierung und Kontonutzung werden insbesondere folgende Daten verarbeitet:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>E-Mail-Adresse</li>
          <li>Vor- und Nachname</li>
          <li>Passwort in gehashter Form</li>
          <li>Projektrolle innerhalb eines Projekts (z. B. Admin, Manager, Worker)</li>
          <li>Session-Tokens und sicherheitsrelevante Authentifizierungsinformationen</li>
        </ul>
        <p>Die Authentifizierung erfolgt über Supabase Auth. Die Verarbeitung dient der Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO.</p>
      </Section>

      <Section title="6. Datenverarbeitung auf der Plattform">
        <p>Im Rahmen der Nutzung von Ustafix.app werden insbesondere folgende Kategorien personenbezogener und projektbezogener Daten verarbeitet:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Projektstammdaten wie Projektname, Adresse und Einheiten</li>
          <li>Mängeldaten, einschließlich Titel, Beschreibungen, Prioritäten und Status</li>
          <li>Medieninhalte wie Fotos, Videos und Audiodateien</li>
          <li>Kommentare, Rückfragen und Arbeitsanweisungen</li>
          <li>Statusverläufe und Fortschrittsdokumentationen</li>
          <li>Abnahmeprotokolle einschließlich digitaler Unterschriften und Integritätshash</li>
          <li>Projektmitgliedschaften, Einladungen und Push-Benachrichtigungseinstellungen</li>
        </ul>
        <p>Diese Daten werden zur Durchführung des Vertrags, zur Teamkoordination und zur revisionssicheren Projektdokumentation verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
      </Section>

      <Section title="7. KI-gestützte Datenverarbeitung (Groq AI)">
        <p>Ustafix.app bietet eine KI-gestützte Sprachfunktion zur Transkription und Übersetzung von Mängelbeschreibungen. Dabei gelten folgende Grundsätze:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Audioaufnahmen werden verschlüsselt an die Groq API übertragen.</li>
          <li>Die Transkription dient ausschließlich der vom Nutzer ausgelösten Umwandlung von Sprache in Text.</li>
          <li>Die Übersetzung erfolgt ausschließlich zur Bereitstellung der Sprachversionen innerhalb der Plattform.</li>
          <li>Die Funktion ist optional. Nutzer können Mängel auch manuell ohne KI erfassen.</li>
        </ul>
        <p>Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO bei aktiver Nutzung der Sprachfunktion und Art. 6 Abs. 1 lit. b DSGVO zur Erbringung der gewünschten Plattformfunktion.</p>
      </Section>

      <Section title="8. Cookies und lokale Speicherung">
        <p>Ustafix.app verwendet technisch notwendige Cookies und ähnliche Technologien, soweit dies für Anmeldung, Sitzungsverwaltung, Sicherheit und den Betrieb der Plattform erforderlich ist.</p>
        <p>Zusätzlich nutzt die Plattform lokale Browser-Speichertechnologien wie localStorage, IndexedDB, Service-Worker-Caches und gerätebezogene Offline-Speicherbereiche, um Spracheinstellungen, Offline-Daten, temporäre Medien und Synchronisationszustände lokal zu speichern.</p>
        <p>Diese lokalen Daten dienen ausschließlich der Funktionsfähigkeit der Anwendung, insbesondere der Offline-Nutzung. Sie verlassen das Endgerät grundsätzlich nicht automatisch, außer soweit eine Synchronisierung mit dem Server durch den Nutzer oder die App-Funktion ausgelöst wird.</p>
        <p>Tracking-, Werbe- oder Analyse-Cookies werden derzeit nicht eingesetzt.</p>
      </Section>

      <Section title="9. Kontaktaufnahme">
        <p>Wenn Sie uns per E-Mail kontaktieren, werden die von Ihnen mitgeteilten Daten wie Name, E-Mail-Adresse und Nachrichteninhalt verarbeitet, um Ihre Anfrage zu bearbeiten und für Anschlussfragen bereitzuhalten.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Sofern die Kontaktaufnahme auf den Abschluss oder die Durchführung eines Vertrags abzielt, ist zusätzliche Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO.</p>
      </Section>

      <Section title="10. Webanalyse">
        <p>Derzeit setzt Ustafix.app keine Webanalyse-, Tracking- oder Marketing-Tools ein. Sollte dies zukünftig geändert werden, erfolgt die Verarbeitung nur auf Basis der jeweils erforderlichen gesetzlichen Grundlage und, soweit nötig, erst nach Ihrer ausdrücklichen Einwilligung.</p>
      </Section>

      <Section title="11. SSL- bzw. TLS-Verschlüsselung">
        <p>Diese Website und Webanwendung nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an der sicheren Browserverbindung über https.</p>
      </Section>

      <Section title="12. Weitergabe von Daten an Dritte">
        <p>Eine Übermittlung Ihrer personenbezogenen Daten an Dritte findet grundsätzlich nur statt, wenn:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sie Ihre ausdrückliche Einwilligung erteilt haben,</li>
          <li>die Weitergabe zur Vertragserfüllung erforderlich ist,</li>
          <li>eine rechtliche Verpflichtung besteht oder</li>
          <li>berechtigte Interessen die Weitergabe erfordern und keine überwiegenden Schutzinteressen entgegenstehen.</li>
        </ul>
        <p>Im Rahmen der Auftragsverarbeitung setzen wir insbesondere Vercel, Supabase, Groq und Resend ein.</p>
      </Section>

      <Section title="13. Speicherdauer und Datenlöschung">
        <p>Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kontodaten werden mit Löschung des Benutzerkontos gelöscht, sofern keine gesetzlichen Pflichten entgegenstehen.</li>
          <li>Projekt- und Mängeldaten werden grundsätzlich bis zur Löschung des jeweiligen Projekts oder Kontos gespeichert.</li>
          <li>Medieninhalte werden bis zur Löschung durch berechtigte Nutzer oder bis zur Löschung der verknüpften Datensätze gespeichert.</li>
          <li>Einladungen werden nach Ablauf, Widerruf oder Einlösung nicht weiter aktiv genutzt.</li>
          <li>Push-Abonnements werden bis zur Deaktivierung gespeichert.</li>
          <li>Lokal gespeicherte Offline-Daten verbleiben auf dem Gerät, bis sie synchronisiert oder durch den Nutzer entfernt werden.</li>
        </ul>
      </Section>

      <Section title="14. Rechte der betroffenen Personen">
        <p>Ihnen stehen als betroffene Person folgende Rechte gemäß der DSGVO zu:</p>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">a) Recht auf Auskunft (Art. 15 DSGVO)</p>
            <p>Sie haben das Recht, Auskunft über die zu Ihrer Person gespeicherten Daten zu verlangen.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">b) Recht auf Berichtigung (Art. 16 DSGVO)</p>
            <p>Sie haben das Recht, unverzüglich die Berichtigung unrichtiger personenbezogener Daten zu verlangen.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">c) Recht auf Löschung (Art. 17 DSGVO)</p>
            <p>Sie haben das Recht, die Löschung Ihrer personenbezogenen Daten zu verlangen, sofern die gesetzlichen Voraussetzungen vorliegen.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">d) Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</p>
            <p>Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer Daten zu verlangen.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">e) Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</p>
            <p>Sie haben das Recht, die Sie betreffenden personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">f) Recht auf Widerspruch (Art. 21 DSGVO)</p>
            <p>Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit Widerspruch gegen bestimmte Verarbeitungen einzulegen.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">g) Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)</p>
            <p>Sie haben das Recht, eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen.</p>
          </div>
        </div>
      </Section>

      <Section title="15. Beschwerderecht bei einer Aufsichtsbehörde">
        <p>Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt.</p>
        <div className="space-y-1 pt-1">
          <p className="font-medium text-foreground">Der Hessische Beauftragte für Datenschutz und Informationsfreiheit</p>
          <p>Gustav-Stresemann-Ring 1</p>
          <p>65189 Wiesbaden</p>
          <p>Telefon: +49 611 1408-0</p>
        </div>
      </Section>

      <Section title="16. Änderungen dieser Datenschutzerklärung">
        <p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie stets den aktuellen rechtlichen Anforderungen anzupassen oder Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die jeweils aktuelle Fassung.</p>
      </Section>
    </LegalPageShell>
  );
}