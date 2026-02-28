/* public/assets/config.js
   Runtime config for nhachung.org (Pages)
   - VI default
   - Allow easy future expansion (more langs, different API base per env)
*/
(function () {
  const cfg = {
    BRAND: "Nhà Chung",
    DEFAULT_LANG: "vi",
    SUPPORTED_LANGS: ["vi", "en"],

    // ✅ CHỐT API & APP (bạn đã chốt)
    API_BASE: "https://api.nhachung.org",
    APP_BASE: "https://app.nhachung.org",

    // UI / Behavior
    ROUTES: {
      home: "/",
      status: "/status",
      verify: "/verify",
      admin: "/admin",
      legal_privacy: "/legal/privacy.html",
      legal_terms: "/legal/terms.html",
    },

    // Endpoints (landing uses these)
    ENDPOINTS: {
      testDb: "/test-db",
      listCommitments: "/api/commitment/list",
      getCommitment: "/api/commitment/get?id=",
      // createCommitment is admin-only via token; landing will not store token
      createCommitment: "/api/commitment/create",
    },

    // Network safety
    FETCH_TIMEOUT_MS: 12000,
  };

  // Allow override via query (?api=...) for quick debug without redeploy
  try {
    const u = new URL(location.href);
    const api = u.searchParams.get("api");
    if (api && /^https:\/\/[a-z0-9.\-]+$/i.test(api)) cfg.API_BASE = api;
    const lang = u.searchParams.get("lang");
    if (lang && cfg.SUPPORTED_LANGS.includes(lang)) cfg.DEFAULT_LANG = lang;
  } catch (_) {}

  window.NHACHUNG_CONFIG = cfg;
})();
