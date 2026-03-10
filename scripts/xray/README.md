# Xray: Testfälle anlegen und Testergebnisse dokumentieren

Diese Skripte legen Testfälle per **Jira REST API** in Ihrem Projekt (z. B. **FR**) an und erzeugen die **Xray-Import-JSON** für Testergebnisse. Direkter API-Zugriff auf Ihre Jira-Instanz ist nur von Ihrem Rechner aus mit Ihren Zugangsdaten möglich.

---

## 1. Testfälle automatisch in Xray anlegen

### Voraussetzungen

- **Jira API Token:** [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) (Atlassian-Account, nicht Jira-Passwort).
- Im Projekt **FR** muss der Issue-Typ **Test** existieren (Xray/Standard).

### Umgebungsvariablen

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `JIRA_BASE_URL` | Jira-URL | `https://wamocon.atlassian.net` |
| `JIRA_EMAIL` | Ihre Jira-/Atlassian-E-Mail | `ihre.email@example.com` |
| `JIRA_API_TOKEN` | API-Token (siehe oben) | `…` |
| `JIRA_PROJECT_KEY` | Projekt-Key | `FR` |

Optional (Xray Custom Fields, pro Instanz unterschiedlich):

- `JIRA_XRAY_TEST_TYPE_FIELD_ID` – z. B. `customfield_10200` (Test Type = Manual)
- `JIRA_XRAY_STEPS_FIELD_ID` – z. B. `customfield_10004` (Manual Test Steps)

Ohne diese Felder werden Schritte und Erwartung in der **Beschreibung** des Test-Issues gespeichert.

### Ausführung

```bash
# Aus dem Projektroot
export JIRA_EMAIL="ihre.email@example.com"
export JIRA_API_TOKEN="ihr-api-token"
export JIRA_PROJECT_KEY="FR"

# Trockenlauf (nur Ausgabe, keine Anlage)
node scripts/xray/sync-tests-to-xray.mjs --dry-run

# Tests tatsächlich anlegen
node scripts/xray/sync-tests-to-xray.mjs
```

Nach dem Lauf:

- In Jira erscheinen neue **Test**-Issues (z. B. FR-101, FR-102, …).
- Die Zuordnung **Test-ID → Jira-Key** wird in `scripts/xray/created-tests-mapping.json` gespeichert (wird für die Ergebnis-Import-JSON benötigt).

---

## 2. Testergebnisse dokumentieren (Import in Xray)

Sie führen die Tests manuell durch und tragen die Ergebnisse in eine JSON-Datei ein. Daraus erzeugen die Skripte die offizielle **Xray-Import-JSON**.

### Ablauf

1. **Vorlage erzeugen**

   ```bash
   node scripts/xray/submit-execution-results.mjs template
   ```

   Erzeugt `execution-results-template.json`.

2. **Kopie anlegen und ausfüllen**

   ```bash
   cp scripts/xray/execution-results-template.json scripts/xray/results-rolenkonzept.json
   ```

   In `results-rolenkonzept.json`:

   - `testExecutionKey`: Key Ihrer **Test Execution** in Jira (z. B. `FR-100`). Die Test Execution legen Sie in Jira/Xray an (z. B. „Abnahme Rollenkonzept – 2025-03-09“) und fügen die zuvor angelegten Tests hinzu.
   - `results`: Pro Test-ID `PASSED` oder `FAILED` eintragen, z. B.:

   ```json
   {
     "testExecutionKey": "FR-100",
     "results": {
       "U-R-01": "PASSED",
       "U-R-02": "PASSED",
       "F-R-A01": "FAILED"
     }
   }
   ```

3. **Xray-Import-JSON erzeugen**

   ```bash
   node scripts/xray/submit-execution-results.mjs
   ```

   Das Skript liest `results-rolenkonzept.json` und `created-tests-mapping.json`, baut die Xray-konforme JSON (mit Jira testKey) und gibt sie auf der Konsole aus.

4. **Import in Xray**

   - **Über die UI:** In der entsprechenden **Test Execution** in Jira → Aktion **Import Execution Results** → erzeugte JSON einfügen/hochladen.
   - **Per API:** Die gleiche JSON an die [Xray REST API für Import](https://docs.getxray.app/display/XRAY/Import+Execution+Results) senden (mit gleicher Authentifizierung wie für Jira).

Damit sind die Testergebnisse in Xray dokumentiert.

---

## Dateien in `scripts/xray/`

| Datei | Beschreibung |
|-------|--------------|
| `test-cases-rolenkonzept.json` | Alle Testfälle (ID, Summary, Stufe, Schritte, Erwartung) – Quelle für Anlage und Ergebnisse. |
| `sync-tests-to-xray.mjs` | Legt Test-Issues in Jira an; schreibt `created-tests-mapping.json`. |
| `update-usfx-descriptions.mjs` | Aktualisiert Beschreibungen von USFX-27 bis USFX-41 mit formatiertem Markdown. |
| `submit-execution-results.mjs` | Erzeugt Vorlage für Ergebnisse und Xray-Import-JSON aus `results-rolenkonzept.json`. |
| `created-tests-mapping.json` | Wird von sync erzeugt: Test-ID → Jira-Key (z. B. U-R-01 → FR-101). |
| `execution-results-template.json` | Vorlage für manuelle Ergebnisse (template-Befehl). |
| `results-rolenkonzept.json` | Von Ihnen gefüllt: testExecutionKey + results (ID → PASSED/FAILED). |

---

## Kurzfassung

- **Testfälle anlegen:** `JIRA_*` setzen → `node scripts/xray/sync-tests-to-xray.mjs` (optional zuerst `--dry-run`).
- **Testergebnisse dokumentieren:** Tests manuell ausführen → in `results-rolenkonzept.json` eintragen → `node scripts/xray/submit-execution-results.mjs` → ausgegebene JSON in Xray importieren.

Die inhaltliche Spezifikation der Teststufen bleibt in **docs/TESTSTUFEN-Rollenkonzept.md** und **docs/Jira-Xray-Anleitung.md**.
