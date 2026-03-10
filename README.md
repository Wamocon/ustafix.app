# Ustafix.app

Construction defect management app for the German construction industry. Document, track, and manage building defects directly from the construction site with voice-first input, photo/video capture, and AI-powered multilingual translation.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Database**: Supabase PostgreSQL + Drizzle ORM
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (images, videos, audio)
- **Voice AI**: Groq Whisper Large v3 Turbo
- **Translation**: DeepL API (DE/TR/RU)
- **Realtime**: Supabase Realtime

## Prerequisites

- Node.js 20+
- Supabase account (free tier): [supabase.com](https://supabase.com)
- Groq API key (free): [console.groq.com](https://console.groq.com)
- DeepL API key (free tier): [deepl.com/pro-api](https://www.deepl.com/pro-api)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local` and fill in your API keys:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
DEEPL_API_KEY=your_deepl_api_key
```

### 3. Set up database

Open the Supabase SQL Editor and run the contents of `supabase/setup.sql`. This creates all tables, RLS policies, storage buckets, and enables Realtime.

- **Bestehende Datenbanken:** Zuerst die Migration `supabase/migrations/20250309_roles_admin_manager_worker.sql` ausführen (Rollen admin/manager/worker, defect_comments, RLS).

#### Rollenkonzept zuerst testen (empfohlen)

Vor dem Einsatz auf einer produktiven oder wichtigen Datenbank das Rollenkonzept auf einer **Test-DB** prüfen:

1. Neues Supabase-Projekt anlegen (z. B. „ustafix-test“) oder eine unkritische Test-DB nutzen.
2. `.env.local` vorübergehend auf die Test-Projekt-URL und -Keys umstellen, App starten (`npm run dev`).
3. Im Supabase SQL Editor der Test-DB: bei frischer DB `supabase/setup.sql` ausführen, bei bestehender DB die Migration `supabase/migrations/20250309_roles_admin_manager_worker.sql`.
4. Den **Testplan** durchgehen: [docs/TESTPLAN-Rollenkonzept.md](docs/TESTPLAN-Rollenkonzept.md) (Checklisten für Admin, Manager, Worker, Empty State, Realtime/PWA).
5. Erst nach erfolgreichem Durchlauf die Migration auf der Ziel- bzw. Produktions-Datenbank ausführen.

Weitere Testdokumentation:
- **Teststufen** (Unit, Funktionstest, Systemintegration, Abnahme): [docs/TESTSTUFEN-Rollenkonzept.md](docs/TESTSTUFEN-Rollenkonzept.md)
- **Dokumentation in Jira Xray:** [docs/Jira-Xray-Anleitung.md](docs/Jira-Xray-Anleitung.md) (Projekt FR: Tests anlegen, Test Plan, Test Execution für Abnahme)

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Voice-first defect capture**: Record audio in any language, auto-transcribed via Groq Whisper, auto-translated to German/Turkish/Russian via DeepL
- **Photo/video capture**: Native camera access, client-side image compression, 50MB video limit
- **One-tap status updates**: Toggle between Open/In Progress/Done with instant auto-save
- **Real-time sync**: All changes sync live across connected users via Supabase Realtime
- **Offline resilience**: PWA with cached app shell and offline indicator
- **Roles (admin, manager, worker)**: Admin/Manager verwalten Projekte, Team und Einheiten; Worker erfassen Mängel und wechseln Status; Löschen von Mängeln/Medien nach Rolle
- **Projekt-Team (Pull-Modell)**: Nutzer per E-Mail hinzufügen (muss registriert sein); nur Admin/Manager
- **Kommentare pro Mangel**: Fragen & Anweisungen (defect_comments); alle lesen/schreiben, Löschen nur Ersteller oder Admin/Manager
