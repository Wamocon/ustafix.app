# Dokumentation der Teststufen in Jira Xray

Diese Anleitung beschreibt, wie Sie die Teststufen (Unit, Funktionstest, Systemintegration, Abnahme) für das **Rollenkonzept** im Jira-Projekt **FR** mit **Xray** abbilden.

**Jira-Projekt:** [FR – Board](https://wamocon.atlassian.net/jira/software/c/projects/FR/issues?jql=project%20%3D%20FR%20AND%20type%20IN%20%28Powerpoint%2C%20Video%29%20ORDER%20BY%20status%20DESC%2C%20priority%20DESC)

Hinweis: Xray nutzt üblicherweise den Issue-Typ **Test**. Falls in FR andere Typen (z. B. Powerpoint, Video) für fachliche Dokumentation genutzt werden, können Sie entweder einen eigenen Issue-Typ **Test** in FR anlegen oder ein separates Xray-/Test-Projekt verwenden und Tests mit FR-Stories/Epics verknüpfen.

---

## 1. Voraussetzungen in Jira/Xray

- **Xray** für die Jira-Instanz aktiviert (wamocon.atlassian.net).
- Im Projekt **FR** (oder im Xray-Test-Projekt):
  - Issue-Typ **Test** verfügbar.
  - Optional: Custom Field **Teststufe** oder **Labels** (z. B. `unit`, `function`, `integration`, `acceptance`).
  - Optional: **Test Plan** und **Test Execution** (Xray-Standard).

---

## 2. Teststufen als Struktur in Xray

Empfohlene Zuordnung:

| Teststufe | Xray-Darstellung | Hinweis |
|-----------|------------------|--------|
| **Unit Test** | Label `test-level=unit` oder Custom Field „Teststufe“ = Unit | Pro Test Case ein **Test**-Issue |
| **Funktionstest** | Label `test-level=function` | Ein Test-Issue pro Funktionstest (z. B. F-R-A01 … F-R-W07, F-R-E01) |
| **Systemintegrationstest** | Label `test-level=integration` | Ein Test-Issue pro S-R-xx |
| **Abnahmetest** | Label `test-level=acceptance` oder eigener Test Plan „Abnahme Rollenkonzept“ | Manuelle Ausführung durch Sie; Ergebnis in **Test Execution** erfassen |

---

## 3. Tests anlegen

### 3.1 Option A: Einzelne Tests manuell anlegen

1. In **FR** (oder Xray-Projekt): **Create** → Issue-Typ **Test** wählen.
2. **Summary:** z. B. `[Rollenkonzept] U-R-01: canCreateProject bei leerer Projektliste`.
3. **Beschreibung:** Kurzbeschreibung + Verweis auf `docs/TESTSTUFEN-Rollenkonzept.md` (Abschnitt + ID).
4. **Test-Schritte** (Xray: Steps):
   - Schritt 1: Vorbedingung / Aktion (z. B. `projects = []` setzen).
   - Schritt 2: Erwartung (z. B. `canCreateProject === true`).
5. **Labels:** z. B. `rolenkonzept`, `test-level=unit`.
6. Optional: **Component** oder **Fix Version** setzen.

Wiederholen für alle IDs aus der [TESTSTUFEN-Dokumentation](TESTSTUFEN-Rollenkonzept.md).

### 3.2 Option B: Übersicht für Import / Bulk-Erstellung

Die folgende Tabelle listet alle **Test-IDs, Summary und Teststufe** auf. Sie können daraus CSV erstellen und per Xray CSV-Import oder über die Xray REST API Tests anlegen (sofern in Ihrer Umgebung verfügbar).

| Test-ID | Teststufe | Summary (Kurz) |
|---------|-----------|----------------|
| U-R-01 | Unit | canCreateProject bei leerer Projektliste → true |
| U-R-02 | Unit | canCreateProject nur Worker → false |
| U-R-03 | Unit | canCreateProject mit Admin → true |
| U-R-04 | Unit | canCreateProject mit Manager → true |
| U-R-05 | Unit | canCreateProject gemischt Worker+Manager → true |
| U-R-06 | Unit | Admin: canDeleteDefect true |
| U-R-07 | Unit | Manager: canDeleteDefect true |
| U-R-08 | Unit | Worker: canDeleteDefect false |
| U-R-09 | Unit | Admin/Manager: alle Medien löschbar |
| U-R-10 | Unit | Worker: eigenes Medium löschbar |
| U-R-11 | Unit | Worker: fremdes Medium nicht löschbar |
| U-R-12 | Unit | Admin/Manager: isAdminOrManager true |
| U-R-13 | Unit | Worker: isAdminOrManager false |
| F-R-A01 | Function | Admin: Dashboard Button Neues Projekt sichtbar |
| F-R-A02 | Function | Admin: Projekt erstellen |
| F-R-A03 | Function | Admin: Einheit anlegen |
| F-R-A04 | Function | Admin: Nutzer hinzufügen (registriert) |
| F-R-A05 | Function | Admin: Nutzer hinzufügen (nicht registriert) → Fehler |
| F-R-A06 | Function | Admin: Mangel erfassen |
| F-R-A07 | Function | Admin: Mangel löschen |
| F-R-A08 | Function | Admin: alle Medien löschen |
| F-R-A09 | Function | Admin: Kommentar schreiben und löschen |
| F-R-A10 | Function | Admin: Mitglied entfernen |
| F-R-M01 | Function | Manager: Dashboard Button Neues Projekt sichtbar |
| F-R-M02 | Function | Manager: Einheiten und Projekt-Team sichtbar |
| F-R-M03 | Function | Manager: Einheit anlegen |
| F-R-M04 | Function | Manager: Nutzer hinzufügen |
| F-R-M05 | Function | Manager: Mangel löschen |
| F-R-M06 | Function | Manager: alle Medien löschen |
| F-R-M07 | Function | Manager: Kommentare löschen (eigene + andere) |
| F-R-W01 | Function | Worker: kein Button Neues Projekt |
| F-R-W02 | Function | Worker: kein Einheiten-/Team-Bereich |
| F-R-W03 | Function | Worker: Mangel erfassen, Einheit nur Dropdown |
| F-R-W04 | Function | Worker: Status umschalten |
| F-R-W05 | Function | Worker: kein Mangel löschen Button |
| F-R-W06 | Function | Worker: nur eigenes Medium löschen |
| F-R-W07 | Function | Worker: nur eigenen Kommentar löschen |
| F-R-E01 | Function | Empty State: Warte auf Zuweisung, kein Projekt-Button |
| S-R-01 | Integration | Realtime: Mangel-Änderung bei anderem Client sichtbar |
| S-R-02 | Integration | Realtime: Kommentare bei anderem Client sichtbar |
| S-R-03 | Integration | PWA/Upload-Queue: Mangel mit Medien speichern |
| S-R-04 | Integration | Auth: geschützte Routen → Redirect Login |
| S-R-05 | Integration | RLS: Worker kann Mangel nicht löschen |
| S-R-06 | Integration | RLS: Worker kann fremdes Medium nicht löschen |
| AB-R-01 | Acceptance | Abnahme: Rollenmodell vollständig (Checkliste) |

---

## 4. Test Plan und Test Execution (Abnahme)

1. **Test Plan anlegen**
   - In Xray: **Test Plan** erstellen, z. B. „Rollenkonzept Ustafix – Test Plan“.
   - Alle oben angelegten **Tests** (Unit, Function, Integration) dem Test Plan zuweisen.
   - Optional: separater Test Plan „Abnahme Rollenkonzept“ nur mit Abnahme-Checkliste.

2. **Test Execution für Abnahme (manuell durch Sie)**
   - **Test Execution** anlegen (z. B. „Abnahme Rollenkonzept – [Datum]“).
   - Test Plan „Abnahme Rollenkonzept“ (oder die Funktionstests + Integration + Abnahme-Checkliste) mit der Test Execution verknüpfen.
   - Für jeden Test: **Status** (Bestanden/Fehlgeschlagen) und ggf. Kommentar setzen.
   - So ist die Abnahme in Jira nachvollziehbar dokumentiert.

---

## 5. Verknüpfung mit Anforderungen (optional)

Falls Sie in FR **Stories** oder **Requirements** für das Rollenkonzept haben:

- **Traceability:** Jeder **Test** (Issue) kann mit der zugehörigen Story/Requirement verknüpft werden (Xray: „Coverage“ / „Tests“ auf der Story).
- So sehen Sie in FR, welche Anforderungen durch welche Tests abgedeckt sind.

---

## 6. Kurz-Checkliste für Sie

- [ ] In FR (oder Xray-Projekt) Issue-Typ **Test** nutzbar?
- [ ] Tests für Unit (U-R-xx), Function (F-R-xx), Integration (S-R-xx) angelegt und mit Teststufe versehen?
- [ ] Abnahme-Test(s) (AB-R-01 bzw. Checkliste) angelegt?
- [ ] Test Plan „Rollenkonzept“ erstellt und Tests zugewiesen?
- [ ] Test Execution für Abnahme erstellt; manuelle Durchführung und Ergebnisse in Xray erfasst?

Die inhaltliche Spezifikation aller Schritte und Erwartungen bleibt in **docs/TESTSTUFEN-Rollenkonzept.md**; Xray dient der Nachverfolgbarkeit, Planung und Abnahme-Dokumentation.

---

## Automatisches Anlegen der Testfälle und Dokumentation der Ergebnisse

Über die Skripte unter **scripts/xray/** können Sie:

1. **Testfälle automatisch in Jira anlegen** (per Jira REST API, mit Ihren Zugangsdaten):
   - Umgebungsvariablen `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` setzen.
   - `node scripts/xray/sync-tests-to-xray.mjs` ausführen (optional zuerst `--dry-run`).
   - Die erstellten Test-Issues und die Zuordnung Test-ID → Jira-Key werden ausgegeben bzw. in `created-tests-mapping.json` gespeichert.

2. **Testergebnisse für den Xray-Import vorbereiten:**
   - Nach manueller Durchführung die Ergebnisse in `results-rolenkonzept.json` eintragen (pro Test-ID `PASSED`/`FAILED`).
   - `node scripts/xray/submit-execution-results.mjs` ausführen → die ausgegebene JSON in Xray unter **Import Execution Results** hochladen (oder per Xray API senden).

Ausführliche Anleitung: **[scripts/xray/README.md](../scripts/xray/README.md)**.
