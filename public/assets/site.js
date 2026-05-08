/* global NHACHUNG */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function localeRegistry() {
    return (NHACHUNG && NHACHUNG.LOCALES) || {
      vi: { short: "VI", dir: "ltr" },
      en: { short: "EN", dir: "ltr" }
    };
  }

  function activeLangs() {
    return (NHACHUNG && NHACHUNG.SUPPORTED_LANGS) || ["vi", "en"];
  }

  function fallbackLang() {
    return (NHACHUNG && NHACHUNG.FALLBACK_LANG) || (NHACHUNG && NHACHUNG.DEFAULT_LANG) || "vi";
  }

  function normalizeLangTag(value) {
    return String(value || "").trim().toLowerCase();
  }

  function tryResolveLang(value) {
    const langs = activeLangs();
    const raw = normalizeLangTag(value);
    if (!raw) return null;
    if (langs.includes(raw)) return raw;
    const base = raw.split("-")[0];
    if (langs.includes(base)) return base;
    return null;
  }

  function resolveLang(value) {
    return tryResolveLang(value) || fallbackLang();
  }

  function getLang() {
    const u = new URL(location.href);
    const q = u.searchParams.get("lang");
    if (q) return resolveLang(q);
    const saved = localStorage.getItem("nhachung_lang");
    if (saved) return resolveLang(saved);

    const browserPrefs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language];

    for (const pref of browserPrefs) {
      const match = tryResolveLang(pref);
      if (match) return match;
    }

    return resolveLang((NHACHUNG && NHACHUNG.DEFAULT_LANG) || "vi");
  }

  function contentBase() {
    return (NHACHUNG && NHACHUNG.CONTENT_BASE) || "/content";
  }

  async function loadLanguagePayload(lang) {
    const locale = resolveLang(lang);
    const res = await fetch(`${contentBase()}/${locale}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`content_load_failed:${locale}`);
    return res.json();
  }

  async function loadI18n() {
    const langs = [...new Set([...activeLangs(), fallbackLang(), "vi", "en"].filter(Boolean).map(resolveLang))];
    const entries = await Promise.all(langs.map(async (lang) => [lang, await loadLanguagePayload(lang)]));
    return Object.fromEntries(entries);
  }

  function translationFor(dict, lang, key) {
    const locale = resolveLang(lang);
    const base = locale.split("-")[0];
    const fallback = fallbackLang();
    const langFirst = dict && dict[locale];
    const langBase = dict && dict[base];
    const langFallback = dict && dict[fallback];

    return (langFirst && langFirst[key]) ||
      (langBase && langBase[key]) ||
      (langFallback && langFallback[key]) ||
      "";
  }

  function buttonLabel(lang) {
    const meta = localeRegistry()[resolveLang(lang)] || {};
    return meta.short || resolveLang(lang).toUpperCase();
  }

  function applyI18n(dict, lang) {
    const locale = resolveLang(lang);
    const meta = localeRegistry()[locale] || {};

    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir || "ltr";
    document.documentElement.dataset.locale = locale;
    $$("#langBtn").forEach((b) => {
      b.textContent = buttonLabel(locale);
      b.setAttribute("title", meta.label || locale);
    });
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = translationFor(dict, locale, key);
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
    const legalPrivacy = $("#legalPrivacyLink");
    const legalTerms = $("#legalTermsLink");

    if (a1) a1.href = appUrl;
    if (a2) a2.href = appUrl;
    if (a3) a3.href = appUrl;
    if (a4) a4.href = adminUrl;
    if (a5) a5.href = api;
    if (a6) a6.href = apiUrl;
    if (legalPrivacy) legalPrivacy.href = lang === "en" ? "/en/legal/privacy.html" : "/vi/legal/privacy.html";
    if (legalTerms) legalTerms.href = lang === "en" ? "/en/legal/terms.html" : "/vi/legal/terms.html";

    $("#year").textContent = String(new Date().getFullYear());
  }

  function wireLang(dict) {
    const btn = $("#langBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const current = getLang();
      const langs = activeLangs();
      const i = langs.indexOf(current);
      const next = langs[(i + 1) % langs.length] || fallbackLang();
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
