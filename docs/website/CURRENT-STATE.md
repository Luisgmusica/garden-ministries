# Website — current state (updated 2026-09-15, content round 1 live)

Canonical memory for the public website. Read before any website work. Evidence (repo, server, live HTTP)
wins over this file: if they disagree, verify, fix this file, and note it in `CHANGELOG.md`.
This folder is versioned in the website repo (`garden-ministries-astro/docs/website/`). Mail/server operations live outside
the repo in the parent project's `docs/operations/` and are not repeated here.

| Doc | Purpose |
|---|---|
| `CURRENT-STATE.md` (this file) | What is true now, decisions in force, known issues |
| `CHANGELOG.md` | What changed when (evidence-based, newest first) |
| `DEPLOY.md` | The only supported deployment procedure + rollback |
| `CONTENT-EXPANSION-PLAN.md` | Content round 1: decisions, what was implemented, what remains |
| `CONTACT-INFO-PROPOSAL.md` | Proposal to publish info@ (not applied) |
| `CONTACT-FORM-AUDIT.md` | Audit of the Get Involved form and recommended secure architecture (not implemented) |

## Source ↔ production

| | Value |
|---|---|
| Repository | `garden-ministries-astro/` (git, branch `main`), remote `git@github.com:Luisgmusica/garden-ministries.git` |
| **Production** | Build of **`73daed0`**. Nginx on garden-prod-01, docroot `/var/www/garden-ministries` (`garden:garden`, dirs 755 / files 644, 82 files, ~32 MB). Deploys 2026-09-15: content round 1 `580a2dc` at 19:25:34–19:29:47Z, founders photo `73daed0` at 19:57:31–19:57:36Z. Server manifest matched the build after each. |
| Repo `main` | `73daed0` is live. Commits after it are post-deploy documentation only unless `CHANGELOG.md` says otherwise. |
| Reproducibility | Clean clone of `73daed0` from GitHub → `npm ci` → `npm run build` = production byte-for-byte (82 files, manifest compared on the server). Docs commits do not change the build. |
| GitHub | `origin/main` at `73daed0` verified after deploy (normal pushes, never forced). Pushing needs `~/.ssh/id_ed25519` in the SSH agent: it is passphrase-protected, so the operator runs `ssh-add --apple-use-keychain ~/.ssh/id_ed25519` in a real terminal. Server clone `~/apps/garden-ministries` is not used for deploys. |

Rule: deploy only a committed SHA built from a clean clone (`DEPLOY.md`).

## Stack and structure

- Astro `^7.2.10` (pinned by `package-lock.json`), static output, Tailwind 4 (`@tailwindcss/vite`), `@astrojs/sitemap`,
  images via `astro:assets` (sharp). Build machine: this Mac, Node v24.15.0.
- `src/pages/*.astro` and `src/pages/es/*.astro` are one-line wrappers rendering `src/templates/*Template.astro` with `locale`.
- Components: `Header`, `Footer`, `PageHero`, `MissionCard`, `Icon` (inline SVG set, incl. `play`), `ZeffyDonationForm`,
  `TestimoniesSection`, `TestimonyVideo`.
- Data: `missions.ts` (3 missions), `prayer.ts` (Pray With Us content), `testimonies.ts` (testimony videos),
  `organization.ts` (mailing address). Copy: `src/i18n/ui.ts` (keyed `en`/`es` per page).
- `scripts/media/encode-video.swift`: macOS web-video encoder (no npm dependency).
- `content-source/` is tracked reference material, not built into the site.
- Brand tokens in `src/styles/global.css`: forest `#17352c`, cream `#f7f2e8`, clay `#a85234`, sage `#dfe7da`, gold `#d2a862`;
  Georgia headings, Inter body.

## Routes (23 pages, live)

`/`, `/about/`, `/missions/`, `/missions/local-family-care/`, `/missions/community-water/`, `/missions/ministry-strengthening/`,
`/impact/`, `/give/`, `/get-involved/`, **`/pray/`**, `/privacy/`, `/404` — each mirrored under `/es/…` (except 404).
Nav: Missions · Impact · About · **Pray** · Get involved + **Give now** button + EN/ES switch (ES: Misiones · Impacto · Nosotros · **Orar** · Participa).
Footer Explore: Missions · Impact · About · Pray · Privacy.

## URLs, localization

- **Trailing slashes (decision 2026-09-15, `cdffe7a`):** `trailingSlash: 'always'`. `localizedPath()` returns `/about/`,
  `/es/about/` (keeps `#fragment`); BaseLayout builds canonical/hreflang with the slash; the sitemap follows. Every generated URL
  is the 200 URL Nginx serves (`/about/`); slash-less URLs keep 301-ing to it. No Nginx change.
- One localization architecture: strings in `ui.ts`, bilingual fields in data files, `localizedPath()`.
  **Spanish URLs reuse English slugs** (`/es/pray/`, not `/es/orar`). Spanish copy uses *tú*.

## Domain, SEO

- Canonical domain **`https://garden-ministries.org`** (apex) from `SITE_URL`. www is served by the same Nginx block, not redirected.
- JSON-LD (`BaseLayout`): `NGO`, `addressRegion: ID`, `addressCountry: US` only. The mailing address is **not** in structured data.

## Pray With Us (`/pray/`, `/es/pray/`)

**Pray With Us is an informational ministry-content page explaining how supporters can pray for the work Garden Ministries is
doing. It is not a prayer-request submission platform and has no prayer-management workflow.** No forms, mailto links,
submission buttons, database, notifications or user-generated content. Individual prayer points carry no donation CTAs.

- Structure: `PageHero` → intro band ("Updated September 2026", intro, in-page links, `shared-meal` photo) → three sections
  (anchors = mission slugs: `#local-family-care`, `#community-water`, `#ministry-strengthening`), each: mission icon/tone,
  heading, what Garden does + how to pray, "Learn about this mission", prayer points as a plain list → quiet closing
  ("Pray. Connect. Give." / "Ora. Participa. Dona." with Get involved + Give).
- Content source of truth: `src/data/prayer.ts` (sections and prayer points, `prayerUpdated`) + `ui.ts` `pray`. To update:
  edit those files when Garden provides new information, then build, check, deploy. No CMS.
- Local Family Care stays Idaho-focused; the Venezuela earthquake prayer lives under Community Water & Relief (owner decision).
- Scripture: Isaiah 40:31 once, KJV (EN) / RVR1960 (ES).
- Links in: primary nav, footer, Get Involved "Pray" card, "Pray for this mission" on each mission page (`/pray/#<slug>`).
- Images: `src/assets/pray/shared-meal.jpg` (from owner batch `Fotos/info/a.jpg`) in the intro; the Community Water section
  reuses the existing mission photo (desktop only). `c.jpg` not used (one family photo is enough). Alt text describes only what is visible.

## About

"The people behind Garden" replaces the former "History with room to grow" section: `src/assets/about/founders.jpg`
(from owner-provided `IMG_8418.png`, 1280×960, a clearer digital copy of the same portrait; it replaced the earlier
photo-of-a-print `IMG_8207.jpeg` on 2026-09-15, live since 19:57Z; shown ≤ 36 rem wide) with caption "The founders of Garden Ministries", short text
(formed in Idaho in 2006 by its founders; relationships of trust), legal line, and `founders-family.jpg` (from `IMG_2511.jpeg`)
full width, caption "The founders with their family". No names, titles or roles. Replacing a photo = replacing the asset file.

## Testimonies (Home)

- `TestimoniesSection` ("Testimonies / In their own words.") after Missions on `/` and `/es/`; data in `src/data/testimonies.ts`.
- Poster-first: an optimized poster `<Image>` inside a link to the MP4. JS swaps it for `<video controls playsinline>` on
  activation and plays; one testimony plays at a time; focus moves to the video. **No video bytes before the visitor acts**
  (verified with a server request log). Without JS the link opens the MP4. No autoplay on load.
- Accessible names "Play testimony N of 3 (m:ss)"; no names, quotes, locations or mission links (none provided).
- Optional fields (owner-provided only): `name`, `summary`, `captions` (WebVTT per language), `missionSlug`.
- Layout: swipeable row on small screens; auto-fit grid from `md`. A fourth entry needs only data + files, no component change.

| Published (in repo) | Source | Output | Size |
|---|---|---|---|
| `testimony-884e95be-v1.mp4` | `884e95be….mov` HEVC 464×832, 5.04 MB | H.264 464×832, ~900 kbps, 31.5 s | 3.97 MB |
| `testimony-img2294-v1.mp4` | `IMG_2294.MOV` HEVC HLG HDR 1080×1920, 20.69 MB | H.264 SDR 720×1280, ~1.8 Mbps, 18.4 s | 4.48 MB |
| `testimony-beefae6d-v1.mp4` | `beefae6d….mov` HEVC 464×832, 9.62 MB | H.264 464×832, ~900 kbps, 58.9 s | 7.38 MB |
| **Pending:** `ce85921e….mov` | landscape, visible InShot watermark | not published until a clean original exists | — |

All: H.264 High, BT.709 SDR, AAC 96 kbps stereo, fast start (`moov` before `mdat`), no upscaling, originals in `Fotos/testimonials/`
untouched. Posters are frames from the encodes (`src/assets/testimonies/`). Captions/transcripts: none yet.

## Other media

- Hero carousel: 4 well-project images. `public/videos/community-water-well.mp4` (H.264 360×640, 2.4 Mbps, 12.5 MB) on
  `/missions/community-water/` — well-construction footage, not a testimony.

## Giving, contact

- `/give/` + `/es/give/`: live **Zeffy** embed (`ZeffyDonationForm`, form `/embed/donation-form/give-act-see-the-impact`,
  loader `https://www.zeffy.com/embed/v2/zeffy-embed.js`). Embed markup in `main` is byte-identical to production.
- **Mailing address** (source `src/data/organization.ts`): Garden Ministries / 179 S Ten Mile Rd. Ste. 120 / PMB #150 /
  Meridian, ID 83642. Shown in `<address>` with label "Mailing address" / "Dirección postal" and note "For mail only — not a
  visitor location." / "Solo para correspondencia; no es una oficina abierta al público." on `/get-involved/` (EN/ES, in the
  contact panel) and in the footer "Connect" column, which no longer shows the "Idaho, USA" map pin.
- `/get-involved/` "Start a conversation" form is a **placeholder**: no action/method and no backend; its script fakes a success
  message; without JavaScript it submits a GET that puts name/email/message in the URL. See `CONTACT-FORM-AUDIT.md`. No email or phone published.

## Source material authority (owner decisions, 2026-09-15)

Hierarchy: current explicit owner instruction → current owner-provided material → this documentation → older reference
documents. Absence of a fact in an older document is not a contradiction. Authorization to publish is not authorization to
invent names, titles, roles, relationships, locations, quotes or mission links.

| Material (outside the repo, `Fotos/`) | Status | Used |
|---|---|---|
| `Owners and family ` (trailing space) | Founders and family; **authorized for public use**, minors included. No names/roles provided. | About |
| `testimonials/` (4 videos) | Authentic Garden-exclusive testimonies, **authorized**. No names, language, transcripts or mission links provided. | Home (3); `ce85921e` pending |
| `info/` (Prayer Requests, Connect card, banner, photos) | **Verified owner-provided source** for this expansion. | /pray (content, `a.jpg`), mailing address |
| `house churches country v/` | Not in the 2026-09-15 authorization; 2026-09-02 withheld decision stands. | — |
| `Generadas IA/` | AI images, rejected. | — |

Isrrael's phone, personal email, title or name from the Connect graphic are **not** authorized for publication.

## Testing expectations

- Every change: `npm run check`, `npm run build`, targeted EN + ES checks of the pages touched.
- Before any deploy: clean-clone build of the SHA; full regression (all routes EN/ES, language switch, canonical/hreflang/
  sitemap, internal links, Zeffy on `/give/` + `/es/give/`, mobile nav, 390/768/1280 px on changed pages, Lighthouse mobile
  on changed pages, no console errors).
- After deploy: manifest match + HTTP checks per `DEPLOY.md`, plus a visual check of the Zeffy form (it does not render on
  `127.0.0.1`, so it can only be seen on the real domain).

## Known issues

1. **Browser cache after deploys:** with no `Cache-Control` headers, a returning visitor's browser may show pre-release HTML for a while (observed during verification; a reload with a query string showed the new page). See 7.
2. **Spanish mobile header overflow** (~19 px at ≤ 390 px: "Donar ahora" pushes the menu button off-screen). Pre-existing — header unchanged since the baseline. Accepted follow-up, not part of content round 1.
3. **Testimonies have no captions/transcripts** (WCAG 1.2.2 gap) — need owner-provided transcripts or human transcription.
4. `ce85921e` testimony pending a clean original (watermark).
5. **Verification caveat:** Chrome automation tabs can report `visibilityState: hidden`; Chrome then defers lazy images and video loading. Poster and playback checks need a visible tab.
6. **www is not redirected** to the apex (one Nginx server block). Fix needs root (separate change).
7. **No `Cache-Control`/`Expires`** (ETag/Last-Modified work). Safe later (root, `nginx -t`, reload, separately authorized):
   `/_astro/` `public, max-age=31536000, immutable`; `/videos/` long max-age is safe for `-vN` versioned files
   (`community-water-well.mp4` is not versioned). `add_header` in a `location` replaces inherited headers.
8. Nginx serves its default 404 page (no `error_page`); the Astro 404 page links to non-existent `/404/` and `/es/404/`.
9. `/missions/` heading order jumps h1 → h3 (MissionCard titles) — pre-existing.
10. `community-water-well.mp4` heavier than needed (≈3 MB achievable); its poster is unoptimized.
11. `/get-involved/` form shows a false success and, without JavaScript, leaks its fields into the URL, browser history and the
    Nginx access log. Audit and recommended fix: `CONTACT-FORM-AUDIT.md` (not implemented).
