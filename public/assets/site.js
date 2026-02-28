/* global NHACHUNG */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function safeLang(x) {
    const langs = (NHACHUNG && NHACHUNG.SUPPORTED_LANGS) || ["vi", "en"];
    return langs.includes(x) ? x : ((NHACHUNG && NHACHUNG.DEFAULT_LANG) || "vi");
  }

  function getLang() {
    const u = new URL(location.href);
    const q = u.searchParams.get("lang");
    if (q) return safeLang(q);
    const saved = localStorage.getItem("nhachung_lang");
    if (saved) return safeLang(saved);
    return safeLang((NHACHUNG && NHACHUNG.DEFAULT_LANG) || "vi");
  }

  async function loadI18n() {
    const res = await fetch("/assets/i18n.json", { cache: "no-store" });
    if (!res.ok) throw new Error("i18n_load_failed");
    return res.json();
  }

  function applyI18n(dict, lang) {
    document.documentElement.lang = lang;
    $$("#langBtn").forEach((b) => (b.textContent = lang.toUpperCase()));
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = dict?.[lang]?.[key];
      if (typeof val === "string") el.textContent = val;
    });
  }

  function setLinks() {
    const app = (NHACHUNG && NHACHUNG.APP_BASE) || "https://app.nhachung.org";
    const api = (NHACHUNG && NHACHUNG.API_BASE) || "https://api.nhachung.org";
    const health = (NHACHUNG && NHACHUNG.API_HEALTH_PATH) || "/test-db";

    const lang = getLang();
    const appUrl = `${app}/?lang=${encodeURIComponent(lang)}`;
    const adminUrl = `${api}/admin`;
    const apiUrl = `${api}${health}`;

    const a1 = $("#btnOpenApp");
    const a2 = $("#btnOpenAppTop");
    const a3 = $("#btnStartApp");
    const a4 = $("#btnStartAdmin");
    const a5 = $("#btnStartApi");
    const a6 = $("#btnOpenAPI");

    if (a1) a1.href = appUrl;
    if (a2) a2.href = appUrl;
    if (a3) a3.href = appUrl;
    if (a4) a4.href = adminUrl;
    if (a5) a5.href = api;
    if (a6) a6.href = apiUrl;

    $("#year").textContent = String(new Date().getFullYear());
  }

  function wireLang(dict) {
    const btn = $("#langBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const current = getLang();
      const next = current === "vi" ? "en" : "vi";
      localStorage.setItem("nhachung_lang", next);

      const u = new URL(location.href);
      u.searchParams.set("lang", next);
      history.replaceState(null, "", u.toString());

      applyI18n(dict, next);
      setLinks();
    });
  }

  (async function boot() {
    try {
      const dict = await loadI18n();
      const lang = getLang();
      applyI18n(dict, lang);
      wireLang(dict);
      setLinks();
    } catch (e) {
      // Fail silently: landing must still render.
      console.warn("boot_failed", e);
      setLinks();
    }
  })();
})();
