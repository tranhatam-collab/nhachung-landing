# NHA CHUNG STORY PIPELINE

**Scope:** Internal story intake and publishing control for `cau-chuyen.html` and future public story pages.
**Public exposure:** Nothing in this folder is deployed by Cloudflare Pages because production publishes only `public/`.
**Version:** 2026-05-08 v1

## Required States

| State | Owner | Exit rule |
|---|---|---|
| `draft_received` | Story editor | Intake form complete with author contact and context. |
| `consent_signed` | Story editor | Author explicitly approves name, photo, quote, and edit scope. |
| `privacy_trimmed` | Story editor | Private address, phone, finance, and sensitive family detail removed. |
| `legal_review` | Legal reviewer | Public word filter, entity rules, and no gated/investment content checked. |
| `author_final_ok` | Story editor | Final 200-word version sent back to author and accepted. |
| `publish_approved` | Publisher | Packet folder complete, page generated from `story-template.html`, and sitemap/OG metadata reviewed. |

## Intake Fields

- Story ID: `story-YYYYMMDD-slug`
- Author display name
- Author legal name, kept internal
- Contact email or phone, kept internal
- House or circle context
- Story body, target 200 words after editing
- Photo credit and usage approval
- Quote approval
- Consent timestamp
- Reviewer notes
- Save the intake payload into `story-pipeline/packets/<story-id>/intake-record.json` before review starts.
- `intake-record.json` must hold real author/contact/story/consent values before the slot can leave `packet_seeded`.
- Keep `legal_review: false` in `intake-record.json` until the separate `legal-review.md` step actually happens; review-start does not require pre-completing legal review.
- Record `withdrawal_rule_recorded` as a real yes/true confirmation inside `intake-record.json` before review starts; leaving it pending keeps the slot blocked.
- Refresh the full batch handoff bundle with `node scripts/story-packet-handoff-bundle.mjs` before asking Brand/Content to fill real intake packets across the five required slots.
- Start from a slot-safe starter file when needed: `node scripts/story-packet-intake-template.mjs --slot=<slot-id> --output=story-pipeline/handoff/<slot-id>.intake-template.json`.
- Validate the payload against the canonical slot first with `node scripts/story-packet-intake-sync.mjs --slot=<slot-id> --input=<intake-json> --check`.
- Use `node scripts/story-packet-readiness.mjs --handoff --slot=<slot-id>` when the editor needs the exact next intake/consent/photo fields for one canonical packet before writing.
- Run the same command without `--check` only when the payload is real and internal-review safe; it syncs `intake-record.json`, `packet.md`, `story-draft.md`, and `consent-record.md` while preserving canonical `story_id`, `target_public_route`, and `packet_path`, then refreshes `approved-story-assets.json` so slot status, missing evidence, and `content_gate` stay truthful.
- Use `node scripts/story-packet-manifest-sync.mjs --check` when you only need to verify that `approved-story-assets.json` still matches the packet reality.
- Packet path: `story-pipeline/packets/<story-id>/packet.md`

## Legal Review Checklist

- No public promise about financial outcome, income, ROI, capital raise, or ownership return.
- No internal-only entity name or private investment structure.
- No private address, private phone, ID document, bank detail, or health/family sensitive detail.
- Public legal footer remains unchanged from the BrandPro pack.
- The author can withdraw consent before publishing.
- Use `consent-checklist.md` before moving any real person or photo into a public draft.
- Build the packet folder from `packets/STORY_PACKET_TEMPLATE.md` before marking any slot `packet_in_review`.
- Save the intake payload into `packets/<story-id>/intake-record.json` so the packet starts with one canonical internal record of route, author scope, and consent inputs.

## Publish Checklist

1. Complete `publish-checklist.md` and copy `story-template.html` into a future public story route only after `publish_approved`.
2. Replace every `{{placeholder}}`.
3. Keep the story body close to 200 words.
4. Add a 1200x630 OG image for that specific story.
5. Add the story/photo entry to `approved-story-assets.json` with the final `public_route`, `hero_asset`, `og_asset`, `packet_record`, `source_photo_pack`, `photo_policy`, `consent_record`, `legal_record`, `author_final_record`, and `language_review`.
6. Set `photo_consent`, `legal_review`, `author_final_ok`, and `publish_approved` to true only after the real packet is complete.
7. Keep `story_id`, `slot_id`, and `target_route` identical across `packet.md`, `intake-record.json`, `story-draft.md`, `consent-record.md`, `legal-review.md`, `author-final-ok.md`, `photo-pack/README.md`, and `asset-exports/README.md`.
8. Keep the matching item in `required_story_slots` truthful via `node scripts/story-packet-manifest-sync.mjs`; the slot moves from `missing_packet` to `packet_seeded`, then to `packet_in_review`, and finally `publish_ready` based on real packet evidence.
9. Keep `content_gate.ready_story_count` truthful through the same sync command; the gate is not complete until 5 real approved story/photo packs are ready.
10. Before a slot can leave `packet_seeded`, keep `intake-record.json` aligned with the same `story_id`, `slot_id`, `target_public_route`, and canonical `packet_path`.
11. Before a slot can leave `packet_seeded`, `intake-record.json` must contain a real author/contact/story/consent payload, not just schema placeholders or `null`.
12. Before a slot can leave `packet_seeded`, attach the next three real unblockers in the packet itself: a non-`TBD` `story-draft.md`, a real `photo-pack/README.md` source photo location, and a real `consent-record.md`.
13. Keep `story-draft.md` and `packet.md` free of real-estate, fundraising, spiritual, social-network, resort, and guaranteed-return wording; Brandpro language drift keeps the slot blocked even after the intake + review unblockers exist.
14. Run:

```bash
node scripts/story-packet-intake-template.mjs --slot=<slot-id> --output=story-pipeline/handoff/<slot-id>.intake-template.json
node scripts/story-packet-handoff-bundle.mjs
node scripts/story-packet-intake-sync.mjs --slot=<slot-id> --input=<intake-json> --check
node scripts/story-packet-readiness.mjs --handoff --slot=<slot-id>
node scripts/story-packet-manifest-sync.mjs --check
node scripts/story-packet-readiness.mjs
node scripts/story-pipeline-lint.mjs
bash scripts/brand-lint.sh public
node scripts/i18n-smoke.mjs
git diff --check
```
