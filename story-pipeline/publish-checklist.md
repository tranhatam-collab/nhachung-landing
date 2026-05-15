# NHA CHUNG STORY PUBLISH CHECKLIST

**Scope:** Final publisher checklist for a real approved story and photo pack.
**Entry condition:** Consent, privacy trim, legal review, and author final OK are already complete.

## Before Copying Into `public/`

- Confirm the packet file exists at `story-pipeline/packets/<story-id>/packet.md` and matches the story entry.
- Confirm `story-pipeline/packets/<story-id>/intake-record.json` exists and still matches the canonical packet route and packet path.
- Confirm `intake-record.json` already contains the real author/contact/story/consent payload that review began from; `null`, empty string, or pending booleans keep the slot blocked.
- Confirm the same `story_id`, `slot_id`, and `target_route` appear consistently across the packet, `intake-record.json`, and every child note.
- Confirm `story-pipeline/packets/<story-id>/story-draft.md` holds the working public-safe draft that legal and the author actually reviewed.
- Confirm the story entry in `approved-story-assets.json` is updated with the final route, approved local hero asset, final `og_asset`, and `packet_record`.
- Confirm `photo_consent`, `legal_review`, `author_final_ok`, and `publish_approved` are all true only when the final package is actually ready.
- Confirm `source_photo_pack`, `consent_record`, `legal_record`, `author_final_record`, and `language_review` are all filled with the internal evidence references for this exact story.
- Confirm `node scripts/story-packet-manifest-sync.mjs --check` passes so `required_story_slots`, `missing_evidence`, and `content_gate` still match the packet truth.
- Confirm the story body stays near 200 words and does not drift into gated/internal detail.
- Confirm the story draft and packet summary do not use real-estate, fundraising, spiritual, social-network, resort, or guaranteed-return wording.
- Confirm the photo pack has one public-safe hero image and one 1200x630 OG image.
- Confirm `asset-exports/README.md` records the same final route, hero asset, and OG asset as `packet.md` and the manifest story entry.
- Confirm `asset-exports/README.md` says the assets came from the approved source pack and that the Brandpro lock check passed.

## Public-Safe Asset Rules

- Use local approved assets only; do not use stock-photo URLs for real approved stories.
- Keep hero/OG assets inside canonical `public/assets/`.
- Keep legal footer and disclaimer unchanged.
- Keep Gold/White/Black and Brandpro language rules intact.

## Verification Commands

```bash
node scripts/story-packet-readiness.mjs
node scripts/story-packet-manifest-sync.mjs --check
node scripts/story-pipeline-lint.mjs
bash scripts/brand-lint.sh public
node scripts/i18n-smoke.mjs
git diff --check
```

## Release Note

- If the story is the first real approved public story, update the execution board fact that the repo-side workflow/checklists exist and separately state the truthful ready count from `approved-story-assets.json`.
