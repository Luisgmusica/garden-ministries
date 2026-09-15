# "Start a conversation" contact form — implementation, runbook, operations

Supersedes the recommendations in `CONTACT-FORM-AUDIT.md` (kept as the audit record). Status is tracked in `CURRENT-STATE.md`.

## What it does (and nothing more)

A visitor fills name, email and message on `/get-involved/` or `/es/get-involved/`, passes Cloudflare Turnstile (managed),
and the browser POSTs JSON to `/api/contact`. A small localhost service validates the request, verifies Turnstile server-side,
applies rate limits and hands **one fixed-format plain-text email** to local Postfix for delivery to
**info@garden-ministries.org**. The visitor sees success only after Postfix accepted the message.
No database, no stored copies, no CRM, no general mail API.

```
browser ── POST /api/contact (JSON) ──▶ Nginx (POST only, 16k body, 3 r/min per IP + burst 5)
        ──▶ garden-contact (Node 22, 127.0.0.1:8091, user gardencontact)
             Origin → attempt limit → type/size → JSON → honeypot → validation → token replay cache
             → per-IP/global limits → Turnstile siteverify → duplicate check
        ──▶ /usr/sbin/sendmail -i -f info@garden-ministries.org -- info@garden-ministries.org
        ──▶ Postfix pickup → virtual delivery (LMTP) → info@ mailbox (never leaves the server)
```

## Code

| Where | What |
|---|---|
| `services/contact/src/server.js` | HTTP handler and the fixed processing order; `/healthz` for local checks |
| `services/contact/src/validate.js` | Authoritative field rules |
| `services/contact/src/turnstile.js` | siteverify call (5 s timeout, one retry with the same `idempotency_key`), hostname/action checks |
| `services/contact/src/message.js` | Fixed identities and the plain-text message |
| `services/contact/src/sendmail.js` | Local submission (`-t` never used; recipient is an argument) |
| `services/contact/src/ratelimit.js` | In-memory sliding windows and expiring sets |
| `services/contact/src/config.js` | Env config; refuses Cloudflare test secrets unless `ALLOW_TURNSTILE_TEST_KEYS=1` |
| `services/contact/test/` | `npm test` (39 tests incl. HTTP integration with a mock siteverify and fake sendmail); `TURNSTILE_LIVE=1` adds real siteverify calls with Cloudflare's test secrets |
| `src/templates/GetInvolvedTemplate.astro` | Form, Turnstile widget (explicit render), honeypot, client validation, states |
| `src/data/organization.ts` | `contactEmail`; `turnstileSiteKey` (public). Empty sitekey = form replaced by the email fallback |
| `src/i18n/ui.ts` | `getInvolved.*` copy and `errors` (EN/ES); Privacy sections "Contact form" and "Spam protection and security logs" |

No npm dependencies (Node built-ins only).

## Mail identity (fits MAIL-ADMIN-04, no Postfix change)

| | Value | Interaction with the existing mail rules |
|---|---|---|
| To | `info@garden-ministries.org` (fixed in code, passed as a `sendmail` argument) | Local virtual mailbox; no relay |
| Envelope sender | `info@garden-ministries.org` (`sendmail -f`) | Local `sendmail` path: not an SMTP session, so 04B/04C (`reject_authenticated_sender_login_mismatch`, live in warn mode since 2026-09-13) do not apply and are not weakened. Today `local_login_sender_maps = static:*` allows it. If 04E E3 is ever enforced, add exactly `gardencontact  info@garden-ministries.org` to that map. |
| From | `"Garden Ministries website" <info@garden-ministries.org>` | Existing identity; no new address or alias (no `website@`), nothing for 04D to reserve. OpenDKIM (`non_smtpd_milters`) may sign it; irrelevant for local delivery. |
| Reply-To | visitor's validated email | Only visitor value in any header; strict ASCII address syntax, CR/LF impossible (validated twice) |
| Subject | `[Garden website] Start a conversation (EN|ES)` | Fixed |

Does **not** use the localhost SMTP relay (S2) and needs no SMTP credentials. Bounces (unlikely for local delivery) return to info@.

## Limits and behaviour

| Control | Value |
|---|---|
| Body | 16 KB (Nginx and service); JSON only; exactly `name`, `email`, `message`, `locale`, `website`, `turnstileToken` |
| Fields | name 1–100 chars, no controls; email ASCII, ≤ 254 (local ≤ 64); message 10–5000 chars, ≤ 3 links; NFC, invisible/bidi formatting stripped |
| Origin | `https://garden-ministries.org` or `https://www.garden-ministries.org`; `Sec-Fetch-Site`, when sent, must be `same-origin`; no CORS headers |
| Nginx | 3 requests/min per IP, burst 5, 429 |
| Service | attempts 20/10 min per IP; accepted 3/10 min and 10/day per IP (IPv6 /64); 30 accepted/hour global; duplicate email+message within 24 h acknowledged, not re-sent |
| Turnstile | token single-use (local 10-min cache + Cloudflare), hostname and action `contact` checked, secret server-side only |

| Case | HTTP | Visitor sees | Sent |
|---|---|---|---|
| Accepted by Postfix | 200 `ok` | success | yes |
| Honeypot filled / duplicate | 200 `ok` | success | no |
| Validation | 400 `invalid` + field names | field errors, input kept | no |
| Turnstile failed / replay | 403 `verify_failed` | "complete the verification" | no |
| Wrong Origin | 403 | generic failure | no |
| Rate limit | 429 | "try again later" | no |
| siteverify or sendmail unavailable | 503 `try_later` | "try again… or write to info@", input kept | no |
| Oversized / wrong type / method | 413 / 415 / 405 | generic failure | no |

No-JS: the form wrapper is `hidden` and a `<noscript>` note offers info@; with `method="post"` nothing can ever be put in a URL.

Logs (journald, one JSON line per request): time, outcome code, HTTP status, locale, Turnstile error codes, message length and a
16-hex HMAC of the client network (key regenerated daily, never stored). Never name, email, message, IP or token.

## Owner action (once)

Create the production Turnstile widget in the Cloudflare dashboard (free plan):
Turnstile → Add widget → name "Garden Ministries contact form" → hostnames `garden-ministries.org` and `www.garden-ministries.org`
→ widget mode **Managed** → no pre-clearance. Copy the **Site Key** (public — may be shared and is committed to git) and keep the
**Secret Key** private: it is typed only into the server during runbook block A (never in chat, git or email).

## Root runbook (Hetzner root console)

Prerequisites: the approved commit is staged by the assistant in `/home/garden/contact-staging/` with `SHA256SUMS`.

### Block A — service

```bash
set -euo pipefail
STAGE=/home/garden/contact-staging
cd "$STAGE" && sha256sum -c SHA256SUMS
id gardencontact >/dev/null 2>&1 || useradd --system --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin gardencontact
install -d -o root -g root -m 0755 /opt/garden-contact /opt/garden-contact/src
install -o root -g root -m 0644 "$STAGE/package.json" /opt/garden-contact/package.json
install -o root -g root -m 0644 "$STAGE"/src/*.js /opt/garden-contact/src/
install -d -o root -g gardencontact -m 0750 /etc/garden-contact
( umask 027; read -rsp 'Turnstile SECRET key (input hidden): ' S; echo; printf 'TURNSTILE_SECRET=%s\n' "$S" > /etc/garden-contact/env; unset S )
chown root:gardencontact /etc/garden-contact/env && chmod 0640 /etc/garden-contact/env
cat > /etc/systemd/system/garden-contact.service <<'EOF'
[Unit]
Description=Garden Ministries contact form endpoint
After=network-online.target postfix.service
Wants=network-online.target

[Service]
Type=simple
User=gardencontact
Group=gardencontact
WorkingDirectory=/opt/garden-contact
EnvironmentFile=/etc/garden-contact/env
Environment=NODE_ENV=production
Environment=PORT=8091
ExecStart=/usr/bin/node /opt/garden-contact/src/server.js
Restart=on-failure
RestartSec=2
UMask=0077
# NoNewPrivileges is deliberately not set: /usr/sbin/sendmail runs the setgid postdrop helper.
PrivateTmp=yes
ProtectHome=yes
ProtectSystem=full
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictRealtime=yes
LockPersonality=yes
MemoryMax=128M

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now garden-contact
sleep 2
systemctl is-active garden-contact
curl -s http://127.0.0.1:8091/healthz; echo
ss -ltn | grep ':8091 '
journalctl -u garden-contact -n 3 --no-pager
```
Expected: `active`, `{"ok":true}`, `127.0.0.1:8091` only, a `listening` log line with `"turnstileTestKeys":false`.

### Block B — Nginx route

```bash
set -euo pipefail
SITE=/etc/nginx/sites-available/garden-ministries.org
TS=$(date -u +%Y%m%dT%H%M%SZ); B=/var/backups/garden-contact/nginx-$TS
install -d -m 0700 "$B" && cp -a "$SITE" "$B/"
cat > /etc/nginx/conf.d/garden-contact-ratelimit.conf <<'EOF'
# Garden Ministries contact form: /api/contact requests per client IP.
limit_req_zone $binary_remote_addr zone=garden_contact:10m rate=3r/m;
EOF
cat > /etc/nginx/snippets/garden-contact-location.conf <<'EOF'
# Garden Ministries contact form endpoint (proxied to the localhost-only garden-contact service).
location = /api/contact {
    limit_except POST { deny all; }
    client_max_body_size 16k;
    limit_req zone=garden_contact burst=5 nodelay;
    limit_req_status 429;
    proxy_pass http://127.0.0.1:8091;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
}
EOF
grep -q 'garden-contact-location.conf' "$SITE" || sed -i '0,/^    index index\.html;$/s//    index index.html;\n    include snippets\/garden-contact-location.conf;/' "$SITE"
test "$(grep -c 'include snippets/garden-contact-location.conf;' "$SITE")" = 1
if nginx -t; then systemctl reload nginx; echo NGINX_RELOADED; else cp -a "$B/garden-ministries.org" "$SITE"; rm -f /etc/nginx/conf.d/garden-contact-ratelimit.conf; nginx -t; echo RESTORED; fi
diff "$B/garden-ministries.org" "$SITE" || true
```
Expected diff: exactly one added `include snippets/garden-contact-location.conf;` line in the HTTPS server block.

### Verification before the site is deployed (no root)

```bash
B=https://garden-ministries.org/api/contact
curl -s -o /dev/null -w '%{http_code}\n' "$B"                                               # 403 (GET denied)
curl -s -X POST "$B" -H 'Content-Type: application/json' --data '{}'; echo                  # {"ok":false,"error":"forbidden"} (no Origin)
curl -s -X POST "$B" -H 'Content-Type: application/json' -H 'Origin: https://garden-ministries.org' --data '{}'; echo   # 400 invalid
curl -s -X POST "$B" -H 'Content-Type: application/json' -H 'Origin: https://garden-ministries.org' \
  --data '{"name":"Probe","email":"probe@example.org","message":"Verification probe, no delivery.","turnstileToken":"XXXX.DUMMY.TOKEN.XXXX"}'; echo   # 403 verify_failed
```

### Rollback

```bash
systemctl disable --now garden-contact
cp -a /var/backups/garden-contact/nginx-<TS>/garden-ministries.org /etc/nginx/sites-available/garden-ministries.org
rm -f /etc/nginx/conf.d/garden-contact-ratelimit.conf /etc/nginx/snippets/garden-contact-location.conf
nginx -t && systemctl reload nginx
```
Website side: redeploy the previous site build (`DEPLOY.md`) or ship a build with an empty `turnstileSiteKey` (form replaced by the email fallback).

## Updating the service later

Stage the new `services/contact/` from a clean clone with `SHA256SUMS`, run `npm test` in staging (as garden), then as root:
`install` the `src/*.js` files as in block A and `systemctl restart garden-contact`; verify `healthz` and one probe. Rotate the
Turnstile secret by rewriting `/etc/garden-contact/env` with the same `read -rs` line and restarting.
