# Live Edge Mismatch Evidence — 2026-05-08

Run times:

- 2026-05-08T08:45:22Z
- 2026-05-08T09:21:06Z

Scope: T1 public web production parity and Worker/API edge routing.

## Result

Blocked. The canonical `brand/v2.0-migration` source is clean, but live web fetches did not match the expected canonical production state.

## Canonical Source Checked

- Repo path: `/Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing`
- Branch: `brand/v2.0-migration`
- Commit: `e1685134836cd00a8e3cba0452123c6515d5aa24`
- `public/index.html` SHA-256: `db3a4103adb01ec5a5f2e344c30be13aab05a153bc578042cdcc512c2fff1a78`
- Local title: `Nhà Chung | Hệ điều hành cộng đồng sống thật`

## Live Fetch Observations

### `https://nhachung.org/`

The live document rendered the older public surface:

- Title: `Nhà Chung | Hệ sinh thái Sống – Học – Làm – Đầu tư – Cộng đồng`
- Header/navigation included `Tính năng`, `Modules`, `Cấp độ`, `Lộ trình`, `FAQ`, `Admin`, and `Vào App`.
- Hero H1 included: `Nơi Con Người Có Không Gian Ở Thật, Công Việc Thật, Cộng Đồng Thật, Và Dòng Tiền Thật.`
- Footer showed only `Privacy`, `Terms`, and `API`, not the canonical legal/footer set in the current BrandPro source.

### `https://www.nhachung.org/`

The 2026-05-08T09:21:06Z web fetch returned a 502 for `https://www.nhachung.org/` instead of the canonical BrandPro page.

### `https://api.nhachung.org/`

The live root rendered a static asset page:

- Heading/content: `Hello, World!`
- Body text: `This page comes from a static asset stored at public/index.html as configured in wrangler.jsonc.`

## Release Impact

- Do not mark Lighthouse/live screenshot evidence complete against current production.
- Do not claim `nhachung.org`/`www.nhachung.org` production hash parity until the correct Pages project is confirmed at the edge.
- Do not claim Worker API production root parity until `api.nhachung.org` routing is confirmed. Endpoint-specific newsletter smoke may still be valid, but the root route evidence conflicts with the current handoff.

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
