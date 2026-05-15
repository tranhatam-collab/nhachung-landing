#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "story-pipeline", "approved-story-assets.json");

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = {};

  for (const arg of argv) {
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

function packetDirFromPath(packetPath) {
  return path.dirname(path.join(root, packetPath));
}

function packetStoryId(slot) {
  return path.basename(packetDirFromPath(slot.packet_path));
}

function buildTemplate(slot) {
  return {
    story_id: packetStoryId(slot),
    slot_id: slot.slot_id,
    target_public_route: slot.target_route,
    packet_path: slot.packet_path,
    author_display_name: "",
    author_legal_name: "",
    author_contact: "",
    house_context: slot.target_house,
    public_naming_mode: "first_name_only",
    story_body: "",
    editor_notes: "Replace every placeholder with the real intake note before --check or write mode.",
    consent_signed: true,
    photo_usage_approved: true,
    photo_usage_scope: "contextual_only",
    quote_approved: true,
    quote_usage_scope: "summary_only",
    consent_timestamp: "",
    withdrawal_rule_recorded: true,
    working_title: "",
    story_summary: "",
    public_safe_draft_text: "",
    author_voice_approved: true,
    target_length_near_200_words: true,
    source_photo_pack_location: "",
    photo_credit_text: ""
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  assert(args.slot, "Missing required --slot=<slot-id>");
  assert(fs.existsSync(manifestPath), "Missing story-pipeline/approved-story-assets.json");

  const manifest = readJson(manifestPath);
  assert(Array.isArray(manifest.required_story_slots), "required_story_slots must be an array");
  const slot = manifest.required_story_slots.find((entry) => entry.slot_id === args.slot);
  assert(slot, `Unknown slot: ${args.slot}`);
  assert(typeof slot.packet_path === "string" && slot.packet_path.length > 0, `${args.slot} does not have a canonical packet_path`);

  const template = buildTemplate(slot);
  const output = `${JSON.stringify(template, null, 2)}\n`;

  if (args.output) {
    const outputPath = path.resolve(root, args.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output, "utf8");
    console.log(`TEMPLATE PASS: ${slot.slot_id}`);
    console.log(`- output: ${path.relative(root, outputPath)}`);
  } else {
    process.stdout.write(output);
  }
}

main();
