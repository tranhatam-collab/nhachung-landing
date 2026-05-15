# Live Edge Regression Evidence — 2026-05-13

Run time: 2026-05-13 02:31 +07 refresh

## Scope

T1 public-web critical path after the earlier 2026-05-09 live-edge PASS.

## Result

BLOCKED. The canonical `nhachung-landing/public` source still passes all repo-side public gates, `node scripts/live-edge-smoke.mjs --json` still returns `status=network_blocked` from this sandbox, a same-turn direct fetch re-confirms the legacy public surface on `https://nhachung.org/`, and `https://www.nhachung.org/` now directly returns `502 Bad Gateway`.

## Canonical Source Recheck

Repo path: `/Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing`

Commands rerun from the repo root on 2026-05-13 02:31 +07:

```bash
cd /Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing
bash scripts/brand-lint.sh public
node scripts/i18n-smoke.mjs
node scripts/story-pipeline-lint.mjs
node ../scripts/public-web-route-smoke.mjs public
node ../scripts/public-seo-audit.mjs public
node ../scripts/public-accessibility-audit.mjs public
node scripts/public-analytics-gate.mjs
node ../scripts/public-performance-audit.mjs public
node scripts/live-edge-smoke.mjs --json
```

Results:

- `bash scripts/brand-lint.sh public` — PASS
- `node scripts/i18n-smoke.mjs` — PASS
- `node scripts/story-pipeline-lint.mjs` — PASS (`0/5` real stories remains the separate T5 blocker)
- `node ../scripts/public-web-route-smoke.mjs public` — PASS, 9 pages checked
- `node ../scripts/public-seo-audit.mjs public` — PASS, 9 pages checked
- `node ../scripts/public-accessibility-audit.mjs public` — PASS, 9 pages checked
- `node scripts/public-analytics-gate.mjs` — PASS
- `node ../scripts/public-performance-audit.mjs public` — PASS, 9 pages / 2 critical assets / 291903 critical bytes checked
- `node scripts/live-edge-smoke.mjs --json` — `status=network_blocked`, `error_code=ENOTFOUND`

## Independent Live Fetch Observations

The desktop shell in this sandbox cannot resolve `nhachung.org`, so direct local live verification is still inconclusive here and the root-host regression proof comes from an external fetch path rather than local `curl`.

### `https://nhachung.org/`

The live document returned the legacy surface again, including these stale markers:

- Title/surface family: `Nhà Chung | Hệ sinh thái Sống – Học – Làm – Đầu tư – Cộng đồng`
- Hero H1: `Nơi Con Người Có Không Gian Ở Thật, Công Việc Thật, Cộng Đồng Thật, Và Dòng Tiền Thật.`
- Navigation labels: `Tính năng`, `Modules`, `Cấp độ`, `Lộ trình`, `FAQ`
- Public copy drift: `Nhà Chung không phải bất động sản`, `Không phải câu lạc bộ đầu tư`, `Đầu tư thiếu hệ sinh thái bảo vệ`, `Module Đầu Tư`, `Vốn đầu tư`, `dòng tiền`

### `https://www.nhachung.org/`

This heartbeat did independently recheck `www`. The current direct response is `502 Bad Gateway`, so the blocker is no longer "not yet re-proved"; it is a concrete runtime failure on the `www` host.

## Release Impact

- Reopen T1 runtime/source parity as the highest-priority public-web blocker.
- Treat `https://www.nhachung.org/` as a hard runtime failure until it stops returning `502 Bad Gateway`.
- Do not count Lighthouse >= 95, screenshot parity, or Cloudflare Web Analytics beacon proof as closable until live edge parity is restored on both root and `www`.
- Treat `nhachung-landing/release-evidence/2026-05-09-live-edge-recheck.md` as historical evidence only, not current release truth.

## Exact Next Step

Ops must reconcile the Cloudflare Pages/runtime surface that is answering for `https://nhachung.org/` and the failing `www` runtime path that is currently returning `502 Bad Gateway`, then rerun live edge smoke against the canonical markers before continuing with Lighthouse or analytics-token closure. When Codex still cannot resolve live DNS, save the external evidence as `--root-response`, `--www-response`, and `--api-response` JSON snapshots with `status`, `contentType`, and `body`, then feed those snapshots back into `node scripts/live-edge-smoke.mjs --json` so the same semantic gate can classify the regression or confirm parity inside the sandbox.
