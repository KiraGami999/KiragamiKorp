# KiragamiKorp — Portfolio Site

The digital engineering & AI studio site for **Blessings Mandala**. A single-scroll,
neo-brutalist / cyberpunk-inflected portfolio built with Next.js, TypeScript, Tailwind
CSS, Framer Motion, and GSAP.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** (CSS-first theme, see `src/app/globals.css`)
- **Framer Motion** — scroll reveals, mobile menu, magnetic buttons
- **GSAP** + `@gsap/react` — marquee loop, pinned horizontal scroll, animated counters
- **Lucide React** — icon set
- Deploys to **Vercel** with zero required environment variables

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

Other scripts:

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # ESLint
```

## Project structure

```
src/
  app/                     Routes, layout, global styles, sitemap/robots
  components/
    layout/                Header, MobileMenu, Footer, Logo, CustomCursor
    sections/               One file per page section (Hero, About, Work, ...)
    ui/                     Reusable primitives (RevealText, GlitchText, ServiceRow, ...)
  lib/
    data/                   All editable site content lives here
    hooks/                  useReducedMotion, useFinePointer
    utils/                  cn() class-merging helper
  types/                    Shared TypeScript types
```

## Editing content

All real content lives in `src/lib/data/` — no component code needs to change to update copy:

| File | What it controls |
| --- | --- |
| `site.ts` | Hero headline/subhead, about copy, contact copy, founder name, email, disciplines list |
| `services.ts` | The six service rows (title, description, icon) |
| `projects.ts` | The Work section's project cards (title, category, summary, tags, optional `href`) |
| `stats.ts` | The animated stat counters in the About section |
| `socials.ts` | Footer/contact social links |
| `ai-lab.ts` | The scripted automation "Lab" terminal scenarios |

All of the above ship with clearly-labeled **placeholder** content — swap it out by copying
the shape of an existing entry.

### Adding real photos

The hero figure and founder portrait are original abstract/typographic placeholders
(no stock photos), so there's nothing to license or attribute. To swap in a real photo:

1. Add the image to `public/images/`.
2. Replace the relevant placeholder markup (`src/components/sections/HeroFigure.tsx` or
   the portrait block in `src/components/sections/About.tsx`) with a `next/image`.

## Design system notes

- **Palette**: `ink` (#0a0a0a), `acid` (#dbff3e), `paper` (#f5f4f0), `fog` (#c9c9c4) —
  defined once in `src/app/globals.css` under `@theme inline`. No other brand colors are
  used anywhere in the UI.
- **Type**: `Anton` (display/headlines), `Space Grotesk` (body/UI), `JetBrains Mono`
  (labels, counters, terminal text) — loaded via `next/font/google` in `src/app/layout.tsx`.
- **Motion**: Framer Motion handles reveals/UI transitions; GSAP handles the marquee loop,
  the Work section's pinned horizontal scroll, and the animated stat counters. Every
  motion-heavy component checks `useReducedMotion()` (from `src/lib/hooks`) and either
  disables or simplifies its animation accordingly; a global CSS rule in `globals.css`
  also clamps any remaining CSS transitions/animations under `prefers-reduced-motion`.
- **The AI Lab terminal** (`src/components/sections/AiLabTerminal.tsx`) is a scripted,
  client-side simulation — not a live model call — and is labeled as such in the UI.

## Deployment

The site has no required environment variables and is static-friendly. To deploy on
Vercel:

```bash
npx vercel
```

or connect the repository in the Vercel dashboard — the default Next.js build settings
work out of the box.
