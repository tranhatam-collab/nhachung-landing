#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "story-pipeline", "approved-story-assets.json");
const args = process.argv.slice(2);

const requiredPacketFiles = [
  "packet.md",
  "intake-record.json",
  "story-draft.md",
  "consent-record.md",
  "legal-review.md",
  "author-final-ok.md",
  "photo-pack/README.md",
  "asset-exports/README.md"
];

const requiredChildPacketIdentityFiles = [
  "story-draft.md",
  "consent-record.md",
  "legal-review.md",
  "author-final-ok.md",
  "photo-pack/README.md",
  "asset-exports/README.md"
];

const forbiddenStoryLanguageRules = [
  { label: "real-estate drift", patterns: ["real-estate", "real estate", "bất động sản", "marketplace", "property investment"] },
  { label: "fundraising drift", patterns: ["fundraising", "gọi vốn", "kêu gọi đầu tư", "capital solicitation", "public capital"] },
  { label: "guaranteed-return drift", patterns: ["roi", "guaranteed income", "guaranteed house", "promised return", "cam kết lợi nhuận", "đảm bảo lợi nhuận", "đảm bảo thu nhập", "chắc chắn sinh lời"] },
  { label: "spiritual drift", patterns: ["spiritual", "tâm linh", "khai mở", "tỉnh thức"] },
  { label: "social-network drift", patterns: ["social network", "mạng xã hội"] },
  { label: "resort drift", patterns: ["resort", "lifestyle resort"] }
];

const requiredIntakeRecordFields = [
  "story_id",
  "slot_id",
  "target_public_route",
  "packet_path",
  "author_display_name",
  "author_legal_name",
  "author_contact",
  "house_context",
  "public_naming_mode",
  "story_body",
  "editor_notes",
  "consent_signed",
  "photo_usage_approved",
  "photo_usage_scope",
  "quote_approved",
  "quote_usage_scope",
  "legal_review",
  "consent_timestamp",
  "withdrawal_rule_recorded"
];

const requiredRealIntakeFields = [
  "author_display_name",
  "author_legal_name",
  "author_contact",
  "public_naming_mode",
  "story_body",
  "consent_timestamp",
  "photo_usage_scope",
  "quote_usage_scope"
];

const jsonMode = args.includes("--json");
const handoffMode = args.includes("--handoff");
const listMode = args.includes("--list-slots");
const slotFilterArg = args.find((arg) => arg.startsWith("--slot="));
const slotFilter = slotFilterArg ? slotFilterArg.slice("--slot=".length) : null;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function packetDirFromPath(packetPath) {
  return path.dirname(path.join(root, packetPath));
}

function topLevelPacketDirName(packetPath) {
  return path.basename(packetDirFromPath(packetPath));
}

function packetFilesStatus(packetPath) {
  const packetDir = packetDirFromPath(packetPath);
  return requiredPacketFiles.map((relativePacketFile) => ({
    relativePacketFile,
    exists: fs.existsSync(path.join(packetDir, relativePacketFile))
  }));
}

function readPacketFile(packetPath, relativePacketFile) {
  return normalize(fs.readFileSync(path.join(packetDirFromPath(packetPath), relativePacketFile), "utf8"));
}

function readPacketJson(packetPath, relativePacketFile) {
  return readJson(path.join(packetDirFromPath(packetPath), relativePacketFile));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function captureFieldValue(text, label) {
  const pattern = new RegExp(`^-\\s+${escapeRegExp(label)}:\\s*(.+)$`, "m");
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

function isPlaceholderLike(value) {
  if (!value) {
    return true;
  }

  return ["`TBD`", "`Pending`", "`No`", "TBD", "Pending", "No"].includes(value.trim());
}

function packetLanguageDrift(packetPath) {
  const packet = readPacketFile(packetPath, "packet.md");
  const draft = readPacketFile(packetPath, "story-draft.md");
  const candidateFields = [
    { field: "packet.final_story_title", value: captureFieldValue(packet, "Final story title") },
    { field: "packet.story_summary", value: captureFieldValue(packet, "Story summary") },
    { field: "draft.working_title", value: captureFieldValue(draft, "Working title") },
    { field: "draft.story_summary", value: captureFieldValue(draft, "Story summary") },
    { field: "draft.public_safe_text", value: captureFieldValue(draft, "Public-safe draft text") }
  ].filter((entry) => !isPlaceholderLike(entry.value));

  const drifts = [];
  for (const candidate of candidateFields) {
    const normalized = candidate.value.toLowerCase();
    for (const rule of forbiddenStoryLanguageRules) {
      const matchedPattern = rule.patterns.find((pattern) => normalized.includes(pattern));
      if (matchedPattern) {
        drifts.push(`${rule.label} in ${candidate.field} (${matchedPattern})`);
      }
    }
  }

  return drifts;
}

function normalizeInlineCode(value) {
  return typeof value === "string" ? value.replace(/^`|`$/g, "") : value;
}

function isAffirmativeValue(value) {
  if (value === true) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["true", "yes", "on", "recorded"].includes(value.trim().toLowerCase());
}

function packetIdentityDrift(slot) {
  const packet = readPacketFile(slot.packet_path, "packet.md");
  const packetStoryId = captureFieldValue(packet, "`story_id`");
  const packetSlotId = captureFieldValue(packet, "`slot_id`");
  const packetRoute = captureFieldValue(packet, "Proposed `public_route`");
  const drifts = [];

  if (!packetStoryId) {
    drifts.push("packet.md missing story_id");
  }
  if (packetSlotId !== `\`${slot.slot_id}\``) {
    drifts.push(`packet.md slot_id != ${slot.slot_id}`);
  }
  if (packetRoute !== `\`${slot.target_route}\``) {
    drifts.push(`packet.md public_route != ${slot.target_route}`);
  }

  for (const relativePacketFile of requiredChildPacketIdentityFiles) {
    const childText = readPacketFile(slot.packet_path, relativePacketFile);
    if (captureFieldValue(childText, "`story_id`") !== packetStoryId) {
      drifts.push(`${relativePacketFile} story_id drift`);
    }
    if (captureFieldValue(childText, "`slot_id`") !== `\`${slot.slot_id}\``) {
      drifts.push(`${relativePacketFile} slot_id drift`);
    }
    if (captureFieldValue(childText, "`target_route`") !== `\`${slot.target_route}\``) {
      drifts.push(`${relativePacketFile} target_route drift`);
    }
  }

  return drifts;
}

function intakeRecordDrift(slot) {
  const intake = readPacketJson(slot.packet_path, "intake-record.json");
  const packet = readPacketFile(slot.packet_path, "packet.md");
  const packetStoryId = normalizeInlineCode(captureFieldValue(packet, "`story_id`"));
  const drifts = [];

  for (const field of requiredIntakeRecordFields) {
    if (!Object.hasOwn(intake, field)) {
      drifts.push(`intake-record missing ${field}`);
    }
  }

  if (intake.story_id !== packetStoryId) {
    drifts.push("intake-record story_id drift");
  }
  if (intake.slot_id !== slot.slot_id) {
    drifts.push("intake-record slot_id drift");
  }
  if (intake.target_public_route !== slot.target_route) {
    drifts.push("intake-record target_public_route drift");
  }
  if (intake.packet_path !== slot.packet_path) {
    drifts.push("intake-record packet_path drift");
  }

  return drifts;
}

function missingRealIntakeFields(intake) {
  const blockers = [];

  for (const field of requiredRealIntakeFields) {
    const value = intake[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      blockers.push(field);
    }
  }

  if (!isAffirmativeValue(intake.consent_signed)) {
    blockers.push("consent_signed");
  }
  if (!isAffirmativeValue(intake.photo_usage_approved)) {
    blockers.push("photo_usage_approved");
  }
  if (!isAffirmativeValue(intake.quote_approved)) {
    blockers.push("quote_approved");
  }
  if (!isAffirmativeValue(intake.withdrawal_rule_recorded)) {
    blockers.push("withdrawal_rule_recorded");
  }

  return blockers;
}

function hasPlaceholderValue(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function findPlaceholderDetails(text, checks) {
  return checks.filter((check) => text.includes(check.pattern)).map((check) => check.detail);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function normalizeSelector(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function packetStoryIdFromSlot(slot) {
  return path.basename(packetDirFromPath(slot.packet_path));
}

function slotSelectors(slot) {
  const routeBasename = path.basename(slot.target_route, path.extname(slot.target_route));
  const storyId = packetStoryIdFromSlot(slot);
  return uniqueSorted([
    slot.slot_id,
    storyId,
    slot.target_house,
    routeBasename,
    routeBasename.replace(/-story$/i, ""),
    storyId.replace(/^story-\d{8}-/i, "")
  ].map((value) => normalizeSelector(value)).filter(Boolean));
}

function slotLabelList(slot) {
  return uniqueSorted([
    slot.slot_id,
    packetStoryIdFromSlot(slot),
    path.basename(slot.target_route, path.extname(slot.target_route)),
    slot.target_house
  ]);
}

function availableSlotLines(slots) {
  return slots.map((slot) => `${slot.slot_id} [${slotLabelList(slot).join(" | ")}]`);
}

function resolveSlotSelection(slots, requested) {
  const exact = slots.find((slot) => slot.slot_id === requested);
  if (exact) {
    return exact;
  }

  const normalized = normalizeSelector(requested);
  const matches = slots.filter((slot) => slotSelectors(slot).includes(normalized));

  if (matches.length === 1) {
    return matches[0];
  }

  if (matches.length > 1) {
    throw new Error(`Ambiguous slot selector: ${requested}. Matches: ${matches.map((slot) => slot.slot_id).join(", ")}`);
  }

  throw new Error(`Unknown slot: ${requested}. Valid slots: ${availableSlotLines(slots).join("; ")}`);
}

function detailPrefix(detail) {
  return detail.split(":")[0] ?? detail;
}

function formatDetailBullets(details) {
  const groups = new Map();

  for (const detail of details) {
    const prefix = detailPrefix(detail);
    const label = detail.slice(prefix.length + 1) || detail;
    if (!groups.has(prefix)) {
      groups.set(prefix, []);
    }
    groups.get(prefix).push(label);
  }

  return [...groups.entries()]
    .map(([prefix, labels]) => `${prefix}: ${labels.join(", ")}`);
}

function reviewPrepDetails(packetPath) {
  const details = [];
  const draft = readPacketFile(packetPath, "story-draft.md");
  const consent = readPacketFile(packetPath, "consent-record.md");
  const photoPack = readPacketFile(packetPath, "photo-pack/README.md");
  const intake = readPacketJson(packetPath, "intake-record.json");

  const intakeFieldBlockers = missingRealIntakeFields(intake);
  if (intakeFieldBlockers.length > 0) {
    details.push(...intakeFieldBlockers.map((field) => `intake-record.json:${field}`));
  }

  details.push(...findPlaceholderDetails(draft, [
    { pattern: "Working title: `TBD`", detail: "story-draft.md:working_title" },
    { pattern: "Story summary: `TBD`", detail: "story-draft.md:story_summary" },
    { pattern: "Public-safe draft text: `TBD`", detail: "story-draft.md:public_safe_draft_text" }
  ]));
  details.push(...findPlaceholderDetails(photoPack, [
    { pattern: "Source photo pack location: `TBD`", detail: "photo-pack/README.md:source_photo_pack_location" }
  ]));
  details.push(...findPlaceholderDetails(consent, [
    { pattern: "Status: `Pending`", detail: "consent-record.md:status" },
    { pattern: "Author display name: `TBD`", detail: "consent-record.md:author_display_name" },
    { pattern: "Consent timestamp: `TBD`", detail: "consent-record.md:consent_timestamp" }
  ]));
  details.push(...packetLanguageDrift(packetPath).map((detail) => `brand_language:${detail}`));

  return uniqueSorted(details);
}

function reviewPrepBlockers(packetPath) {
  const blockers = [];
  const reviewDetails = reviewPrepDetails(packetPath);

  if (reviewDetails.some((detail) => detail.startsWith("intake-record.json:"))) {
    blockers.push("real intake record");
  }
  if (reviewDetails.some((detail) => detail.startsWith("story-draft.md:"))) {
    blockers.push("story draft");
  }
  if (reviewDetails.some((detail) => detail.startsWith("photo-pack/README.md:"))) {
    blockers.push("approved source photo pack");
  }
  if (reviewDetails.some((detail) => detail.startsWith("consent-record.md:"))) {
    blockers.push("consent record");
  }
  if (reviewDetails.some((detail) => detail.startsWith("brand_language:"))) {
    blockers.push("brand/language compliance");
  }

  return blockers;
}

function publishReadyDetails(packetPath) {
  const details = [...reviewPrepDetails(packetPath)];
  const packet = readPacketFile(packetPath, "packet.md");
  const draft = readPacketFile(packetPath, "story-draft.md");
  const consent = readPacketFile(packetPath, "consent-record.md");
  const legal = readPacketFile(packetPath, "legal-review.md");
  const authorFinal = readPacketFile(packetPath, "author-final-ok.md");
  const photoPack = readPacketFile(packetPath, "photo-pack/README.md");
  const exportsFile = readPacketFile(packetPath, "asset-exports/README.md");

  details.push(...findPlaceholderDetails(packet, [
    { pattern: "Author display name: `TBD`", detail: "packet.md:author_display_name" },
    { pattern: "Author legal name: `TBD`", detail: "packet.md:author_legal_name" },
    { pattern: "Contact channel: `TBD`", detail: "packet.md:contact_channel" },
    { pattern: "Public naming mode: `TBD`", detail: "packet.md:public_naming_mode" },
    { pattern: "Consent timestamp: `TBD`", detail: "packet.md:consent_timestamp" },
    { pattern: "Quote usage approved: `TBD`", detail: "packet.md:quote_usage_approved" },
    { pattern: "Photo usage approved: `TBD`", detail: "packet.md:photo_usage_approved" },
    { pattern: "Photo credit text: `TBD`", detail: "packet.md:photo_credit_text" },
    { pattern: "Withdrawal rule recorded: `No`", detail: "packet.md:withdrawal_rule_recorded" },
    { pattern: "Private detail removed: `No`", detail: "packet.md:private_detail_removed" },
    { pattern: "Legal reviewer: `TBD`", detail: "packet.md:legal_reviewer" },
    { pattern: "Legal review result: `Pending`", detail: "packet.md:legal_review_result" },
    { pattern: "Public voice check: `Pending`", detail: "packet.md:public_voice_check" },
    { pattern: "Drift check: `Pending`", detail: "packet.md:drift_check" },
    { pattern: "Final story title: `TBD`", detail: "packet.md:final_story_title" },
    { pattern: "Story summary: `TBD`", detail: "packet.md:story_summary" },
    { pattern: "Story body target near 200 words: `No`", detail: "packet.md:story_body_target" },
    { pattern: "Hero asset path: `TBD`", detail: "packet.md:hero_asset_path" },
    { pattern: "OG asset path: `TBD`", detail: "packet.md:og_asset_path" },
    { pattern: "Publisher: `TBD`", detail: "packet.md:publisher" },
    { pattern: "Publish approved: `No`", detail: "packet.md:publish_approved" }
  ]));
  details.push(...findPlaceholderDetails(draft, [
    { pattern: "Working title: `TBD`", detail: "story-draft.md:working_title" },
    { pattern: "Story summary: `TBD`", detail: "story-draft.md:story_summary" },
    { pattern: "Author voice approved: `No`", detail: "story-draft.md:author_voice_approved" },
    { pattern: "Target length near 200 words: `No`", detail: "story-draft.md:target_length_near_200_words" },
    { pattern: "Public-safe draft text: `TBD`", detail: "story-draft.md:public_safe_draft_text" }
  ]));
  details.push(...findPlaceholderDetails(consent, [
    { pattern: "Status: `Pending`", detail: "consent-record.md:status" },
    { pattern: "Author display name: `TBD`", detail: "consent-record.md:author_display_name" },
    { pattern: "Scope approved: `TBD`", detail: "consent-record.md:scope_approved" },
    { pattern: "Quote usage approved: `TBD`", detail: "consent-record.md:quote_usage_approved" },
    { pattern: "Photo usage approved: `TBD`", detail: "consent-record.md:photo_usage_approved" },
    { pattern: "Consent timestamp: `TBD`", detail: "consent-record.md:consent_timestamp" },
    { pattern: "Withdrawal note recorded: `No`", detail: "consent-record.md:withdrawal_note_recorded" }
  ]));
  details.push(...findPlaceholderDetails(legal, [
    { pattern: "Status: `Pending`", detail: "legal-review.md:status" },
    { pattern: "Reviewer: `TBD`", detail: "legal-review.md:reviewer" },
    { pattern: "Public boundary check: `Pending`", detail: "legal-review.md:public_boundary_check" },
    { pattern: "Language drift check: `Pending`", detail: "legal-review.md:language_drift_check" },
    { pattern: "Sensitive detail removed: `Pending`", detail: "legal-review.md:sensitive_detail_removed" }
  ]));
  details.push(...findPlaceholderDetails(authorFinal, [
    { pattern: "Status: `Pending`", detail: "author-final-ok.md:status" },
    { pattern: "Final story shared with author: `No`", detail: "author-final-ok.md:final_story_shared_with_author" },
    { pattern: "Author accepted final text: `No`", detail: "author-final-ok.md:author_accepted_final_text" },
    { pattern: "Timestamp: `TBD`", detail: "author-final-ok.md:timestamp" }
  ]));
  details.push(...findPlaceholderDetails(photoPack, [
    { pattern: "Source photo pack location: `TBD`", detail: "photo-pack/README.md:source_photo_pack_location" },
    { pattern: "Public-safe hero candidate selected: `No`", detail: "photo-pack/README.md:hero_candidate_selected" },
    { pattern: "OG crop candidate selected: `No`", detail: "photo-pack/README.md:og_crop_candidate_selected" },
    { pattern: "Photo credit confirmed: `No`", detail: "photo-pack/README.md:photo_credit_confirmed" }
  ]));
  details.push(...findPlaceholderDetails(exportsFile, [
    { pattern: "Hero asset path: `TBD`", detail: "asset-exports/README.md:hero_asset_path" },
    { pattern: "OG asset path: `TBD`", detail: "asset-exports/README.md:og_asset_path" },
    { pattern: "Exported from approved source pack: `No`", detail: "asset-exports/README.md:exported_from_approved_source_pack" },
    { pattern: "Brand lock check passed: `No`", detail: "asset-exports/README.md:brand_lock_check_passed" },
    { pattern: "Export status: `Pending real approved photo`", detail: "asset-exports/README.md:export_status" }
  ]));

  return uniqueSorted(details);
}

function publishReadyBlockers(packetPath) {
  const blockers = [];
  const publishDetails = publishReadyDetails(packetPath);

  if (publishDetails.some((detail) => detail.startsWith("intake-record.json:"))) {
    blockers.push("real intake record");
  }
  if (publishDetails.some((detail) => detail.startsWith("packet.md:"))) {
    blockers.push("packet approval fields");
  }
  if (publishDetails.some((detail) => detail.startsWith("story-draft.md:"))) {
    blockers.push("story draft");
  }
  if (publishDetails.some((detail) => detail.startsWith("consent-record.md:"))) {
    blockers.push("consent record");
  }
  if (publishDetails.some((detail) => detail.startsWith("legal-review.md:"))) {
    blockers.push("legal review record");
  }
  if (publishDetails.some((detail) => detail.startsWith("author-final-ok.md:"))) {
    blockers.push("author final approval record");
  }
  if (publishDetails.some((detail) => detail.startsWith("photo-pack/README.md:"))) {
    blockers.push("approved source photo pack");
  }
  if (publishDetails.some((detail) => detail.startsWith("asset-exports/README.md:"))) {
    blockers.push("local hero/OG assets");
  }
  if (publishDetails.some((detail) => detail.startsWith("brand_language:"))) {
    blockers.push("brand/language compliance");
  }

  return blockers;
}

function canonicalMissingEvidence(packetPath) {
  const publishBlockers = publishReadyBlockers(packetPath);
  const missing = [];

  if (publishBlockers.includes("real intake record")) {
    missing.push("real intake record");
  }
  if (publishBlockers.includes("story draft")) {
    missing.push("story draft");
  }
  if (publishBlockers.includes("approved source photo pack")) {
    missing.push("approved source photo pack");
  }
  if (publishBlockers.includes("consent record")) {
    missing.push("consent record");
  }
  if (publishBlockers.includes("legal review record")) {
    missing.push("legal review record");
  }
  if (publishBlockers.includes("author final approval record")) {
    missing.push("author final approval record");
  }
  if (publishBlockers.includes("local hero/OG assets")) {
    missing.push("local hero asset", "1200x630 OG asset");
  }
  if (publishBlockers.includes("brand/language compliance")) {
    missing.push("brand/language compliance");
  }

  return missing;
}

function expectedSlotStatus(packetPath) {
  const reviewPrep = reviewPrepBlockers(packetPath);
  if (reviewPrep.length > 0) {
    return "packet_seeded";
  }

  const publishPrep = publishReadyBlockers(packetPath);
  if (publishPrep.length > 0) {
    return "packet_in_review";
  }

  return "publish_ready";
}

assert(fs.existsSync(manifestPath), "missing story-pipeline/approved-story-assets.json");
assert(!(jsonMode && handoffMode), "Use either --json or --handoff, not both");
assert(!(listMode && jsonMode), "Use either --list-slots or --json, not both");

const manifest = readJson(manifestPath);
assert(Array.isArray(manifest.required_story_slots), "required_story_slots must be an array");

let resolvedSlot = null;
if (slotFilter) {
  resolvedSlot = resolveSlotSelection(manifest.required_story_slots, slotFilter);
}

const packetsRoot = path.join(root, "story-pipeline", "packets");
const expectedPacketDirs = new Set(manifest.required_story_slots.map((slot) => topLevelPacketDirName(slot.packet_path)));
const orphanPacketDirs = fs
  .readdirSync(packetsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((dirName) => !expectedPacketDirs.has(dirName));

assert(orphanPacketDirs.length === 0, `Orphan packet dirs must be removed before readiness review: ${orphanPacketDirs.join(", ")}`);

const lines = [];
const slotSummaries = [];
let seededOrBetterCount = 0;
let completeScaffoldCount = 0;
let reviewInputReadyCount = 0;
let publishReadyInputCount = 0;
const aggregateReviewBlockers = new Map();
const aggregatePublishBlockers = new Map();

function bumpCounter(map, items) {
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
}

for (const slot of manifest.required_story_slots) {
  if (resolvedSlot && slot.slot_id !== resolvedSlot.slot_id) {
    continue;
  }

  assert(typeof slot.slot_id === "string" && slot.slot_id.length > 0, "slot_id is required");
  assert(typeof slot.status === "string" && slot.status.length > 0, `${slot.slot_id} status is required`);
  if (slot.status === "missing_packet") {
    lines.push(`${slot.slot_id}: missing_packet | packet scaffold missing`);
    continue;
  }

  seededOrBetterCount += 1;
  assert(typeof slot.packet_path === "string" && slot.packet_path.length > 0, `${slot.slot_id} packet_path is required`);
  const files = packetFilesStatus(slot.packet_path);
  const missingFiles = files.filter((file) => !file.exists).map((file) => file.relativePacketFile);
  const missingEvidence = Array.isArray(slot.missing_evidence) ? slot.missing_evidence : [];
  if (missingFiles.length === 0) {
    completeScaffoldCount += 1;
  }

  const scaffoldLabel = missingFiles.length === 0 ? "scaffold_complete" : `scaffold_missing:${missingFiles.join(",")}`;
  const reviewPrep = missingFiles.length === 0 ? reviewPrepBlockers(slot.packet_path) : ["packet scaffold incomplete"];
  const publishPrep = missingFiles.length === 0 ? publishReadyBlockers(slot.packet_path) : ["packet scaffold incomplete"];
  const reviewPrepDetailsForSlot = missingFiles.length === 0 ? reviewPrepDetails(slot.packet_path) : [];
  const publishPrepDetailsForSlot = missingFiles.length === 0 ? publishReadyDetails(slot.packet_path) : [];
  const expectedStatus = missingFiles.length === 0 ? expectedSlotStatus(slot.packet_path) : "missing_packet";
  const expectedMissingEvidence = missingFiles.length === 0 ? canonicalMissingEvidence(slot.packet_path) : [];
  const identityDrift = missingFiles.length === 0 ? [...packetIdentityDrift(slot), ...intakeRecordDrift(slot)] : [];
  bumpCounter(aggregateReviewBlockers, reviewPrep);
  bumpCounter(aggregatePublishBlockers, publishPrep);
  if (reviewPrep.length === 0) {
    reviewInputReadyCount += 1;
  }
  if (publishPrep.length === 0) {
    publishReadyInputCount += 1;
  }
  const reviewLabel = reviewPrep.length === 0 ? "review_inputs_ready" : `review_inputs_missing:${reviewPrep.join(", ")}`;
  const publishLabel = publishPrep.length === 0 ? "publish_inputs_ready" : `publish_inputs_missing:${publishPrep.join(", ")}`;
  const identityLabel = identityDrift.length === 0 ? "identity_ok" : `identity_drift:${identityDrift.join(", ")}`;
  const evidenceLabel = missingEvidence.length === 0 ? "missing_evidence:none" : `missing_evidence:${missingEvidence.join(", ")}`;
  const expectedEvidenceLabel = expectedMissingEvidence.length === 0 ? "expected_missing_evidence:none" : `expected_missing_evidence:${expectedMissingEvidence.join(", ")}`;
  const reviewDetailLabel = reviewPrepDetailsForSlot.length === 0 ? "review_detail:none" : `review_detail:${reviewPrepDetailsForSlot.join(", ")}`;
  const publishDetailLabel = publishPrepDetailsForSlot.length === 0 ? "publish_detail:none" : `publish_detail:${publishPrepDetailsForSlot.join(", ")}`;
  const statusLabel = slot.status === expectedStatus ? `status_ok:${slot.status}` : `status_drift:actual=${slot.status},expected=${expectedStatus}`;
  const firstUnblockers = reviewPrep.slice();
  const slotPathLabel = `packet_path:${slot.packet_path}`;
  lines.push(`${slot.slot_id}: ${statusLabel} | ${slotPathLabel} | ${scaffoldLabel} | ${identityLabel} | ${reviewLabel} | ${reviewDetailLabel} | ${publishLabel} | ${publishDetailLabel} | ${evidenceLabel} | ${expectedEvidenceLabel}`);
  slotSummaries.push({
    slot_id: slot.slot_id,
    target_route: slot.target_route,
    target_house: slot.target_house,
    packet_path: slot.packet_path,
    status: slot.status,
    expected_status: expectedStatus,
    missing_packet_files: missingFiles,
    first_unblockers: firstUnblockers,
    review_blockers: reviewPrep,
    review_blocker_details: reviewPrepDetailsForSlot,
    publish_blockers: publishPrep,
    publish_blocker_details: publishPrepDetailsForSlot,
    missing_evidence: missingEvidence,
    expected_missing_evidence: expectedMissingEvidence,
    identity_drift: identityDrift
  });
}

const summary = {
  story_packet_readiness_version: "2026-05-13",
  totals: {
    seeded_or_better_slots: seededOrBetterCount,
    complete_packet_scaffolds: completeScaffoldCount,
    review_ready_packet_inputs: reviewInputReadyCount,
    publish_ready_packet_inputs: publishReadyInputCount,
    approved_ready_stories: manifest.content_gate?.ready_story_count ?? null,
    required_ready_stories: manifest.content_gate?.required_ready_story_count ?? null,
    canonical_packet_dirs: expectedPacketDirs.size,
    required_slots: manifest.required_story_slots.length
  },
  aggregate_review_blockers: Object.fromEntries([...aggregateReviewBlockers.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  aggregate_publish_blockers: Object.fromEntries([...aggregatePublishBlockers.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  slots: slotSummaries
};

if (jsonMode) {
  console.log(JSON.stringify(summary, null, 2));
} else if (listMode) {
  console.log("Canonical story slots");
  for (const slot of manifest.required_story_slots) {
    console.log(`- ${slot.slot_id}`);
    console.log(`  route: ${slot.target_route}`);
    console.log(`  story_id: ${packetStoryIdFromSlot(slot)}`);
    console.log(`  selectors: ${slotLabelList(slot).join(", ")}`);
  }
} else if (handoffMode) {
  console.log("Story packet handoff");
  console.log(`Slots in scope: ${slotSummaries.length}`);
  console.log("");

  for (const slot of slotSummaries) {
    console.log(`${slot.slot_id} | ${slot.target_house}`);
    console.log(`- route: ${slot.target_route}`);
    console.log(`- packet: ${slot.packet_path}`);
    console.log(`- status: ${slot.status} (expected ${slot.expected_status})`);
    console.log(`- first unblockers: ${slot.first_unblockers.length > 0 ? slot.first_unblockers.join(", ") : "none"}`);
    console.log(`- template command: node scripts/story-packet-intake-template.mjs --slot=${slot.slot_id} --output=story-pipeline/handoff/${slot.slot_id}.intake-template.json`);
    console.log(`- intake command: node scripts/story-packet-intake-sync.mjs --slot=${slot.slot_id} --input=<intake-json> --check`);
    console.log(`- write command: node scripts/story-packet-intake-sync.mjs --slot=${slot.slot_id} --input=<intake-json>`);
    console.log(`- verify command: node scripts/story-packet-readiness.mjs --slot=${slot.slot_id} && node scripts/story-pipeline-lint.mjs`);
    if (slot.review_blocker_details.length > 0) {
      console.log("- review details:");
      for (const line of formatDetailBullets(slot.review_blocker_details)) {
        console.log(`  - ${line}`);
      }
    }
    if (slot.publish_blocker_details.length > 0) {
      console.log("- publish details:");
      for (const line of formatDetailBullets(slot.publish_blocker_details)) {
        console.log(`  - ${line}`);
      }
    }
    if (slot.identity_drift.length > 0) {
      console.log(`- identity drift: ${slot.identity_drift.join(", ")}`);
    }
    console.log("");
  }
} else {
  console.log("Story packet readiness");
  console.log(`Seeded-or-better slots: ${seededOrBetterCount}/${slotFilter ? slotSummaries.length : manifest.required_story_slots.length}`);
  console.log(`Complete packet scaffolds: ${completeScaffoldCount}/${slotFilter ? slotSummaries.length : manifest.required_story_slots.length}`);
  console.log(`Review-ready packet inputs: ${reviewInputReadyCount}/${slotFilter ? slotSummaries.length : manifest.required_story_slots.length}`);
  console.log(`Publish-ready packet inputs: ${publishReadyInputCount}/${slotFilter ? slotSummaries.length : manifest.required_story_slots.length}`);
  console.log(`Approved ready stories: ${manifest.content_gate?.ready_story_count ?? "?"}/${manifest.content_gate?.required_ready_story_count ?? "?"}`);
  console.log(`Canonical packet dirs: ${expectedPacketDirs.size}/${manifest.required_story_slots.length}`);
  console.log("");
  console.log("Shared first unblockers");
  for (const [blocker, count] of Object.entries(summary.aggregate_review_blockers)) {
    console.log(`- ${blocker}: ${count}/${slotSummaries.length || manifest.required_story_slots.length}`);
  }
  console.log("");
  for (const line of lines) {
    console.log(`- ${line}`);
  }
}
