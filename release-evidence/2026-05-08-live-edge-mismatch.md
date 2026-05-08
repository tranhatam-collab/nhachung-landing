# Live Edge Mismatch Evidence — 2026-05-08

Run times:

- 2026-05-08T08:45:22Z
- 2026-05-08T09:21:06Z
- 2026-05-08T13:42:15Z
- 2026-05-08T14:30:15Z
- 2026-05-08T15:09:10Z
- 2026-05-08T15:33:10Z
- 2026-05-08T15:56:21Z

Scope: T1 public web production parity and Worker/API edge routing.

## Result

Blocked. The canonical `brand/v2.0-migration` source is clean, but live web fetches did not match the expected canonical production state.

## Canonical Source Checked

- Repo path: `/Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing`
- Branch: `brand/v2.0-migration`
- Commit: `fe1c057`
- `public/index.html` SHA-256: `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a`
- Local title: `Nhà Chung | Hệ điều hành cộng đồng sống thật`

## Live Fetch Observations

### `https://nhachung.org/`

The live document rendered the older public surface again in the 2026-05-08T13:42Z, 2026-05-08T14:30Z, 2026-05-08T15:09Z, 2026-05-08T15:33Z, and 2026-05-08T15:56Z verifications:

- Title: `Nhà Chung | Hệ sinh thái Sống – Học – Làm – Đầu tư – Cộng đồng`
- Header/navigation included `Tính năng`, `Modules`, `Cấp độ`, `Lộ trình`, `FAQ`, `Admin`, and `Vào App`.
- Hero H1 included: `Nơi Con Người Có Không Gian Ở Thật, Công Việc Thật, Cộng Đồng Thật, Và Dòng Tiền Thật.`
- Footer showed only `Privacy`, `Terms`, and `API`, not the canonical legal/footer set in the current BrandPro source.

### `https://www.nhachung.org/`

The 2026-05-08T09:21:06Z, 2026-05-08T13:42Z, 2026-05-08T14:30Z, 2026-05-08T15:09Z, 2026-05-08T15:33Z, and 2026-05-08T15:56Z web fetches returned a 502 for `https://www.nhachung.org/` instead of the canonical BrandPro page.

### `https://api.nhachung.org/`

The live root rendered a static asset page again in the 2026-05-08T13:42Z, 2026-05-08T14:30Z, 2026-05-08T15:09Z, 2026-05-08T15:33Z, and 2026-05-08T15:56Z verifications:

- Heading/content: `Hello, World!`
- Body text: `This page comes from a static asset stored at public/index.html as configured in wrangler.jsonc.`

## Release Impact

- Do not mark Lighthouse/live screenshot evidence complete against current production.
- Do not claim `nhachung.org`/`www.nhachung.org` production hash parity until the correct Pages project is confirmed at the edge.
- Do not claim Worker API production root parity until `api.nhachung.org` routing is confirmed. Endpoint-specific newsletter smoke may still be valid, but the root route evidence conflicts with the current handoff.

## Local Gate Recheck — 2026-05-08T15:56Z

The canonical source gates last passed locally from `/Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing`; the live-edge shell smoke still cannot resolve the public host from this sandbox:

- `bash scripts/brand-lint.sh public` — PASS
- `node scripts/i18n-smoke.mjs` — PASS
- `node scripts/story-pipeline-lint.mjs` — PASS
- `node scripts/public-analytics-gate.mjs` — PASS
- `node scripts/public-legal-gate.mjs` — PASS
- `node scripts/public-icon-gate.mjs` — PASS
- `node ../scripts/public-web-route-smoke.mjs public` — PASS, 9 pages checked
- `node ../scripts/public-seo-audit.mjs public` — PASS, 9 pages checked
- `node ../scripts/public-accessibility-audit.mjs public` — PASS, 9 pages checked
- `node ../scripts/public-performance-audit.mjs public` — PASS, 9 pages / 2 critical assets / 297802 critical bytes checked
- `git diff --check` — PASS
- `node scripts/live-edge-smoke.mjs` — FAIL in local shell before HTTP fetch because this sandbox cannot resolve `nhachung.org` (`getaddrinfo ENOTFOUND nhachung.org`)

Independent web fetch evidence above still confirms the edge mismatch, so the release gate remains blocked on Cloudflare routing/parity rather than local source quality.

## Worker Gate Recheck — 2026-05-08T15:09Z

Worker source gates pass locally from `/Users/tranhatam/Documents/Devnewproject/nhachung.org/apps/worker`:

- `npm test -- --run` — PASS, 54 tests
- `npx tsc --noEmit` — PASS

This verifies the source-side root route guard, but production `https://api.nhachung.org/` still needs a routing/deploy reconciliation because the live root continues serving the static Wrangler asset placeholder.

## Required Next Step

Ops should reconcile Cloudflare custom-domain routing and Worker bindings, then rerun:

```bash
cd /Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing
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
```

After deploy/routing is fixed, record fresh live hashes for `https://nhachung.org/` and `https://www.nhachung.org/`, then run Lighthouse and screenshot evidence.
