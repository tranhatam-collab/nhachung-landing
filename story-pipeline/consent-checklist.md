# NHA CHUNG STORY CONSENT CHECKLIST

**Scope:** Internal-only checklist before any real person, quote, or photo moves from intake into a public story draft.
**Status rule:** If any item is not true, the story remains outside `public/`.

## Required Identity + Scope

- Record the `story_id` and proposed public route.
- Capture the author display name and author legal name exactly as approved.
- Capture one working contact channel for the author.
- Confirm whether the public story uses the real name, first name only, or a pseudonym.
- Confirm whether a face photo is allowed, a contextual photo only is allowed, or no photo is allowed.

## Required Consent Evidence

- Author explicitly approves edit scope for a public 200-word story.
- Author explicitly approves quote usage or explicitly declines quote usage.
- Author explicitly approves photo usage and photo credit text, or confirms there should be no photo.
- Consent timestamp is recorded.
- Withdrawal rule is recorded: the author may withdraw consent before `publish_approved`.

## Privacy + Legal Guard

- Remove private address, private phone, ID numbers, bank detail, health detail, and family-sensitive detail.
- Remove or rewrite anything that makes Nhà Chung read as "not a real-estate marketplace" only by disclaimer while the surrounding copy still behaves like one.
- Remove or rewrite anything that makes Nhà Chung read as "not a public capital-solicitation platform" only by disclaimer while the surrounding copy still behaves like one.
- Remove or rewrite any promise of ROI, guaranteed income, guaranteed house, ownership return, fundraising, resort, spiritual movement, or social network positioning.
- Confirm the story stays in the calm, precise, real, long-term public voice.

## Evidence Hand-off

- Create the packet folder from `story-pipeline/packets/STORY_PACKET_TEMPLATE.md` before review starts.
- Save the intake payload in `story-pipeline/packets/<story-id>/intake-record.json` before review starts.
- Do not move a slot out of `packet_seeded` until `intake-record.json` has real author/contact/story/consent values, not only schema placeholders or `null`.
- If the editor does not remember the exact canonical slot id, run `node scripts/story-packet-readiness.mjs --list-slots` first; `--slot=` also accepts the unique story-id/route/house shorthand for one canonical packet.
- If the editor needs the exact missing intake/consent/photo fields for one slot, run `node scripts/story-packet-readiness.mjs --handoff --slot=<slot-id>` before editing packet files.
- Validate the payload against the canonical slot first: `node scripts/story-packet-intake-sync.mjs --slot=<slot-id> --input=<intake-json> --check`.
- Only write the payload after the check passes and the packet really belongs to that slot: `node scripts/story-packet-intake-sync.mjs --slot=<slot-id> --input=<intake-json>`.
- Copy the exact same `story_id`, `slot_id`, and `target_route` into `packet.md`, `intake-record.json`, `consent-record.md`, `legal-review.md`, `author-final-ok.md`, `story-draft.md`, `photo-pack/README.md`, and `asset-exports/README.md`.
- Save the approved source photo pack outside `public/` until publish approval is final.
- Add or update the story entry in `approved-story-assets.json`, including `packet_record`, `source_photo_pack`, `photo_policy`, and `consent_record`.
- Add or update the matching slot `packet_path` when a packet scaffold is seeded, mark it `packet_seeded`, and move it to `packet_in_review` only once real story/photo/approval review is actively happening.
- Do not move the story into a public route until legal review and author final OK are both true.
- Do not count the story toward the content gate until a real local hero asset and 1200x630 OG asset are both assigned.
