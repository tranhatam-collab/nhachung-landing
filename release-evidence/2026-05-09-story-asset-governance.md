# Story Asset Governance Evidence — 2026-05-09

Run time: 2026-05-08T20:15:53Z / 2026-05-09T03:15:53+0700

## Scope

This closes a repo-side T5/T6 gap before real stories/photos are published:

- The public story hub no longer uses an unapproved stock-photo hero.
- `story-pipeline/approved-story-assets.json` now records the approval state for story/photo assets.
- `scripts/story-pipeline-lint.mjs` blocks a `publish_approved` story unless photo consent, legal review, author final approval, and publish approval are all true.
- The publish workflow now requires the approved asset manifest entry before generating a public story page.

No real resident story or photo has been published in this patch. Real content remains blocked until founder/content approval, consent, and legal signoff are complete.

## Verification

- `node scripts/story-pipeline-lint.mjs` — PASS
- `bash scripts/brand-lint.sh public` — PASS
- `node scripts/i18n-smoke.mjs` — PASS
- `node scripts/public-analytics-gate.mjs` — PASS
- `node scripts/public-legal-gate.mjs` — PASS
- `node scripts/public-icon-gate.mjs` — PASS
- `node ../scripts/public-web-route-smoke.mjs public` — PASS
- `node ../scripts/public-seo-audit.mjs public` — PASS
- `node ../scripts/public-accessibility-audit.mjs public` — PASS
- `node ../scripts/public-performance-audit.mjs public` — PASS, 9 pages / 2 critical assets / 297670 critical bytes checked
- `git diff --check` — PASS

## Live Edge Note

Fresh external fetch still showed production routing mismatch during this run:

- `https://nhachung.org/` served the older "Hệ sinh thái Sống – Học – Làm – Đầu tư – Cộng đồng" surface.
- `https://www.nhachung.org/` did not return the canonical BrandPro page.
- `https://api.nhachung.org/` served the static Wrangler asset placeholder.

Live Lighthouse and screenshot evidence remain blocked until Cloudflare Pages/custom-domain and Worker routing parity are reconciled.
