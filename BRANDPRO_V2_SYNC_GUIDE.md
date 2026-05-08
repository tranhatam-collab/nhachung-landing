# BRANDPRO NHÀ CHUNG V2 — SOURCE + DEPLOY GUIDE

**Verified:** 2026-05-08
**Approved brand:** Gold/White/Black v2.0

## Current Truth

| Item | Correct state |
|---|---|
| Live production | `https://nhachung.org` + `https://www.nhachung.org` |
| Live hash | `6ddb1562b757a6f7a3b815e98a5d868fe3e2502a2392172deb571993ca246a2f` |
| Production runtime | Cloudflare account `93112cc89181e75335cbd7ef7e392ba3`, Pages `nhachung-landing`, alias `nhachung-landing-abp.pages.dev`, latest deploy `263c6d01.nhachung-landing-abp.pages.dev`, No Git |
| Duplicate/reference | Cloudflare account `f3f9e76222dcb488d5e303e29e8ba192`, Pages `nhachung-org.pages.dev`, historical Brand v2 reference; do not use as canonical production |
| Git source | This repo, branch `brand/v2.0-migration` |
| Brand code baseline | `4580e59 feat(brand): sync canonical public site pack` |
| Current branch commit | `e1685134836cd00a8e3cba0452123c6515d5aa24` |
| Current local `public/index.html` hash | `db3a4103adb01ec5a5f2e344c30be13aab05a153bc578042cdcc512c2fff1a78` |
| Handoff guide | This file in the same branch |
| PR URL | `https://github.com/tranhatam-collab/nhachung-landing/pull/new/brand/v2.0-migration` |
| PR compare preflight | `brand/v2.0-migration` is ahead of `main` by 11 commits, behind by 0; merge base is `259c8a23742d6b249c52a6238c854437302f6d35` |

`public/index.html` no longer hashes to the older `6ddb1562b757a6f7a3b815e98a5d868fe3e2502a2392172deb571993ca246a2f` after the analytics and guide commits. Treat `db3a4103adb01ec5a5f2e344c30be13aab05a153bc578042cdcc512c2fff1a78` as the current local source hash until the next production deploy records a new live hash.

## Live Edge Blocker

2026-05-08T08:45:22Z web fetch evidence found production routing/content inconsistent with this canonical source:

- `https://nhachung.org/` rendered the older "Hệ sinh thái Sống – Học – Làm – Đầu tư – Cộng đồng" surface, including old navigation labels such as `Tính năng`, `Modules`, `Cấp độ`, and app/admin links.
- `https://api.nhachung.org/` rendered a static "Hello, World!" asset page instead of the Worker API surface.

Release implication: do not claim live Lighthouse, live screenshot, or production parity PASS until Cloudflare Pages/Worker routing is reconciled and a fresh live hash is recorded. See `release-evidence/2026-05-08-live-edge-mismatch.md`.

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

Verified on 2026-05-08:

- `brand-lint`: PASS
- `i18n-smoke`: PASS 4/4
- `story-pipeline-lint`: PASS
- `public-analytics-gate`: PASS
- `live-edge-smoke`: BLOCKED by production routing mismatch; 2026-05-08T09:21Z web fetch still showed stale `nhachung.org`, `www.nhachung.org` 502, and static `api.nhachung.org/`
- `git diff --check`: PASS
- `git diff --check main...HEAD`: PASS
- `node ../scripts/public-web-route-smoke.mjs public`: PASS 9 pages
- `node ../scripts/public-seo-audit.mjs public`: PASS 9 pages
- `node ../scripts/public-accessibility-audit.mjs public`: PASS 9 pages
- `node ../scripts/public-performance-audit.mjs public`: PASS 9 pages / 299620 bytes

## Remaining Before Production Merge

1. Open the PR from `brand/v2.0-migration` to `main`; the branch is compare-clean and does not need a rebase as of this verification.
2. Wait for Cloudflare branch preview and review visual/content.
3. Reconcile Cloudflare live routing so `https://nhachung.org`, `https://www.nhachung.org`, and `https://api.nhachung.org` serve the intended Pages/Worker projects; then run `node scripts/live-edge-smoke.mjs`.
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
