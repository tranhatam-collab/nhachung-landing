# BRANDPRO NHÀ CHUNG V2 — SOURCE + DEPLOY GUIDE

**Verified:** 2026-05-13
**Approved brand:** Gold/White/Black v2.0

## Current Truth

| Item | Correct state |
|---|---|
| Intended live production | `https://nhachung.org` + `https://www.nhachung.org` |
| Live verification contract | Semantic checks on title + required markers + `Organization.sameAs` + footer pathway; do not require raw HTML hash equality because Cloudflare mutates the served document |
| Production runtime | Cloudflare account `93112cc89181e75335cbd7ef7e392ba3`, Pages `nhachung-landing`, latest runtime truth must be re-proved after the 2026-05-13 regression; do not rely on the earlier PASS alone |
| Duplicate/reference | Cloudflare account `f3f9e76222dcb488d5e303e29e8ba192`, Pages `nhachung-org.pages.dev`, historical Brand v2 reference; do not use as canonical production |
| Git source | This repo, branch `brand/v2.0-migration` |
| Brand code baseline | `4580e59 feat(brand): sync canonical public site pack` |
| Current branch commit | Run `git rev-parse HEAD` before release; this branch receives release-evidence commits during automation |
| Current local `public/index.html` hash | Historical reference only; do not use as a release gate for live parity |
| Handoff guide | This file in the same branch |
| PR URL | `https://github.com/tranhatam-collab/nhachung-landing/pull/new/brand/v2.0-migration` |
| PR compare preflight | `brand/v2.0-migration` is ahead of local `main` by 23 commits; rerun compare before merge if remote access is available |

Treat the local `public/index.html` hash as a static source fingerprint only. Live parity must be verified semantically because Cloudflare runtime transforms can change the served HTML body without changing the approved content.

## Live Edge Evidence

2026-05-09T01:39Z `node scripts/live-edge-smoke.mjs` passed under the then-current runtime. That PASS is now historical only. As of 2026-05-13 the gate was corrected to avoid raw hash equality and instead verify semantic parity:

- `https://nhachung.org/` title matches canonical source and still exposes the approved public markers.
- `https://www.nhachung.org/` title matches canonical source and still exposes the approved public markers.
- Both public hosts must expose the same `Organization.sameAs` pathway URL and footer pathway label as the canonical source.
- `https://api.nhachung.org/` returned Worker API home with `text/html; charset=utf-8`, not the static Wrangler placeholder.

See `release-evidence/2026-05-09-live-edge-recheck.md` for the historical PASS and `release-evidence/2026-05-13-live-edge-regression.md` for the current blocker.

## Do Not

- Do not use `apps/www/public` for new BrandPro work.
- Do not treat `https://nhachung-landing.pages.dev` as production reference until the Git preview/merge path is verified.
- Do not delete `nhachung-org` or reassign domains before canonical production is verified.
- Do not merge this branch until the gates below pass.

## Required Commands

```bash
cd /Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing
git checkout brand/v2.0-migration
bash scripts/brand-lint.sh public
node scripts/i18n-smoke.mjs
node scripts/story-pipeline-lint.mjs
node scripts/public-analytics-gate.mjs
node scripts/live-edge-smoke.mjs
node ../scripts/public-web-route-smoke.mjs public
node ../scripts/public-seo-audit.mjs public
node ../scripts/public-accessibility-audit.mjs public
node ../scripts/public-performance-audit.mjs public
git diff --check
git diff --check main...HEAD
```

```bash
cd /Users/tranhatam/Documents/Devnewproject/nhachung.org
node scripts/report-t1-public-status.mjs
```

If the local shell cannot resolve the public host, validate external fetch snapshots instead of hand-reading HTML:

```bash
cd /Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing
node scripts/live-edge-smoke.mjs --json \
  --root-response=tmp/live-root-response.json \
  --www-response=tmp/live-www-response.json \
  --api-response=tmp/live-api-response.json
```

Then resolve the heartbeat summary from the same evidence:

```bash
cd /Users/tranhatam/Documents/Devnewproject/nhachung.org
node scripts/report-t1-public-status.mjs \
  --root-response=nhachung-landing/tmp/live-root-response.json \
  --www-response=nhachung-landing/tmp/live-www-response.json \
  --api-response=nhachung-landing/tmp/live-api-response.json
```

The snapshot files should preserve `status`, `contentType`, and `body` from the same verification window for root, `www`, and `api` respectively. Raw HTTP snapshots are also accepted via `--root-http`, `--www-http`, and `--api-http` when the operator wants to preserve the original response envelope verbatim.

Verified on 2026-05-09:

- `brand-lint`: PASS
- `i18n-smoke`: PASS 4/4
- `story-pipeline-lint`: PASS
- `public-analytics-gate`: PASS
- `public-legal-gate`: PASS
- `public-icon-gate`: PASS
- `live-edge-smoke`: historical PASS 2026-05-09T01:39Z under the old runtime; this is not current release truth after the 2026-05-13 regression, and future reruns must stay green against the semantic parity contract plus the expanded stale-marker rejection set
- `git diff --check`: PASS
- `git diff --check main...HEAD`: PASS
- `node ../scripts/public-web-route-smoke.mjs public`: PASS 9 pages
- `node ../scripts/public-seo-audit.mjs public`: PASS 9 pages
- `node ../scripts/public-accessibility-audit.mjs public`: PASS 9 pages
- `node ../scripts/public-performance-audit.mjs public`: PASS 9 pages / 2 critical assets / 297670 critical bytes
- `node scripts/report-t1-public-status.mjs`: BLOCKED on 2026-05-13 04:29 +07; current sandbox verifier is still `network_blocked`, and the effective blocker remains `root_legacy_surface_and_www_502` from the latest regression evidence

## Remaining Before Production Merge

1. Open the PR from `brand/v2.0-migration` to `main`; the branch is compare-clean and does not need a rebase as of this verification.
2. Wait for Cloudflare branch preview and review visual/content.
3. Re-establish live root + `www` parity first, then keep `node scripts/live-edge-smoke.mjs` green through PR/merge and after any Pages/Worker deploy.
4. Run Lighthouse mobile + desktop on preview/live; each public page must score at least 95.
5. Capture screenshot evidence for homepage, app link, signup form, newsletter success/error, and legal footer.
6. Inject the Cloudflare Web Analytics token during controlled Pages setup; source keeps `CLOUDFLARE_WEB_ANALYTICS_TOKEN` empty and gated to avoid committing runtime identifiers.
7. Merge main, then verify `https://nhachung.org` and `https://www.nhachung.org`.

Repo-side canonical work already complete:
- 9 public pages under `public/`, including `cau-chuyen.html`, `nguyen-tac-song-chung.html`, `lam-viec-muon-noi.html`, and `ung-dung.html`.
- 1200x630 `og:image` metadata/assets under `public/assets/og/`.
- Newsletter signup in `public/dang-ky.html` calls `https://api.nhachung.org/api/newsletter` through `public/assets/js/main.js`; production smoke passed on 2026-05-08.
- Cloudflare Web Analytics scaffold is wired through `public/assets/js/analytics.js` on public and legal pages; it loads only when `public/assets/config.js` receives a token and does not inspect forms, cookies, storage, or custom events.
- SEO, accessibility, and static performance gates pass against `public/`.
- Internal story collection pipeline lives outside the deploy root in `story-pipeline/`, with intake form, consent/legal workflow, story template, and `scripts/story-pipeline-lint.mjs`.
