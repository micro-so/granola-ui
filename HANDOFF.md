# Evaluation handoff

Short guide for reviewers. Full setup lives in [README.md](./README.md).

## Before you start

1. Keep this repository **private**. Share via invite or a zip that excludes `.env`, `.local/`, `.next/`, and `node_modules/`.
2. Prefer **staging** Micro keys for demos. If keys were created on staging, keep:

   ```bash
   MICRO_BASE_URL=https://developers.staging.micro.so
   ```

   For production keys, clear `MICRO_BASE_URL` (SDK default is production).
3. Set `MICRO_ME_EMAIL` to the reviewer account email so calendar “mine” filtering works.

## Five-minute walkthrough

1. `npm install && cp .env.example .env.local && npm run dev` → http://localhost:3001  
2. Leave the sidebar on **Placeholder**. Open **People** and **Companies**, open a profile.  
3. Note the bottom **Ask** bar and recipe chips — they are decorative only (no agent backend).  
4. Add `MICRO_API_KEY` + `MICRO_TEAM_ID` (+ staging `MICRO_BASE_URL` if needed), restart `npm run dev`, switch the sidebar to **Micro**.  
5. Re-open People / Companies and a profile; confirm live lists and upcoming / notes as available for the workspace.

## What to expect

- **Placeholder** = offline fixture CRM data (fictional people; public company names for familiarity).  
- **Micro** = live Prism / workspace data for the keyed team.  
- Missing credentials soft-fail (`live: false`, empty lists) instead of crashing.
