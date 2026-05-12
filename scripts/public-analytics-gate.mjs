import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");

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

const forbiddenTrackers = [
  "googletagmanager.com",
  "google-analytics.com",
  "gtag(",
  "fbq(",
  "connect.facebook.net",
  "hotjar.com",
  "segment.com",
  "analytics.track",
  "navigator.sendBeacon",
  "XMLHttpRequest",
  "new FormData",
];

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${path.relative(projectRoot, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(haystack, needle, label) {
  assert(haystack.includes(needle), `${label} missing required text: ${needle}`);
}

const analyticsJs = readRequired(path.join(publicRoot, "assets/js/analytics.js"));
assertIncludes(analyticsJs, "https://static.cloudflareinsights.com/beacon.min.js", "assets/js/analytics.js");
assertIncludes(analyticsJs, "data-cf-beacon", "assets/js/analytics.js");
assertIncludes(analyticsJs, "CLOUDFLARE_WEB_ANALYTICS_TOKEN", "assets/js/analytics.js");
assert(!/querySelector\(\s*["']form/i.test(analyticsJs), "analytics.js must not inspect forms");
assert(!/localStorage|sessionStorage|document\.cookie/i.test(analyticsJs), "analytics.js must not read browser storage or cookies");

const configJs = readRequired(path.join(publicRoot, "assets/config.js"));
assertIncludes(configJs, "CLOUDFLARE_WEB_ANALYTICS_TOKEN", "assets/config.js");
assert(
  /CLOUDFLARE_WEB_ANALYTICS_TOKEN:\s*""/.test(configJs),
  "Do not commit a Cloudflare Web Analytics token; inject it during controlled production setup.",
);

for (const tracker of forbiddenTrackers) {
  assert(!analyticsJs.includes(tracker), `analytics.js must not include custom tracker/data sink: ${tracker}`);
}

const headersText = readRequired(path.join(publicRoot, "_headers"));
assertIncludes(headersText, "Content-Security-Policy:", "_headers");
assertIncludes(headersText, "https://static.cloudflareinsights.com", "_headers");
assertIncludes(headersText, "https://cloudflareinsights.com", "_headers");

for (const page of publicPages) {
  const html = readRequired(path.join(publicRoot, page));
  assertIncludes(html, '<script src="assets/config.js" defer></script>', page);
  assertIncludes(html, '<script src="assets/js/analytics.js" defer></script>', page);
}

for (const page of legalPages) {
  const html = readRequired(path.join(publicRoot, page));
  assertIncludes(html, '<script src="/assets/config.js"></script>', page);
  assertIncludes(html, '<script src="/assets/js/analytics.js" defer></script>', page);
}

console.log("Public analytics gate PASS: Cloudflare Web Analytics scaffold is token-gated and avoids custom PII collection.");
