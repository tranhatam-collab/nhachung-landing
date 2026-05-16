/* global window */
(function () {
  "use strict";

  // Landing config — no secrets.
  // Optional overrides via ?api=...&app=...&lang=... for debugging only.
  const u = new URL(window.location.href);

  const cfg = {
    BRAND: "Nhà Chung",
    DEFAULT_LANG: "vi",
    FALLBACK_LANG: "vi",
    SUPPORTED_LANGS: ["vi", "en"],
    LOCALES: {
      vi: { label: "Tiếng Việt", short: "VI", hreflang: "vi-VN", dir: "ltr", primary: true },
      en: { label: "English", short: "EN", hreflang: "en-US", dir: "ltr" },
      fr: { label: "Français", short: "FR", hreflang: "fr-FR", dir: "ltr", enabled: false },
      de: { label: "Deutsch", short: "DE", hreflang: "de-DE", dir: "ltr", enabled: false },
      ja: { label: "日本語", short: "JA", hreflang: "ja-JP", dir: "ltr", enabled: false },
      ko: { label: "한국어", short: "KO", hreflang: "ko-KR", dir: "ltr", enabled: false },
      "zh-hans": { label: "简体中文", short: "ZH", hreflang: "zh-CN", dir: "ltr", enabled: false }
    },

    // Canonical endpoints (LOCKED CONTRACT)
    LANDING_BASE: "https://nhachung.org",
    API_BASE: "https://api.nhachung.org",
    APP_BASE: "https://app.nhachung.org",
    CONTENT_BASE: "/content",
    LANGUAGE_REBUILD_REQUIRED: true,
    // ANALYTICS TOKEN SETUP:
    // CLOUDFLARE_WEB_ANALYTICS_TOKEN must remain "" in source (enforced by
    // scripts/public-analytics-gate.mjs). Inject the real token via Cloudflare Pages
    // environment variable or a build-time sed/replace step — do NOT commit it.
    // To get the token:
    //   1. Go to https://dash.cloudflare.com/f3f9e76222dcb488d5e303e29e8ba192/web-analytics/sites
    //   2. Select the nhachung.org site (or create it if missing)
    //   3. Copy the "token" value shown in the JS snippet
    //   4. Set it in Cloudflare Pages > Settings > Environment Variables as
    //      CF_ANALYTICS_TOKEN (then replace "" below only in your deploy pipeline,
    //      never in a committed file)
    ANALYTICS: {
      CLOUDFLARE_WEB_ANALYTICS_TOKEN: "",
      PROVIDER: "cloudflare-web-analytics"
    },

    // Landing internal anchors
    ANCHORS: ["vision", "system", "opportunities", "levels", "pricing", "faq"],

    // Contract landing short routes (handled by Pages _redirects)
    ROUTES: {
      register: "/register",
      app: "/app",
      verify: "/verify",
      admin: "/admin"
    },

    // Optional: shown in UI as a link (landing should not fetch)
    API_HEALTH_PATH: "/api/health"
  };

  // Debug overrides (DO NOT use in production marketing links)
  if (u.searchParams.get("api")) cfg.API_BASE = u.searchParams.get("api");
  if (u.searchParams.get("app")) cfg.APP_BASE = u.searchParams.get("app");
  if (u.searchParams.get("lang")) cfg.DEFAULT_LANG = u.searchParams.get("lang");

  window.NHACHUNG = cfg;
})();
