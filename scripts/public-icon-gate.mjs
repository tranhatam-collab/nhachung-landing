import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");

const iconChecks = [
  ["assets/icons/icon-16.png", 16],
  ["assets/icons/icon-32.png", 32],
  ["assets/icons/icon-64.png", 64],
  ["assets/icons/icon-128.png", 128],
  ["assets/icons/icon-256.png", 256],
  ["assets/icons/icon-512.png", 512],
  ["assets/icons/icon-1024.png", 1024],
  ["assets/icons/app/apple-touch-icon.png", 180],
  ["assets/icons/app/icon-192-maskable.png", 192],
  ["assets/icons/app/icon-512-maskable.png", 512],
];

const publicPages = [
  "index.html",
  "nha-chung-la-gi.html",
  "hanh-trinh-tham-gia.html",
  "cac-can-nha.html",
  "cau-chuyen.html",
  "nguyen-tac-song-chung.html",
  "lam-viec-muon-noi.html",
  "ung-dung.html",
  "dang-ky.html",
];

const legalPages = [
  "vi/legal/terms.html",
  "vi/legal/privacy.html",
  "vi/legal/community-principles.html",
  "vi/legal/resident-agreement.html",
  "en/legal/terms.html",
  "en/legal/privacy.html",
  "en/legal/community-principles.html",
  "en/legal/resident-agreement.html",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readRequired(relativePath) {
  const filePath = path.join(publicRoot, relativePath);
  assert(fs.existsSync(filePath), `Missing required public file: ${relativePath}`);
  return fs.readFileSync(filePath);
}

function readText(relativePath) {
  return readRequired(relativePath).toString("utf8");
}

function assertPngDimensions(relativePath, expectedSize) {
  const buffer = readRequired(relativePath);
  assert(buffer.length > 24, `${relativePath} is too small to be a valid PNG`);
  assert(buffer.subarray(1, 4).toString("ascii") === "PNG", `${relativePath} is not a PNG`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  assert(width === expectedSize && height === expectedSize, `${relativePath} expected ${expectedSize}x${expectedSize}, got ${width}x${height}`);
}

for (const [relativePath, expectedSize] of iconChecks) {
  assertPngDimensions(relativePath, expectedSize);
}

const manifest = JSON.parse(readText("manifest.json"));
const iconSrcs = new Set((manifest.icons || []).map((icon) => icon.src));
for (const src of [
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/app/icon-192-maskable.png",
  "/assets/icons/app/icon-512-maskable.png",
]) {
  assert(iconSrcs.has(src), `manifest.json missing icon source: ${src}`);
}

for (const page of publicPages) {
  const html = readText(page);
  assert(html.includes('rel="icon" href="assets/favicon.svg"'), `${page} missing SVG favicon link`);
  assert(html.includes('rel="icon" href="assets/icons/icon-32.png"'), `${page} missing PNG favicon link`);
  assert(html.includes('rel="apple-touch-icon" href="assets/icons/app/apple-touch-icon.png"'), `${page} missing apple-touch-icon link`);
  assert(html.includes('rel="manifest" href="manifest.json"'), `${page} missing manifest link`);
}

for (const page of legalPages) {
  const html = readText(page);
  assert(html.includes('rel="icon" href="/assets/favicon.svg"'), `${page} missing SVG favicon link`);
  assert(html.includes('rel="icon" href="/assets/icons/icon-32.png"'), `${page} missing PNG favicon link`);
  assert(html.includes('rel="apple-touch-icon" href="/assets/icons/app/apple-touch-icon.png"'), `${page} missing apple-touch-icon link`);
  assert(html.includes('rel="manifest" href="/manifest.json"'), `${page} missing manifest link`);
}

console.log("Public icon gate PASS: PNG favicon/app icons exist, dimensions match, and public/legal pages link them.");
