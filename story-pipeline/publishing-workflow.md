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
| `publish_approved` | Publisher | Page generated from `story-template.html`; sitemap and OG metadata reviewed. |

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

## Legal Review Checklist

- No public promise about financial outcome, income, ROI, capital raise, or ownership return.
- No internal-only entity name or private investment structure.
- No private address, private phone, ID document, bank detail, or health/family sensitive detail.
- Public legal footer remains unchanged from the BrandPro pack.
- The author can withdraw consent before publishing.

## Publish Checklist

1. Copy `story-template.html` into a future public story route only after `publish_approved`.
2. Replace every `{{placeholder}}`.
3. Keep the story body close to 200 words.
4. Add a 1200x630 OG image for that specific story.
5. Run:

```bash
node scripts/story-pipeline-lint.mjs
bash scripts/brand-lint.sh public
node scripts/i18n-smoke.mjs
git diff --check
```
