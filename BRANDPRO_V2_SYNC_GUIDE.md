# BRANDPRO NHÀ CHUNG V2 — SOURCE + DEPLOY GUIDE

**Verified:** 2026-05-08  
**Approved brand:** Gold/White/Black v2.0

## Current Truth

| Item | Correct state |
|---|---|
| Live production | `https://nhachung.org` + `https://www.nhachung.org` |
| Live hash | `70d1c178118d3942da1e3dbc2a09205bbd4577c2100b361617618a0b35eaec13` |
| Production runtime | Cloudflare account `93112cc89181e75335cbd7ef7e392ba3`, Pages `nhachung-landing`, alias `nhachung-landing-abp.pages.dev`, No Git |
| Duplicate/reference | Cloudflare account `f3f9e76222dcb488d5e303e29e8ba192`, Pages `nhachung-org.pages.dev`, same hash `70d1...` |
| Git source | This repo, branch `brand/v2.0-migration` |
| Brand code baseline | `b41c864 fix(brand): add v2 lint guardrail` |
| Handoff guide | This file in the same branch |
| PR URL | `https://github.com/tranhatam-collab/nhachung-landing/pull/new/brand/v2.0-migration` |

`public/index.html` currently hashes to `9897bcbe082662d45462ed86dc9c8e4d614180784a3d54fb0621f57dd853f6f3`. It intentionally differs from live hash `70d1...` because this branch fixes the legacy hover color `#c9a455` to `#D4AF37`.

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
node scripts/public-analytics-gate.mjs
git diff --check
```

Verified on 2026-05-08:

- `brand-lint`: PASS
- `i18n-smoke`: PASS 4/4
- `story-pipeline-lint`: PASS
- `public-analytics-gate`: PASS
- `git diff --check`: PASS
- `node scripts/public-web-route-smoke.mjs nhachung-landing/public`: PASS 9 pages
- `node scripts/public-seo-audit.mjs nhachung-landing/public`: PASS 9 pages
- `node scripts/public-accessibility-audit.mjs nhachung-landing/public`: PASS 9 pages
- `node scripts/public-performance-audit.mjs nhachung-landing/public`: PASS 9 pages / 299620 bytes

## Remaining Before Production Merge

1. Wait for Cloudflare branch preview and review visual/content.
2. Run Lighthouse mobile + desktop on preview/live; each public page must score at least 95.
3. Capture screenshot evidence for homepage, app link, signup form, and legal footer.
4. Inject the Cloudflare Web Analytics token during controlled Pages setup; source keeps `CLOUDFLARE_WEB_ANALYTICS_TOKEN` empty and gated to avoid committing runtime identifiers.
5. Apply the newsletter Worker/D1 rollout if the public signup form is used in production.
6. Open PR, merge main, then verify `https://nhachung.org` and `https://www.nhachung.org`.

Repo-side canonical work already complete:
- 9 public pages under `public/`, including `cau-chuyen.html`, `nguyen-tac-song-chung.html`, `lam-viec-muon-noi.html`, and `ung-dung.html`.
- 1200x630 `og:image` metadata/assets under `public/assets/og/`.
- Newsletter signup in `public/dang-ky.html` calls `https://api.nhachung.org/api/newsletter` through `public/assets/js/main.js`.
- Cloudflare Web Analytics scaffold is wired through `public/assets/js/analytics.js` on public and legal pages; it loads only when `public/assets/config.js` receives a token and does not inspect forms, cookies, storage, or custom events.
- SEO, accessibility, and static performance gates pass against `public/`.
- Internal story collection pipeline lives outside the deploy root in `story-pipeline/`, with intake form, consent/legal workflow, story template, and `scripts/story-pipeline-lint.mjs`.
