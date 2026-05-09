# Live Edge Recheck Evidence — 2026-05-09

Run time: 2026-05-09T01:39Z / 2026-05-09T08:39+0700

## Scope

T1 production parity for `nhachung.org` / `www.nhachung.org` and T2 Worker/API root routing after the latest BrandPro and Worker deploys.

## Result

**PASS.** Live custom domains, `www`, local source, and the latest Pages preview all serve the canonical Brand v2.0 HTML hash. `api.nhachung.org/` serves the Worker API home and no longer serves the static Wrangler placeholder.

## Canonical Source Checked

- Repo path: `/Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing`
- Branch: `brand/v2.0-migration`
- `public/index.html` SHA-256: `1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a`
- Local title: `Nhà Chung | Hệ điều hành cộng đồng sống thật`

## Live Edge Smoke

Command:

```bash
node scripts/live-edge-smoke.mjs
```

Output:

```text
Live edge smoke PASS
local index hash: 1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a
https://nhachung.org/ title="Nhà Chung | Hệ điều hành cộng đồng sống thật" hash=1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a
https://www.nhachung.org/ title="Nhà Chung | Hệ điều hành cộng đồng sống thật" hash=1462b82ec977dae14349d104bbf989e97369ce3290ff26f0272d3133e1fc1d6a
https://api.nhachung.org/ status=200 content-type="text/html; charset=utf-8"
```

## Gate Correction

The previous inconclusive run failed on marker `Sống tự do`. That marker was not present in the canonical `public/index.html`, so the smoke gate itself was stale. `scripts/live-edge-smoke.mjs` now checks markers that are present in the approved Brand v2.0 source:

- `Hệ điều hành cộng đồng sống thật`
- `Ba hình thức Nhà Chung`
- `Làm việc muôn nơi`
- `Đăng ký miễn phí`
- `VIET CAN NEW CORP`
- `CÔNG TY TNHH BỒ CÂU TRẮNG`

The gate still rejects stale markers:

- `Hệ sinh thái Sống`
- `Modules`
- `Cấp độ`
- `Lộ trình`
- `Hello, World!`

## Local Landing Gates

All source-side T1 gates passed in the Batch 1 verification:

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

## Worker/App Cross-Check

- Worker baseline: `eeadb59 feat(worker): audit public verify checks`
- Worker production version: `8d263561-6cd0-467b-86ad-bf3c560de820`
- Worker `npm test`: PASS `57/57`
- Worker `npx tsc --noEmit`: PASS
- Root `node scripts/release-live-smoke.mjs`: PASS `12 gates`
- App `node scripts/render-smoke.mjs`: PASS, including all 9 V1 room aliases and live-API loader states

## Release Impact

Public hash parity and Worker root routing are no longer blockers. The remaining T1 release evidence blockers are:

1. Lighthouse mobile + desktop score >= 95.
2. Screenshot evidence for homepage, app link, signup flow, and legal footer.
3. PR/main reconciliation or a written decision that `brand/v2.0-migration` is the production branch until merge.
4. Cloudflare Web Analytics token injection in runtime config.
