# Garden Ministries — Astro site

Public website of Garden Ministries, live at **https://garden-ministries.org** (English at `/`, Spanish at `/es/`).
Static [Astro](https://astro.build) build served by Nginx on the Garden server.

**Before working on the site, read `docs/website/CURRENT-STATE.md`.** Deployment: `docs/website/DEPLOY.md`.
History: `docs/website/CHANGELOG.md`. Mail/server operations docs live outside this repository (parent project `docs/operations/`).

## Stack

- Astro 7 (static output), Tailwind CSS 4, `@astrojs/sitemap`, image optimization via `astro:assets`.
- Brand system: forest / cream / clay / sage / gold, Georgia headings + Inter body (`src/styles/global.css`).
- Minimal client JavaScript: mobile menu, hero carousel, Zeffy embed loader, Get Involved placeholder form,
  click-to-play testimony videos.

## Project structure

```
src/
  layouts/BaseLayout.astro     <head>: meta, canonical, hreflang, Open Graph, JSON-LD
  components/                  Header, Footer, PageHero, MissionCard, Icon (inline SVG), ZeffyDonationForm
  templates/                   One template per page type (Home, About, Missions, Give, ...)
  pages/                       Thin English routes rendering a template with locale="en"
  pages/es/                    Thin Spanish routes, same templates, locale="es" (same slugs as English)
  i18n/ui.ts                   All UI copy in English and Spanish, keyed by page
  i18n/locales.ts              localizedPath() — the only localization helper
  data/missions.ts             The three Missions (bilingual fields)
  assets/                      Images optimized at build time
public/                        robots.txt, favicons, manifest, og image, videos/ (served as-is)
content-source/                Reference material and editorial notes — not built into the site
```

To add a page: create a template in `src/templates/`, then two one-line wrappers in `src/pages/` and `src/pages/es/`
(same file name) passing `locale="en"` / `locale="es"`.

## Commands

| Command | Action |
| --- | --- |
| `npm ci` | install exact dependencies from the lockfile |
| `npm run dev` | local dev server |
| `npm run check` | Astro/TypeScript diagnostics |
| `npm run build` | production build to `dist/` |
| `npm run preview` | serve the built `dist/` locally |

## Current facts worth knowing

- `SITE_URL` in `astro.config.mjs` (`https://garden-ministries.org`) drives canonical URLs, hreflang and the sitemap.
- Giving is live through the Zeffy embed on `/give`.
- The Get Involved contact form is a disclosed placeholder and sends nothing.
- Production must always be built from a committed SHA via a clean clone — never from a working tree (see DEPLOY.md).
