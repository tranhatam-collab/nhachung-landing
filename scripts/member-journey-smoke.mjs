/**
 * member-journey-smoke.mjs
 *
 * Live member-journey smoke test for https://api.nhachung.org
 * Tests the 6 canonical API gates that matter at launch.
 *
 * Usage:
 *   node scripts/member-journey-smoke.mjs          # human-readable output
 *   node scripts/member-journey-smoke.mjs --json   # JSON summary
 *
 * Exit codes:
 *   0 – all tests PASS
 *   1 – one or more tests FAIL
 *   2 – network blocked (sandbox / CI with no egress)
 */

import process from "node:process";

const BASE = "https://api.nhachung.org";
const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");

const TIMEOUT_MS = 15_000;

/** Classify network-level errors so CI can exit 2 instead of 1. */
function isNetworkError(err) {
  const code = err?.cause?.code || err?.code || "";
  const msg = err?.message || String(err);
  return (
    ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ENETUNREACH", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"].includes(code) ||
    /fetch failed|getaddrinfo|network/i.test(msg)
  );
}

/** Minimal fetch wrapper with timeout and JSON-safe body capture. */
async function request(method, path, { body, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const init = {
      method,
      headers: {
        "user-agent": "nhachung-member-journey-smoke/1.0",
        accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers["content-type"] = "application/json";
    }

    const res = await fetch(`${BASE}${path}`, init);
    let parsed = null;
    try {
      const text = await res.text();
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // body is not JSON – leave parsed null
    }
    return { status: res.status, body: parsed };
  } finally {
    clearTimeout(timer);
  }
}

/** Test definition schema:
 *  name        – human label
 *  run()       – async fn returning { status, body }
 *  assert(r)   – throws Error if the result is unexpected
 *  meta        – recorded in JSON output
 */
const TESTS = [
  {
    name: "Test 1: GET /api/health → 200 ok:true",
    meta: { method: "GET", path: "/api/health", expectedStatus: 200 },
    run: () => request("GET", "/api/health"),
    assert({ status, body }) {
      if (status !== 200) throw new Error(`expected 200, got ${status}`);
      if (!body?.ok) throw new Error(`expected body.ok=true, got ${JSON.stringify(body)}`);
    },
  },
  {
    name: "Test 2: GET /api/me (no auth) → 401",
    meta: { method: "GET", path: "/api/me", expectedStatus: 401 },
    run: () => request("GET", "/api/me"),
    assert({ status }) {
      if (status !== 401) throw new Error(`expected 401, got ${status}`);
    },
  },
  {
    name: "Test 3: POST /api/applications (valid body) → 201 + application_id",
    meta: { method: "POST", path: "/api/applications", expectedStatus: 201 },
    run: () =>
      request("POST", "/api/applications", {
        body: {
          name: "Nguyen Thi Smoke Test",
          email: "smoke-test@nhachung.org",
          phone: "0900000000",
          current_city: "Ho Chi Minh",
          why_nhachung: "Automated member journey smoke test — safe to ignore.",
          preferred_move_in: "2026-07-01",
        },
      }),
    assert({ status, body }) {
      if (status !== 201) throw new Error(`expected 201, got ${status}`);
      // API wraps data: { ok: true, data: { application_id, message } }
      const appId = body?.application_id || body?.data?.application_id;
      if (!appId) throw new Error(`expected application_id in response, got ${JSON.stringify(body)}`);
    },
  },
  {
    name: "Test 4: GET /api/public/verify/nonexistent → 404",
    meta: { method: "GET", path: "/api/public/verify/nonexistent", expectedStatus: 404 },
    run: () => request("GET", "/api/public/verify/nonexistent"),
    assert({ status }) {
      if (status !== 404) throw new Error(`expected 404, got ${status}`);
    },
  },
  {
    name: "Test 5: POST /api/applications (missing fields) → 400",
    meta: { method: "POST", path: "/api/applications", expectedStatus: 400 },
    run: () =>
      request("POST", "/api/applications", {
        body: { email: "incomplete@nhachung.org" },  // missing name, current_city, why_nhachung
      }),
    assert({ status }) {
      if (status !== 400) throw new Error(`expected 400, got ${status}`);
    },
  },
  {
    name: "Test 6: GET /api/admin/applications (no auth) → 401 or 403",
    meta: { method: "GET", path: "/api/admin/applications", expectedStatus: "401|403" },
    run: () => request("GET", "/api/admin/applications"),
    assert({ status }) {
      if (status !== 401 && status !== 403)
        throw new Error(`expected 401 or 403, got ${status}`);
    },
  },
];

async function runAll() {
  const results = [];
  let anyFail = false;
  let networkBlocked = false;

  for (const test of TESTS) {
    let result;
    try {
      const response = await test.run();
      try {
        test.assert(response);
        result = {
          name: test.name,
          ...test.meta,
          actualStatus: response.status,
          verdict: "PASS",
        };
      } catch (assertErr) {
        anyFail = true;
        result = {
          name: test.name,
          ...test.meta,
          actualStatus: response.status,
          verdict: "FAIL",
          reason: assertErr.message,
        };
      }
    } catch (fetchErr) {
      if (isNetworkError(fetchErr)) {
        networkBlocked = true;
        result = {
          name: test.name,
          ...test.meta,
          actualStatus: null,
          verdict: "NETWORK_BLOCKED",
          reason: fetchErr.message,
        };
      } else {
        anyFail = true;
        result = {
          name: test.name,
          ...test.meta,
          actualStatus: null,
          verdict: "ERROR",
          reason: fetchErr.message,
        };
      }
    }
    results.push(result);
  }

  return { results, anyFail, networkBlocked };
}

function renderHuman(results) {
  const pad = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    const url = `${BASE}${r.path}`;
    const expected = r.expectedStatus;
    const actual = r.actualStatus ?? "–";
    const verdict = r.verdict;
    const extra = r.reason ? `  (${r.reason})` : "";
    console.log(`  ${verdict.padEnd(16)} ${r.name}`);
    console.log(`               url=${url}  expected=${expected}  actual=${actual}${extra}`);
  }
}

const { results, anyFail, networkBlocked } = await runAll();

const checkedAt = new Date().toISOString();
const overallStatus = networkBlocked && !anyFail
  ? "network_blocked"
  : anyFail
    ? "fail"
    : "pass";

if (jsonMode) {
  console.log(
    JSON.stringify(
      { checked_at: checkedAt, status: overallStatus, base: BASE, results },
      null,
      2,
    ),
  );
} else {
  const banner = overallStatus === "pass"
    ? "Member journey smoke PASS"
    : overallStatus === "network_blocked"
      ? "Member journey smoke NETWORK_BLOCKED (no egress)"
      : "Member journey smoke FAIL";

  console.log(`\n${banner}  (${checkedAt})\n`);
  renderHuman(results);
  console.log();
}

process.exit(anyFail ? 1 : networkBlocked ? 2 : 0);
