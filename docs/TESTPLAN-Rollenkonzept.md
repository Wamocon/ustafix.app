# Testplan: Rollenkonzept (admin, manager, worker)

**Zweck:** Das 3-Rollen-Konzept manuell prüfen, **bevor** die Migration auf einer produktiven oder wichtigen Datenbank ausgeführt wird.

---

## Migration auf der Test-DB ausführen

So gehst du vor, um das Rollenkonzept zuerst sicher zu testen:

1. **Test-Datenbank bereitstellen**
   - **Option A (empfohlen):** Neues Supabase-Projekt anlegen (z. B. „ustafix-test“) unter [supabase.com/dashboard](https://supabase.com/dashboard). Dort sind URL und Keys getrennt von Produktion.
   - **Option B:** Bestehendes Projekt nutzen, wenn die Datenbank nur Testdaten enthält und ein Zurücksetzen akzeptabel ist.

2. **`.env.local` auf Test-DB umstellen**
   - `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` (und optional `SUPABASE_SERVICE_ROLE_KEY`) auf die Werte des **Test-Projekts** setzen.
   - App mit dieser Umgebung starten: `npm run dev`.

3. **Datenbank-Schema anlegen**
   - Im Supabase-Dashboard des **Test-Projekts** → **SQL Editor** öffnen.
   - **Frische Installation:** Gesamtes Skript `supabase/setup.sql` ausführen (enthält bereits admin/manager/worker und defect_comments).
   - **Bestehende Test-DB** (mit alter Rollen-Struktur): Nur die Migration `supabase/migrations/20250309_roles_admin_manager_worker.sql` ausführen (Rollen-Update, neue Spalte/Tabelle, RLS-Anpassungen).

4. **App testen**
   - Test-Accounts anlegen und den Rest dieses Testplans durchgehen.

5. **Erst nach erfolgreichem Test**
   - Migration auf der **Produktions-** bzw. Ziel-Datenbank ausführen (wieder im SQL Editor des jeweiligen Projekts).

---

## Voraussetzungen (für die Tests)

1. **Lokale App läuft** (`npm run dev`), verbunden mit der **Test-Supabase-Instanz** (siehe oben).
2. **Migration bzw. setup.sql** auf dieser Test-DB bereits ausgeführt.

---

## Test-Accounts anlegen

| Rolle    | E-Mail (Beispiel)     | Verwendung                    |
|----------|------------------------|-------------------------------|
| Admin    | `admin@test.local`    | Erstellt Projekt, verwaltet Team |
| Manager  | `manager@test.local`  | Wird von Admin zum Projekt hinzugefügt |
| Worker   | `worker@test.local`   | Wird von Admin/Manager hinzugefügt |

Alle drei über **Registrierung** (`/register`) anlegen (Pull-Modell: keine Einladungs-Mails).

---

## 1. Admin

- [ ] **Login** als Admin.
- [ ] **Dashboard:** Button „Neues Projekt“ sichtbar.
- [ ] **Projekt erstellen:** Name + Adresse, Speichern → Projekt erscheint, Rolle „Admin“ auf der Karte.
- [ ] **Projekt öffnen:** Sektionen „Einheiten“ und „Projekt-Team“ sichtbar.
- [ ] **Einheit anlegen:** z. B. „EG links“ → erscheint in Liste / im Mangel-Erfassen-Dropdown.
- [ ] **Nutzer hinzufügen:** E-Mail `manager@test.local`, Rolle „Manager“ → Hinzufügen → Erfolg (Manager muss vorher registriert sein).
- [ ] **Nutzer hinzufügen:** E-Mail `worker@test.local`, Rolle „Mitarbeiter“ → Erfolg.
- [ ] **Nutzer hinzufügen:** E-Mail `unbekannt@test.local` (nicht registriert) → Fehlermeldung „Nutzer existiert nicht im System“.
- [ ] **Mangel erfassen:** FAB → Sprechen oder Foto/Video, Einheit wählbar, Priorität, Speichern → Mangel erscheint.
- [ ] **Mangeldetail:** Status umschalten (Offen ↔ In Arbeit ↔ Erledigt), Button „Mangel löschen“ sichtbar, Medien löschen (alle), Kommentar schreiben + löschen.
- [ ] **Mitglied entfernen:** In Projekt-Team bei Manager/Worker „Entfernen“ → Mitglied verschwindet (nicht bei sich selbst).

---

## 2. Manager

- [ ] **Login** als Manager (zuvor von Admin zum Projekt hinzugefügt).
- [ ] **Dashboard:** Button „Neues Projekt“ sichtbar (Manager darf Projekte anlegen).
- [ ] **Projekt öffnen:** „Einheiten“ und „Projekt-Team“ sichtbar.
- [ ] **Einheit anlegen:** funktioniert.
- [ ] **Nutzer hinzufügen:** weiteren Worker per E-Mail hinzufügen → funktioniert.
- [ ] **Mangel erfassen:** wie Admin.
- [ ] **Mangeldetail:** „Mangel löschen“ sichtbar, alle Medien löschbar, Kommentare lesen/schreiben/löschen (eigene + andere).

---

## 3. Worker

- [ ] **Login** als Worker (nur diesem Projekt zugewiesen).
- [ ] **Dashboard:** Button „Neues Projekt“ **nicht** sichtbar.
- [ ] **Projekt öffnen:** Sektionen „Einheiten“ und „Projekt-Team“ **nicht** sichtbar.
- [ ] **Mangel erfassen:** FAB → Erfassen möglich, Einheit nur aus **bestehendem** Dropdown wählbar (kein „Einheit anlegen“).
- [ ] **Mangeldetail:** Status umschalten (Offen ↔ In Arbeit ↔ Erledigt) funktioniert.
- [ ] **Mangeldetail:** Button „Mangel löschen“ **nicht** sichtbar.
- [ ] **Medien:** Löschen-Icon nur bei **eigenen** hochgeladenen Medien sichtbar; bei Medien anderer **kein** Löschen-Icon.
- [ ] **Kommentare:** Schreiben und Lesen möglich; Löschen nur bei **eigenen** Kommentaren (nicht bei denen anderer).

---

## 4. Worker ohne Projekt (Empty State)

- [ ] Neuen Nutzer registrieren, **nicht** zu einem Projekt hinzufügen.
- [ ] **Dashboard:** Keine Projekte, Text „Willkommen! Warte auf die Zuweisung zu einem Projekt durch deinen Bauleiter.“, **kein** Button „Projekt erstellen“.

---

## 5. Kurz-Check Realtime & PWA

- [ ] Zwei Browser/Devices (oder Tabs mit unterschiedlichen Nutzern): Mangel anlegen/Status ändern → andere Seite aktualisiert sich (Realtime).
- [ ] Mangel mit Foto/Voice erfassen → Upload läuft durch, Mangel erscheint mit Medien (Upload-Queue / PWA-Verhalten ungestört).

---

## 6. RLS / Backend (optional)

Falls du direkt in der Supabase-DB prüfen willst:

- [ ] Als **Worker** eingeloggt: Versuch, einen Mangel per SQL/API zu löschen → sollte fehlschlagen (RLS).
- [ ] Als **Worker** eingeloggt: Versuch, eine **fremde** Medienzeile in `defect_media` zu löschen → sollte fehlschlagen.

---

## Ablauf-Empfehlung (Reihenfolge)

1. **Test-DB** bereitstellen und **Migration** (bzw. `setup.sql`) dort ausführen (siehe Abschnitt „Migration auf der Test-DB ausführen“).
2. Drei Nutzer über `/register` anlegen: Admin, Manager, Worker.
3. Mit **Admin** ein Projekt erstellen, eine Einheit anlegen, Manager und Worker im Projekt-Team hinzufügen.
4. Diesen Testplan der Reihe nach abarbeiten: **Admin** → **Manager** → **Worker** → **Worker ohne Projekt** → **Realtime & PWA** (optional: RLS).
5. **Erst wenn alle Punkte wie erwartet funktionieren:** gleiche Migration im SQL Editor der **Produktions-** bzw. Ziel-Datenbank ausführen und dort ggf. kurz nachtesten.
