#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pipelineDir = path.join(root, "story-pipeline");

const requiredFiles = [
  "publishing-workflow.md",
  "intake-form.html",
  "story-template.html"
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

console.log("Story pipeline lint PASS: internal intake, consent workflow, legal review, and template are present.");
