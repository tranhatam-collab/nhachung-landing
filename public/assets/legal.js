/* global NHACHUNG */
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function activeLangs() {
    return (NHACHUNG && NHACHUNG.SUPPORTED_LANGS) || ["vi", "en"];
  }

  function fallbackLang() {
    return (NHACHUNG && NHACHUNG.FALLBACK_LANG) || "vi";
  }

  function resolveLang(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (activeLangs().includes(normalized)) return normalized;
    return fallbackLang();
  }

  function currentLang() {
    const parts = location.pathname.split("/").filter(Boolean);
    return resolveLang(parts[0]);
  }

  function targetLang() {
    return currentLang() === "vi" ? "en" : "vi";
  }

  function contentBase() {
    return (NHACHUNG && NHACHUNG.CONTENT_BASE) || "/content";
  }

  async function loadDictionary(lang) {
    const locale = resolveLang(lang);
    const res = await fetch(`${contentBase()}/${locale}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`content_load_failed:${locale}`);
    return res.json();
  }

  function counterpartUrl() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length) return `/${targetLang()}/`;
    parts[0] = targetLang();
    return `/${parts.join("/")}`;
  }

  function homeUrl(lang) {
    return lang === "en" ? "/en/" : "/vi/";
  }

  function applyText(dict, lang) {
    const locale = resolveLang(lang);
    document.documentElement.lang = locale;
    $$("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (!key) return;
      const value = dict[key];
      if (typeof value === "string") node.textContent = value;
    });
    const langBtn = $("#legalLangBtn");
    if (langBtn) {
      langBtn.textContent = targetLang().toUpperCase();
      langBtn.setAttribute("aria-label", dict["legal.switcher"] || "Switch language");
    }
    const homeLink = $("#legalHomeLink");
    if (homeLink) homeLink.href = homeUrl(locale);
  }

  function bindNav() {
    const langBtn = $("#legalLangBtn");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        location.href = counterpartUrl();
      });
    }
  }

  (async function boot() {
    const lang = currentLang();
    const dict = await loadDictionary(lang);
    applyText(dict, lang);
    bindNav();
  })().catch((error) => {
    console.warn("legal_boot_failed", error);
  });
})();
