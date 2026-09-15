# Website — info@garden-ministries.org as the public organizational contact (proposal, not applied)

Separate from MAIL-ADMIN-04. No website change has been made.

## Current state (2026-09-13, source `garden-ministries-astro/` + live site)

- No email address or `mailto:` is published anywhere on the site (EN or ES).
- Footer contact item ("Contact Garden" / "Contactar a Garden", `components/Footer.astro`) and mission pages
  ("Ask about this Mission") link to `/get-involved`.
- `/get-involved` (`templates/GetInvolvedTemplate.astro`) shows a form (name, email, message). Its script only hides the form
  and shows `g.sent`: "Thank you. The contact connection will be activated before public launch." The intro text says the
  preview stores no personal information. Nothing is sent or stored.
- Strings live in `src/i18n/ui.ts` (`getInvolved.formTitle/formText/email/message/send/sent`, `footer.contact`, mission `contact`).
- The site is static (Nginx serves `/var/www/garden-ministries`); there is no server-side form endpoint.

## Preconditions (mail side)

1. info@ is monitored by named people (it also receives DMARC reports and, after MAIL-ADMIN-04A, postmaster@/abuse@).
2. Preferably MAIL-ADMIN-04A done (aliases) and 04B/04C at least in observation, so replies "as info@" follow the agreed policy.

## Phase 1 — static, low risk (recommended)

- `/get-involved` EN/ES: replace the placeholder form block with a clear contact card:
  "Write to us at info@garden-ministries.org" with a `mailto:info@garden-ministries.org?subject=...` button
  (EN subject "Garden Ministries — Get involved", ES "Garden Ministries — Quiero participar"); keep the four participation options.
- Remove the "preview" wording and the fake success message so no visitor believes a message was submitted.
- Footer contact block: show `info@garden-ministries.org` as a `mailto:` link (keep the link to `/get-involved`).
- Mission pages "Ask about this Mission": `mailto:info@garden-ministries.org?subject=<mission name>` or keep linking to `/get-involved`.
- `/privacy` EN/ES: name info@ as the contact for privacy requests.
- Optional: `Organization.email` / `contactPoint` in the JSON-LD.
- Accept that a published address attracts some spam (normal for an org contact; server-side filtering is a mail topic).

Files touched in Phase 1: `src/i18n/ui.ts`, `src/templates/GetInvolvedTemplate.astro`, `src/components/Footer.astro`,
optionally `src/templates/MissionDetailTemplate.astro`, the privacy template and the JSON-LD in the base layout.
Validation: `npm run build`, check EN/ES pages locally, deploy through the usual site procedure, verify `mailto:` links on the live site.

## Phase 2 — real form (optional, separate design)

> Detailed audit and recommended architecture (2026-09-15): `CONTACT-FORM-AUDIT.md`. It supersedes the outline below.

Only if a form is preferred over `mailto:`:
- (a) Small dedicated endpoint on the Garden server that sends to info@ via local Postfix: honeypot field, per-IP rate limit,
  strict size/field validation, fixed From (a Garden system address) with `Reply-To:` = visitor, no attachments, logging without
  message bodies. Separate service/user; not inside garden-mail-admin. Interacts with MAIL-ADMIN-04E E1/E3 (local submission policy).
- (b) A reputable hosted form service delivering to info@ (review privacy terms; the site's privacy page must mention it).
Never use the visitor's address as the envelope or header sender.

## Decision needed

1. Approve Phase 1 wording (EN/ES) and whether mission pages use `mailto:` or keep `/get-involved`.
2. Whether Phase 2 is wanted, and which option.
