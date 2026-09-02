# Granola UI

A Granola-inspired People / Companies UI demo, wired to **Micro** for live workspace data. This is not production Granola — it is a Next.js app that recreates the look and flow for evaluation and integration work.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` as needed (see below). Placeholder mode works with an empty env file.

## Run

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` / `npm start` | Production build + serve (also port 3001) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Placeholder vs Micro

The sidebar has a **Placeholder / Micro** toggle (stored in `localStorage` as `granola-ui:data-source`). Default is Placeholder.

| Mode | Data | Credentials |
|------|------|-------------|
| **Placeholder** | Static fixtures in `src/lib/data.ts` | None — works offline |
| **Micro** | Live data via `src/app/api/*` + `@micro-so/sdk` | `MICRO_API_KEY` + `MICRO_TEAM_ID` |

Without Micro credentials, API routes return `{ live: false, items: [] }` instead of crashing. Switch the toggle after adding keys and restarting the dev server if env changed.

Placeholder view chips use ids like `all` / `met`. Micro views use UUIDs — the app only sends UUID view ids to Micro APIs.

## Environment

Copy `.env.example` → `.env.local`.

| Variable | Required when | Notes |
|----------|---------------|--------|
| `MICRO_API_KEY` | Micro mode | API key from Micro Settings / Console |
| `MICRO_TEAM_ID` | Micro mode | Team id for the workspace |
| `MICRO_BASE_URL` | Staging keys | SDK defaults to production `https://developers.micro.so`. Staging keys need `https://developers.staging.micro.so`. Clear or omit for production keys. |
| `MICRO_ME_EMAIL` | Calendar / “mine” filtering | Your email for upcoming events and Granola “exclude me” logic. Unset = no personal filter. |
| `GRANOLA_API_KEY` | Optional | Granola notes / spaces enrichment |
| `LOCAL_EMAIL_ACTIVITY_PATH` | Optional | Path to local email activity JSON (defaults under `.local/`) |
| `LOCAL_IMESSAGE_ACTIVITY_PATH` | Optional | Path to local iMessage activity JSON |

`.env*` is gitignored (except `.env.example`). Local fixture dirs live under `.local/`.

## Layout

| Path | Role |
|------|------|
| `src/app/` | App Router pages (`/`, `/people`, `/companies`, spaces, lists) |
| `src/app/api/` | BFF routes that call Micro (and optional Granola / local fixtures) |
| `src/components/` | Shell, directories, profile UI |
| `src/lib/data.ts` | Placeholder fixtures + shared types |
| `src/lib/data-source.tsx` | Placeholder / Micro mode provider |
| `src/lib/micro*.ts` | Micro SDK helpers (people, companies, events, …) |
| `src/lib/granola.ts` | Optional Granola API client |
