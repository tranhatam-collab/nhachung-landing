# BRANDPRO NHÀ CHUNG V2 — SOURCE + DEPLOY GUIDE

**Verified:** 2026-05-09
**Approved brand:** Gold/White/Black v2.0

## Current Truth

| Item | Correct state |
|---|---|
| Intended live production | `https://nhachung.org` + `https://www.nhachung.org` |
| Counted live hash | `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a` |
| Production runtime | Cloudflare account `93112cc89181e75335cbd7ef7e392ba3`, Pages `nhachung-landing`, latest verified deploy `ec4ee215.nhachung-landing-abp.pages.dev`, No Git |
| Duplicate/reference | Cloudflare account `f3f9e76222dcb488d5e303e29e8ba192`, Pages `nhachung-org.pages.dev`, historical Brand v2 reference; do not use as canonical production |
| Git source | This repo, branch `brand/v2.0-migration` |
| Brand code baseline | `4580e59 feat(brand): sync canonical public site pack` |
| Current branch commit | Run `git rev-parse HEAD` before release; this branch receives release-evidence commits during automation |
| Current local `public/index.html` hash | `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a` |
| Handoff guide | This file in the same branch |
| PR URL | `https://github.com/tranhatam-collab/nhachung-landing/pull/new/brand/v2.0-migration` |
| PR compare preflight | `brand/v2.0-migration` is ahead of local `main` by 23 commits; rerun compare before merge if remote access is available |

`public/index.html`, `https://nhachung.org/`, and `https://www.nhachung.org/` currently hash to `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a`. Treat this as the canonical source/live hash.

## Live Edge Evidence

2026-05-09T01:39Z `node scripts/live-edge-smoke.mjs` passed:

- `https://nhachung.org/` title `Nhà Chung | Hệ điều hành cộng đồng sống thật`, hash `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a`.
- `https://www.nhachung.org/` title `Nhà Chung | Hệ điều hành cộng đồng sống thật`, hash `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a`.
- `https://api.nhachung.org/` returned Worker API home with `text/html; charset=utf-8`, not the static Wrangler placeholder.

See `release-evidence/2026-05-09-live-edge-recheck.md`.

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

Verified on 2026-05-09:

- `brand-lint`: PASS
- `i18n-smoke`: PASS 4/4
- `story-pipeline-lint`: PASS
- `public-analytics-gate`: PASS
- `public-legal-gate`: PASS
- `public-icon-gate`: PASS
- `live-edge-smoke`: PASS 2026-05-09T01:39Z; `nhachung.org` and `www` hash match local source, and `api.nhachung.org/` serves Worker API home
- `git diff --check`: PASS
- `git diff --check main...HEAD`: PASS
- `node ../scripts/public-web-route-smoke.mjs public`: PASS 9 pages
- `node ../scripts/public-seo-audit.mjs public`: PASS 9 pages
- `node ../scripts/public-accessibility-audit.mjs public`: PASS 9 pages
- `node ../scripts/public-performance-audit.mjs public`: PASS 9 pages / 2 critical assets / 297670 critical bytes

## Remaining Before Production Merge

1. Open the PR from `brand/v2.0-migration` to `main`; the branch is compare-clean and does not need a rebase as of this verification.
2. Wait for Cloudflare branch preview and review visual/content.
3. Keep `node scripts/live-edge-smoke.mjs` green through PR/merge; rerun after any Pages/Worker deploy.
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
