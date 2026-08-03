# GymGraph

A mobile-first Progressive Web App for logging gym workouts and tracking progressive overload. Built to be installed on your phone like a native app, used every day, and deployed for free.

## Features

- **Fast logging** — a single floating `+` button opens a bottom sheet to add an exercise: search or type a name, pick a set count, fill in weight/reps. Previous-workout values show as placeholders so progressive overload is a glance away.
- **Date-based workout log** — swipe between days with the top bar's arrows or the calendar picker. Each exercise is its own card; swipe a card left (like Gmail/iOS Mail) to reveal delete, or tap it to edit sets in place.
- **Consistency grid** — a GitHub-style contribution heatmap of every day you've trained. Tap any day to jump straight to that workout.
- **Progress charts** — pick any exercise you've ever logged and see Weight / Reps / Volume over time, one colored line per set.
- **Installable PWA** — add-to-home-screen support, offline caching of the app shell and last-seen data, dark mode.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI primitives) |
| Forms/validation | React Hook Form + Zod |
| Database | SQLite locally, [Turso](https://turso.tech) (libSQL) in production |
| ORM | Drizzle ORM |
| Charts | Recharts (lazy-loaded) |
| State/data | Zustand (UI state) + SWR (server cache) |
| Animation | Framer Motion |
| Hosting | Cloudflare Workers (via OpenNext), free tier |

### Why these choices over the initially-suggested ones

- **Drizzle instead of Prisma.** Prisma's query engine is a native binary, which does not run in Cloudflare's Workers runtime without extra data-proxy infrastructure. Drizzle compiles to plain SQL over the libSQL/HTTP driver, so the exact same code runs locally and on Workers with zero extra services.
- **Turso instead of D1** (both were offered as options). Turso is libSQL (SQLite's wire-compatible fork), so local development uses a real SQLite file (`local.db`) with **no emulation layer**, and production just points the same Drizzle client at a remote URL. D1 requires Cloudflare's own binding/emulation setup and a different local dev story; Turso's free tier is generous enough for a single user and keeps local/prod parity perfect.
- **OpenNext for Cloudflare instead of `@cloudflare/next-on-pages`.** `next-on-pages` restricts every route to the Edge runtime and doesn't support the Node `fetch`-based libSQL driver well. [OpenNext](https://opennext.js.org/cloudflare) runs standard Next.js (Node.js runtime, App Router route handlers) on Workers via `nodejs_compat`, so nothing in this repo needed to be written in an "edge-safe" dialect.

## Project structure

```
app/
  page.tsx                 Home screen (today's / selected day's workout)
  progress/page.tsx        Consistency (contribution) grid
  analytics/page.tsx       Exercise search + progress charts
  manifest.ts              PWA manifest (Next's built-in metadata route)
  api/
    workout/                     GET  workout for a given ?date=
    workout-exercises/           POST create an exercise entry
    workout-exercises/[id]/      PATCH update sets, DELETE remove
    exercises/                   GET  autocomplete search
    exercises/previous/          GET  most recent sets for pre-fill placeholders
    contributions/                GET  logged dates in a range (for the grid)
    analytics/exercises/         GET  every exercise ever logged
    analytics/data/              GET  time series for one exercise
components/
  layout/        top bar, bottom nav, app shell, theme + service worker registration
  home/          exercise card with swipe-to-delete
  add-exercise/  the add/edit bottom sheet + exercise autocomplete
  progress/      contribution grid
  analytics/     exercise search list, metric tabs, chart
  ui/            shadcn/ui primitives actually used by the app
db/
  schema.ts      Drizzle table definitions
  index.ts       DB client (SQLite file locally, libSQL/Turso in prod)
  seed.ts        Sample data generator
  migrations/    SQL migrations (drizzle-kit generate)
lib/
  api.ts         typed fetch wrappers for every API route
  store/         Zustand store (selected date, add-sheet state)
  validation.ts  Zod schemas shared by client forms and API routes
  date.ts        timezone-safe YYYY-MM-DD date helpers
public/
  sw.js          hand-written service worker (network-first HTML/API, cache-first static assets)
```

## Data model

```
workout_days        id, date (unique, YYYY-MM-DD)
exercises            id, name (unique, case-insensitive)
workout_exercises   id, workout_day_id → workout_days, exercise_id → exercises, position
exercise_sets       id, workout_exercise_id → workout_exercises, set_number, weight, reps
```

Exercise names are normalized into a single `exercises` table (matched case-insensitively on create), so "Bench Press" logged on different days always resolves to the same exercise for autocomplete and analytics. Foreign keys cascade on delete: deleting a `workout_exercise` removes its sets; deleting a `workout_day` removes its exercises and their sets. Indexes cover every foreign key and the two date/name lookup columns.

Authentication was intentionally left out (single-user app), but nothing in the schema assumes a single user — adding a `user_id` column to `workout_days` and `exercises` plus an auth check in the API routes is the whole migration path later.

## Getting started

```bash
npm install
cp .env.example .env        # defaults to a local SQLite file, no edits needed
npm run db:migrate          # create local.db from the migrations in db/migrations
npm run db:seed             # optional: 6 weeks of sample push/pull/legs data
npm run dev                 # starts on http://localhost:3000
```

To open it on your phone during development, connect the phone to the same Wi-Fi and visit `http://<your-computer's-LAN-IP>:3000`. Next.js's dev server blocks cross-origin asset requests by default; `allowedDevOrigins` in `next.config.ts` is pre-configured for common home-network ranges (`192.168.*.*`, `10.*.*.*`) — add your specific IP there if your network doesn't match.

### Useful scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (bound to `0.0.0.0` so it's reachable on your LAN) |
| `npm run build` / `start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a new migration after editing `db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the database at `DATABASE_URL` |
| `npm run db:studio` | Drizzle Studio (visual DB browser) |
| `npm run db:seed` | Wipe and reseed with sample data |
| `npm run cf:preview` | Build with OpenNext and run it locally under `wrangler` (closest thing to production) |
| `npm run cf:deploy` | Build and deploy to Cloudflare Workers |

## Environment variables

Set in `.env` locally; set as Cloudflare secrets/vars in production (see below).

| Variable | Local default | Production |
|---|---|---|
| `DATABASE_URL` | `file:./local.db` | Your Turso database URL, e.g. `libsql://gymgraph-yourname.turso.io` |
| `DATABASE_AUTH_TOKEN` | not needed | Turso auth token |

## Deploying to Cloudflare (free tier)

### 1. Create the production database (Turso)

```bash
npm install -g turso-cli   # or see https://docs.turso.tech/cli/installation
turso auth signup          # or `turso auth login`
turso db create gymgraph
turso db show gymgraph --url          # → DATABASE_URL
turso db tokens create gymgraph       # → DATABASE_AUTH_TOKEN
```

Apply the schema to that database (point `drizzle.config.ts` at it for one command via env vars):

```bash
DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." npm run db:migrate
```

Optionally seed it the same way with `npm run db:seed`, or just start logging real workouts — the app creates exercises and days on demand.

### 2. Configure Cloudflare secrets

```bash
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put DATABASE_AUTH_TOKEN
```

`wrangler.jsonc` already declares the Worker (`gymgraph`), the static assets binding, and `nodejs_compat` (required for the libSQL client to run on Workers). Edit the `name` field there if you want a different Worker name.

### 3. Deploy

```bash
npm run cf:deploy
```

This runs `opennextjs-cloudflare build` (adapts the Next.js build for Workers) and `opennextjs-cloudflare deploy` (pushes it with Wrangler). Your app is live at `https://gymgraph.<your-subdomain>.workers.dev`.

### 4. Custom domain

In the Cloudflare dashboard: **Workers & Pages → gymgraph → Settings → Domains & Routes → Add Custom Domain**, and follow the DNS prompts (works whether the domain's zone is already on Cloudflare or you add it now). HTTPS is provisioned automatically.

### 5. Install it on your phone

Visit your deployed URL (or the LAN dev URL) on your phone:

- **iOS Safari**: Share icon → **Add to Home Screen**.
- **Android Chrome**: menu (⋮) → **Install app** (or **Add to Home Screen**).

The app now opens full-screen with no browser chrome, works offline for previously-loaded data, and updates automatically whenever you redeploy.

## Notes on the PWA/offline behavior

`public/sw.js` is a small hand-written service worker (no build plugin) registered only in production:

- Navigations (HTML) are network-first with a cached-shell fallback, so the app still opens offline.
- `/api/*` `GET` requests are network-first with a cache fallback, so your most recently loaded workout/analytics data is available offline; writes (`POST`/`PATCH`/`DELETE`) always go straight to the network.
- `_next/static/*` and icons are cache-first, since they're content-hashed and safe to cache forever.

It's intentionally left out of local development (`next dev`) to avoid caching interfering with hot reload.
