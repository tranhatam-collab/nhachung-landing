#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "story-pipeline", "approved-story-assets.json");
const manifestSyncScriptPath = path.join(__dirname, "story-packet-manifest-sync.mjs");

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = { check: false, listSlots: false };

  for (const arg of argv) {
    if (arg === "--check") {
      options.check = true;
      continue;
    }

    if (arg === "--list-slots") {
      options.listSlots = true;
      continue;
    }

    const match = arg.match(/^--([^=]+)=(.+)$/);
    if (!match) {
      fail(`Unknown argument: ${arg}`);
    }

    options[match[1]] = match[2];
  }

  return options;
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceLine(text, label, value) {
  const pattern = new RegExp(`^(-\\s+${escapeRegExp(label)}:\\s+).*$`, "m");
  assert(pattern.test(text), `Missing field line for ${label}`);
  return text.replace(pattern, `$1${value}`);
}

function normalizeString(value, field) {
  assert(typeof value === "string", `${field} must be a string`);
  const normalized = value.trim();
  assert(normalized.length > 0, `${field} must not be empty`);
  return normalized;
}

function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isAffirmativeValue(value) {
  if (value === true) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["true", "yes", "on", "recorded", "1"].includes(value.trim().toLowerCase());
}

function normalizeBoolean(value, field) {
  assert(isAffirmativeValue(value), `${field} must be true/yes/on/recorded`);
  return true;
}

function normalizeNamingMode(value) {
  const normalized = normalizeString(value, "public_naming_mode");
  assert(["real_name", "first_name_only", "pseudonym"].includes(normalized), "public_naming_mode must be real_name, first_name_only, or pseudonym");
  return normalized;
}

function normalizePhotoUsageScope(value) {
  const normalized = normalizeString(value, "photo_usage_scope");
  assert(["face", "contextual_only", "no_photo"].includes(normalized), "photo_usage_scope must be face, contextual_only, or no_photo");
  return normalized;
}

function normalizeQuoteUsageScope(value) {
  const normalized = normalizeString(value, "quote_usage_scope");
  assert(["direct_quote_ok", "summary_only", "no_quote"].includes(normalized), "quote_usage_scope must be direct_quote_ok, summary_only, or no_quote");
  return normalized;
}

function normalizeIsoTimestamp(value) {
  const normalized = normalizeString(value, "consent_timestamp");
  assert(!Number.isNaN(Date.parse(normalized)), "consent_timestamp must be a valid date/time");
  return normalized;
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function packetDirFromPath(packetPath) {
  return path.dirname(path.join(root, packetPath));
}

function packetStoryId(slot) {
  return path.basename(packetDirFromPath(slot.packet_path));
}

function normalizeSelector(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function slotSelectors(slot) {
  const routeBasename = path.basename(slot.target_route, path.extname(slot.target_route));
  const storyId = packetStoryId(slot);
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
    packetStoryId(slot),
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
    fail(`Ambiguous slot selector: ${requested}. Matches: ${matches.map((slot) => slot.slot_id).join(", ")}`);
  }

  fail(`Unknown slot: ${requested}. Valid slots: ${availableSlotLines(slots).join("; ")}`);
}

function formatCode(value) {
  return `\`${value}\``;
}

function formatYesNo(value) {
  return value ? "`Yes`" : "`No`";
}

function titleCaseTokens(value) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizePayload(raw, slot) {
  const storyId = packetStoryId(slot);
  const storyBody = normalizeString(raw.story_body, "story_body");
  const workingTitle = normalizeOptionalString(raw.working_title);
  const storySummary = normalizeOptionalString(raw.story_summary);
  const publicSafeDraftText = normalizeOptionalString(raw.public_safe_draft_text) ?? storyBody;
  const photoCreditText = normalizeOptionalString(raw.photo_credit_text);
  const sourcePhotoPackLocation = normalizeOptionalString(raw.source_photo_pack_location);
  const authorVoiceApproved = raw.author_voice_approved === undefined ? true : normalizeBoolean(raw.author_voice_approved, "author_voice_approved");
  const targetLengthNear200Words =
    raw.target_length_near_200_words === undefined
      ? countWords(publicSafeDraftText) >= 140 && countWords(publicSafeDraftText) <= 260
      : normalizeBoolean(raw.target_length_near_200_words, "target_length_near_200_words");

  if (raw.story_id !== undefined) {
    assert(normalizeString(raw.story_id, "story_id") === storyId, `story_id must stay ${storyId}`);
  }
  if (raw.slot_id !== undefined) {
    assert(normalizeString(raw.slot_id, "slot_id") === slot.slot_id, `slot_id must stay ${slot.slot_id}`);
  }
  if (raw.target_public_route !== undefined) {
    assert(normalizeString(raw.target_public_route, "target_public_route") === slot.target_route, `target_public_route must stay ${slot.target_route}`);
  }
  if (raw.packet_path !== undefined) {
    assert(normalizeString(raw.packet_path, "packet_path") === slot.packet_path, `packet_path must stay ${slot.packet_path}`);
  }

  return {
    story_id: storyId,
    slot_id: slot.slot_id,
    target_public_route: slot.target_route,
    packet_path: slot.packet_path,
    author_display_name: normalizeString(raw.author_display_name, "author_display_name"),
    author_legal_name: normalizeString(raw.author_legal_name, "author_legal_name"),
    author_contact: normalizeString(raw.author_contact, "author_contact"),
    house_context: normalizeOptionalString(raw.house_context) ?? slot.target_house,
    public_naming_mode: normalizeNamingMode(raw.public_naming_mode),
    story_body: storyBody,
    editor_notes: normalizeOptionalString(raw.editor_notes),
    consent_signed: normalizeBoolean(raw.consent_signed, "consent_signed"),
    photo_usage_approved: normalizeBoolean(raw.photo_usage_approved, "photo_usage_approved"),
    photo_usage_scope: normalizePhotoUsageScope(raw.photo_usage_scope),
    quote_approved: normalizeBoolean(raw.quote_approved, "quote_approved"),
    quote_usage_scope: normalizeQuoteUsageScope(raw.quote_usage_scope),
    legal_review: false,
    consent_timestamp: normalizeIsoTimestamp(raw.consent_timestamp),
    withdrawal_rule_recorded: normalizeBoolean(raw.withdrawal_rule_recorded, "withdrawal_rule_recorded"),
    working_title: workingTitle,
    story_summary: storySummary,
    public_safe_draft_text: publicSafeDraftText,
    author_voice_approved: authorVoiceApproved,
    target_length_near_200_words: targetLengthNear200Words,
    source_photo_pack_location: sourcePhotoPackLocation,
    photo_credit_text: photoCreditText
  };
}

function updatePacket(packetPath, payload) {
  let text = readText(packetPath);
  text = replaceLine(text, "Author display name", formatCode(payload.author_display_name));
  text = replaceLine(text, "Author legal name", formatCode(payload.author_legal_name));
  text = replaceLine(text, "Contact channel", formatCode(payload.author_contact));
  text = replaceLine(text, "Public naming mode", formatCode(payload.public_naming_mode));
  text = replaceLine(text, "House or journey context", formatCode(payload.house_context));
  text = replaceLine(text, "Consent timestamp", formatCode(payload.consent_timestamp));
  text = replaceLine(text, "Quote usage approved", formatCode(payload.quote_usage_scope));
  text = replaceLine(text, "Photo usage approved", formatCode(payload.photo_usage_scope));
  if (payload.photo_credit_text) {
    text = replaceLine(text, "Photo credit text", formatCode(payload.photo_credit_text));
  }
  text = replaceLine(text, "Withdrawal rule recorded", formatYesNo(payload.withdrawal_rule_recorded));
  if (payload.working_title) {
    text = replaceLine(text, "Final story title", formatCode(payload.working_title));
  }
  if (payload.story_summary) {
    text = replaceLine(text, "Story summary", formatCode(payload.story_summary));
  }
  text = replaceLine(text, "Story body target near 200 words", formatYesNo(payload.target_length_near_200_words));
  writeText(packetPath, text);
}

function updateStoryDraft(storyDraftPath, payload) {
  let text = readText(storyDraftPath);
  if (payload.working_title) {
    text = replaceLine(text, "Working title", formatCode(payload.working_title));
  }
  if (payload.story_summary) {
    text = replaceLine(text, "Story summary", formatCode(payload.story_summary));
  }
  text = replaceLine(text, "Author voice approved", formatYesNo(payload.author_voice_approved));
  text = replaceLine(text, "Target length near 200 words", formatYesNo(payload.target_length_near_200_words));
  text = replaceLine(text, "Public-safe draft text", formatCode(payload.public_safe_draft_text));
  writeText(storyDraftPath, text);
}

function updateConsentRecord(consentPath, payload) {
  let text = readText(consentPath);
  text = replaceLine(text, "Status", formatCode("Recorded"));
  text = replaceLine(text, "Author display name", formatCode(payload.author_display_name));
  text = replaceLine(
    text,
    "Scope approved",
    formatCode(`naming=${payload.public_naming_mode}; quote=${payload.quote_usage_scope}; photo=${payload.photo_usage_scope}`)
  );
  text = replaceLine(text, "Quote usage approved", formatCode(titleCaseTokens(payload.quote_usage_scope)));
  text = replaceLine(text, "Photo usage approved", formatCode(titleCaseTokens(payload.photo_usage_scope)));
  text = replaceLine(text, "Consent timestamp", formatCode(payload.consent_timestamp));
  text = replaceLine(text, "Withdrawal note recorded", formatYesNo(payload.withdrawal_rule_recorded));
  writeText(consentPath, text);
}

function updatePhotoPack(photoPackPath, payload) {
  if (!payload.source_photo_pack_location) {
    return;
  }

  let text = readText(photoPackPath);
  text = replaceLine(text, "Source photo pack location", formatCode(payload.source_photo_pack_location));
  writeText(photoPackPath, text);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  assert(fs.existsSync(manifestPath), "Missing story-pipeline/approved-story-assets.json");

  const manifest = readJson(manifestPath);
  assert(Array.isArray(manifest.required_story_slots), "required_story_slots must be an array");

  if (args.listSlots) {
    console.log("Canonical story slots");
    for (const slot of manifest.required_story_slots) {
      console.log(`- ${slot.slot_id}`);
      console.log(`  route: ${slot.target_route}`);
      console.log(`  story_id: ${packetStoryId(slot)}`);
      console.log(`  selectors: ${slotLabelList(slot).join(", ")}`);
    }
    return;
  }

  assert(args.slot, "Missing required --slot=<slot-id>");
  assert(args.input, "Missing required --input=/abs/or/relative/intake.json");
  const slot = resolveSlotSelection(manifest.required_story_slots, args.slot);
  assert(typeof slot.packet_path === "string" && slot.packet_path.length > 0, `${args.slot} does not have a canonical packet_path`);

  const inputPath = path.resolve(process.cwd(), args.input);
  assert(fs.existsSync(inputPath), `Input file not found: ${inputPath}`);

  const rawPayload = readJson(inputPath);
  const payload = normalizePayload(rawPayload, slot);
  const packetDir = packetDirFromPath(slot.packet_path);
  const files = {
    intake: path.join(packetDir, "intake-record.json"),
    packet: path.join(packetDir, "packet.md"),
    storyDraft: path.join(packetDir, "story-draft.md"),
    consent: path.join(packetDir, "consent-record.md"),
    photoPack: path.join(packetDir, "photo-pack", "README.md")
  };

  for (const filePath of Object.values(files)) {
    assert(fs.existsSync(filePath), `Canonical packet file missing: ${path.relative(root, filePath)}`);
  }

  if (!args.check) {
    writeJson(files.intake, {
      story_id: payload.story_id,
      slot_id: payload.slot_id,
      target_public_route: payload.target_public_route,
      packet_path: payload.packet_path,
      author_display_name: payload.author_display_name,
      author_legal_name: payload.author_legal_name,
      author_contact: payload.author_contact,
      house_context: payload.house_context,
      public_naming_mode: payload.public_naming_mode,
      story_body: payload.story_body,
      editor_notes: payload.editor_notes,
      consent_signed: payload.consent_signed,
      photo_usage_approved: payload.photo_usage_approved,
      photo_usage_scope: payload.photo_usage_scope,
      quote_approved: payload.quote_approved,
      quote_usage_scope: payload.quote_usage_scope,
      legal_review: false,
      consent_timestamp: payload.consent_timestamp,
      withdrawal_rule_recorded: payload.withdrawal_rule_recorded
    });
    updatePacket(files.packet, payload);
    updateStoryDraft(files.storyDraft, payload);
    updateConsentRecord(files.consent, payload);
    updatePhotoPack(files.photoPack, payload);
    execFileSync(process.execPath, [manifestSyncScriptPath], {
      cwd: root,
      stdio: "ignore"
    });
  }

  const updatedFiles = [
    "intake-record.json",
    "packet.md",
    "story-draft.md",
    "consent-record.md",
    payload.source_photo_pack_location ? "photo-pack/README.md" : null
  ].filter(Boolean);

  console.log(`${args.check ? "CHECK" : "WRITE"} PASS: ${args.slot}`);
  console.log(`- packet_path: ${slot.packet_path}`);
  console.log(`- story_id: ${payload.story_id}`);
  console.log(`- updated_files: ${updatedFiles.join(", ")}`);
  console.log(`- story_word_count: ${countWords(payload.public_safe_draft_text)}`);
  console.log(`- review_unblockers_seeded: real intake record, story draft, consent record${payload.source_photo_pack_location ? ", approved source photo pack" : ""}`);
}

main();
