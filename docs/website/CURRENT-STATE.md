# Website — current state (verified 2026-09-15)

Canonical memory for the public website. Read before any website work. Evidence (repo, server, live HTTP)
wins over this file: if they disagree, verify, fix this file, and note it in `CHANGELOG.md`.
This folder is versioned in the website repo (`garden-ministries-astro/docs/website/`). Mail/server operations live outside the repo in the parent project's `docs/operations/` and are not repeated here.

| Doc | Purpose |
|---|---|
| `CURRENT-STATE.md` (this file) | What is true now, decisions in force, known issues |
| `CHANGELOG.md` | What changed when (evidence-based, newest first) |
| `DEPLOY.md` | The only supported deployment procedure + rollback |
| `CONTENT-EXPANSION-PLAN.md` | Approved-but-not-implemented content round (Pray, address, testimonies, founders) |
| `CONTACT-INFO-PROPOSAL.md` | Proposal to publish info@ (not applied) |

## Source ↔ production

| | Value |
|---|---|
| Repository | `garden-ministries-astro/` (git, branch `main`), remote `git@github.com:Luisgmusica/garden-ministries.git` |
| Source commit of production | **`76e3181`** "Baseline: website source as deployed to production 2026-09-11" |
| Production | Nginx on garden-prod-01, docroot `/var/www/garden-ministries` (`garden:garden`, dirs 755 / files 644, 52 files, ~15 MB) |
| Last deploy | 2026-09-11 ~02:23Z (build mtime 02:22:21Z), rsync from the Mac |
| Reproducibility | Verified 2026-09-15: clean clone of `76e3181` → `npm ci` → `npm run build` gives a `dist/` byte-identical to all 52 files served in production (each file fetched over HTTPS and compared) |
| GitHub | `76e3181` is **not pushed** (GitHub SSH from this Mac returned `Permission denied (publickey)`). The server clone `~/apps/garden-ministries` is at `8f77259` (pulled 2026-09-03) and is **not** used for deploys |

Until 2026-09-15 production had been built from an uncommitted working tree; that gap is closed. Rule: deploy only
a committed SHA built from a clean clone (`DEPLOY.md`).

## Stack and structure

- Astro `^7.2.10` (pinned by `package-lock.json`), static output, Tailwind 4 (`@tailwindcss/vite`), `@astrojs/sitemap`,
  images via `astro:assets` (sharp). Build machine: this Mac, Node v24.15.0. (Server has Node v22.23.2; unused for deploys.)
- `src/pages/*.astro` and `src/pages/es/*.astro` are one-line wrappers that render `src/templates/*Template.astro` with `locale`.
- Components: `Header`, `Footer`, `PageHero`, `MissionCard`, `Icon` (inline SVG set), `ZeffyDonationForm`.
- Data: `src/data/missions.ts` (3 missions, bilingual `{en, es}` fields). Copy: `src/i18n/ui.ts` (keyed `en`/`es` per page).
- `content-source/` is tracked reference material (board memo, notes, source photos). It is **not** built into the site.
- Brand tokens in `src/styles/global.css`: forest `#17352c`, cream `#f7f2e8`, clay `#a85234`, sage `#dfe7da`, gold `#d2a862`;
  Georgia headings, Inter body.

## Routes (21 pages)

`/`, `/about`, `/missions`, `/missions/local-family-care`, `/missions/community-water`, `/missions/ministry-strengthening`,
`/impact`, `/give`, `/get-involved`, `/privacy`, `/404` — each mirrored under `/es/…` (except 404).
Nav: Missions · Impact · About · Get involved + **Give now** button + EN/ES switch.

## Localization

- One architecture only: strings in `ui.ts`, bilingual fields in data files, `localizedPath(path, locale)` in `src/i18n/locales.ts`.
- **Spanish URLs reuse English slugs** (`/es/get-involved`, not `/es/participa`). Language switch, hreflang (BaseLayout) and
  sitemap all depend on this. Decision reaffirmed 2026-09-15: new Prayer page is `/pray` + `/es/pray` (no `/es/orar`).
- Spanish copy uses *tú*.

## Domain, SEO

- Canonical production domain: **`https://garden-ministries.org`** (apex), from `SITE_URL` in `astro.config.mjs`;
  canonical, hreflang, sitemap and `public/robots.txt` use it.
- JSON-LD (`BaseLayout`): `NGO` with `addressRegion: ID`, `addressCountry: US` only. Do not add the mailing address as a
  physical location.

## Media

- Images: `src/assets/*` → responsive WebP at build (hero carousel: 4 well-project images; mission image).
- Video: `public/videos/community-water-well.mp4` (served as-is; H.264 360×640, 40 s, 2.4 Mbps, 12.5 MB) on
  `/missions/community-water`, `<video controls preload="none">`. It is well-construction footage, **not** a testimony.
  Its `poster` uses the unoptimized JPG URL, and the 4:5 box crops the 9:16 video.
- No site-wide testimonial/story component exists yet.

## Giving, contact

- `/give` + `/es/give`: live **Zeffy** embed (`ZeffyDonationForm`, form `/embed/donation-form/give-act-see-the-impact`,
  loader `https://www.zeffy.com/embed/v2/zeffy-embed.js`, iframe fallback). No per-mission designation (`?mission=` removed).
- `/get-involved`: the contact form is a **placeholder** (sends nothing; says so). See `CONTACT-INFO-PROPOSAL.md`.
- No email, phone or street/mailing address is published yet.

## Source material authority (owner decision, 2026-09-15)

Hierarchy for content work: current explicit owner instruction → current owner-provided material → this documentation →
older historical/reference documents. Absence of a fact in an older document is not a contradiction; flag only genuine conflicts.
Authorization to publish is not authorization to invent names, titles, roles, relationships, locations, quotes or mission links.

| Material (outside the repo, `Fotos/`) | Status |
|---|---|
| `Fotos/Owners and family ` (trailing space; `IMG_2511.jpeg` family portrait, `IMG_8207.jpeg` couple) | Real photographs of Garden Ministries' **founders and their family**. **Authorized for public website use**, minors included. Names/roles not provided. |
| `Fotos/testimonials/` (4 videos) | **Authentic testimonials made exclusively for Garden Ministries, authorized for public website use.** Speaker names, language, transcript and mission association not provided. |
| `Fotos/info/` (Prayer Requests graphic, Connect card, banner, photos `a.jpg`, `B.jpg`, `c.jpg`, `d.jpg`) | **Owner-provided, verified source material** for the current expansion; authoritative editorial source. Evaluate its photos on their own authorization, not by resemblance to earlier withheld batches. |
| `Fotos/house churches country v/` | Not part of the 2026-09-15 authorization. The 2026-09-02 board-memo decision (withheld) stands until the owner says otherwise. |
| `Fotos/Generadas IA/` | AI images, rejected (board memo 2026-09-02). |

Contact identity: the **mailing address** is authorized. Isrrael's phone, personal email, title or name from the Connect
graphic are **not** authorized for publication.

## Approved, not yet implemented

See `CONTENT-EXPANSION-PLAN.md`: `/pray` + `/es/pray`; nav order About → Pray → Get involved → Give now; mailing address on
`/get-involved`, `/es/get-involved` and footer; testimonies; founders/family on About.

## Testing expectations

- Every change: `npm run check`, `npm run build`, targeted EN + ES checks of the pages touched.
- Before any deploy: build from a clean clone of the committed SHA; full regression (all routes EN/ES render, language switch,
  canonical/hreflang/sitemap consistency, Zeffy on `/give` + `/es/give`, mobile nav, 360/768/1280 px on changed pages,
  Lighthouse mobile on changed pages, no console errors). Broad regression is for pre-deploy, not for every discovery step.
- After deploy: manifest match + HTTP checks per `DEPLOY.md`.

## Known issues

1. **Trailing-slash redirect on every internal URL.** Astro `trailingSlash: 'never'` + default `build.format: 'directory'`
   emits `about/index.html`; Nginx `try_files $uri $uri/ =404` answers `/about` with **301 → `/about/`**. Canonical, hreflang,
   sitemap and all internal links are slash-less, so each points at a redirect (`http://…/about` takes 2 hops).
   **Recommended smallest fix (repo only, no Nginx/root change):** `trailingSlash: 'always'`; `localizedPath` returns
   trailing-slash paths; BaseLayout builds canonical/hreflang with the slash. Trial build 2026-09-15 (scratch clone, not
   committed): canonical, hreflang, sitemap `<loc>` and every internal link end in `/` and match what Nginx serves with 200;
   old slash-less URLs keep 301-ing to them. Apply as the first commit of the content round so `/pray/` is born correct.
2. **www is not redirected** to the apex: `server_name garden-ministries.org www.garden-ministries.org` share one server block
   (canonical tags mitigate). The comment in `astro.config.mjs` claiming an Nginx www redirect is wrong. Fix needs root (separate change).
3. **No `Cache-Control`/`Expires`** on any path (ETag/Last-Modified revalidation works). Safe later improvement (root console,
   `nginx -t`, reload, separately authorized): `/_astro/` `public, max-age=31536000, immutable` (content-hashed names);
   `/videos/` a short max-age (e.g. 7 days) unless video filenames are versioned, then long. Note `add_header` inside a
   `location` replaces inherited headers.
4. Nginx serves its default 404 page, not Astro's `404.html` (no `error_page`); the 404 page's language switch links to a
   non-existent `/es/404`.
5. `community-water-well.mp4` is heavier than needed (≈3 MB achievable) and its poster is unoptimized.
6. `/get-involved` placeholder form (see proposal).
7. Baseline commit not pushed to GitHub.
