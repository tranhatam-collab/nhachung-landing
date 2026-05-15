# Live Edge Smoke Network-Blocked Evidence — 2026-05-13

Run time: 2026-05-13 02:12 +07

## Scope

T1 public-web critical-path verification for the canonical `nhachung-landing/public` source.

## Result

Repo-side public gates still pass, and the live-edge verifier was tightened in this run so it now distinguishes a real runtime-parity failure from a sandbox network/DNS block.

Direct live verification from this Codex sandbox is currently **not conclusive** because `nhachung.org` does not resolve here.

## Commands

Run from:

```zsh
cd /Users/tranhatam/Documents/Devnewproject/nhachung.org/nhachung-landing
```

Repo-side gates rerun in this heartbeat:

```zsh
bash scripts/brand-lint.sh public
node scripts/i18n-smoke.mjs
node scripts/story-pipeline-lint.mjs
node scripts/public-analytics-gate.mjs
node ../scripts/public-web-route-smoke.mjs public
node ../scripts/public-seo-audit.mjs public
node ../scripts/public-accessibility-audit.mjs public
node ../scripts/public-performance-audit.mjs public
```

Verifier reruns:

```zsh
node scripts/live-edge-smoke.mjs
node scripts/live-edge-smoke.mjs --json
printf 'ok\n' > /private/tmp/nhachung-live-edge-api-body.txt
node scripts/live-edge-smoke.mjs --root-html=public/index.html --www-html=public/index.html --api-body=/private/tmp/nhachung-live-edge-api-body.txt
node scripts/live-edge-smoke.mjs --root-http=/private/tmp/nhachung-root-200.http --www-http=/private/tmp/nhachung-www-200.http --api-http=/private/tmp/nhachung-api-200.http
node scripts/live-edge-smoke.mjs --json --root-http=/private/tmp/nhachung-root-200.http --www-http=/private/tmp/nhachung-www-502.http --api-http=/private/tmp/nhachung-api-200.http
git diff --check -- scripts/live-edge-smoke.mjs
```

## Results

- `bash scripts/brand-lint.sh public` — PASS
- `node scripts/i18n-smoke.mjs` — PASS
- `node scripts/story-pipeline-lint.mjs` — PASS (`0/5` real story packets remains the separate T5 blocker)
- `node scripts/public-analytics-gate.mjs` — PASS
- `node ../scripts/public-web-route-smoke.mjs public` — PASS, 9 pages
- `node ../scripts/public-seo-audit.mjs public` — PASS, 9 pages
- `node ../scripts/public-accessibility-audit.mjs public` — PASS, 9 pages
- `node ../scripts/public-performance-audit.mjs public` — PASS, 9 pages / 2 critical assets / 291903 critical bytes
- `node scripts/live-edge-smoke.mjs` — `NETWORK_BLOCKED: fetch failed (getaddrinfo ENOTFOUND nhachung.org)`
- `node scripts/live-edge-smoke.mjs --json` — returns structured:

```json
{
  "error_code": "ENOTFOUND",
  "status": "network_blocked"
}
```

- Snapshot-mode self-check — PASS using canonical `public/index.html` for both public hosts plus a temp API body stub
- Raw-HTTP snapshot self-check — PASS using canonical `public/index.html` wrapped in `HTTP/2 200` response fixtures for root + `www`, plus a `200 ok` API fixture
- Raw-HTTP snapshot regression self-check — correctly returns `status=runtime_parity_fail` when the `www` fixture is a real `HTTP/2 502` response instead of silently assuming `200`
- `git diff --check -- scripts/live-edge-smoke.mjs` — PASS

## Gate Tightening Applied

This run improved `scripts/live-edge-smoke.mjs` so the gate now:

- returns `NETWORK_BLOCKED` with exit code `2` when the environment cannot resolve or reach the live hosts
- emits `--json` output for automation/heartbeat consumers
- checks the full `Organization.sameAs` array from canonical source instead of only the first entry
- checks the footer surface cluster `nhachung.org · app.nhachung.org · lamviec.muonnoi.org` instead of a weak empty footer extraction
- accepts raw HTTP response snapshots via `--root-http`, `--www-http`, and `--api-http`, so T1 can machine-check real `502` or other non-200 live evidence without rewriting it into synthetic JSON first

## Release Impact

- This heartbeat did **not** prove live runtime parity PASS.
- This heartbeat also did **not** prove a new live legacy regression on its own.
- The exact new fact is narrower: from this sandbox, T1 live-edge status is currently **externally verifiable only**, while repo-side canonical source and static public gates remain clean.

## Next Step

Use an external fetch path, browser lane, or operator environment with working DNS to rerun:

```zsh
node scripts/live-edge-smoke.mjs --json
```

If it returns `status=pass`, T1 can move back to Lighthouse and Cloudflare Web Analytics token closure. If it returns `status=runtime_parity_fail`, keep runtime/source parity as the active highest-priority blocker.
