<div align="center">

# GymGraph

**A mobile-first Progressive Web App for logging gym workouts and tracking progressive overload.**

[Live App](https://gym.biplovpokhrel.com.np) · Built with Next.js 16, Drizzle ORM, and Cloudflare Workers

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare)
![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey)

</div>

---

GymGraph replaces a paper notebook (or a bloated fitness app) with a fast, installable PWA built around one goal: logging a set should take as few taps as possible, and last week's numbers should always be one glance away.

## Highlights

- **Scroll-wheel set entry** — weight and reps are set with native-feeling iOS-style scroll wheels (0.5 kg / 1-rep increments) instead of a keyboard. Each wheel opens already dialed in to what you lifted last time for that exact set, so repeating a workout is zero taps and beating it is one scroll.
- **Date-based workout log** — swipe between days via the top bar's arrows or the calendar picker. Every exercise is its own card; swipe left (Gmail/iOS Mail style) to delete, with a required second tap to confirm so nothing is removed by accident.
- **Consistency grid** — a GitHub-style contribution heatmap of every day trained. Tap any square to jump straight to that day's workout.
- **Progress charts** — pick any exercise ever logged and see Weight / Reps / Volume over time, one colored line per set, so progressive overload is visible at a glance.
- **True PWA** — installable to the home screen, works offline for previously-loaded data, dark mode, zero native-app-store friction.

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
| Hosting | Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare), free tier |
| CI/CD | GitHub Actions — every push to `main` builds and deploys automatically |

<details>
<summary><strong>Why these choices over the more obvious defaults</strong></summary>

<br>

- **Drizzle instead of Prisma.** Prisma's query engine is a native binary, which doesn't run in Cloudflare's Workers runtime without extra data-proxy infrastructure. Drizzle compiles to plain SQL over the libSQL/HTTP driver, so the exact same code runs locally and on Workers with zero extra services.
- **Turso instead of D1.** Turso is libSQL (SQLite's wire-compatible fork), so local development uses a real SQLite file with **no emulation layer**, and production just points the same Drizzle client at a remote URL. D1 requires its own binding/emulation setup and a different local-dev story; Turso's free tier is generous enough for personal use and keeps local/prod parity perfect.
- **OpenNext instead of `@cloudflare/next-on-pages`.** `next-on-pages` restricts every route to the Edge runtime and doesn't support the Node `fetch`-based libSQL driver well. [OpenNext](https://opennext.js.org/cloudflare) runs standard Next.js (Node.js runtime, App Router route handlers) on Workers via `nodejs_compat`, so nothing in this codebase needed to be written in an "edge-safe" dialect.

</details>

## Project structure

```
app/
  page.tsx                 Home screen (today's / selected day's workout)
  progress/page.tsx        Consistency (contribution) grid
  analytics/page.tsx       Exercise search + progress charts
  manifest.ts              PWA manifest (Next's built-in metadata route)
  api/
    workout/                      GET   workout for a given ?date=
    workout-exercises/            POST  create an exercise entry
    workout-exercises/[id]/       PATCH update sets, DELETE remove
    exercises/                    GET   autocomplete search
    exercises/previous/           GET   most recent sets, for wheel-picker seeding
    contributions/                GET   logged dates in a range (for the grid)
    analytics/exercises/          GET   every exercise ever logged
    analytics/data/               GET   time series for one exercise
components/
  layout/        top bar, bottom nav, app shell, theme + service worker registration
  home/          exercise card with swipe-to-delete
  add-exercise/  add/edit bottom sheet, exercise autocomplete, wheel picker
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
.github/workflows/
  deploy.yml     builds and deploys to Cloudflare on every push to main
```

## Data model

```
workout_days        id, date (unique, YYYY-MM-DD)
exercises            id, name (unique, case-insensitive)
workout_exercises   id, workout_day_id → workout_days, exercise_id → exercises, position
exercise_sets       id, workout_exercise_id → workout_exercises, set_number, weight, reps
```

Exercise names are normalized into a single `exercises` table (matched case-insensitively on create), so "Bench Press" logged on different days always resolves to the same exercise for autocomplete and analytics. Foreign keys cascade on delete: deleting a `workout_exercise` removes its sets; deleting a `workout_day` removes its exercises and their sets. Indexes cover every foreign key and the date/name lookup columns.

Authentication was intentionally left out (personal, single-user app), but nothing in the schema assumes a single user — adding a `user_id` column to `workout_days` and `exercises` plus an auth check in the API routes is the entire migration path if that's needed later.

## Running it locally

```bash
npm install
cp .env.example .env        # defaults to a local SQLite file, no edits needed
npm run db:migrate          # create local.db from the migrations in db/migrations
npm run db:seed             # optional: 6 weeks of sample push/pull/legs data
npm run dev                 # starts on http://localhost:3000
```

To open it on your phone during development, connect the phone to the same Wi-Fi and visit `http://<your-computer's-LAN-IP>:3000`. Next.js's dev server blocks cross-origin asset requests by default; `allowedDevOrigins` in `next.config.ts` is pre-configured for common home-network ranges — add your specific IP there if your network doesn't match.

### Scripts

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
| `npm run cf:deploy` | Build and deploy to Cloudflare Workers manually |

### Environment variables

| Variable | Local default | Production |
|---|---|---|
| `DATABASE_URL` | `file:./local.db` | Turso database URL, e.g. `libsql://<db>-<org>.turso.io` |
| `DATABASE_AUTH_TOKEN` | not needed | Turso auth token |

## Deployment

This repo is deployed to Cloudflare Workers, with GitHub Actions redeploying automatically on every push to `main`. To stand up your own instance:

<details>
<summary><strong>1. Create a production database (Turso)</strong></summary>

<br>

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login              # or `turso auth signup`
turso db create gymgraph
turso db show gymgraph --url          # → DATABASE_URL
turso db tokens create gymgraph       # → DATABASE_AUTH_TOKEN
```

Apply the schema:

```bash
DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." npm run db:migrate
```

</details>

<details>
<summary><strong>2. Configure Cloudflare secrets</strong></summary>

<br>

```bash
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put DATABASE_AUTH_TOKEN
```

`wrangler.jsonc` already declares the Worker, the static assets binding, and `nodejs_compat` (required for the libSQL client to run on Workers).

</details>

<details>
<summary><strong>3. First deploy</strong></summary>

<br>

```bash
npm run cf:deploy
```

Live at `https://<worker-name>.<your-subdomain>.workers.dev`.

</details>

<details>
<summary><strong>4. Auto-deploy on every push to <code>main</code></strong></summary>

<br>

1. Create a Cloudflare API token: dashboard → profile icon → **My Profile → API Tokens → Create Token** → **Edit Cloudflare Workers** template.
2. Add it as a GitHub repo secret named `CLOUDFLARE_API_TOKEN` (**Settings → Secrets and variables → Actions**).

From then on, `git push origin main` ships to production via `.github/workflows/deploy.yml`. Database secrets never need to touch GitHub — they're stored on the Worker itself and persist across deploys.

</details>

<details>
<summary><strong>5. Custom domain</strong></summary>

<br>

Declared in `wrangler.jsonc` so it's applied automatically on every deploy:

```jsonc
"routes": [{ "pattern": "gym.yourdomain.com", "custom_domain": true }]
```

Requires the domain's zone to already be on your Cloudflare account. HTTPS is provisioned automatically.

</details>

<details>
<summary><strong>6. Install it on your phone</strong></summary>

<br>

Visit the deployed URL:

- **iOS Safari**: Share icon → **Add to Home Screen**
- **Android Chrome**: ⋮ menu → **Install app**

It opens full-screen with no browser chrome, works offline for previously-loaded data, and updates automatically on the next deploy.

</details>

## PWA / offline behavior

`public/sw.js` is a small hand-written service worker (no build plugin), registered only in production:

- Navigations (HTML) are network-first with a cached-shell fallback, so the app still opens offline.
- `/api/*` `GET` requests are network-first with a cache fallback, so the most recently loaded workout/analytics data is available offline; writes (`POST`/`PATCH`/`DELETE`) always go straight to the network.
- `_next/static/*` and icons are cache-first, since they're content-hashed and safe to cache forever.

It's intentionally left out of local development (`next dev`) to avoid caching interfering with hot reload.

## License

MIT
