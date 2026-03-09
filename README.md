# Baumängel.app

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
- **Multi-tenant**: Organizations manage multiple construction projects with role-based access (Admin/Reporter/Viewer)
