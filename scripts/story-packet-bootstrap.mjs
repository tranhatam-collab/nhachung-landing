#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pipelineDir = path.join(root, "story-pipeline");
const manifestPath = path.join(pipelineDir, "approved-story-assets.json");
const packetsDir = path.join(pipelineDir, "packets");
const checkMode = process.argv.includes("--check");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    const output = typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`;
    fs.writeFileSync(filePath, output, "utf8");
    return true;
  }

  return false;
}

function buildIntakeRecord(slot) {
  const packetDirName = path.basename(path.dirname(slot.packet_path));

  return {
    story_id: packetDirName,
    slot_id: slot.slot_id,
    target_public_route: slot.target_route,
    packet_path: slot.packet_path,
    author_display_name: null,
    author_legal_name: null,
    author_contact: null,
    house_context: slot.target_house,
    public_naming_mode: null,
    story_body: null,
    editor_notes: null,
    consent_signed: false,
    photo_usage_approved: false,
    photo_usage_scope: null,
    quote_approved: false,
    quote_usage_scope: null,
    legal_review: false,
    consent_timestamp: null,
    withdrawal_rule_recorded: false
  };
}

function buildPacketMd(slot) {
  return `# STORY PACKET PREP

## Identity

- story_id:
- slot_id: ${slot.slot_id}
- Proposed public route: ${slot.target_route}
- Target house: ${slot.target_house}
- Author display name:
- Author legal name:
- Contact channel:
- Public naming mode: real name / first name only / pseudonym

## Consent Scope

- Consent timestamp:
- Quote usage approved: yes / no
- Photo usage approved: face / contextual only / no photo
- Photo credit text:
- Withdrawal rule recorded: yes / no
- Consent record file: story-pipeline/packets/<story-id>/consent-record.md

## Privacy + Legal

- Private detail removed: yes / no
- Legal reviewer:
- Legal review result:
- Legal review file: story-pipeline/packets/<story-id>/legal-review.md
- Public voice check: calm / precise / real / long-term
- Drift check: no real-estate / fundraising / spiritual / social / resort / guaranteed-return language

## Story + Assets

- Final story title:
- Story summary:
- Story draft file: story-pipeline/packets/<story-id>/story-draft.md
- Story body target near 200 words: yes / no
- Source photo pack note: story-pipeline/packets/<story-id>/photo-pack/README.md
- Hero asset path:
- OG asset path:
- Asset export note: story-pipeline/packets/<story-id>/asset-exports/README.md

## Final Approval

- Author final approval file: story-pipeline/packets/<story-id>/author-final-ok.md
- Publisher:
- Publish approved: yes / no
- Remaining blockers:
${slot.missing_evidence.map((item) => `  - ${item}`).join("\n")}
`;
}

function buildNote(title, slot, bullets) {
  return `# ${title}

- slot_id: ${slot.slot_id}
- target_route: ${slot.target_route}
- target_house: ${slot.target_house}
- story_id:
- status: prep_scaffold_only
${bullets.map((item) => `- ${item}`).join("\n")}
`;
}

function resolvePacketDir(slot) {
  if (typeof slot.packet_path === "string" && slot.packet_path.length > 0) {
    return path.dirname(path.join(root, slot.packet_path));
  }

  return path.join(packetsDir, slot.slot_id);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const requiredSlots = Array.isArray(manifest.required_story_slots) ? manifest.required_story_slots : [];

if (requiredSlots.length === 0) {
  throw new Error("approved-story-assets.json does not define required_story_slots");
}

const missingPaths = [];
let createdCount = 0;

for (const slot of requiredSlots) {
  const slotDir = resolvePacketDir(slot);
  const photoPackDir = path.join(slotDir, "photo-pack");
  const assetExportsDir = path.join(slotDir, "asset-exports");

  const files = [
    [path.join(slotDir, "packet.md"), buildPacketMd(slot)],
    [path.join(slotDir, "intake-record.json"), buildIntakeRecord(slot)],
    [path.join(slotDir, "consent-record.md"), buildNote("CONSENT RECORD", slot, [
      "author display name:",
      "consent timestamp:",
      "quote usage scope:",
      "photo usage scope:",
      "withdrawal rule recorded:"
    ])],
    [path.join(slotDir, "story-draft.md"), buildNote("STORY DRAFT", slot, [
      "working title:",
      "story summary:",
      "author voice approved: yes / no",
      "target length near 200 words: yes / no",
      "public-safe draft text goes here:"
    ])],
    [path.join(slotDir, "legal-review.md"), buildNote("LEGAL REVIEW", slot, [
      "reviewer:",
      "result:",
      "privacy trim complete: yes / no",
      "language drift check: pass / fail"
    ])],
    [path.join(slotDir, "author-final-ok.md"), buildNote("AUTHOR FINAL OK", slot, [
      "author reply channel:",
      "final approval timestamp:",
      "public naming mode:",
      "approved final title:"
    ])],
    [path.join(photoPackDir, "README.md"), buildNote("PHOTO PACK", slot, [
      "source folder:",
      "public-safe hero candidate:",
      "public-safe OG crop candidate:",
      "restricted assets kept outside public/: yes / no"
    ])],
    [path.join(assetExportsDir, "README.md"), buildNote("ASSET EXPORTS", slot, [
      "hero asset path:",
      "og asset path:",
      "exported from approved source pack: No",
      "brand lock check passed: No",
      "export status: Pending real approved photo"
    ])]
  ];

  if (checkMode) {
    for (const [filePath] of files) {
      if (!fs.existsSync(filePath)) {
        missingPaths.push(path.relative(root, filePath));
      }
    }
    continue;
  }

  ensureDir(photoPackDir);
  ensureDir(assetExportsDir);

  for (const [filePath, content] of files) {
    if (ensureFile(filePath, content)) {
      createdCount += 1;
    }
  }
}

if (checkMode) {
  if (missingPaths.length > 0) {
    throw new Error(`Missing slot packet prep files:\n${missingPaths.join("\n")}`);
  }
  console.log(`Story packet bootstrap CHECK PASS: ${requiredSlots.length} slot prep workspaces present.`);
} else {
  console.log(`Story packet bootstrap WRITE PASS: created ${createdCount} missing files across ${requiredSlots.length} slot workspaces.`);
}
