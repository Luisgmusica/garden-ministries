# Content expansion plan — Pray, mailing address, testimonies, founders (prepared, not implemented)

Status 2026-09-15: architecture and copy drafts prepared for review. Nothing here is in the repo or in production.
Implementation needs explicit authorization after the copy is reviewed. Source authority: `CURRENT-STATE.md`.

## 1. Approved decisions

- **Purpose of Pray With Us (owner decision 2026-09-15):** Pray With Us is an informational ministry-content page explaining how
  supporters can pray for the work Garden Ministries is doing. It is not a prayer-request submission platform and has no
  prayer-management workflow — no forms, no mailto links, no submission buttons, no database, no notifications, no user-generated
  content. Content is editorial (`src/data/prayer.ts`), updated when Garden provides new information. Test for every item:
  "Does this help someone understand how to pray for something Garden Ministries is doing?" The owner's "Prayer Requests"
  material is read as "ways to pray for what Garden is doing". Individual prayer points never end in donation CTAs.
- `/pray` (EN) and `/es/pray` (ES). No `/es/orar`; English-slug convention stays.
- Primary nav: Missions · Impact · About · **Pray / Orar** · Get involved · [Give now].
- Mailing address on `/get-involved`, `/es/get-involved`, footer. Labelled as a mailing address; never a visitor location;
  not in structured data.
- Prayer Requests graphic (`Fotos/info/bc048da3….jpeg`) is verified owner content. Categories: Local Family Care ·
  Community Water & Relief · Strengthening Those Who Serve in the Ministry.
- Testimonies and founder/family photos are authorized for publication; identities/quotes/roles/mission links come only from the owner.
- Isrrael's direct contact details are not published.

## 2. Source architecture

| File | Change |
|---|---|
| `astro.config.mjs`, `src/i18n/locales.ts`, `src/layouts/BaseLayout.astro` | Trailing-slash fix first (CURRENT-STATE known issue 1) |
| `src/data/prayer.ts` **new** | `prayerUpdated = '2026-09'` (formatted per locale with `Intl.DateTimeFormat`) and `prayerCategories: PrayerCategory[]` |
| `src/data/organization.ts` **new** | `mailingAddress` lines (single source, not translated) |
| `src/data/testimonies.ts` **new** (empty until media is final) | typed entries, optional owner-provided fields |
| `src/components/TestimonyVideo.astro` **new** | click-to-play facade (section 8) |
| `src/templates/PrayTemplate.astro` **new** + `src/pages/pray.astro` + `src/pages/es/pray.astro` | the page |
| `src/i18n/ui.ts` | `nav` (+Pray), `footer.exploreLinks` (+Pray), `footer.mailingAddress`, `getInvolved.mailingAddress`/`mailingNote`, `getInvolved.options` (+href), `missionDetail.pray`, new `pray` block, later `about.people` |
| `src/components/Footer.astro` | address block replaces "Idaho, USA" line |
| `src/templates/GetInvolvedTemplate.astro` | address block; option cards with `href` render as links |
| `src/templates/MissionDetailTemplate.astro` | "Pray for this mission" link → `/pray/#<mission.slug>` |
| `src/templates/AboutTemplate.astro` | founders section (section 9) |

```ts
// src/data/prayer.ts (shape)
import type { ImageMetadata } from 'astro';
import type { Mission } from '@/data/missions';
type L = { en: string; es: string };
export type PrayerRequest = { title: L; text: L };
export type PrayerCategory = {
  id: Mission['slug'];            // section anchor = mission slug → mission pages link to /pray/#<slug>
  icon: Mission['icon']; tone: Mission['tone'];
  title: L; intro: L; requests: PrayerRequest[];
  image?: ImageMetadata; imageAlt?: L;
};
```

The Header needs no code change: it renders `ui.ts nav`. Verify the 5-item desktop nav at 1024 px in both languages.

## 3. `/pray` page structure

1. `BaseLayout` (`path="/pray"`) → canonical, hreflang, sitemap automatic.
2. `PageHero` — eyebrow, title, description.
3. Intro band (white): "updated" line (small clay uppercase), one intro paragraph, three plain in-page links to the sections.
4. Three sections, alternating white/cream, `id` = mission slug, `scroll-mt-24` (sticky header). Desktop grid `[.8fr_1.2fr]`:
   left = icon tile in the mission tone, `h2`, intro, "Learn about this mission →", optional photo; right = requests as a list:
   `h3` (Georgia, text-xl) + paragraph, separated by `border-t border-forest/10`. No cards, no numbered circles, no donation CTA.
5. Closing band (forest): "Pray. Connect. Give." + short text + `Get involved` (cream button) and `Give` (outline).
6. Zero JavaScript. No form and no way to submit prayer needs of any kind (see Purpose in section 1).

Images: Local Family Care — `Fotos/info/a.jpg` (primary) and optionally `c.jpg`; Community Water & Relief — existing well
asset (`src/assets/mission-community-water.jpg` or `hero-well-2.jpg`); Strengthening Those Who Serve — text only (no image in
the authorized batch). `d.jpg` not recommended on editorial grounds (head bowed over a plate reads as need rather than
dignity); `B.jpg` (meal trays) optional. Alt text describes only what is visible — no location or program claims
(e.g. "A man smiles and raises a cup during a shared meal at an outdoor table").

## 4. Prayer copy — English draft

**Eyebrow:** Pray with us
**Title:** Join us in prayer for families, communities, and those who serve.
**Description:** Supporting Garden Ministries is not only about giving. You can stand with the people and ministries we serve by bringing these needs before God.
**Updated:** Prayer requests updated September 2026
**Section link:** Learn about this mission

### Local Family Care
*For families carrying grief, financial strain, and everyday needs.*

- **Families in grief** — Pray for families walking through the painful loss of a spouse, child, or close relative during the back-to-back earthquakes of June 24, 2026, in Venezuela. Ask God to comfort them and surround them with care.
- **Families under financial strain** — Intercede for families burdened by unemployment, unexpected medical bills, or poverty. Pray for timely provision, wisdom with finances, and new doors of opportunity.
- **Our food programs** — Pray for our food programs, so children can keep receiving a meal before they go to school.

### Community Water & Relief
*For communities without safe water and for people facing disaster.*

- **Safe water** — Pray for communities living with chronic water scarcity, drought, or contaminated supplies. Ask God to reveal underground water sources and open doors for wells to be completed.
- **Protection and healing** — Pray for children and families exposed to illness from unsafe water. Ask God for protection, healing, and access to clean water and sanitation.
- **Time to learn** — Pray that as clean water comes closer to home, children—especially girls who spend long hours gathering water—would have more time to learn and grow.
- **Safe passage for relief** — During natural disasters, conflict, or severe drought, pray for access to cut-off areas: that roads would open, delays would clear, and relief would travel safely.
- **Families who have lost their homes** — Pray for displaced families to receive clean drinking water, food, safe shelter, and medical care without delay.
- **Rebuilding** — Pray for communities rebuilding after disaster, and for the people, resources, and skills needed to restore damaged water systems and community infrastructure.

### Strengthening Those Who Serve in the Ministry
*For pastors, leaders, and ministry workers who carry the needs of others.*

- **Renewed strength** — Pray that God replaces weariness and burnout with strength only He can give, as promised in Isaiah 40:31: “they shall run, and not be weary; and they shall walk, and not faint.”
- **Wisdom in leadership** — Ask God to give clear direction for daily decisions, administrative challenges, and the counsel they offer others.
- **Courage and pure motives** — Pray that they speak the truth without fear of others or pressure from culture, keeping their eyes on Christ rather than on personal recognition.
- **Marriages and families** — Pray for protection over the marriages and families of those in ministry, who often live under constant attention, and for realistic expectations from their congregations.

**Closing title:** Pray. Connect. Give.
**Closing text:** For many people, prayer is the first step. Whenever you are ready, there are other ways to walk alongside Garden Ministries.
**Buttons:** Get involved · Give

## 5. Prayer copy — Spanish draft

**Eyebrow:** Ora con nosotros
**Title:** Acompáñanos en oración por las familias, las comunidades y quienes sirven.
**Description:** Apoyar a Garden Ministries no se trata solo de dar. También puedes acompañar a las personas y a los ministerios que servimos presentando estas necesidades delante de Dios.
**Updated:** Peticiones de oración actualizadas en septiembre de 2026
**Section link:** Conoce esta misión

### Apoyo a familias locales
*Por las familias que atraviesan el duelo, la estrechez económica y las necesidades de cada día.*

- **Familias en duelo** — Oremos por las familias que atraviesan el dolor de haber perdido a su esposo o esposa, a un hijo o a un ser querido en los terremotos consecutivos del 24 de junio de 2026 en Venezuela. Pidamos a Dios que las consuele y las rodee de cuidado.
- **Familias en dificultad económica** — Intercedamos por las familias agobiadas por el desempleo, gastos médicos inesperados o la pobreza. Oremos por provisión oportuna, sabiduría para administrar sus recursos y nuevas puertas de oportunidad.
- **Nuestros programas de alimentación** — Oremos por nuestros programas de alimentación, para que los niños sigan recibiendo una comida antes de ir a la escuela.

### Agua y ayuda comunitaria
*Por las comunidades sin agua segura y por quienes enfrentan desastres.*

- **Agua segura** — Oremos por las comunidades que sufren escasez crónica de agua, sequía o fuentes contaminadas. Pidamos a Dios que revele fuentes de agua subterránea y abra puertas para que se completen los pozos.
- **Protección y sanidad** — Oremos por los niños y las familias expuestos a enfermedades por el agua insalubre. Pidamos a Dios protección, sanidad y acceso a agua limpia y saneamiento.
- **Tiempo para aprender** — Oremos para que, a medida que el agua limpia llegue más cerca de casa, los niños —especialmente las niñas que pasan largas horas acarreando agua— tengan más tiempo para aprender y crecer.
- **Paso seguro para la ayuda** — En medio de desastres naturales, conflictos o sequías severas, oremos por acceso a las zonas incomunicadas: que se abran los caminos, se superen los retrasos y la ayuda llegue con seguridad.
- **Familias que perdieron su hogar** — Oremos por las familias desplazadas, para que reciban pronto agua potable, alimento, un refugio seguro y atención médica.
- **Reconstrucción** — Oremos por las comunidades que se reconstruyen después de un desastre, y por las personas, los recursos y la capacidad necesarios para restaurar sus sistemas de agua y su infraestructura comunitaria.

### Fortalecer a quienes sirven en el ministerio
*Por pastores, líderes y servidores que cargan con las necesidades de otros.*

- **Fuerzas renovadas** — Oremos para que Dios cambie el cansancio y el agotamiento por las fuerzas que solo Él puede dar, como lo promete en Isaías 40:31: «correrán, y no se cansarán; caminarán, y no se fatigarán».
- **Sabiduría para liderar** — Pidamos a Dios dirección clara para las decisiones diarias, los retos administrativos y el consejo que brindan a otros.
- **Valentía y motivaciones puras** — Oremos para que hablen la verdad sin temor a los hombres ni a la presión de la cultura, con los ojos puestos en Cristo y no en el reconocimiento personal.
- **Matrimonios y familias** — Oremos por protección sobre los matrimonios y las familias de quienes sirven en el ministerio, que muchas veces viven bajo la mirada constante de los demás, y por expectativas realistas de parte de sus congregaciones.

**Closing title:** Ora. Participa. Dona.
**Closing text:** Para muchas personas, la oración es el primer paso. Cuando quieras dar un paso más, hay otras formas de caminar junto a Garden Ministries.
**Buttons:** Participa · Donar

## 6. Editorial notes (owner source → draft)

| Source item | Change | Why |
|---|---|---|
| 1.1 earthquakes | Kept date, place, wording; added a closing line of comfort | Owner fact kept; prayer completed |
| 1.2 | Near-verbatim ("immediate" → "timely") | — |
| 1.3 food programs | Verbatim ("kids" → "children") | Owner-verified that these are Garden's programs |
| 2.1 wells | "viable aquifers… well-drilling projects" → "underground water sources… wells to be completed" | Plain language; not tied to one drilling method |
| 2.2 waterborne illness | Disease names and "eradication" removed; prayer for protection, healing, clean water, sanitation | Prayer, not a clinical/impact claim |
| 2.3 education | "freed… break the cycle of poverty" → "more time to learn and grow" | No measured-outcome claim |
| 2.4 access | "bureaucratic delays" → "delays"; "relief trucks" → "relief" | Softer, same substance |
| 2.5 displaced | "swift, abundant" → "without delay" | — |
| 2.6 infrastructure | Prayer for communities rebuilding and those doing the work | Not a claim that Garden repairs infrastructure |
| 3.1 | "supernatural energy" → "strength only He can give"; Isaiah 40:31 quoted (EN: KJV; ES: Reina-Valera, same wording in 1909 and 1960) | Scripture quoted exactly |
| 3.2–3.3 | "counselling needs" → "the counsel they offer"; "fear of man" kept in ES as "temor a los hombres" | Natural phrasing |
| 3.4 "glass house" | → "live under constant attention" / "bajo la mirada constante de los demás" | Idiom made plain |

Spanish uses the existing mission titles for sections 1–2 (`Apoyo a familias locales`, `Agua y ayuda comunitaria`) so the page
and the mission links read as one vocabulary; section 3 uses the owner's longer heading.

## 7. Mailing address

```ts
// src/data/organization.ts
export const mailingAddress = ['Garden Ministries', '179 S Ten Mile Rd. Ste. 120', 'PMB #150', 'Meridian, ID 83642'] as const;
```
(Street line from the owner's Connect card; the chat instruction arrived truncated but matches it.)

- Labels: EN "Mailing address" / ES "Dirección postal". Note on `/get-involved`: EN "For mail only — not a visitor location." /
  ES "Solo para correspondencia; no es una oficina abierta al público."
- `/get-involved` + `/es/get-involved`: inside the forest contact panel, below the form, after `border-t border-cream/12 pt-6`:
  label (small uppercase), `<address class="not-italic">` lines, note. Stays when the placeholder form is replaced (contact proposal).
- Footer "Connect" column: replaces the `map-pin` "Idaho, USA" line with label + `<address>` (no map-pin icon — it implies a place to visit). "Contact Garden" link stays.
- JSON-LD unchanged.

## 8. Testimonies — media architecture

Test encodes 2026-09-15 (AVFoundation via a Swift script; session scratch only; originals untouched):
H.264 High, fast-start MP4, SDR BT.709 (HLG tone-mapped for `IMG_2294`, frames visually checked), AAC 96 kbps stereo, keyframe ≤ 2 s.

| Source | Source size | Output | Output size |
|---|---|---|---|
| `884e95be….mov` 31.5 s, HEVC 464×832 | 5.04 MB | 464×832, 900 kbps | 3.96 MB |
| `IMG_2294.MOV` 18.4 s, HEVC HDR 1080×1920 | 20.69 MB | 720×1280, 1.8 Mbps | 4.48 MB |
| `beefae6d….mov` 58.9 s, HEVC 464×832 | 9.62 MB | 464×832, 900 kbps | 7.38 MB |
| `ce85921e….mov` 18.4 s, landscape, InShot watermark | 3.06 MB | **pending** until an original without watermark exists | — |

Implementation (when authorized):
- Encoder kept in the repo as `scripts/media/encode-video.swift` (no npm dependency; macOS only) with the settings above.
  No loudness normalization in this path — check levels by ear.
- Files: `public/videos/testimonies/<id>-v1.mp4` (versioned names allow long caching later); posters hand-picked frames →
  `src/assets/testimonies/<id>-poster.jpg` (optimized by `astro:assets`); captions `public/videos/testimonies/<id>.<lang>.vtt`.
- `TestimonyVideo.astro`: optimized poster `<Image>` + play button (accessible name); on click inject
  `<video controls autoplay playsinline>` with the source and caption tracks; playing one pauses others; no JS → link to the MP4.
  Zero video bytes before intent; no autoplay on load.
- `testimonies.ts` entry: `id`, `src`, `poster`, `width`, `height`, `durationSec`, and **optional, owner-provided only**:
  `name`, `spokenLanguage`, `summary {en, es}`, `captions {en?, es?}`, `missionSlug`.
- Placement: no mission association is known, so not on mission pages. Proposed: a neutral "Testimonies / Testimonios" section
  on the Home page (after Missions). Mission-page placement only when the owner links a testimony to a mission.
- Transcripts/captions: **pending** (no reliable transcription available; none will be invented). Captions are needed for
  accessibility (WCAG 1.2.2) — owner-provided transcripts, human transcription, or a local speech-to-text tool are the options.

## 9. Founders and family — About

- Replace "History with room to grow" (its copy says bios are pending) with a founders section:
  `IMG_8207.jpeg` primary (two-column with short text), `IMG_2511.jpeg` full-width below.
  `IMG_8207` is a phone photo of a printed photo (soft focus, glare lower-left): fine at modest width (≤ 560 px);
  an original digital file would look better.
- Captions supported by the owner instruction: EN "The founders of Garden Ministries" / "The founders with their family";
  ES "Los fundadores de Garden Ministries" / "Los fundadores junto a su familia".
- Not stated without owner confirmation: which person is who, names on the photos, titles ("Pastor"), roles, family members' names.
  (The 2006 Form 1023 names directors Gail L. Graves and Joyce A. Graves, married; linking those names to these photos needs the owner.)
- Assets: `src/assets/about/founders.jpg`, `src/assets/about/founders-family.jpg`; copy in `ui.ts about.people`.

## 10. Other links

- Mission pages: third CTA link "Pray for this mission" / "Ora por esta misión" → `/pray/#<slug>`.
- Get Involved: "Pray" card links to `/pray`; text EN "Pray through current needs connected with Garden's service." /
  ES "Ora por las necesidades actuales relacionadas con el servicio de Garden."
- Footer Explore: + Pray / Orar.

## 11. Open owner decisions

1. **Genuine conflict:** request 1.1 (Venezuela earthquakes) sits under *Local Family Care*, whose mission page says
   "Idaho communities". Keep it there and broaden that mission's service-area wording, or move 1.1 to Community Water & Relief?
2. Where testimonies appear (Home proposed) and, per video: name to show (if any), language, transcript, mission link.
3. Whether `Fotos/info/a.jpg` / `c.jpg` should illustrate the food-programs section (alt text will not claim place or program).
4. Names/captions on founder photos beyond "founders" / "their family"; original of `IMG_8207` if available.
5. Bible version preference (drafts: KJV / Reina-Valera).
6. Whether to push `76e3181` to GitHub (access from this Mac currently fails).

## 12. Implementation sequence (after authorization)

1. Trailing-slash fix → build → verify canonical/hreflang/sitemap/links.
2. `organization.ts` + address in footer and Get Involved.
3. `prayer.ts`, `PrayTemplate`, pages, nav, footer, mission and Get Involved links.
4. Founders section (if captions confirmed).
5. Testimony component + encodes + posters (captions when available).
6. `npm run check`, build, targeted then full pre-deploy regression (CURRENT-STATE), commit.
7. Deploy per `DEPLOY.md` (separately authorized). Update `CURRENT-STATE.md` + `CHANGELOG.md`.
