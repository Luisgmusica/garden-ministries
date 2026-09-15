# Website changelog

Newest first. Times UTC. Reconstructed entries before 2026-09-15 cite their evidence; nothing here is inferred without it.
Mail/server operations: parent project `docs/operations/CHANGELOG.md` (not in this repo).

## 2026-09-15 — content round 1 (in `main`, NOT deployed)

- **Owner decisions:** Venezuela earthquake prayer under Community Water & Relief (Local Family Care stays Idaho-focused);
  Home testimonies with the three suitable videos, `ce85921e` (watermark) pending; `a.jpg`/`c.jpg` approved for /pray; founders
  photos approved with neutral captions; Scripture KJV / RVR1960; mailing address exact text and label. **Pray With Us is an
  informational ministry-content page explaining how supporters can pray for the work Garden Ministries is doing. It is not a
  prayer-request submission platform and has no prayer-management workflow.**
- `7495897` Docs versioned with the site (see entry below). `9031916` Pray purpose recorded in the plan before implementation.
- `cdffe7a` **Trailing-slash canonicalization:** `trailingSlash: 'always'`, `localizedPath()` and BaseLayout emit `/`-terminated
  URLs. Verified: canonical, hreflang, sitemap and all internal links point at 200 URLs (0 slash-less). Repo-only.
- `2a4ec50` **Media:** 3 testimony MP4s (15.8 MB total, from 35.3 MB HEVC sources; H.264/SDR/AAC/fast start via
  `scripts/media/encode-video.swift`), 3 poster frames, founders + family photos, `shared-meal.jpg`. Originals untouched (SHA-256 checked).
- `5c71ce4` **Features:** `/pray/` + `/es/pray/` (`PrayTemplate`, `prayer.ts`); Pray/Orar in nav and footer; mission pages link
  to their prayer section; Get Involved "Pray" card links to /pray/; `organization.ts` mailing address on Get Involved (EN/ES) and
  footer (replaces "Idaho, USA" pin; JSON-LD unchanged); About founders section; Home `TestimoniesSection`/`TestimonyVideo`.
- **Validation:** `npm run check` 0 errors / 0 warnings (1 pre-existing hint); build 23 pages; clean clone of `5c71ce4` byte-identical
  to the validated build (82 files); link check 0 slash-less or broken internal links except the pre-existing 404-page self links;
  static a11y (alt text, one h1, `lang`, unique ids) clean except the pre-existing `/missions/` h1→h3 jump; `/pray/` has 0 forms and
  0 mailto links. Chrome on a local static server with HTTP range support: desktop 1280 (`/pray/`, `/about/`, `/get-involved/`,
  Home), 768 (`/pray/`, Home), 390 via iframes (`/pray/`, Home, `/about/`), ~606 (`/es/pray/`, `/es/get-involved/`, mobile nav
  opened/closed by keyboard); no horizontal overflow. Testimonies: no MP4 request before interaction (server log), mouse click
  plays with sound, a second testimony pauses the first, keyboard Enter plays and focuses the video. Give: Zeffy embed markup
  byte-identical to production, loader present, no console errors (the form does not render on 127.0.0.1; live page showed the
  same embed DOM state). Fixed during validation: Get Involved cards stretching, address label font, closing border width,
  HTML comments shipped in output, sandbox temp copies of the MP4s. Not done: Lighthouse, real iOS/Android devices, screen reader pass.
- **Production untouched:** docroot still 52 files, nothing newer than 2026-09-11; Nginx config unchanged; live `/pray/` 404.
- **Push:** not pushed — `~/.ssh/id_ed25519` is passphrase-protected and not in the agent.

## 2026-09-15

- **Website docs versioned with the site:** `CURRENT-STATE.md`, `CHANGELOG.md`, `DEPLOY.md`, `CONTENT-EXPANSION-PLAN.md`,
  `CONTACT-INFO-PROPOSAL.md` moved from the parent project `docs/website/` (not a git repo) into this repo at `docs/website/`;
  a one-line pointer README remains at the old location. `docs/operations/AI-CONTEXT.md` and `docs/operations/CURRENT-STATE.md`
  (outside any repo) now point here.
- **Owner decision — source authority** recorded in `CURRENT-STATE.md`: `Fotos/Owners and family ` = founders and family,
  authorized for public use (minors included); `Fotos/testimonials/` = authentic Garden-exclusive testimonials, authorized;
  `Fotos/info/` = verified owner-provided source for this expansion. Names/roles/quotes/mission links still must come from the owner.
  Other decisions: `/pray` + `/es/pray` (no `/es/orar`); nav About → Pray → Get involved → Give now; mailing address authorized
  (not as a visitor location, not in structured data); Isrrael's direct contact details not authorized.
- **Baseline commit `76e3181`** (repo `garden-ministries-astro`, not pushed): commits the source that production had been
  running from an uncommitted tree — Zeffy embed (`ZeffyDonationForm.astro`, `GiveTemplate.astro`, give copy in `ui.ts`),
  apex domain (`astro.config.mjs`, `public/robots.txt`), live-giving CTA/footer copy, removal of `?mission=` on mission CTA,
  README domain note. Working-tree classification: 7 files production source; `dist/`, `.astro/`, `node_modules/` build
  output (ignored); `.DS_Store` ignored; nothing uncertain.
- **Verification:** all 52 production files fetched over HTTPS and byte-compared to local `dist/` (0 differences); a clean clone of
  `76e3181` + `npm ci` + `npm run build` reproduces the same 52 files byte-for-byte. Production untouched (read-only SSH/HTTP only).
- **Docs:** created `docs/website/CURRENT-STATE.md`, `CHANGELOG.md`, `DEPLOY.md`, `CONTENT-EXPANSION-PLAN.md`; pointer added in
  `docs/operations/AI-CONTEXT.md`; `garden-ministries-astro/README.md` rewritten to match reality (**uncommitted**, docs only,
  no build effect).
- **Analysis only (not applied):** trailing-slash redirect finding + recommended repo-only fix (trial build in a scratch clone);
  Cache-Control and www findings; `/pray` copy EN/ES drafts and source architecture.
- **Testimonial test encodes** (session scratch directory, not in repo, not deployed; originals untouched): 3 portrait videos to
  H.264/AAC MP4, SDR BT.709 — 15.8 MB total vs 35.3 MB sources. Landscape clip with InShot watermark left pending. Details in
  `CONTENT-EXPANSION-PLAN.md`.

## 2026-09-13

- `docs/website/CONTACT-INFO-PROPOSAL.md` written (publish info@ as public contact). Not applied. (Source: `docs/operations/CHANGELOG.md`.)

## 2026-09-11

- **~02:23Z deploy — canonical domain fix.** `SITE_URL` `https://www.gardenministries.org` → `https://garden-ministries.org`,
  robots.txt sitemap URL. Built locally (file mtimes 02:22:21Z), rsync `--delete` from the Mac. Backup before deploy:
  `/home/garden/backups/garden-site/garden-ministries-20260911-022300-pre-canonical-fix` (52 files; Zeffy present, www canonical).
  Evidence: backup contents, current docroot, prior session commands. Source was uncommitted until `76e3181`.
- **~01:50Z deploy — Zeffy donation embed** replaces the preview giving flow; footer note "Secure giving · EIN 20-5133327".
  Built locally (mtimes 01:49:58Z), dry-run showed no deletions, rsync `--delete`. Backup before deploy:
  `/home/garden/backups/garden-site/garden-ministries-20260911-014803` (52 files = the 2026-09-03 build: preview giving,
  canonical `www.gardenministries.org`).

## 2026-09-03

- Commits `67b1b73` (06:07Z, real well-project hero imagery) and `8f77259` (06:27Z, mobile menu fix).
- Server clone `~/apps/garden-ministries` updated to `8f77259` and built there (dist mtime 06:27:30Z); that build was what
  production served until 2026-09-11 (backup `…-20260911-014803` has identical mtimes). How it was copied into the docroot is not recorded.

## 2026-09-02

- Initial commit `1f8f79b` (20:23Z). `/var/www/garden-ministries` and the Nginx site `garden-ministries.org` created
  (~20:06–20:07Z); server clone at ~20:41Z (`garden` bash history: `git clone`, `npm ci`, `npm run build`).
- Board memo `content-source/board-memo-website-content.html`: real well photos/video in, AI images out, Venezuela field batch withheld.
