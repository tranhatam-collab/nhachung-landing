import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");
const cliArgs = process.argv.slice(2);

const localIndex = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
const localHash = sha256(localIndex);
const localTitle = extractTitle(localIndex);
const localSameAs = extractSameAs(localIndex);
const localFooterSurfaceCluster = extractFooterSurfaceCluster(localIndex);

const landingUrls = [
  "https://nhachung.org/",
  "https://www.nhachung.org/",
];

const requiredLandingMarkers = [
  "Hệ điều hành cộng đồng sống thật",
  "Ba hình thức Nhà Chung",
  "Làm việc muôn nơi",
  "Đăng ký miễn phí",
  "VIET CAN NEW CORP",
  "CÔNG TY TNHH BỒ CÂU TRẮNG",
];

const forbiddenLiveMarkers = [
  "Hệ sinh thái Sống",
  "Modules",
  "Cấp độ",
  "Lộ trình",
  "Nơi Con Người Có Không Gian Ở Thật",
  "Nhà Chung không phải bất động sản",
  "Không phải câu lạc bộ đầu tư",
  "Đầu tư thiếu hệ sinh thái bảo vệ",
  "Module Đầu Tư",
  "Vốn đầu tư",
  "dòng tiền",
  "Hello, World!",
];

const snapshotOverrides = {
  "https://nhachung.org/": readArgValue("--root-html"),
  "https://www.nhachung.org/": readArgValue("--www-html"),
  "https://api.nhachung.org/": readArgValue("--api-body"),
};

const responseSnapshotOverrides = {
  "https://nhachung.org/": readArgValue("--root-response"),
  "https://www.nhachung.org/": readArgValue("--www-response"),
  "https://api.nhachung.org/": readArgValue("--api-response"),
};

const rawResponseSnapshotOverrides = {
  "https://nhachung.org/": readArgValue("--root-http"),
  "https://www.nhachung.org/": readArgValue("--www-http"),
  "https://api.nhachung.org/": readArgValue("--api-http"),
};

function readArgValue(prefix) {
  const match = cliArgs.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? path.resolve(projectRoot, match.slice(prefix.length + 1)) : "";
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractSameAs(html) {
  const match = html.match(/"sameAs"\s*:\s*\[([\s\S]*?)\]/i);
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1].trim());
}

function extractFooterSurfaceCluster(html) {
  const match = html.match(/nhachung\.org\s*[·|]\s*app\.nhachung\.org\s*[·|]\s*lamviec\.muonnoi\.org/i);
  return match ? match[0].replace(/\s+/g, " ").trim() : "";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function classifyError(error) {
  const code = error?.cause?.code || error?.code || "";
  const message = error?.message || String(error);
  const networkCodes = new Set([
    "ENOTFOUND",
    "EAI_AGAIN",
    "ECONNREFUSED",
    "ECONNRESET",
    "ENETUNREACH",
    "ETIMEDOUT",
    "UND_ERR_CONNECT_TIMEOUT",
  ]);

  if (networkCodes.has(code) || /fetch failed|getaddrinfo|network/i.test(message)) {
    return { code, status: "network_blocked" };
  }

  return { code, status: "runtime_parity_fail" };
}

function buildLocalExpectation() {
  return {
    footerSurfaceCluster: localFooterSurfaceCluster,
    hash: localHash,
    requiredMarkers: requiredLandingMarkers,
    sameAs: localSameAs,
    title: localTitle,
    urls: [...landingUrls, "https://api.nhachung.org/"],
  };
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

async function fetchText(url) {
  const rawResponseSnapshotPath = rawResponseSnapshotOverrides[url];
  if (rawResponseSnapshotPath) {
    return readRawHttpResponseSnapshot(url, rawResponseSnapshotPath);
  }

  const responseSnapshotPath = responseSnapshotOverrides[url];
  if (responseSnapshotPath) {
    return readResponseSnapshot(url, responseSnapshotPath);
  }

  const snapshotPath = snapshotOverrides[url];
  if (snapshotPath) {
    return {
      body: fs.readFileSync(snapshotPath, "utf8"),
      contentType: url === "https://api.nhachung.org/" ? "text/plain; charset=utf-8" : "text/html; charset=utf-8",
      snapshotMode: "body_file",
      snapshotPath,
      status: 200,
      url,
    };
  }

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
      snapshotMode: "live_fetch",
      status: response.status,
      url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function readResponseSnapshot(url, snapshotPath) {
  const raw = fs.readFileSync(snapshotPath, "utf8");
  const parsed = JSON.parse(raw);
  const body = typeof parsed?.body === "string" ? parsed.body : "";
  const status = Number.isFinite(parsed?.status) ? parsed.status : 200;
  const contentType =
    typeof parsed?.contentType === "string" && parsed.contentType.trim()
      ? parsed.contentType
      : url === "https://api.nhachung.org/"
        ? "text/plain; charset=utf-8"
        : "text/html; charset=utf-8";

  return {
    body,
    contentType,
    note: typeof parsed?.note === "string" ? parsed.note : "",
    snapshotMode: "response_json",
    snapshotPath,
    status,
    url: typeof parsed?.url === "string" && parsed.url.trim() ? parsed.url : url,
  };
}

function readRawHttpResponseSnapshot(url, snapshotPath) {
  const raw = fs.readFileSync(snapshotPath, "utf8").replace(/\r\n/g, "\n");
  const separatorIndex = raw.indexOf("\n\n");

  if (separatorIndex === -1) {
    throw new Error(`Invalid raw HTTP snapshot: ${snapshotPath}`);
  }

  const headerBlock = raw.slice(0, separatorIndex);
  const body = raw.slice(separatorIndex + 2);
  const headerLines = headerBlock.split("\n").filter(Boolean);
  const statusLine = headerLines.shift() || "";
  const statusMatch = statusLine.match(/^HTTP\/\d+(?:\.\d+)?\s+(\d{3})\b/i);

  if (!statusMatch) {
    throw new Error(`Invalid HTTP status line in snapshot: ${snapshotPath}`);
  }

  const headers = new Map();
  for (const line of headerLines) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    headers.set(name, value);
  }

  const contentType =
    headers.get("content-type") ||
    (url === "https://api.nhachung.org/" ? "text/plain; charset=utf-8" : "text/html; charset=utf-8");

  return {
    body,
    contentType,
    note: "raw_http_snapshot",
    snapshotMode: "response_http",
    snapshotPath,
    status: Number.parseInt(statusMatch[1], 10),
    url,
  };
}

async function checkLanding(url) {
  const { body, contentType, note, snapshotMode, snapshotPath, status } = await fetchText(url);
  const liveHash = sha256(body);
  const liveTitle = extractTitle(body);
  const liveSameAs = extractSameAs(body);
  const liveFooterSurfaceCluster = extractFooterSurfaceCluster(body);

  assert(status === 200, `${url} returned HTTP ${status}`);
  assert(contentType.includes("text/html"), `${url} returned non-HTML content-type: ${contentType}`);
  assert(liveTitle === localTitle, `${url} title mismatch: ${liveTitle || "(missing)"}`);
  assert(
    JSON.stringify(liveSameAs) === JSON.stringify(localSameAs),
    `${url} Organization.sameAs mismatch: ${JSON.stringify(liveSameAs)}`
  );
  assert(
    liveFooterSurfaceCluster === localFooterSurfaceCluster,
    `${url} footer surface cluster mismatch: ${liveFooterSurfaceCluster || "(missing)"}`
  );

  for (const marker of requiredLandingMarkers) {
    assert(body.includes(marker), `${url} missing canonical marker: ${marker}`);
  }

  for (const marker of forbiddenLiveMarkers) {
    assert(!body.includes(marker), `${url} still contains stale marker: ${marker}`);
  }

  return {
    footerSurfaceCluster: liveFooterSurfaceCluster,
    hash: liveHash,
    sameAs: liveSameAs,
    snapshotMode,
    snapshotPath,
    snapshotNote: note,
    title: liveTitle,
    url,
  };
}

async function checkApiRoot() {
  const { body, contentType, note, snapshotMode, snapshotPath, status, url } = await fetchText("https://api.nhachung.org/");

  assert(status >= 200 && status < 500, `${url} returned unexpected HTTP ${status}`);
  assert(!body.includes("Hello, World!"), `${url} is serving the static Wrangler asset placeholder`);
  assert(
    !body.includes("public/index.html as configured in `wrangler.jsonc`"),
    `${url} is serving static asset docs`,
  );

  return { contentType, snapshotMode, snapshotPath, snapshotNote: note, status, url };
}

async function main() {
  const landingResults = [];
  for (const url of landingUrls) {
    landingResults.push(await checkLanding(url));
  }

  const apiResult = await checkApiRoot();

  if (jsonMode) {
    printJson({
      api: apiResult,
      checked_at: new Date().toISOString(),
      local: buildLocalExpectation(),
      results: landingResults,
      status: "pass",
    });
    return;
  }

  console.log("Live edge smoke PASS");
  console.log(`local index hash: ${localHash}`);
  console.log(`local Organization.sameAs: ${JSON.stringify(localSameAs)}`);
  console.log(`local footer surface cluster: ${localFooterSurfaceCluster}`);
  for (const result of landingResults) {
    console.log(
      `${result.url} title="${result.title}" hash=${result.hash} sameAs='${JSON.stringify(result.sameAs)}' footer="${result.footerSurfaceCluster}"${result.snapshotPath ? ` snapshot="${result.snapshotPath}"` : ""}${result.snapshotMode ? ` snapshot_mode="${result.snapshotMode}"` : ""}${result.snapshotNote ? ` snapshot_note="${result.snapshotNote}"` : ""}`
    );
  }
  console.log(
    `${apiResult.url} status=${apiResult.status} content-type="${apiResult.contentType}"${apiResult.snapshotPath ? ` snapshot="${apiResult.snapshotPath}"` : ""}${apiResult.snapshotMode ? ` snapshot_mode="${apiResult.snapshotMode}"` : ""}${apiResult.snapshotNote ? ` snapshot_note="${apiResult.snapshotNote}"` : ""}`
  );
}

try {
  await main();
} catch (error) {
  const message = error?.message || String(error);
  const causeMessage = error?.cause?.message ? ` (${error.cause.message})` : "";
  const classification = classifyError(error);

  if (jsonMode) {
    printJson({
      checked_at: new Date().toISOString(),
      error: `${message}${causeMessage}`,
      error_code: classification.code || null,
      local: buildLocalExpectation(),
      status: classification.status,
    });
  } else if (classification.status === "network_blocked") {
    console.error(`Live edge smoke NETWORK_BLOCKED: ${message}${causeMessage}`);
    console.error(
      `Local expectation: title="${localTitle}" sameAs='${JSON.stringify(localSameAs)}' footer="${localFooterSurfaceCluster}"`
    );
  } else {
    console.error(`Live edge smoke FAIL: ${message}${causeMessage}`);
  }

  process.exit(classification.status === "network_blocked" ? 2 : 1);
}
