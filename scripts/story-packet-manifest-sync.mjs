#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "story-pipeline", "approved-story-assets.json");
const readinessScriptPath = path.join(__dirname, "story-packet-readiness.mjs");

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = { check: false };

  for (const arg of argv) {
    if (arg === "--check") {
      options.check = true;
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeArray(values) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function buildOpenBlockers(summary) {
  const blockers = [];
  const slots = Array.isArray(summary.slots) ? summary.slots : [];
  const reviewReady = summary.totals?.review_ready_packet_inputs ?? 0;
  const publishReady = summary.totals?.publish_ready_packet_inputs ?? 0;
  const approvedReady = summary.totals?.approved_ready_stories ?? 0;
  const requiredReady = summary.totals?.required_ready_stories ?? slots.length;
  const allSlotsShare = (blocker) => slots.length > 0 && slots.every((slot) => Array.isArray(slot.review_blockers) && slot.review_blockers.includes(blocker));
  const anyPublishBlocker = (blocker) => slots.some((slot) => Array.isArray(slot.publish_blockers) && slot.publish_blockers.includes(blocker));

  if (approvedReady < requiredReady) {
    blockers.push(`Only ${approvedReady}/${requiredReady} required story slots are publish-approved with full consent, legal review, author final approval, and publish approval.`);
  }
  if (reviewReady < slots.length) {
    const shared = [];
    if (allSlotsShare("real intake record")) {
      shared.push("real intake record");
    }
    if (allSlotsShare("story draft")) {
      shared.push("story draft");
    }
    if (allSlotsShare("approved source photo pack")) {
      shared.push("approved source photo pack");
    }
    if (allSlotsShare("consent record")) {
      shared.push("consent record");
    }
    if (shared.length > 0) {
      blockers.push(`Shared first unblockers across seeded slots: ${shared.join(", ")}.`);
    } else {
      blockers.push(`Review-ready packet inputs remain incomplete on ${slots.length - reviewReady}/${slots.length} required slots.`);
    }
  }
  if (publishReady < slots.length) {
    const publishAssetsBlocked = anyPublishBlocker("local hero/OG assets");
    if (publishAssetsBlocked) {
      blockers.push("No slot has the final local hero + 1200x630 OG asset pair attached to a real story packet yet.");
    }
  }

  return normalizeArray(blockers);
}

function runReadinessSummary() {
  const raw = execFileSync(process.execPath, [readinessScriptPath, "--json"], {
    cwd: root,
    encoding: "utf8"
  });
  return JSON.parse(raw);
}

function syncManifest(manifest, summary) {
  const slotSummaries = new Map((summary.slots ?? []).map((slot) => [slot.slot_id, slot]));
  const nextManifest = {
    ...manifest,
    content_gate: {
      ...manifest.content_gate,
      ready_story_count: summary.totals?.approved_ready_stories ?? manifest.content_gate?.ready_story_count ?? 0,
      status: (summary.totals?.approved_ready_stories ?? 0) >= (summary.totals?.required_ready_stories ?? 0) ? "complete" : "blocked",
      open_blockers: buildOpenBlockers(summary)
    },
    required_story_slots: (manifest.required_story_slots ?? []).map((slot) => {
      const slotSummary = slotSummaries.get(slot.slot_id);
      if (!slotSummary) {
        return slot;
      }

      return {
        ...slot,
        status: slotSummary.expected_status,
        missing_evidence: slotSummary.expected_missing_evidence
      };
    })
  };

  return nextManifest;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(manifestPath)) {
    fail("Missing story-pipeline/approved-story-assets.json");
  }

  const manifest = readJson(manifestPath);
  const summary = runReadinessSummary();
  const nextManifest = syncManifest(manifest, summary);
  const before = `${JSON.stringify(manifest, null, 2)}\n`;
  const after = `${JSON.stringify(nextManifest, null, 2)}\n`;

  if (args.check) {
    if (before !== after) {
      fail("approved-story-assets.json is out of sync with packet readiness; run node scripts/story-packet-manifest-sync.mjs");
    }
  } else if (before !== after) {
    writeJson(manifestPath, nextManifest);
  }

  const changedSlots = (nextManifest.required_story_slots ?? [])
    .filter((slot, index) => {
      const prev = manifest.required_story_slots?.[index];
      return JSON.stringify(prev) !== JSON.stringify(slot);
    })
    .map((slot) => slot.slot_id);

  console.log(`${args.check ? "CHECK" : "SYNC"} PASS: approved-story-assets.json`);
  console.log(`- ready_story_count: ${nextManifest.content_gate.ready_story_count}/${nextManifest.content_gate.required_ready_story_count}`);
  console.log(`- content_gate_status: ${nextManifest.content_gate.status}`);
  console.log(`- changed_slots: ${changedSlots.length > 0 ? changedSlots.join(", ") : "none"}`);
  console.log(`- open_blockers: ${nextManifest.content_gate.open_blockers.length}`);
}

main();
