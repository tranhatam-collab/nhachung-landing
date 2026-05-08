# Brand Icon Export Evidence — 2026-05-08

Run time: 2026-05-08T15:33:10Z

Scope: T5 Brand & Content production logo/app-icon export gap for the canonical `nhachung-landing/public` BrandPro source.

## Source

Canonical SVG source:

- `public/assets/logo/01-monogram.svg`

Export command:

- `NODE_PATH=../apps/worker/node_modules node scripts/export-brand-icons.mjs`

The script uses the existing local `sharp` dependency from `apps/worker/node_modules`; it does not require a network install.

## Exported PNG Set

- `public/assets/icons/icon-16.png` — 16 x 16
- `public/assets/icons/icon-32.png` — 32 x 32
- `public/assets/icons/icon-64.png` — 64 x 64
- `public/assets/icons/icon-128.png` — 128 x 128
- `public/assets/icons/icon-256.png` — 256 x 256
- `public/assets/icons/icon-512.png` — 512 x 512
- `public/assets/icons/icon-1024.png` — 1024 x 1024
- `public/assets/icons/app/apple-touch-icon.png` — 180 x 180
- `public/assets/icons/app/icon-192-maskable.png` — 192 x 192
- `public/assets/icons/app/icon-512-maskable.png` — 512 x 512

## Wiring

- `public/manifest.json` now includes PNG `any` and `maskable` app icons.
- The 9 public BrandPro HTML pages link the SVG favicon, 32 px PNG favicon, Apple touch icon, and manifest.
- The 8 VI/EN legal pages link the same icon set with absolute paths.

## Verification

- `node scripts/public-icon-gate.mjs` — verifies PNG headers/dimensions, manifest icon entries, and public/legal page links.

This closes the repo-side PNG/app-icon export gap for T5. Favicon ICO packaging remains a designer/browser-compatibility enhancement, not a blocker for the current Pages manifest path.
