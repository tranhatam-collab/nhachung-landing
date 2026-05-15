#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "story-pipeline", "approved-story-assets.json");
const handoffDir = path.join(root, "story-pipeline", "handoff");
const readinessScriptPath = path.join(__dirname, "story-packet-readiness.mjs");
const intakeTemplateScriptPath = path.join(__dirname, "story-packet-intake-template.mjs");
const checkMode = process.argv.slice(2).includes("--check");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runNodeJson(scriptPath, scriptArgs) {
  return JSON.parse(
    execFileSync(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: root,
      encoding: "utf8"
    })
  );
}

function packetStoryId(slot) {
  return path.basename(path.dirname(slot.packet_path));
}

function templatePathForSlot(slot) {
  return path.join(handoffDir, `${slot.slot_id}.intake-template.json`);
}

function summaryPathForSlot(slot) {
  return path.join(handoffDir, `${slot.slot_id}.readiness-summary.json`);
}

function expectedTemplate(slot) {
  return runNodeJson(intakeTemplateScriptPath, [`--slot=${slot.slot_id}`]);
}

function expectedSummary(slot) {
  return {
    slot_id: slot.slot_id,
    story_id: packetStoryId(slot),
    target_route: slot.target_route,
    target_house: slot.target_house,
    packet_path: slot.packet_path,
    status: slot.status,
    first_unblockers: slot.first_unblockers,
    review_blockers: slot.review_blockers,
    review_blocker_details: slot.review_blocker_details,
    publish_blockers: slot.publish_blockers,
    publish_blocker_details: slot.publish_blocker_details,
    missing_evidence: slot.missing_evidence
  };
}

function compareJson(filePath, expectedValue, label) {
  assert(fs.existsSync(filePath), `Missing ${label}: ${path.relative(root, filePath)}`);
  const actual = readJson(filePath);
  assert(JSON.stringify(actual) === JSON.stringify(expectedValue), `${label} out of sync: ${path.relative(root, filePath)}`);
}

function buildReadme(manifest, readiness) {
  const slotSections = readiness.slots.map((slot) => [
    `## ${slot.slot_id}`,
    `- Story ID: \`${packetStoryId(slot)}\``,
    `- Target house: ${slot.target_house}`,
    `- Target route: \`${slot.target_route}\``,
    `- Packet path: \`${slot.packet_path}\``,
    `- Status: \`${slot.status}\``,
    `- Intake template: \`${slot.slot_id}.intake-template.json\``,
    `- Readiness summary: \`${slot.slot_id}.readiness-summary.json\``,
    `- First unblockers: ${slot.first_unblockers.join(", ")}`,
    `- Publish blockers: ${slot.publish_blockers.join(", ")}`
  ].join("\n")).join("\n\n");

  return `# Story Packet Handoff Bundle

Generated from the canonical T5 packet scripts. Refresh this bundle before asking Brand/Content to fill any real intake packet.

- Required ready story count: \`${manifest.content_gate.required_ready_story_count}\`
- Ready story count: \`${manifest.content_gate.ready_story_count}\`
- Content gate status: \`${manifest.content_gate.status}\`
- Shared open blockers: ${manifest.content_gate.open_blockers.join(" ")}

## Canonical use

1. Pick one slot below.
2. Fill the matching \`*.intake-template.json\` with real author, contact, naming, story, consent, and source photo pack data only.
3. Dry-run it with \`node scripts/story-packet-intake-sync.mjs --slot=<slot-id> --input=story-pipeline/handoff/<slot-id>.intake-template.json --check\`.
4. Apply only real internal-review-safe payloads, then rerun \`node scripts/story-packet-manifest-sync.mjs --check\` and \`node scripts/story-pipeline-lint.mjs\`.

## Slot batch

${slotSections}
`;
}

function main() {
  assert(fs.existsSync(manifestPath), "Missing story-pipeline/approved-story-assets.json");
  const manifest = readJson(manifestPath);
  const readiness = runNodeJson(readinessScriptPath, ["--json"]);
  const slots = Array.isArray(readiness.slots) ? readiness.slots : [];
  const readmePath = path.join(handoffDir, "README.md");
  const summaryPath = path.join(handoffDir, "bundle-summary.json");
  const expectedReadme = buildReadme(manifest, readiness);

  if (checkMode) {
    assert(fs.existsSync(handoffDir), "Missing story-pipeline/handoff");
    compareJson(summaryPath, readiness, "bundle summary");
    for (const slot of slots) {
      compareJson(templatePathForSlot(slot), expectedTemplate(slot), `${slot.slot_id} intake template`);
      compareJson(summaryPathForSlot(slot), expectedSummary(slot), `${slot.slot_id} readiness summary`);
    }
    assert(fs.existsSync(readmePath), "Missing handoff README");
    assert(fs.readFileSync(readmePath, "utf8") === expectedReadme, "handoff README out of sync");
    console.log(`CHECK PASS: story-pipeline/handoff (${slots.length} slots)`);
    return;
  }

  fs.mkdirSync(handoffDir, { recursive: true });
  writeJson(summaryPath, readiness);
  for (const slot of slots) {
    writeJson(templatePathForSlot(slot), expectedTemplate(slot));
    writeJson(summaryPathForSlot(slot), expectedSummary(slot));
  }
  fs.writeFileSync(readmePath, expectedReadme, "utf8");
  console.log(`WRITE PASS: story-pipeline/handoff (${slots.length} slots)`);
}

main();
