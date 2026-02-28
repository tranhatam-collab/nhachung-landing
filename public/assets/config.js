/* global window */
(function () {
  "use strict";

  // Landing config — no secrets.
  // Optional overrides via ?api=...&app=...&lang=... for debugging only.
  const u = new URL(window.location.href);

  const cfg = {
    BRAND: "Nhà Chung",
    DEFAULT_LANG: "vi",
    SUPPORTED_LANGS: ["vi", "en"],

    // Canonical endpoints (LOCKED CONTRACT)
    LANDING_BASE: "https://nhachung.org",
    API_BASE: "https://api.nhachung.org",
    APP_BASE: "https://app.nhachung.org",

    // Landing internal anchors
    ANCHORS: ["features", "how", "trust", "faq"],

    // Contract landing short routes (handled by Pages _redirects)
    ROUTES: {
      app: "/app",
      verify: "/verify",
      admin: "/admin"
    },

    // Optional: shown in UI as a link (landing should not fetch)
    API_HEALTH_PATH: "/test-db"
  };

  // Debug overrides (DO NOT use in production marketing links)
  if (u.searchParams.get("api")) cfg.API_BASE = u.searchParams.get("api");
  if (u.searchParams.get("app")) cfg.APP_BASE = u.searchParams.get("app");
  if (u.searchParams.get("lang")) cfg.DEFAULT_LANG = u.searchParams.get("lang");

  window.NHACHUNG = cfg;
})();
