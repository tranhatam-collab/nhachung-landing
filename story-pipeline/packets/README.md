# NHA CHUNG STORY PACKETS

**Scope:** Internal-only evidence packets for real public stories and photo packs.
**Rule:** Nothing here belongs in `public/` until the exact story entry is `publish_approved`.

## Folder Contract

Create one folder per real story:

`story-pipeline/packets/<story-id>/`

Required packet files:

- `packet.md` — completed from `STORY_PACKET_TEMPLATE.md`
- `intake-record.json` — canonical internal copy of the intake form payload; keeps `story_id`, `slot_id`, `target_public_route`, and `packet_path` machine-checkable before review starts
- `story-draft.md` — current 200-word working draft before legal/final approval; repeat `story_id`, `slot_id`, and `target_route`
- `consent-record.md` — approved consent scope, timing, and withdrawal note; repeat `story_id`, `slot_id`, and `target_route`
- `legal-review.md` — public boundary review result; repeat `story_id`, `slot_id`, and `target_route`
- `author-final-ok.md` — final edited story approval; repeat `story_id`, `slot_id`, and `target_route`
- `photo-pack/README.md` — what source photos exist and what is public-safe; repeat `story_id`, `slot_id`, and `target_route`
- `asset-exports/README.md` — local hero + 1200x630 OG export note; repeat `story_id`, `slot_id`, and `target_route`, and record source-pack approval plus Brandpro lock status

## Slot Bootstrap

- Run `node scripts/story-packet-bootstrap.mjs` from `nhachung-landing/` to create the five required slot workspaces before real material arrives.
- Bootstrap folders are prep scaffolds only; they do not count as consent, legal, author, or publish approval evidence.
- Keep `approved-story-assets.json` truthful: a slot may stay `missing_packet` until review starts, or move to `packet_seeded` once the scaffold exists, but it does not count toward readiness until real evidence is attached.
- Use `node scripts/story-packet-manifest-sync.mjs` after any real packet change that affects readiness so `required_story_slots`, `missing_evidence`, and `content_gate` stay in sync with the packet evidence.
- Use `story-pipeline/photo-production-brief.md` as the canonical photographer brief and shot-list contract before any source photos are collected.
- Keep the same `story_id`, `slot_id`, and `target_route` across `packet.md` and every child note so consent/legal/publish review cannot drift to the wrong route.
- Keep `intake-record.json` aligned with the same `story_id`, `slot_id`, `target_public_route`, and canonical `packet_path`; this is the handoff artifact from intake into the packet workspace.
- If the exact canonical slot id is not obvious, run `node scripts/story-packet-readiness.mjs --list-slots` or `node scripts/story-packet-intake-sync.mjs --list-slots`; both commands print the canonical slot plus the accepted shorthand selectors that still resolve back to that one slot.
- If the editor needs a slot-safe starter payload, run `node scripts/story-packet-intake-template.mjs --slot=<slot-id> --output=story-pipeline/handoff/<slot-id>.intake-template.json`, then replace every placeholder before validation.
- Start each real intake handoff with `node scripts/story-packet-intake-sync.mjs --slot=<slot-id> --input=<intake-json> --check`, then rerun without `--check` only after the payload is confirmed real for that slot.
- `story-pipeline/intake-payload.example.json` is an internal shape example only; replace every value with the real intake packet before writing into a canonical packet workspace.
- Only the directories named by `required_story_slots[].packet_path` are canonical review workspaces. Remove older `packets/slot-*` prep folders once the manifest points to real `story-YYYYMMDD-*` packet paths.

## Path Rules

- Keep all packet references relative to `story-pipeline/`.
- `approved-story-assets.json` should point to packet files, not vague notes.
- Use canonical asset paths only in `public/assets/` for `hero_asset` and `og_asset`.
- Use `packet_seeded` when the folder scaffold exists but real story/photo/approval evidence is still missing.
- If a slot is `packet_in_review`, `packet_path` must already point to a real `packet.md`.
- If a story is `publish_approved`, every packet file above must exist and align with the manifest entry.

## No Public Drift

- Do not store private address, phone, ID, bank, health, or family-sensitive detail in public-safe files.
- Do not write public story copy that drifts into real-estate, fundraising, spiritual, social, resort, or guaranteed-return claims.
- Do not count a packet toward the content gate until local hero + OG exports are attached and the manifest is truthful.
