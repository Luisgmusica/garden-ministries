# Garden Ministries — Astro site

Rebuild of the Garden Ministries public website on [Astro](https://astro.build), replacing the
previous Next.js prototype (`pu/work/garden-ministries-site`). Same brand system (forest / cream /
clay / sage, Georgia headings + Inter body), rebuilt for SEO and performance.

## Why Astro for this

- **Zero client-side JS by default.** Every page ships as static HTML; the only JavaScript that
  loads is the small, framework-free scripts for the mobile menu and the Give/Get Involved forms.
  That keeps Lighthouse/Core Web Vitals scores high, which is itself an SEO signal.
- **Built-in i18n routing.** English lives at the root (`/about`, `/missions/...`) and Spanish is
  mirrored under `/es/...`, with proper `hreflang` alternates and an XML sitemap generated
  automatically (`@astrojs/sitemap`).
- **Optimized images out of the box.** `astro:assets` converts the logo and hero photo to
  responsive WebP at build time (the hero photo alone went from a 295KB JPG to a 33–101KB WebP set).

## Project structure

```
src/
  layouts/BaseLayout.astro     <head> — meta tags, canonical, hreflang, Open Graph, JSON-LD
  components/                  Header, Footer, PageHero, MissionCard, Icon (inline SVG set)
  templates/                   One template per page type (Home, About, Missions, Give, ...)
  pages/                       Thin English routes, each rendering a template
  pages/es/                    Thin Spanish routes, same templates, locale="es"
  i18n/ui.ts                   All copy, in English and Spanish, keyed by page
  data/missions.ts             The three launch "Missions" (bilingual)
  assets/                      Source images processed by astro:assets (logo, hero photo)
public/                        robots.txt, sitemap output, favicons, manifest, og image
```

To add a page: create a template in `src/templates/`, then two one-line wrapper files in
`src/pages/` and `src/pages/es/` that import it and pass `locale="en"` / `locale="es"`.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | install dependencies |
| `npm run dev` | local dev server |
| `npm run build` | production build to `dist/` (also runs image optimization + sitemap) |
| `npm run preview` | serve the built `dist/` locally |
| `npm run check` | Astro/TypeScript diagnostics |

## Before launch — things intentionally left as TODOs

1. **`astro.config.mjs` → `SITE_URL`** is the official production domain
   (`https://garden-ministries.org`, apex — no www). Canonical URLs, hreflang tags, and the
   sitemap all derive from this value.
2. **Give page** is a working *preview* of the donation flow (frequency, amount, designation,
   summary) with no payment processor wired up yet — matches the honesty of the original prototype
   rather than claiming to process real donations.
3. **Get Involved form** submits nothing anywhere yet; it's a client-side "submitted" state. Wire it
   to a real endpoint (Formspree, Netlify Forms, a Worker, etc.) when ready.
4. **Content** mirrors the identity/mission language already reviewed in
   `documents/Analisis_Garden_Ministries.pdf` — historical claims, leadership bios, and financial
   figures are still marked "pending verification" in the copy itself, on purpose.
5. **Deploy target**: no hosting config included. Astro's static output (`dist/`) deploys as-is to
   Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.
