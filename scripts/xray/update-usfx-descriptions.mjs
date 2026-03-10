#!/usr/bin/env node
/**
 * Aktualisiert die Beschreibungen von USFX-27 bis USFX-41 (FT-01 bis FT-16)
 * mit korrekt formatiertem Markdown.
 *
 * Umgebung:
 *   JIRA_BASE_URL   z.B. https://wamocon.atlassian.net
 *   JIRA_EMAIL      Ihre Jira-E-Mail
 *   JIRA_API_TOKEN  API-Token von https://id.atlassian.com/manage-profile/security/api-tokens
 *
 * Aufruf: node scripts/xray/update-usfx-descriptions.mjs [--dry-run]
 */

import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");
config({ path: join(projectRoot, ".env") });
config({ path: join(projectRoot, ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

const JIRA_BASE_URL = (process.env.JIRA_BASE_URL || "https://wamocon.atlassian.net").replace(/\/$/, "");
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

const ISSUES = [
  {
    key: "USFX-27",
    description: `### Funktionsbereich

Authentifizierung

### Vorbedingung

Keine (neuer Benutzer)

### Testschritte

1. Navigiere zu \`/register\`
2. Gib eine gültige E-Mail-Adresse ein
3. Gib ein Passwort ein (mind. 6 Zeichen)
4. Bestätige das Passwort
5. Klicke auf "Registrieren"

### Erwartetes Ergebnis

- Konto wird erstellt (Supabase Auth)
- Weiterleitung zu \`/dashboard\`
- Toast-Nachricht: Erfolgreiche Registrierung

### Negative Testfälle

- Zu kurzes Passwort (< 6 Zeichen) → Fehlermeldung
- Bereits registrierte E-Mail → Fehlermeldung
- Passwort-Mismatch → Fehlermeldung
- Leere Felder → Validierungsfehler`,
  },
  {
    key: "USFX-28",
    description: `### Funktionsbereich

Authentifizierung

### Vorbedingung

Registrierter Benutzer existiert

### Testschritte

1. Navigiere zu \`/login\`
2. Gib E-Mail und Passwort ein
3. Klicke auf "Anmelden"

### Erwartetes Ergebnis

- Session wird erstellt (Cookie-basiert)
- Weiterleitung zu \`/dashboard\`

### Negative Testfälle

- Falsches Passwort → "Ungültige Anmeldedaten"
- Nicht registrierte E-Mail → "Ungültige Anmeldedaten"
- Leere Felder → Validierungsfehler`,
  },
  {
    key: "USFX-29",
    description: `### Funktionsbereich

Authentifizierung

### Vorbedingung

PC-001: Benutzer angemeldet

### Testschritte

1. Klicke auf Logout-Button
2. Bestätige Abmeldung

### Erwartetes Ergebnis

- Session wird beendet (Cookie gelöscht)
- Weiterleitung zu \`/login\`
- Zugriff auf \`/dashboard\` ohne Session → Redirect zu \`/login\``,
  },
  {
    key: "USFX-30",
    description: `### Funktionsbereich

Authentifizierung

### Vorbedingung

Registrierter Benutzer existiert

### Testschritte

1. Navigiere zu \`/forgot-password\`
2. Gib registrierte E-Mail ein
3. Klicke auf "Link senden"

### Erwartetes Ergebnis

- Supabase sendet Reset-E-Mail mit \`redirectTo: /reset-password\`
- Toast-Nachricht: "Link wurde gesendet"

### Bekannter Bug

⚠️ Die Seite \`/reset-password\` existiert aktuell NICHT im Codebase. Der Reset-Flow ist daher unvollständig.`,
  },
  {
    key: "USFX-31",
    description: `### Funktionsbereich

Authentifizierung / Middleware

### Vorbedingung

Verschiedene Session-Zustände

### Testschritte

1. Ohne Session: Navigiere zu \`/dashboard\` → Redirect zu \`/login\`
2. Mit Session: Navigiere zu \`/login\` → Redirect zu \`/dashboard\`
3. Session abgelaufen → Middleware refresht Token oder leitet um

### Erwartetes Ergebnis

- \`src/lib/supabase/middleware.ts\` schützt authentifizierte Routen
- Session-Refresh funktioniert transparent
- Geschützte Routen: \`/dashboard\`, \`/project/*\`, \`/settings\`
- Öffentliche Routen: \`/login\`, \`/register\`, \`/forgot-password\``,
  },
  {
    key: "USFX-32",
    description: `### Funktionsbereich

Projektverwaltung

### Vorbedingung

PC-001: Benutzer angemeldet

### Testschritte

1. Navigiere zu \`/dashboard\`
2. Klicke auf "Neues Projekt"
3. Gib Projektname und Adresse ein
4. Klicke auf "Erstellen"

### Erwartetes Ergebnis

- Projekt wird in \`projects\`-Tabelle erstellt
- Organisation wird automatisch erstellt (falls keine existiert)
- Benutzer wird als \`admin\` in \`project_members\` eingetragen
- Weiterleitung zur Projektdetailseite

### Negative Testfälle

- Leerer Projektname → Validierungsfehler
- Leere Adresse → Validierungsfehler`,
  },
  {
    key: "USFX-33",
    description: `### Funktionsbereich

Projektverwaltung

### Vorbedingung

PC-001: Benutzer angemeldet

### Testschritte

1. Navigiere zu \`/dashboard\`
2. Prüfe Projektliste

### Erwartetes Ergebnis

- Alle Projekte des Benutzers werden angezeigt
- Jede Projektkarte zeigt: Name, Adresse, Fortschrittsbalken, Mängel-Zähler
- Bei 0 Projekten: Empty State mit "Noch keine Projekte" und CTA

### Datenbasis

\`getProjects()\` → Supabase query auf \`projects\` JOIN \`project_members\``,
  },
  {
    key: "USFX-34",
    description: `### Funktionsbereich

Projektverwaltung

### Vorbedingung

PC-003: Admin/Manager-Rolle

### Testschritte

1. Navigiere zur Projektdetailseite
2. Gib einen Einheitennamen ein (z.B. "EG links")
3. Klicke auf "Hinzufügen"

### Erwartetes Ergebnis

- Einheit wird in \`units\`-Tabelle erstellt (referenziert \`project_id\`)
- Einheit erscheint in der Liste
- Einheit ist beim Mangel-Erstellen als Dropdown verfügbar

### Negative Testfälle

- Leerer Name → Validierungsfehler
- Worker-Rolle versucht Einheit zu erstellen → Nur Admin/Manager erlaubt`,
  },
  {
    key: "USFX-35",
    description: `### Funktionsbereich

Projektverwaltung

### Vorbedingung

PC-002: Testprojekt existiert

### Testschritte

1. Navigiere zu \`/project/[id]\`
2. Prüfe die angezeigten Informationen

### Erwartetes Ergebnis

- Projektname und Adresse werden angezeigt
- Fortschrittsbalken zeigt Verhältnis offener/erledigter Mängel
- Mängelliste mit Status-Badges
- Einheiten-Bereich
- Team-Bereich mit Mitgliedern und Rollen

### Datenbasis

\`getProject()\` → Einzelnes Projekt mit Details
\`getDefects()\` → Mängelliste des Projekts`,
  },
  {
    key: "USFX-36",
    description: `### Funktionsbereich

Teamverwaltung

### Vorbedingung

PC-003: Admin/Manager-Rolle, Projekt mit Teammitglied

### Testschritte

1. Navigiere zur Projektdetailseite
2. Im Team-Bereich: Klicke auf Entfernen-Button bei einem Mitglied
3. Bestätige Entfernung

### Erwartetes Ergebnis

- Mitglied wird aus \`project_members\`-Tabelle entfernt
- Mitglied erscheint nicht mehr in der Teamliste
- Entferntes Mitglied verliert Zugriff auf das Projekt

### Negative Testfälle

- Worker versucht Mitglied zu entfernen → Keine Berechtigung
- Eigenen Account entfernen → Sollte verhindert oder gewarnt werden`,
  },
  {
    key: "USFX-37",
    description: `### Funktionsbereich

Mängelverwaltung

### Vorbedingung

PC-002: Testprojekt mit Einheiten

### Testschritte

1. Auf Projektdetailseite: Öffne CaptureModal
2. Gib Mangeltitel ein
3. Wähle Einheit aus Dropdown
4. Optional: Wähle Priorität
5. Klicke auf "Erstellen"

### Erwartetes Ergebnis

- Mangel wird in \`defects\`-Tabelle erstellt mit Status "offen"
- Mangel erscheint in der Mängelliste
- CaptureModal schließt sich
- Toast: "Mangel erstellt"

### Negative Testfälle

- Leerer Titel → Validierungsfehler
- Keine Einheit gewählt → Validierungsfehler`,
  },
  {
    key: "USFX-38",
    description: `### Funktionsbereich

Mängelverwaltung + Medien

### Vorbedingung

PC-002: Testprojekt mit Einheiten

### Testschritte

1. Öffne CaptureModal
2. Gib Titel und Einheit ein
3. Füge ein Foto hinzu (Kamera oder Datei-Upload)
4. Optional: Füge ein Video hinzu
5. Klicke auf "Erstellen"

### Erwartetes Ergebnis

- Mangel wird erstellt
- Medien werden in Supabase Storage (\`defect-media\` Bucket) hochgeladen
- \`defect_media\`-Tabelle verknüpft Medien mit Mangel
- Bilder werden automatisch komprimiert (browser-image-compression)
- Vorschau-Thumbnails werden angezeigt`,
  },
  {
    key: "USFX-39",
    description: `### Funktionsbereich

Mängelverwaltung

### Vorbedingung

PC-002: Mangel existiert

### Testschritte

1. Auf Projektdetailseite: Wähle einen Mangel aus
2. Klicke einmal auf Löschen-Button → Warnung erscheint
3. Klicke erneut innerhalb des Zeitfensters → Mangel wird gelöscht

### Erwartetes Ergebnis

- Erster Klick: Bestätigungs-UI erscheint (Double-Tap-Sicherheit)
- Zweiter Klick: Mangel wird gelöscht
- Zugehörige Medien werden aus Storage entfernt
- Zugehörige Kommentare und Transitions werden kaskadierend gelöscht

### Negative Testfälle

- Nur einmal klicken → Mangel bleibt bestehen
- Zeitfenster abgelaufen → Erneuter Double-Tap erforderlich`,
  },
  {
    key: "USFX-40",
    description: `### Funktionsbereich

Mängelverwaltung

### Vorbedingung

PC-002: Mehrere Mängel mit verschiedenen Status existieren

### Testschritte

1. Navigiere zur Projektdetailseite
2. Nutze das Suchfeld → Filtere nach Mangeltitel
3. Nutze den Statusfilter → Filtere nach "offen", "in_arbeit", "erledigt"

### Erwartetes Ergebnis

- Suche filtert Mängel nach Titel (clientseitig)
- Statusfilter zeigt nur Mängel mit gewähltem Status
- Kombination aus Suche und Filter funktioniert
- Mängel-Zähler wird aktualisiert
- Bei 0 Ergebnissen: Empty State`,
  },
  {
    key: "USFX-41",
    description: `### Funktionsbereich

Statusübergänge

### Vorbedingung

PC-002: Mangel mit Status "offen" existiert

### Testschritte

1. Navigiere zur Mangeldetailseite
2. Klicke auf StatusToggle → "Arbeit beginnen"
3. Lade ein Foto/Video hoch (Pflicht-Media)
4. Gib eine Notiz ein (Pflicht-Note)
5. Bestätige den Statuswechsel

### Erwartetes Ergebnis

- Status ändert sich von "offen" zu "in_arbeit"
- Eintrag in \`defect_status_transitions\`-Tabelle
- Media in \`transition_media\`-Tabelle verknüpft
- TransitionTimeline zeigt neuen Eintrag
- Realtime-Update für andere Benutzer

### TRANSITION_RULES

- \`requiresMedia: true\`
- \`requiresNote: true\`
- \`allowedRoles: [admin, manager, worker]\`

### Negative Testfälle

- Ohne Media → Fehler: "Medien sind erforderlich"
- Ohne Notiz → Fehler: "Notiz ist erforderlich"`,
  },
];

function envCheck() {
  if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error("Bitte JIRA_EMAIL und JIRA_API_TOKEN setzen (z.B. in .env oder Export).");
    console.error("API-Token: https://id.atlassian.com/manage-profile/security/api-tokens");
    process.exit(1);
  }
}

async function updateIssue(key, description) {
  const url = `${JIRA_BASE_URL}/rest/api/2/issue/${key}`;
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ fields: { description } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API ${res.status}: ${text}`);
  }
}

async function main() {
  envCheck();
  const updated = [];

  console.log(`JIRA_BASE_URL: ${JIRA_BASE_URL}`);
  console.log(`Anzahl Issues: ${ISSUES.length}`);
  if (DRY_RUN) console.log("(Dry-Run – es wird nichts aktualisiert)\n");

  for (const { key, description } of ISSUES) {
    if (DRY_RUN) {
      console.log(`[DRY-RUN] Würde aktualisieren: ${key}`);
      updated.push(key);
      continue;
    }
    try {
      await updateIssue(key, description);
      updated.push(key);
      console.log(`Aktualisiert: ${key}`);
    } catch (e) {
      console.error(`Fehler bei ${key}:`, e.message);
    }
  }

  console.log("\n--- Erfolgreich aktualisierte Keys ---");
  console.log(updated.join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
