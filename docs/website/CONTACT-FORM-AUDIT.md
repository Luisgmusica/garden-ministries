# "Start a conversation" form — audit and recommended architecture (NOT implemented)

Audit date 2026-09-15. Read-only: no code, server, mail, DNS or third-party changes were made.
Evidence: repo source at `73daed0`, built `dist/`, live HTML/headers of `/get-involved/` and `/es/get-involved/`,
read-only SSH (`ss`, `postconf`, `/etc/postfix/virtual`, Nginx config), `docs/operations/MAIL-ADMIN*.md`, Cloudflare Turnstile docs.

## A. Current implementation (proven from code)

| | Finding |
|---|---|
| Owner | `src/templates/GetInvolvedTemplate.astro` (form ~L55–69, script ~L83–92), rendered by `src/pages/get-involved.astro` and `src/pages/es/get-involved.astro`. Strings: `src/i18n/ui.ts` → `getInvolved.formTitle/formText/name/email/message/send/sent` (EN/ES). |
| Fields | `name` (`type=text`), `email` (`type=email`), `message` (`textarea`). All `required`. No `maxlength`, no `autocomplete`. Labels wrap inputs (accessible names exist). |
| Validation | Browser-native only (`required`, `type=email`). No server exists to validate. |
| Action / method | **None** → HTML default: `GET` to the current page URL. |
| JavaScript | One bundled inline module (identical live and in `dist/`): on `submit` → `preventDefault()`, hide the form, show the "sent" box. **No `fetch`/XHR/`sendBeacon`.** Data never leaves the page. |
| Backend | **None.** Astro static output (no adapter, no API routes); Nginx `try_files` serves files only; `POST /get-involved/` → **405**. No form service in dependencies or markup. |
| Email | **None.** No SMTP, API, recipient, From or Reply-To anywhere. |

**Submission path today**
- With JavaScript: browser → submit handler → message discarded → visitor sees "Thank you…" (a **false success**). Copy still says
  "This preview stores no personal information… will be activated before public launch" although the site is public.
- Without JavaScript (disabled, blocked, or script failed): browser → `GET /get-involved/?name=…&email=…&message=…` → Nginx serves the
  page (200, query ignored). The name, email and message end up in the **URL, browser history and the Nginx access log**
  (`access_log /var/log/nginx/access.log`, default `combined` format includes the request line). Nothing is delivered.
  (Derived from the markup and config; not exercised, to avoid writing test personal data to production logs.)

## B. Current destination
None. Nothing is sent or stored by Garden.

## C. Current security / anti-spam controls
None: no CAPTCHA/Turnstile, honeypot, timing check, JS challenge, server token, rate limit, CSRF/Origin check. Static site
responses carry no security headers (no CSP, `X-Frame-Options`, `Referrer-Policy`); `server_tokens` is on (Nginx version shown).
Because there is no endpoint, there is also no abuse surface today (no email can be triggered).

## D. Vulnerabilities / missing protections
1. **False success** — visitors believe Garden received their message (trust/ministry impact). HIGH (functional).
2. **Personal data in URLs/logs** when JS is unavailable. MEDIUM.
3. For any future endpoint, every control in E–K is missing.
4. **Server mail context (from MAIL-ADMIN-04):** localhost is an unauthenticated relay (S2: `mynetworks` 127.0.0.0/8 →
   any sender, any recipient, DKIM-signed, relayed via IETEL) and local `sendmail` accepts any sender (S3). An endpoint on this
   server would inherit that power: recipient and sender must be hard-coded, and 04E E1/E3 hardening is recommended.

## E. Human verification — recommendation: Cloudflare Turnstile (managed mode) + honeypot

Why Turnstile fits (Cloudflare docs, checked 2026-09-15):
- Works on any site **without** Cloudflare DNS/proxy; no visual puzzles (managed mode shows a checkbox only when risk is high).
- Free plan: up to 20 widgets, 10 hostnames per widget, unlimited challenges. WCAG 2.2 AA stated.
- Server verification: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret`, `response`, optional
  `remoteip`, `idempotency_key`. Tokens are **valid 300 s and single-use** (`timeout-or-duplicate` on reuse), max 2048 chars.
  Docs: "The client-side widget alone does not protect your forms" — validate server-side and check `hostname` and `action`.
- Official test keys work on `localhost` (always-pass / always-fail / forced-interactive / token-already-spent secret);
  production secrets reject dummy tokens.
- Privacy: processes client IP, TLS fingerprint, User-Agent, sitekey/origin; states it does not access form entries.
  Cloudflare is processor for bot detection and **controller** for improving Turnstile → must be disclosed on /privacy/.

Layers: Turnstile (`action: "contact"`, `language` en/es, loaded only on /get-involved/) + hidden honeypot field (filled →
fake success, no send) + server rate limits (F). No time-to-submit check (client-controlled, low value).

Alternatives: **ALTCHA** (open-source, self-hosted proof-of-work, no third party) if the owner prefers no Cloudflare dependency —
more private, weaker against determined bots, needs a challenge endpoint. hCaptcha (more puzzle friction). reCAPTCHA v3
(Google profiling, score tuning) — not recommended.

## F. Rate limiting
1. **Nginx** (endpoint location only): `limit_req_zone $binary_remote_addr zone=contact:10m rate=3r/m;`,
   `limit_req zone=contact burst=3 nodelay; limit_req_status 429;` — same pattern already used for Mail Admin.
2. **Service, per client IP** (IPv6 bucketed by /64): max 3 accepted submissions per 10 min and 10 per 24 h.
3. **Global breaker:** max 30 delivered messages per hour to the destination; above that return "try later" and log.
4. **Duplicates:** same SHA-256(email + normalized message) within 24 h → respond success, do not send again.
In-memory counters are acceptable (single instance; reset on restart).

## G. Server-side validation (authoritative; client checks are UX only)
- Method `POST` only; `Content-Type: application/json`; body ≤ 16 KB (Nginx `client_max_body_size 16k` + service check).
- Exactly these keys: `name`, `email`, `message`, `locale`, `website` (honeypot), `turnstileToken`. Unknown/missing keys → 400.
- All strings: valid UTF-8, Unicode NFC, trim; strip bidi controls (U+202A–202E, U+2066–2069); reject other control chars.
- `name`: 1–100 characters, no CR/LF/tab.
- `email`: ≤ 254 chars (local part ≤ 64), single `@`, domain with a dot, no whitespace, CR/LF, `,` `;` `<` `>` `"`; no DNS/MX lookup.
- `message`: 10–5000 characters; newlines allowed (normalize CRLF → LF); tab allowed; at most 3 URLs.
- `locale`: `en` | `es`. `website`: must be empty. `turnstileToken`: 1–2048 chars.
- HTML/script is treated as plain text: email is `text/plain; charset=utf-8`; nothing is ever rendered as HTML.

## H. Recommended delivery architecture (self-hosted, minimal)

```
browser (fetch POST, JSON)
  → https://garden-ministries.org/api/contact
  → Nginx: location = /api/contact  (POST only, 16k body, limit_req, proxy to 127.0.0.1:8091, X-Real-IP)
  → garden-contact service (Node 22, systemd, dedicated no-login user, 127.0.0.1:8091 only, no sudo)
       validate → Origin check → honeypot → rate limits → Turnstile siteverify (secret from root-owned env file)
  → local Postfix 127.0.0.1:25 (or sendmail), fixed envelope + header identities
  → virtual delivery to info@garden-ministries.org Maildir (garden-ministries.org is a local virtual mailbox domain:
    the message never leaves the server, no IETEL relay, no spam-folder deliverability issue, no SMTP credentials needed)
```

Email composition (server-fixed):
- `To:` info@garden-ministries.org — never from the browser.
- `From:` "Garden Ministries website" `<website@garden-ministries.org>` (proposed alias → info@, so bounces land somewhere; DKIM-signed and DMARC-aligned).
- Envelope sender: `website@garden-ministries.org`.
- `Reply-To:` the visitor's **validated** email, set through the mail library's address object (encoded, no raw header string).
- `Subject:` fixed, e.g. `Website message — Get involved (EN)`; no user input in any header except Reply-To.
- Body: name, email, locale, UTC time, message. No IP address in the email.

Why not the alternatives: a hosted form service stores messages at a third party and delivers over the internet (privacy
disclosure, cost, spam filtering); a Cloudflare Worker + email API adds vendor accounts, sending-domain DNS and secrets
outside Garden's server. Placing the endpoint **inside** garden-mail-admin is rejected (separate privilege/blast radius).
The static site stays static; only this tiny localhost service is added, mirroring the proven Mail Admin pattern.

**Header safety (D):** visitor input never becomes From/envelope; CR/LF rejected in every field; Reply-To only after strict
validation; fixed Subject/To. **CSRF/Origin (E):** endpoint has no cookies or session, so classic CSRF does not apply; still
require `Origin` = `https://garden-ministries.org` (decide on `www`), `Sec-Fetch-Site: same-origin` when present, JSON content
type, and send **no CORS headers**. These stop other websites from using visitors' browsers but do **not** stop scripts
(`curl` can forge Origin) — Turnstile + rate limits are the real controls. **Replay (F):** single-use 300 s token verified on
every request; expected `action` and `hostname` checked; `idempotency_key` only for retrying the same verification call.
**Exposure (G):** browser receives only the public sitekey; secret lives in `/etc/garden-contact/env` (root:gardencontact 0640);
no SMTP credentials exist (local delivery); responses are generic JSON codes; no stack traces or upstream error text.

## I. Is info@garden-ministries.org appropriate?
Yes: real protected mailbox on the same server, local delivery, institutional. Preconditions: named people monitor it.
Caveat: info@ also receives DMARC reports and the postmaster@/abuse@ aliases — use the fixed Subject/From for filtering.
Optional: a `contact@` or `website@` alias (root, `/etc/postfix/virtual`, reserved-identity rules) — never a new mailbox.

## J. Privacy
Activation **requires** updating `/privacy/` (EN/ES). The current page is a draft of principles ("final legal privacy notice will
be approved before public launch") and does not describe the contact form, Turnstile/Cloudflare, security logs or retention.
Add: data collected (name, email, message, language; IP/time in short-lived security logs; Turnstile signals processed by
Cloudflare), purpose (reply to the inquiry), where it is kept (Garden's own mailbox), retention, no marketing use without
consent, contact for access/deletion, Cloudflare's processor/controller role with a link to its Turnstile privacy addendum.
Add a one-line notice under the form linking to /privacy/. Owner/legal review.

## K. User experience (EN/ES)
- Keep visible labels; add `autocomplete="name"`/`"email"`, `maxlength` matching G.
- Per-field errors via `aria-describedby` + `aria-invalid`; summary with `role="alert"`; success with `role="status"`; move focus to
  the success heading.
- Submitting: button disabled, "Sending…", `aria-busy`; one request at a time.
- Failure: never clear the fields; show retry guidance.
- Replace the "preview" copy (`formText`, `sent`); add `<noscript>` fallback pointing to another contact route (mailing address,
  and info@ if approved).
- Generic messages only, e.g. verification failed → "Please complete the verification and try again."; rate limited → "Too many
  messages were sent from this connection. Please try again later."; any server/mail failure → "We couldn't send your message right
  now. Please try again in a few minutes." (ES equivalents.)

## L. Logging and retention
- Service (journald): one line per request — UTC time, outcome code (`sent`, `invalid`, `verify_failed`, `rate_limited`,
  `duplicate`, `honeypot`, `origin_rejected`, `delivery_failed`), locale, Turnstile error codes, message length, HMAC-hashed IP
  (daily rotating key). **Never** name, email or message text. Keep ≤ 30 days.
- Nginx access log already records IP/path/status (no POST bodies); existing logrotate applies.
- Message content lives **only** in the delivered email in info@. No database, no second copy, nothing written to disk by the
  service. Mailbox retention is an owner policy (suggest deleting after the inquiry is resolved, e.g. within 24 months).

## Failure behavior (section 8)

| Case | Service response | Visitor sees | Send? |
|---|---|---|---|
| Turnstile fails / missing / wrong action or hostname | 403 `verify_failed` | "complete the verification" + widget reset | No |
| siteverify timeout (5 s) or error | 503 `try_later` (fail closed) | "try again in a few minutes" | No |
| Rate limit (Nginx or service) | 429 + `Retry-After` | "too many messages… later" | No |
| Honeypot filled | 200 `ok` (silent) | success | No |
| Duplicate within 24 h | 200 `ok` | success | No |
| Malformed / unknown fields / wrong type / oversized | 400 (413 from Nginx) | "check the highlighted fields" | No |
| Wrong/missing Origin | 403 | generic error | No |
| Replayed request (token spent) | 403 `verify_failed` | — | No |
| Postfix refuses/unreachable | 503 `try_later` | message kept in form | No |
| Postfix accepts, Dovecot down | 200 `ok` (Postfix queues and retries) | success | Queued |

## M. Files / components that would change
Repo `garden-ministries-astro`: `src/templates/GetInvolvedTemplate.astro` (form attributes, honeypot, Turnstile container,
status regions, noscript, new fetch script); `src/i18n/ui.ts` (getInvolved form/error/success copy, privacy sections, EN/ES);
public Turnstile sitekey as build config (e.g. `PUBLIC_TURNSTILE_SITEKEY`); docs (`CURRENT-STATE`, `CHANGELOG`, `DEPLOY`, this file).
New service code (separate project folder, e.g. `garden-contact/`, with tests and an ops runbook — not inside garden-mail-admin).

## N. Owner / root / third-party actions
- Cloudflare account (owner) → Turnstile widget (managed) for `garden-ministries.org` (+ `www` if kept) → sitekey (public) and
  secret (entered by the operator into the server env file; never in chat or repo).
- Root console: system user `gardencontact`; `/opt/garden-contact`; `/etc/garden-contact/env`; systemd unit (127.0.0.1:8091,
  hardening options); Nginx `limit_req_zone` + `location = /api/contact`, `nginx -t`, reload; optional `website@` alias in
  `/etc/postfix/virtual` + `postmap` + reload; recommended MAIL-ADMIN-04E E1/E3 localhost-submission hardening.
- DNS: **none** required (Turnstile needs no DNS; delivery is local).

## O. Proposed implementation sequence
1. Owner decisions (P).
2. Optional interim fix (small separate release): stop the false success — replace the form with honest copy/mailing address
   (and info@ if approved) until the endpoint is live; this also removes the URL/log leak.
3. Build and test the service locally: validation, header safety, rate limits, duplicate/replay, Turnstile test keys, fake SMTP sink.
4. Root runbook on the server; service on 127.0.0.1:8091; verify locally on the server with test keys, then install the real secret.
5. Front-end form + privacy copy (EN/ES); local tests with test keys; full pre-deploy regression.
6. Deploy the site per `DEPLOY.md`; end-to-end test with the owner (real message arrives in info@; Reply-To works).
7. Watch outcome logs for the first weeks; tune limits; record everything in `CHANGELOG.md` / `CURRENT-STATE.md`.

## P. Decisions and risks for approval
Decisions: (1) architecture — self-hosted endpoint (recommended) vs hosted service vs mailto only; (2) Turnstile (Cloudflare account,
privacy disclosure) vs ALTCHA; (3) destination info@ and who monitors it; (4) sender identity alias (`website@`); (5) publish info@
as fallback; (6) interim removal of the false-success form now; (7) privacy wording and mailbox retention; (8) rate-limit values;
(9) do MAIL-ADMIN-04E E1/E3 first; (10) allow the `www` origin or redirect www first; (11) root-console time.
Risks: Turnstile outage makes the form unusable (show fallback contact route); human-solved spam still passes (rate limits,
duplicates, fixed format); a new service adds attack surface (isolation, no sudo, localhost-only); until 04E, a compromised service
could use the localhost relay; message content is stored in plaintext in the mailbox like all mail.
