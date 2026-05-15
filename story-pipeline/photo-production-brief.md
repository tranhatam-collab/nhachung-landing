# NHA CHUNG PHOTO PRODUCTION BRIEF

**Scope:** Internal-only capture brief for the five required T5 story/photo slots.
**Status rule:** This brief enables capture and handoff. It does not count as consent, legal review, author final OK, or publish approval.
**Brand lock:** Gold/White/Black only. Public photos must reinforce calm, precise, real, long-term positioning and must not make Nhà Chung read like real-estate sales, fundraising, resort, spiritual, or social-network marketing.

## Required Delivery Set

- Four house packs: Da Lat (Đà Lạt), Sai Gon (Sài Gòn), Lam Dong (Lâm Đồng), Nha Trang.
- One cross-house member journey pack.
- Minimum source delivery per house pack: 20 approved raw/source images after trim.
- Minimum source delivery for the cross-house journey pack: 12 approved raw/source images after trim.
- Every pack must identify one public-safe hero candidate and one 1200x630 OG crop candidate.
- Private address markers, license plates, IDs, banking detail, health detail, or family-sensitive detail must be excluded before any public review.

## File and Folder Contract

- Keep source files outside `public/`.
- Attach each capture batch to the matching packet folder under `story-pipeline/packets/<story-id>/photo-pack/`.
- Recommended source folder naming:
  - `raw/`
  - `trimmed/`
  - `selects/`
- Recommended file naming:
  - `YYYYMMDD-house-slot-seq-description.jpg`
  - Example: `20260512-da-lat-slot-01-hero-exterior.jpg`
- Record the actual storage location in `photo-pack/README.md`.

## Shot List By Slot

### Slot 01 — Da Lat (Đà Lạt) house story

- Hero exterior showing entry and surrounding calm.
- One shared table or shared kitchen moment.
- One work-focused scene with desk or laptop in real use.
- One quiet belonging detail: books, plants, window light, or shoes at entry.
- One transition image that reads long-term living instead of short-stay travel.

### Slot 02 — Sai Gon (Sài Gòn) house story

- Hero exterior or arrival moment that reads urban but grounded.
- One living or dining scene with real interaction.
- One work or study scene with clear daily rhythm.
- One detail image that shows care and order, not luxury signaling.
- One night or low-light scene only if it remains calm and documentary.

### Slot 03 — Lam Dong (Lâm Đồng) house story

- Hero frame showing land, air, and structure together.
- One communal work or meal scene.
- One slow activity scene: reading, tending plants, preparing food.
- One detail frame that signals maintenance and lived-in trust.
- One route or transition frame that supports the story body.

### Slot 04 — Nha Trang house story

- Hero exterior that stays house-first, not tourism-first.
- One shared indoor working/living scene.
- One listening/talking scene between members.
- One detail image that shows routine, not leisure promotion.
- One contextual frame that avoids resort cues.

### Slot 05 — Cross-house member journey

- One portrait or contextual image approved for the member story.
- One work scene from one house.
- One belonging/community scene from a second house or circle.
- One travel-transition or movement image that supports the journey arc.
- One detail image tied to contribution, routine, or verified effort.

## Consent and Review Gate Before Handoff

- Every identifiable person in the selected pack must have a matching consent scope.
- If a face photo is not approved, only contextual/no-face candidates may move forward.
- If quote usage is `summary_only` or `no_quote`, the packet must reflect that before draft editing.
- Do not mark a slot `packet_in_review` until the real draft, source photo pack path, and consent record all exist.
- Do not assign hero/OG exports until the selected images are confirmed public-safe.

## Export Requirements For Public Use

- Hero image must fit the target story page without cropping out the human context that makes the scene real.
- OG image must be exported at `1200x630`.
- Export notes must be recorded in `story-pipeline/packets/<story-id>/asset-exports/README.md`.
- Public asset paths must stay under `public/assets/`.
- No stock-photo URLs and no placeholder imagery once a real slot moves to publish review.

## Verification Before Calling The Brief Ready

- `photo-production-brief.md` exists and matches the five required slots.
- Matching packet folders already exist under `story-pipeline/packets/`.
- `node scripts/story-pipeline-lint.mjs`
- `git diff --check`
