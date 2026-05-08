# Live Edge Recheck Evidence — 2026-05-09

Run time: 2026-05-08T21:06:30Z / 2026-05-09T04:06:30+0700

## Scope

T1 production parity and T2 Worker/API root routing after the latest BrandPro source-side gates.

## Result

Blocked by production routing, not by canonical source quality.

The canonical `brand/v2.0-migration` source is clean at commit `20b0673`, but external live fetches still did not return the expected BrandPro/Worker surfaces.

## Canonical Source Checked

- Repo path: `/Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing`
- Branch: `brand/v2.0-migration`
- Commit: `20b0673`
- `public/index.html` SHA-256: `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a`
- Local title: `Nhà Chung | Hệ điều hành cộng đồng sống thật`

## External Fetch Observations

### `https://nhachung.org/`

External web fetch still returned the older public surface:

- Title: `Nhà Chung | Hệ sinh thái Sống – Học – Làm – Đầu tư – Cộng đồng`
- Header/navigation included stale labels such as `Tính năng`, `Modules`, `Cấp độ`, `Lộ trình`, `FAQ`, `Admin`, and `Vào App`.
- Hero H1 included `Nơi Con Người Có Không Gian Ở Thật, Công Việc Thật, Cộng Đồng Thật, Và Dòng Tiền Thật.`

### `https://www.nhachung.org/`

External web fetch did not return a fetchable canonical BrandPro page, so the `www` custom domain still cannot be counted as production evidence.

### `https://api.nhachung.org/`

External web fetch still returned the static Wrangler asset placeholder:

- Heading/content: `Hello, World!`
- Body text described a static asset from `public/index.html` configured in `wrangler.jsonc`.

### `https://nhachung-landing-abp.pages.dev/`

External web fetch did not return a fetchable canonical BrandPro page. Treat the custom domains and Pages alias as unreconciled until Cloudflare routing is checked directly.

## Local Landing Gate Recheck

All source-side T1 gates passed locally:

- `bash scripts/brand-lint.sh public` — PASS
- `node scripts/i18n-smoke.mjs` — PASS
- `node scripts/story-pipeline-lint.mjs` — PASS
- `node scripts/public-analytics-gate.mjs` — PASS
- `node scripts/public-legal-gate.mjs` — PASS
- `node scripts/public-icon-gate.mjs` — PASS
- `node ../scripts/public-web-route-smoke.mjs public` — PASS, 9 pages checked
- `node ../scripts/public-seo-audit.mjs public` — PASS, 9 pages checked
- `node ../scripts/public-accessibility-audit.mjs public` — PASS, 9 pages checked
- `node ../scripts/public-performance-audit.mjs public` — PASS, 9 pages / 2 critical assets / 297670 critical bytes checked

## Worker/App Gate Recheck

Local source checks passed:

- Worker `npm test -- --run` — PASS, 55 tests
- Worker `npx tsc --noEmit` — PASS
- App `node scripts/render-smoke.mjs` — PASS, including all 9 V1 room aliases and live-API loader states
- App `node scripts/check-human-text-character-response-protocol.mjs` — PASS for checked pages

## Release Impact

- Do not count Lighthouse or live screenshot evidence against current production.
- Do not claim `nhachung.org`, `www.nhachung.org`, or `nhachung-landing-abp.pages.dev` parity until Cloudflare Pages routing returns the canonical source hash.
- Do not claim Worker production root parity until `https://api.nhachung.org/` stops serving the static Wrangler asset placeholder.

## Required Next Step

Ops should reconcile Cloudflare Pages custom domains, the Pages alias, and the `api.nhachung.org/*` Worker route/bindings. After that, rerun:

```bash
cd /Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing
bash scripts/brand-lint.sh public
node scripts/i18n-smoke.mjs
node scripts/story-pipeline-lint.mjs
node scripts/public-analytics-gate.mjs
node scripts/public-legal-gate.mjs
node scripts/public-icon-gate.mjs
node scripts/live-edge-smoke.mjs
node ../scripts/public-web-route-smoke.mjs public
node ../scripts/public-seo-audit.mjs public
node ../scripts/public-accessibility-audit.mjs public
node ../scripts/public-performance-audit.mjs public
```

Then record fresh live hashes for `https://nhachung.org/` and `https://www.nhachung.org/`, and only then run Lighthouse and screenshot evidence.
