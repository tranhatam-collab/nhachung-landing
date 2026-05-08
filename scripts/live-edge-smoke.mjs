import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");

const localIndex = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
const localHash = sha256(localIndex);
const localTitle = extractTitle(localIndex);

const landingUrls = [
  "https://nhachung.org/",
  "https://www.nhachung.org/",
];

const requiredLandingMarkers = [
  "Hệ điều hành cộng đồng sống thật",
  "Sống tự do",
  "Làm việc muôn nơi",
  "Có nơi thuộc về",
  "VIET CAN NEW CORP",
  "CÔNG TY TNHH BỒ CÂU TRẮNG",
];

const forbiddenLiveMarkers = [
  "Hệ sinh thái Sống",
  "Modules",
  "Cấp độ",
  "Lộ trình",
  "Hello, World!",
];

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "user-agent": "nhachung-release-smoke/1.0",
      },
      signal: controller.signal,
    });

    return {
      body: await response.text(),
      contentType: response.headers.get("content-type") || "",
      status: response.status,
      url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkLanding(url) {
  const { body, contentType, status } = await fetchText(url);
  const liveHash = sha256(body);
  const liveTitle = extractTitle(body);

  assert(status === 200, `${url} returned HTTP ${status}`);
  assert(contentType.includes("text/html"), `${url} returned non-HTML content-type: ${contentType}`);
  assert(liveTitle === localTitle, `${url} title mismatch: ${liveTitle || "(missing)"}`);
  assert(liveHash === localHash, `${url} hash mismatch: live ${liveHash}, local ${localHash}`);

  for (const marker of requiredLandingMarkers) {
    assert(body.includes(marker), `${url} missing canonical marker: ${marker}`);
  }

  for (const marker of forbiddenLiveMarkers) {
    assert(!body.includes(marker), `${url} still contains stale marker: ${marker}`);
  }

  return { hash: liveHash, title: liveTitle, url };
}

async function checkApiRoot() {
  const { body, contentType, status, url } = await fetchText("https://api.nhachung.org/");

  assert(status >= 200 && status < 500, `${url} returned unexpected HTTP ${status}`);
  assert(!body.includes("Hello, World!"), `${url} is serving the static Wrangler asset placeholder`);
  assert(
    !body.includes("public/index.html as configured in `wrangler.jsonc`"),
    `${url} is serving static asset docs`,
  );

  return { contentType, status, url };
}

async function main() {
  const landingResults = [];
  for (const url of landingUrls) {
    landingResults.push(await checkLanding(url));
  }

  const apiResult = await checkApiRoot();

  console.log("Live edge smoke PASS");
  console.log(`local index hash: ${localHash}`);
  for (const result of landingResults) {
    console.log(`${result.url} title="${result.title}" hash=${result.hash}`);
  }
  console.log(`${apiResult.url} status=${apiResult.status} content-type="${apiResult.contentType}"`);
}

try {
  await main();
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  const cause = error && error.cause && error.cause.message ? ` (${error.cause.message})` : "";
  console.error(`Live edge smoke FAIL: ${message}${cause}`);
  process.exit(1);
}
