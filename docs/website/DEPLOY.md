# Website deployment runbook

Reconstructed 2026-09-15 from server evidence (docroot ownership, backups in `/home/garden/backups/garden-site/`,
Nginx site config) and the commands used for the 2026-09-11 deploys. Not re-executed to "prove" it.

## Facts

| | |
|---|---|
| Target | `garden@2.29.29.114:/var/www/garden-ministries/` (Nginx `root`, site `garden-ministries.org`) |
| SSH | `ssh -i ~/.ssh/garden_claude_deploy -o IdentitiesOnly=yes -o BatchMode=yes garden@2.29.29.114` |
| Ownership | docroot owned by `garden:garden`, dirs 755, files 644 → **no sudo needed** |
| Backups | `/home/garden/backups/garden-site/garden-ministries-<timestamp>-<label>/` (outside any Nginx root) |
| Nginx | Static files only: a deploy needs **no** Nginx reload. Nginx config changes are separate, need root (Hetzner console). |
| Not used | `~/apps/garden-ministries` on the server (stale clone at `8f77259`). Do not build or deploy from it. |

## Rules

- Deploy only a **committed SHA on `main`**, built from a **clean clone**. Never deploy a working tree.
- Deploys need explicit authorization for that change. Record every deploy in `CHANGELOG.md` and update `CURRENT-STATE.md`.
- Full pre-deploy regression per `CURRENT-STATE.md` → Testing expectations.

## Procedure

```bash
REPO=/Users/luisgonzalez/Development/garden-ministries/garden-ministries-astro
SSH="ssh -i $HOME/.ssh/garden_claude_deploy -o IdentitiesOnly=yes -o BatchMode=yes"
HOST=garden@2.29.29.114
LABEL=short-change-name

# 1. Source: clean, committed
git -C "$REPO" status --porcelain          # must print nothing
SHA=$(git -C "$REPO" rev-parse --short HEAD)

# 2. Build from a clean clone of that SHA
BUILD=$(mktemp -d)/site
git clone -q "$REPO" "$BUILD" && git -C "$BUILD" checkout -q "$SHA"
(cd "$BUILD" && npm ci && npm run check && npm run build)

# 3. Local manifest (LC_ALL=C so ordering matches the server)
(cd "$BUILD/dist" && find . -type f ! -name .DS_Store -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256) > "$BUILD/manifest.sha256"

# 4. Backup current production (on the server, as garden)
$SSH $HOST "set -e; TS=\$(date -u +%Y%m%dT%H%M%SZ); D=/home/garden/backups/garden-site/garden-ministries-\$TS-pre-$LABEL;
  cp -a /var/www/garden-ministries \"\$D\"; diff -r \"\$D\" /var/www/garden-ministries >/dev/null && echo BACKUP_OK \$D"

# 5. Dry run — read the list; every "deleting" line must be explainable (e.g. old hashed _astro files)
rsync -avz --delete --dry-run --exclude .DS_Store -e "$SSH" "$BUILD/dist/" $HOST:/var/www/garden-ministries/

# 6. Deploy
rsync -avz --delete --stats --exclude .DS_Store -e "$SSH" "$BUILD/dist/" $HOST:/var/www/garden-ministries/
```

## Verification (post-deploy)

```bash
# Byte-level: server manifest must equal the local one
$SSH $HOST 'cd /var/www/garden-ministries && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum' | diff - "$BUILD/manifest.sha256" && echo MANIFEST_MATCH
# Ownership/modes: expect only garden:garden 644 (files) and 755 (dirs)
$SSH $HOST 'find /var/www/garden-ministries -printf "%u:%g %m %y\n" | sort | uniq -c'
# HTTP (while the trailing-slash issue exists, request the slash form)
for p in / /about/ /missions/community-water/ /give/ /get-involved/ /es/ /es/give/ /sitemap-index.xml /robots.txt; do
  printf "%-32s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://garden-ministries.org$p"; done
curl -s https://garden-ministries.org/give/ | grep -c -i zeffy          # expect > 0 (also /es/give/)
curl -s https://garden-ministries.org/about/ | grep -o '<link rel="canonical"[^>]*>'
```

Then check the changed pages in a browser (EN + ES, mobile width), and record: date/time, SHA, backup path, manifest
result, checks run → `CHANGELOG.md`; update "Source ↔ production" in `CURRENT-STATE.md`.

## Rollback

Restore the pre-deploy backup (as garden, no sudo), then re-run the verification against the backup instead of the build:

```bash
$SSH $HOST 'rsync -a --delete /home/garden/backups/garden-site/<backup-dir>/ /var/www/garden-ministries/'
```

Alternative: redeploy the previous known-good SHA with the full procedure. Record the rollback in `CHANGELOG.md`.

## Housekeeping

Each backup is ~15 MB. Prune old backups manually (keep at least the two most recent) and note it in `CHANGELOG.md`.
