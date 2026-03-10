# Teststufen: Rollenkonzept Ustafix.app

Dokumentation aller Teststufen für das 3-Rollen-Konzept (admin, manager, worker). Die **Abnahmetests** werden manuell durchgeführt; die übrigen Stufen sind als Grundlage für automatisierte bzw. manuelle Ausführung und für die Dokumentation in **Jira Xray** beschrieben.

---

## Übersicht

| Stufe | Kurzbeschreibung | Automatisiert / Manuell | Dokumentation in Xray |
|-------|------------------|--------------------------|------------------------|
| **Unit Test** | Logik einzelner Funktionen (Rollen-Checks, Berechtigungen) | Automatisierbar (Jest/Vitest) | Als Test-Schritte / Test-Specs |
| **Funktionstest** | Features pro Rolle (UI + Server Actions) | Manuell oder E2E | Test Cases mit Schritten |
| **Systemintegrationstest** | Realtime, PWA, Auth, RLS, Upload-Queue | Manuell oder E2E | Test Cases |
| **Abnahmetest** | End-to-End aus Sicht des Auftraggebers | **Manuell** (durch Sie) | Test Execution / Abnahme-Checkliste |

---

## 1. Unit Tests

**Ziel:** Isolierte Prüfung von Rollenlogik und Berechtigungs-Helfern ohne UI/DB.

### 1.1 canCreateProject (Dashboard)

| ID | Beschreibung | Vorbedingung | Aktion | Erwartung |
|----|--------------|--------------|--------|-----------|
| U-R-01 | Keine Projekte → darf erstellen | `projects = []` | `canCreateProject` auswerten | `true` |
| U-R-02 | Nur Worker-Rollen → darf nicht erstellen | `projects = [{ role: 'worker' }]` | `canCreateProject` auswerten | `false` |
| U-R-03 | Mind. eine Admin-Rolle → darf erstellen | `projects = [{ role: 'admin' }]` | `canCreateProject` auswerten | `true` |
| U-R-04 | Mind. eine Manager-Rolle → darf erstellen | `projects = [{ role: 'manager' }]` | `canCreateProject` auswerten | `true` |
| U-R-05 | Gemischt (Worker + Manager) → darf erstellen | `projects = [{ role: 'worker' }, { role: 'manager' }]` | `canCreateProject` auswerten | `true` |

**Zu testende Logik (Beispiel):**  
`canCreateProject = projects.length === 0 || projects.some(p => p.role === 'admin' || p.role === 'manager')`

### 1.2 UI-Berechtigungen (Defect)

| ID | Beschreibung | Eingabe | Erwartung |
|----|--------------|---------|-----------|
| U-R-06 | Admin → Mangel löschen erlaubt | `myRole = 'admin'` | `canDeleteDefect === true` |
| U-R-07 | Manager → Mangel löschen erlaubt | `myRole = 'manager'` | `canDeleteDefect === true` |
| U-R-08 | Worker → Mangel löschen verboten | `myRole = 'worker'` | `canDeleteDefect === false` |

### 1.3 Medien-Löschberechtigung (Worker nur eigenes)

| ID | Beschreibung | Eingabe | Erwartung |
|----|--------------|---------|-----------|
| U-R-09 | Admin/Manager → alle Medien löschbar | `canDeleteAll = true` | `canDeleteItem(anyMedia) === true` |
| U-R-10 | Worker, eigenes Medium | `canDeleteAll = false`, `currentUserId = 'u1'`, `item.created_by = 'u1'` | `canDeleteItem(item) === true` |
| U-R-11 | Worker, fremdes Medium | `canDeleteAll = false`, `currentUserId = 'u1'`, `item.created_by = 'u2'` | `canDeleteItem(item) === false` |

### 1.4 Einheiten / Projekt-Team (nur Admin/Manager)

| ID | Beschreibung | Eingabe | Erwartung |
|----|--------------|---------|-----------|
| U-R-12 | Admin/Manager → Einheiten/Team sichtbar | `myRole in ['admin','manager']` | `isAdminOrManager === true` |
| U-R-13 | Worker → Einheiten/Team nicht sichtbar | `myRole = 'worker'` | `isAdminOrManager === false` |

---

## 2. Funktionstests

**Ziel:** Pro Rolle die fachlichen Funktionen (UI + Server) prüfen.

### 2.1 Admin

| ID | Kurzbeschreibung | Schritte (Kurz) | Erwartetes Ergebnis |
|----|------------------|-----------------|---------------------|
| F-R-A01 | Dashboard: Button „Neues Projekt“ | Als Admin einloggen, Dashboard öffnen | Button sichtbar |
| F-R-A02 | Projekt erstellen | Neues Projekt anlegen (Name, Adresse) | Projekt erscheint, Rolle „Admin“ |
| F-R-A03 | Einheit anlegen | Im Projekt „Einheiten“ → neue Einheit eingeben, speichern | Einheit erscheint / im Mangel-Dropdown |
| F-R-A04 | Nutzer hinzufügen (registriert) | Projekt-Team → E-Mail (Manager/Worker), Rolle wählen, Hinzufügen | Erfolg, Nutzer in Liste |
| F-R-A05 | Nutzer hinzufügen (nicht registriert) | E-Mail nicht registrierter Nutzer eingeben, Hinzufügen | Fehlermeldung „Nutzer existiert nicht im System“ |
| F-R-A06 | Mangel erfassen | FAB → Sprechen oder Foto, Einheit/Priorität, Speichern | Mangel erscheint in Liste |
| F-R-A07 | Mangel löschen | Mangeldetail → „Mangel löschen“ → Bestätigen | Mangel gelöscht, Rückkehr zur Liste |
| F-R-A08 | Alle Medien löschen | Mangeldetail → bei beliebigem Medium Löschen-Icon | Medium gelöscht |
| F-R-A09 | Kommentar schreiben & löschen | Kommentar eingeben, Senden; bei eigenem/anderem Löschen | Schreiben ok; Löschen ok (eigene + andere) |
| F-R-A10 | Mitglied entfernen | Projekt-Team → bei Manager/Worker „Entfernen“ | Mitglied verschwindet (nicht bei sich selbst) |

### 2.2 Manager

| ID | Kurzbeschreibung | Schritte (Kurz) | Erwartetes Ergebnis |
|----|------------------|-----------------|---------------------|
| F-R-M01 | Dashboard: Button „Neues Projekt“ | Als Manager einloggen, Dashboard öffnen | Button sichtbar |
| F-R-M02 | Einheiten & Projekt-Team sichtbar | Projekt öffnen | Sektionen „Einheiten“ und „Projekt-Team“ sichtbar |
| F-R-M03 | Einheit anlegen | Neue Einheit anlegen | Erfolg |
| F-R-M04 | Nutzer hinzufügen | Worker per E-Mail hinzufügen | Erfolg |
| F-R-M05 | Mangel löschen | Mangeldetail → „Mangel löschen“ | Button sichtbar, Löschen möglich |
| F-R-M06 | Alle Medien löschen | Bei beliebigem Medium Löschen | Erfolg |
| F-R-M07 | Kommentare löschen (eigene + andere) | Eigenen und fremden Kommentar löschen | Beide löschbar |

### 2.3 Worker

| ID | Kurzbeschreibung | Schritte (Kurz) | Erwartetes Ergebnis |
|----|------------------|-----------------|---------------------|
| F-R-W01 | Dashboard: kein „Neues Projekt“ | Als Worker einloggen, Dashboard öffnen | Button nicht sichtbar |
| F-R-W02 | Kein Einheiten-/Team-Bereich | Projekt öffnen | „Einheiten“ und „Projekt-Team“ nicht sichtbar |
| F-R-W03 | Mangel erfassen, Einheit nur Dropdown | FAB → Erfassen, Einheit wählen | Nur bestehende Einheiten wählbar, kein „Einheit anlegen“ |
| F-R-W04 | Status umschalten | Mangeldetail → Offen / In Arbeit / Erledigt | Alle drei Wechsel möglich |
| F-R-W05 | Kein „Mangel löschen“ | Mangeldetail öffnen | Button „Mangel löschen“ nicht sichtbar |
| F-R-W06 | Nur eigenes Medium löschen | Eigenes vs. fremdes Medium | Löschen-Icon nur bei eigenem Medium |
| F-R-W07 | Kommentar: nur eigene löschen | Eigenen und fremden Kommentar | Nur eigener löschbar |

### 2.4 Worker ohne Projekt (Empty State)

| ID | Kurzbeschreibung | Schritte (Kurz) | Erwartetes Ergebnis |
|----|------------------|-----------------|---------------------|
| F-R-E01 | Leerer Zustand ohne Berechtigung | Als neuer User (nie zu Projekt hinzugefügt) einloggen | Text „Willkommen! Warte auf die Zuweisung…“, kein Button „Projekt erstellen“ |

---

## 3. Systemintegrationstests

**Ziel:** Zusammenspiel Realtime, PWA/Upload, Auth, RLS.

| ID | Kurzbeschreibung | Schritte (Kurz) | Erwartetes Ergebnis |
|----|------------------|-----------------|---------------------|
| S-R-01 | Realtime: Mangel-Änderung | Zwei Clients (z. B. zwei Nutzer/Tabs), einer legt Mangel an oder ändert Status | Anderer Client sieht Änderung ohne Reload |
| S-R-02 | Realtime: Kommentare | Ein Nutzer schreibt Kommentar | Anderer Nutzer sieht neuen Kommentar (bei Refresh/Realtime-Subscription) |
| S-R-03 | PWA / Upload-Queue | Mangel mit Foto/Voice erfassen, ggf. schlechte Verbindung | Upload läuft durch, Mangel erscheint mit Medien |
| S-R-04 | Auth: geschützte Routen | Ohne Login `/dashboard` oder `/project/…` aufrufen | Weiterleitung zu `/login` |
| S-R-05 | RLS: Worker löscht Mangel (API/DB) | Als Worker versuchen, Mangel zu löschen (z. B. direkter API-Call oder SQL mit auth.uid() Worker) | Löschen schlägt fehl (RLS) |
| S-R-06 | RLS: Worker löscht fremdes Medium | Als Worker versuchen, defect_media-Zeile mit created_by ≠ aktueller User zu löschen | Fehlschlag (RLS) |

---

## 4. Abnahmetest (manuell durch Sie)

**Ziel:** End-to-End aus Sicht des Auftraggebers; Sie führen die Abnahme manuell durch.

### Empfohlene Abnahme-Checkliste

- [ ] **Rollenmodell:** Admin, Manager, Worker verhalten sich wie fachlich spezifiziert (siehe Funktionstests).
- [ ] **Projekt-Team (Pull-Modell):** Nutzer nur per E-Mail hinzufügbar, nur wenn registriert; Fehlermeldung bei unbekannter E-Mail.
- [ ] **Einheiten:** Nur Admin/Manager legen Einheiten an; Worker wählen nur aus Dropdown.
- [ ] **Mängel:** Erfassen, Status-Wechsel (alle Richtungen), Löschen nur Admin/Manager.
- [ ] **Medien:** Worker löschen nur eigene; Admin/Manager alle.
- [ ] **Kommentare:** Alle schreiben/lesen; Löschen nur Ersteller oder Admin/Manager.
- [ ] **Empty State:** Nutzer ohne Projekt sehen Hinweis „Warte auf Zuweisung…“ ohne „Projekt erstellen“.
- [ ] **Realtime & Stabilität:** Änderungen erscheinen bei anderen Clients; PWA/Upload stabil.

Die detaillierten Schritte entsprechen dem [TESTPLAN-Rollenkonzept](TESTPLAN-Rollenkonzept.md); die Abnahme kann als **Test Execution** in Jira Xray mit Status „Abnahme“ dokumentiert werden.

---

## Referenzen

- **Testplan (manuell):** [TESTPLAN-Rollenkonzept.md](TESTPLAN-Rollenkonzept.md)
- **Jira Xray:** [Jira-Xray-Anleitung.md](Jira-Xray-Anleitung.md) – Anlegen und Zuordnung der Tests im Projekt (z. B. FR).
