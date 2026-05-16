# Cloudflare Pages — Analytics Token Setup Guide

**Date:** 2026-05-16  
**Project:** nhachung-landing  
**Scope:** Final 2% — wire Cloudflare Web Analytics token to production deployment

---

## Background

`public/assets/config.js` keeps `CLOUDFLARE_WEB_ANALYTICS_TOKEN: ""` in source (enforced by `scripts/public-analytics-gate.mjs`). The real token must be injected via the CF Pages build pipeline using the env var `CF_ANALYTICS_TOKEN`. The `wrangler.toml` `[build]` command performs a `sed` replacement at deploy time — if the var is unset, the placeholder stays `""` and `analytics.js` silently no-ops.

---

## Step 1 — Get Your Web Analytics Token

1. Open: `https://dash.cloudflare.com/f3f9e76222dcb488d5e303e29e8ba192/web-analytics/sites`
2. Find **nhachung.org** in the list.  
   - If missing: click **Add site** → enter `nhachung.org` → save. CF will generate a token.
3. Click the site name, then **Manage site** or **Get snippet**.
4. In the JS snippet you'll see:  
   ```html
   <script defer src='...' data-cf-beacon='{"token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}'></script>
   ```
5. Copy the 32-character hex token value (the `XXXXXXXX...` part).

---

## Step 2 — Set the Environment Variable in CF Pages

**Dashboard URL:**  
`https://dash.cloudflare.com/f3f9e76222dcb488d5e303e29e8ba192/pages/view/nhachung-landing/settings/environment-variables`

1. Navigate to the URL above.
2. Under **Production** environment variables, click **Add variable** (or **Edit variables**).
3. Set:
   - **Variable name:** `CF_ANALYTICS_TOKEN`
   - **Value:** (paste the token from Step 1)
   - **Encrypt:** Yes (recommended — keeps it hidden in logs)
4. Click **Save**.

> Note: `CLOUDFLARE_WEB_ANALYTICS_TOKEN` is the config key name inside `config.js`.  
> `CF_ANALYTICS_TOKEN` is the CF Pages env var name that feeds into the build command.

---

## Step 3 — Trigger a Manual Redeploy

The build command in `wrangler.toml` runs `sed` to splice the token into `config.js` at build time. A redeploy is required after setting the env var.

### Option A — Via Dashboard (no new commit needed)

1. Go to: `https://dash.cloudflare.com/f3f9e76222dcb488d5e303e29e8ba192/pages/view/nhachung-landing`
2. Click the **Deployments** tab.
3. Find the latest **Production** deployment, click the three-dot menu (`...`).
4. Select **Retry deployment**.
5. Wait for the build to complete (~30–60 seconds for a static site).
6. Verify: open `https://nhachung.org` → View Source → search for `CF_ANALYTICS_TOKEN` — it should show the real token value inside the `config.js` script block.

### Option B — Via Wrangler CLI

```bash
# From nhachung-landing directory
CF_ANALYTICS_TOKEN=<your-token> npx wrangler pages deploy public --project-name nhachung-landing
```

### Option C — Push an empty commit to trigger CI

```bash
git commit --allow-empty -m "chore: trigger redeploy for analytics token activation"
git push origin main
```

---

## Step 4 — Verify Analytics is Active

1. Open `https://nhachung.org` in a browser.
2. Open DevTools → Network tab → filter for `beacon.min.js`.
3. Confirm the script loads from `https://static.cloudflareinsights.com/beacon.min.js`.
4. Check `https://dash.cloudflare.com/f3f9e76222dcb488d5e303e29e8ba192/web-analytics/sites` → nhachung.org should show page views within a few minutes.

---

## How the Injection Works

`wrangler.toml` `[build]` command:
```bash
if [ -n "$CF_ANALYTICS_TOKEN" ]; then
  sed -i "s|CLOUDFLARE_WEB_ANALYTICS_TOKEN: \"\"|CLOUDFLARE_WEB_ANALYTICS_TOKEN: \"$CF_ANALYTICS_TOKEN\"|" public/assets/config.js
fi
```

- If `CF_ANALYTICS_TOKEN` is set: replaces the empty string with the real token before CF Pages serves the files.
- If `CF_ANALYTICS_TOKEN` is unset: no-ops — `analytics.js` checks for empty token and skips loading the beacon script, so the page works normally without analytics.

---

## Gate Note

`scripts/public-analytics-gate.mjs` verifies the source file keeps `CLOUDFLARE_WEB_ANALYTICS_TOKEN: ""`. Do not commit a real token value — the gate will fail CI if a non-empty token appears in the committed source.
