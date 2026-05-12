#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pipelineDir = path.join(root, "story-pipeline");
const publicDir = path.join(root, "public");

const requiredFiles = [
  "publishing-workflow.md",
  "intake-form.html",
  "story-template.html",
  "approved-story-assets.json",
  "consent-checklist.md",
  "publish-checklist.md"
];

const requiredStates = [
  "draft_received",
  "consent_signed",
  "privacy_trimmed",
  "legal_review",
  "author_final_ok",
  "publish_approved"
];

const requiredIntakeFields = [
  "author_display_name",
  "author_legal_name",
  "author_contact",
  "story_id",
  "story_body",
  "consent_signed",
  "photo_usage_approved",
  "quote_approved",
  "legal_review",
  "consent_timestamp"
];

const requiredTemplateTokens = [
  "{{story_title}}",
  "{{story_summary}}",
  "{{story_slug}}",
  "{{story_photo_url}}",
  "{{story_photo_alt}}",
  "{{photo_credit}}",
  "{{story_body_around_200_words}}"
];

const requiredAssetFields = [
  "story_id",
  "state",
  "public_route",
  "hero_asset",
  "photo_consent",
  "legal_review",
  "author_final_ok",
  "publish_approved"
];

const requiredConsentChecklistLines = [
  "author legal name",
  "photo usage",
  "withdraw consent",
  "private address",
  "not a real-estate marketplace",
  "not a public capital-solicitation platform"
];

const requiredPublishChecklistLines = [
  "approved-story-assets.json",
  "1200x630",
  "brand-lint.sh public",
  "story-pipeline-lint.mjs",
  "i18n-smoke.mjs",
  "git diff --check"
];

function read(relativePath) {
  return fs.readFileSync(path.join(pipelineDir, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(fs.existsSync(pipelineDir), "story-pipeline directory is missing");

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(pipelineDir, file)), `missing ${file}`);
  assert(!path.join(pipelineDir, file).includes(`${path.sep}public${path.sep}`), `${file} must not be under public/`);
}

const workflow = read("publishing-workflow.md");
for (const state of requiredStates) {
  assert(workflow.includes(state), `workflow missing state ${state}`);
}
assert(workflow.includes("200 words") || workflow.includes("200 từ"), "workflow must define the 200-word story target");
assert(workflow.includes("node scripts/story-pipeline-lint.mjs"), "workflow must document its lint command");

const consentChecklist = read("consent-checklist.md").toLowerCase();
for (const line of requiredConsentChecklistLines) {
  assert(consentChecklist.includes(line), `consent checklist missing ${line}`);
}

const publishChecklist = read("publish-checklist.md").toLowerCase();
for (const line of requiredPublishChecklistLines) {
  assert(publishChecklist.includes(line.toLowerCase()), `publish checklist missing ${line}`);
}

const intake = read("intake-form.html");
assert(intake.includes('data-internal-only="true"'), "intake form must be explicitly marked internal only");
assert(!/action=["'][^"']+["']/i.test(intake), "intake form must not post to a public or remote action");
for (const field of requiredIntakeFields) {
  assert(intake.includes(`name="${field}"`), `intake form missing ${field}`);
}

const template = read("story-template.html");
for (const token of requiredTemplateTokens) {
  assert(template.includes(token), `story template missing ${token}`);
}
assert(template.includes("VIET CAN NEW CORP"), "story template missing international legal entity");
assert(template.includes("BỒ CÂU TRẮNG"), "story template missing Vietnam legal entity");
assert(template.includes("pay.iai.one"), "story template missing payment infrastructure line");

const publicStoryHub = fs.readFileSync(path.join(publicDir, "cau-chuyen.html"), "utf8");
assert(!publicStoryHub.includes("images.unsplash.com"), "public story hub must not use unapproved stock-photo assets");
assert(publicStoryHub.includes("assets/og/cau-chuyen.svg"), "public story hub must use the approved local story hub asset");

const assetManifest = JSON.parse(read("approved-story-assets.json"));
assert(Array.isArray(assetManifest.stories), "approved-story-assets.json must contain a stories array");
assert(assetManifest.stories.length > 0, "approved-story-assets.json must track at least the story hub placeholder");

for (const story of assetManifest.stories) {
  for (const field of requiredAssetFields) {
    assert(Object.hasOwn(story, field), `approved-story-assets.json entry missing ${field}`);
  }

  const approved = story.photo_consent === true && story.legal_review === true && story.author_final_ok === true && story.publish_approved === true;
  if (story.state === "publish_approved") {
    assert(approved, `${story.story_id} is publish_approved without full consent/legal/author approval`);
    assert(story.public_route.startsWith("/"), `${story.story_id} public_route must be an absolute public path`);
    assert(story.hero_asset.startsWith("/assets/"), `${story.story_id} hero_asset must be a local approved asset`);
  }
}

console.log("Story pipeline lint PASS: internal intake, consent workflow, legal review, template, and approved asset manifest are present.");
