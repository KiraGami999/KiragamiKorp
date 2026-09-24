# KiragamiKorp — Portfolio + Automation Studio

The digital engineering & AI studio site for **Blessings Mandala**. A neo-brutalist /
cyberpunk-inflected portfolio **plus** an MVP AI automation generation system at `/studio`.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** (CSS-first theme, see `src/app/globals.css`)
- **Framer Motion** — scroll reveals, mobile menu, magnetic buttons
- **GSAP** + `@gsap/react` — marquee loop, pinned horizontal scroll, animated counters
- **Lucide React** — icon set
- Deploys to **Vercel** with zero required environment variables (mock generator)

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
| `src/lib/automation/generate.ts` | Mock keyword-matched generator |
| `src/components/studio/*` | Prompt form + workflow result UI |

The API currently returns **mock** templates (support triage, weekly reports, changelog, email, or a generic scaffold). To plug in a live LLM later, replace the body of `generateAutomation` / the route handler while keeping the `AutomationWorkflow` response shape.

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
    automation/            Mock workflow generator
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
| `projects.ts` | Work cards |
| `stats.ts` | About counters |
| `socials.ts` | Social links |
| `ai-lab.ts` | Lab terminal scenarios |

## Design system notes

- **Palette**: `ink` (#0a0a0a), `acid` (#dbff3e), `paper` (#f5f4f0), `fog` (#c9c9c4)
- **Type**: `Anton`, `Space Grotesk`, `JetBrains Mono` via `next/font/google`
- **Motion**: respects `prefers-reduced-motion`

## Deployment

No required environment variables for the mock Studio. Connect the repo in Vercel — default Next.js settings work.
