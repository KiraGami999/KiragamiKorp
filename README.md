# KiragamiKorp — Portfolio + Automation Studio

The digital engineering & AI studio site for **Blessings Mandala**. A neo-brutalist /
cyberpunk-inflected portfolio **plus** an MVP AI automation generation system at `/studio`.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** (CSS-first theme, see `src/app/globals.css`)
- **Framer Motion** — scroll reveals, mobile menu, magnetic buttons
- **GSAP** + `@gsap/react` — marquee loop, pinned horizontal scroll, animated counters
- **Lucide React** — icon set
- **Groq** (free tier, OpenAI-compatible API) for live Studio generation

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

- Portfolio: http://localhost:3000
- Studio: http://localhost:3000/studio

Other scripts:

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # ESLint
```

## Studio (MVP)

Describe a task in plain language → get a structured automation workflow:

- Pipeline **steps** (trigger → ingest → AI → review → action)
- **System prompt**
- Starter **code** stub
- **Export JSON**

| Path | Role |
| --- | --- |
| `src/app/studio/page.tsx` | Studio UI route |
| `src/app/api/generate-automation/route.ts` | POST API |
| `src/lib/automation/llm.ts` | Live generation via any OpenAI-compatible API (Groq by default) + response validation |
| `src/lib/automation/generate.ts` | Keyword-matched template fallback |
| `src/lib/automation/rate-limit.ts` | Per-IP limit (5 requests / minute) |
| `src/components/studio/*` | Prompt form + workflow result UI |

### Live AI with Groq (free tier)

1. Create a free key at [console.groq.com/keys](https://console.groq.com/keys).
2. Copy `.env.example` to `.env.local` and set `GROQ_API_KEY=...`.
3. Restart `npm run dev`.

The key is only read on the server and never reaches the browser. If no key is set, the model is rate-limited, or its JSON doesn't match the workflow shape, the Studio falls back to the templates and shows a notice. Override `LLM_MODEL` / `LLM_BASE_URL` to use a different model or a local Ollama server (see `.env.example`).

## Project structure

```
src/
  app/                     Routes (/, /studio), API, layout, sitemap/robots
  components/
    layout/                Header, MobileMenu, Footer, Logo, CustomCursor
    sections/              Portfolio sections
    studio/                Studio prompt + workflow UI
    ui/                    Reusable primitives
  lib/
    automation/            LLM client, template fallback, rate limit
    data/                  Portfolio content
    hooks/                 useReducedMotion, useFinePointer
    utils/                 cn()
  types/                   Shared TypeScript types
```

## Editing content

All portfolio copy lives in `src/lib/data/`:

| File | What it controls |
| --- | --- |
| `site.ts` | Hero, about, contact, disciplines |
| `services.ts` | Service rows |
| `projects.ts` | Work cards (seed / fallback) |
| `stats.ts` | About counters (seed / fallback) |
| `socials.ts` | Social links |
| `ai-lab.ts` | Lab terminal scenarios |

## Admin CMS (sole operator)

There is **no public login link**. Entry is hidden behind the hero samurai mark:

1. Click the samurai image → cyberpunk terminal
2. Enter clearance phrase (stored hashed in Neon `auth_config`; default seed: `Screw Arasaka`)
3. Personal login at `/admin/login` (credentials in Neon `admin_users`)
4. Ops deck at `/admin` — edit projects, site copy, and stats

### Neon database

Project: **kiragamikorp** · Database: **`kiragamikorp`** (not `neondb`)

| Table | Purpose |
| --- | --- |
| `admin_users` | Sole-admin username + scrypt password hash |
| `auth_config` | Hashed gate phrase |
| `admin_sessions` | Session registry (logout / expiry) |
| `site_settings` | Hero / about / contact / disciplines JSON |
| `projects` | Portfolio projects (normalized rows) |
| `site_stats` | About counters |
| `site_content` | Legacy JSON blob mirror |
| `automation_workflows` | Studio generation archive (ready for use) |

Seed locally: `node scripts/seed-db.mjs`  
Schema reference: `scripts/schema.sql`

Required Vercel env: `DATABASE_URL` (must end with `/kiragamikorp`), `ADMIN_SESSION_SECRET`. Optional: `GROQ_API_KEY`.

## Design system notes

- **Palette**: `ink` (#0a0a0a), `acid` (#dbff3e), `paper` (#f5f4f0), `fog` (#c9c9c4)
- **Type**: `Anton`, `Space Grotesk`, `JetBrains Mono` via `next/font/google`
- **Motion**: respects `prefers-reduced-motion`

## Deployment

Connect the repo in Vercel — default Next.js settings work. Add these environment variables for full features:

- `DATABASE_URL` — Neon connection string for database **`kiragamikorp`**
- `ADMIN_SESSION_SECRET` — random string for signing admin cookies
- `GROQ_API_KEY` — live Studio generation (optional; templates otherwise)

Admin username/password and the gate phrase live in Postgres after seeding (not required as Vercel env vars).
