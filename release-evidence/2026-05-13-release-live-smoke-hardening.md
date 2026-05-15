# Release Live Smoke Hardening — 2026-05-13

Run time: 2026-05-13 04:28 +07

## Scope

T1 public-web critical-path guardrail hardening after the live edge regression was re-opened.

## Why this change was needed

`/Users/tranhatam/Documents/Devnewproject/nhachung.org/scripts/release-live-smoke.mjs` was still too broad for the reopened T1 blocker:

- it only checked `https://nhachung.org`, not `https://www.nhachung.org`
- homepage acceptance still allowed a false-green path because it only looked for generic `Nhà Chung` presence instead of canonical BrandPro markers plus stale-marker rejection

That meant the script could remain historically PASS-shaped even while the active blocker had shifted back to live root + `www` runtime parity.

## Change applied

The live smoke script now:

- checks both `--public-base` and a dedicated `--www-base` mirror (default `https://www.nhachung.org`)
- requires the canonical homepage markers `Hệ điều hành cộng đồng sống thật`, `Ba hình thức Nhà Chung`, `Làm việc muôn nơi`, `Đăng ký miễn phí`, `VIET CAN NEW CORP`, and `CÔNG TY TNHH BỒ CÂU TRẮNG`
- rejects the same stale legacy homepage markers already used by the T1 live-edge regression evidence, including `Hệ sinh thái Sống`, `Modules`, `Cấp độ`, `Lộ trình`, and the older `Nơi Con Người Có Không Gian Ở Thật...` hero family
- prints an explicit follow-up reminder to rerun `node nhachung-landing/scripts/live-edge-smoke.mjs --json` before treating T1 live smoke as closure evidence

## Verification

Run from `/Users/tranhatam/Documents/Devnewproject/nhachung.org`:

```zsh
node scripts/release-live-smoke.mjs --dry-run --json
```

Run from `/Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing`:

```zsh
bash scripts/brand-lint.sh public
node scripts/i18n-smoke.mjs
node scripts/story-pipeline-lint.mjs
node scripts/public-analytics-gate.mjs
node ../scripts/public-web-route-smoke.mjs public
node ../scripts/public-seo-audit.mjs public
node ../scripts/public-accessibility-audit.mjs public
node ../scripts/public-performance-audit.mjs public
git diff --check -- ../scripts/release-live-smoke.mjs
```

Results in this heartbeat:

- `node scripts/release-live-smoke.mjs --dry-run --json` — PASS, confirming the new `wwwBase` config plus the canonical/stale homepage marker sets are wired into the operator command shape
- `bash scripts/brand-lint.sh public` — PASS
- `node scripts/i18n-smoke.mjs` — PASS
- `node scripts/story-pipeline-lint.mjs` — PASS
- `node scripts/public-analytics-gate.mjs` — PASS
- `node ../scripts/public-web-route-smoke.mjs public` — PASS
- `node ../scripts/public-seo-audit.mjs public` — PASS
- `node ../scripts/public-accessibility-audit.mjs public` — PASS
- `node ../scripts/public-performance-audit.mjs public` — PASS
- `git diff --check -- ../scripts/release-live-smoke.mjs` — PASS

Additional same-turn local harness proof was attempted by pointing `--public-base`, `--www-base`, `--app-base`, and `--api-base` at one local mock server, but this sandbox does not permit binding `127.0.0.1` (`listen EPERM`). So end-to-end execution of the stricter live smoke path still needs either a DNS-working operator environment or a less-restricted local runner.

## Release impact

- No live parity blocker was closed in this run.
- The highest-priority unfinished T1 lane is unchanged: root + `www` runtime parity.
- The repo-side operator path is now stricter, so a future broad live smoke rerun cannot silently ignore the `www` runtime failure or the legacy homepage marker regression.
