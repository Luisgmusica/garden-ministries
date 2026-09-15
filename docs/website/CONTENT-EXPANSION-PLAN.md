# Content expansion — round 1 (Pray With Us, mailing address, founders, testimonies)

Status 2026-09-15: **live in production and verified** (`580a2dc` deployed 19:25–19:29Z; founders photo update `73daed0` at 19:57Z). Architecture as built: `CURRENT-STATE.md`.
The code is the source of truth for copy: `src/data/prayer.ts`, `src/i18n/ui.ts` (`pray`, `about`, `home`, `mailingAddress`),
`src/data/testimonies.ts`, `src/data/organization.ts`. This file keeps decisions, editorial rationale and remaining work.

## 1. Decisions (owner, 2026-09-15)

- **Purpose of Pray With Us:** Pray With Us is an informational ministry-content page explaining how supporters can pray for
  the work Garden Ministries is doing. It is not a prayer-request submission platform and has no prayer-management workflow —
  no forms, mailto links, submission buttons, database, notifications or user-generated content. Content is editorial and
  updated when Garden provides new information. Test for every item: "Does this help someone understand how to pray for
  something Garden Ministries is doing?" The owner's "Prayer Requests" material is read as "ways to pray for what Garden is
  doing". Prayer points never end in donation CTAs; the page stands on its own.
- Routes `/pray/` and `/es/pray/` (no `/es/orar`). Nav order About → Pray → Get involved → Give now.
- Categories: Local Family Care · Community Water & Relief · Strengthening Those Who Serve in the Ministry.
- The June 24, 2026 Venezuela earthquake prayer belongs to Community Water & Relief; Local Family Care stays Idaho-focused.
- Scripture: KJV (EN), Reina-Valera 1960 (ES); Isaiah 40:31 used once, in context.
- Testimonies on Home, no forced mission associations; three suitable videos now; `ce85921e` (InShot watermark) left out until a
  clean original exists; architecture must accept a fourth without redesign.
- Food photos `a.jpg` and `c.jpg` approved "where appropriate", without overloading /pray.
- Founders/family photos approved; neutral captions when names/roles are not in the sources.
- Mailing address exactly: Garden Ministries / 179 S Ten Mile Rd. Ste. 120 / PMB #150 / Meridian, ID 83642; label
  "Mailing address" / "Dirección postal"; mail only; not in structured data.
- Isrrael's direct contact details not published.

## 2. Done

| Item | Where | Commit |
|---|---|---|
| Trailing-slash canonicalization (prerequisite) | `astro.config.mjs`, `locales.ts`, `BaseLayout.astro` | `cdffe7a` |
| Media: 3 testimony encodes, posters, founders/family, shared-meal photo, encoder script | `public/videos/testimonies/`, `src/assets/{testimonies,about,pray}/`, `scripts/media/` | `2a4ec50` |
| `/pray/` + `/es/pray/` | `PrayTemplate.astro`, `pages/pray.astro`, `pages/es/pray.astro`, `data/prayer.ts`, `ui.ts pray` | `5c71ce4` |
| Nav + footer Pray/Orar | `ui.ts nav`, `footer.exploreLinks` | `5c71ce4` |
| Mission → prayer links ("Pray for this mission" → `/pray/#<slug>`) | `MissionDetailTemplate.astro`, `ui.ts missionDetail.pray` | `5c71ce4` |
| Get Involved "Pray" card → `/pray/` | `GetInvolvedTemplate.astro`, `ui.ts getInvolved.options` | `5c71ce4` |
| Mailing address (Get Involved EN/ES + footer) | `data/organization.ts`, `Footer.astro`, `GetInvolvedTemplate.astro`, `ui.ts mailingAddress` | `5c71ce4` |
| About founders and family | `AboutTemplate.astro`, `ui.ts about.people*` | `5c71ce4` |
| Home testimonies | `TestimoniesSection.astro`, `TestimonyVideo.astro`, `data/testimonies.ts`, `HomeTemplate.astro` | `5c71ce4` |

Implementation choices worth remembering:
- /pray section intros state what Garden does in that area (wording grounded in the existing mission pages) and then how to pray.
- /pray uses one owner photo (`a.jpg`, intro band). `c.jpg` was not used, to keep photography from dominating; the Water
  section reuses the existing mission photo on desktop only. No image claims a place or program.
- Home testimonies copy: "In their own words." — "These testimonies were recorded for Garden and are shared here as they were given."
- About text states only: formed in Idaho in 2006 by its founders to take Christ's message of hope to all people; grows through
  relationships of trust. The former "biographies pending verification" paragraph was removed with that section.

## 3. Editorial notes (owner "Prayer Requests" source → site)

| Source item | Change | Why |
|---|---|---|
| 1.1 earthquakes | Moved to Community Water & Relief; date/place kept; closing line of comfort | Owner decision; prayer completed |
| 1.2 financial strain | Near-verbatim ("immediate" → "timely") | — |
| 1.3 food programs | Verbatim ("kids" → "children") | Owner-verified as Garden's programs |
| 2.1 wells | "viable aquifers… well-drilling projects" → "underground water sources… wells to be completed" | Plain language |
| 2.2 waterborne illness | Disease names and "eradication" removed; protection, healing, clean water, sanitation | Prayer, not a clinical/impact claim |
| 2.3 education | "freed… break the cycle of poverty" → "more time to learn and grow" | No measured-outcome claim |
| 2.4 access | "bureaucratic delays" → "delays"; "relief trucks" → "relief" | Same substance |
| 2.5 displaced | "swift, abundant" → "without delay" | — |
| 2.6 infrastructure | Prayer for communities rebuilding and those doing the work | Not a claim that Garden repairs infrastructure |
| 3.1 | "supernatural energy" → "strength only He can give"; Isaiah 40:31 quoted exactly | KJV / RVR1960 |
| 3.2–3.3 | "counselling needs" → "the counsel they offer"; ES "temor a los hombres" | Natural phrasing |
| 3.4 "glass house" | → "live under constant attention" / "bajo la mirada constante de los demás" | Idiom made plain |
| Page wording | "Prayer requests updated…" → "Updated September 2026"; data model `PrayerPoint`/`points` | Not a request platform |

Spanish section titles reuse the mission titles (`Apoyo a familias locales`, `Agua y ayuda comunitaria`); section 3 uses the
owner's longer heading (`Fortalecer a quienes sirven en el ministerio`).

## 4. Remaining

1. ~~Release~~ — done 2026-09-15 (see `CHANGELOG.md`).
2. ~~Push to GitHub~~ — done (`origin/main` = `73daed0`).
3. **Testimony captions/transcripts** (per video: spoken language, transcript, EN/ES captions). Add `.vtt` files under
   `public/videos/testimonies/` and set `captions` in `testimonies.ts`. Optional owner-provided `name`, `summary`, `missionSlug`.
4. **Fourth testimony (`ce85921e`):** when a clean original exists — encode with `scripts/media/encode-video.swift`
   (`… 960 900` for a landscape source), take a poster frame, add an entry to `testimonies.ts`. No component change.
5. **Founders:** clearer owner photo `IMG_8418.png` is live (2026-09-15). Names/roles only if the owner provides them.
6. **Prayer content upkeep:** edit `src/data/prayer.ts` (and `prayerUpdated`) when Garden shares new work to pray for.
7. Not in this round: Spanish mobile header overflow at ≤ 390 px (accepted follow-up), www redirect, Cache-Control, custom 404 in Nginx, `/missions/` heading order, re-encoding
   `community-water-well.mp4`, contact form replacement (see `CURRENT-STATE.md` known issues, `CONTACT-INFO-PROPOSAL.md`).
