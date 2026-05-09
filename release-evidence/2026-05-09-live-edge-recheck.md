# Live Edge Recheck Evidence — 2026-05-09

Run time: 2026-05-09T01:35:18Z / 2026-05-09T08:35:18+0700

## Scope

T1 production parity and T2 Worker/API root routing after the latest BrandPro source-side gates.

## Result

Inconclusive because live fetch paths disagree and local DNS is not repeatable. The canonical source quality gates pass.

The canonical `brand/v2.0-migration` source is clean at commit `43e5a9b`. External web fetches still showed stale/non-canonical surfaces, but shell `curl` briefly returned canonical BrandPro/Worker HTML before repeat hash capture failed on local DNS.

## Canonical Source Checked

- Repo path: `/Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing`
- Branch: `brand/v2.0-migration`
- Commit: `43e5a9beb00e4756685db56397439fd4895ca8e4`
- `public/index.html` SHA-256: `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a`
- Local title: `Nhà Chung | Hệ điều hành cộng đồng sống thật`

## External Fetch Observations

### `https://nhachung.org/`

External web fetch returned the older public surface:

- Title: `Nhà Chung | Hệ sinh thái Sống – Học – Làm – Đầu tư – Cộng đồng`
- Header/navigation included stale labels such as `Tính năng`, `Modules`, `Cấp độ`, `Lộ trình`, `FAQ`, `Admin`, and `Vào App`.
- Hero H1 included `Nơi Con Người Có Không Gian Ở Thật, Công Việc Thật, Cộng Đồng Thật, Và Dòng Tiền Thật.`

Shell `curl` at 2026-05-09T01:34Z returned the canonical BrandPro HTML with title `Nhà Chung | Hệ điều hành cộng đồng sống thật`.

### `https://www.nhachung.org/`

External web fetch did not return a fetchable canonical BrandPro page, so the `www` custom domain still cannot be counted as production evidence.

Shell `curl` at 2026-05-09T01:34Z returned the canonical BrandPro HTML.

### `https://api.nhachung.org/`

External web fetch returned the static Wrangler asset placeholder:

- Heading/content: `Hello, World!`
- Body text described a static asset from `public/index.html` configured in `wrangler.jsonc`.

Shell `curl` at 2026-05-09T01:34Z returned the Worker API home HTML with `Nha Chung API` and `Cloudflare Worker + D1`.

### `https://nhachung-landing-abp.pages.dev/`

External web fetch did not return a fetchable canonical BrandPro page. Treat the custom domains and Pages alias as unreconciled until Cloudflare routing is checked directly.

Shell `curl` at 2026-05-09T01:34Z returned the canonical BrandPro HTML.

### Repeatability Limitation

Immediate repeat hash capture via shell `curl` failed with `Could not resolve host` for the custom domains, Pages alias, and API domain. `node scripts/live-edge-smoke.mjs` also failed with `getaddrinfo ENOTFOUND nhachung.org`.

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

- Do not count Lighthouse or live screenshot evidence until live hash capture is repeatable.
- Do not claim final `nhachung.org`, `www.nhachung.org`, or `nhachung-landing-abp.pages.dev` parity until a stable network records canonical source hashes.
- Do not claim final Worker production root parity until a stable network records the Worker API home without the static placeholder.

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
