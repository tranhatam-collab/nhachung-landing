/* global window */
(function () {
  // Landing config — keep tiny, no secrets.
  // You can override via ?api=...&app=... in URL if needed.
  const u = new URL(window.location.href);

  const cfg = {
    BRAND: "Nhà Chung",
    DEFAULT_LANG: "vi",
    SUPPORTED_LANGS: ["vi", "en"],

    // Canonical production endpoints
    API_BASE: "https://api.nhachung.org",
    APP_BASE: "https://app.nhachung.org",

    // Optional: show these quick links in landing (no fetch here)
    API_HEALTH_PATH: "/test-db"
  };

  if (u.searchParams.get("api")) cfg.API_BASE = u.searchParams.get("api");
  if (u.searchParams.get("app")) cfg.APP_BASE = u.searchParams.get("app");

  window.NHACHUNG = cfg;
})();
