/* global NHACHUNG */
(function () {
  const cfg = NHACHUNG || {};
  const langs = cfg.SUPPORTED_LANGS || ["vi", "en"];
  const fallback = cfg.FALLBACK_LANG || cfg.DEFAULT_LANG || "vi";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const base = (v) => String(v || "").trim().toLowerCase().split("-")[0];
  const tryLang = (v) => {
    const raw = String(v || "").trim().toLowerCase();
    if (langs.includes(raw)) return raw;
    const b = base(raw);
    return langs.includes(b) ? b : null;
  };
  const lang = () => {
    const query = new URL(location.href).searchParams.get("lang");
    if (query) return tryLang(query) || fallback;
    for (const pref of navigator.languages || [navigator.language]) {
      const match = tryLang(pref);
      if (match) return match;
    }
    return fallback;
  };
  const read = async (l) => {
    const res = await fetch(`${cfg.CONTENT_BASE || "/content"}/${l}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`content_load_failed:${l}`);
    return res.json();
  };
  const apply = (dict, l) => {
    document.documentElement.lang = l;
    document.documentElement.dir = (cfg.LOCALES && cfg.LOCALES[l] && cfg.LOCALES[l].dir) || "ltr";
    $$("#langBtn").forEach((b) => {
      b.textContent = ((cfg.LOCALES && cfg.LOCALES[l] && cfg.LOCALES[l].short) || l).toUpperCase();
    });
    $$("[data-i18n]").forEach((el) => {
      const value = dict[el.getAttribute("data-i18n")];
      if (typeof value === "string") el.textContent = value;
    });
    const app = `${cfg.APP_BASE || "https://app.nhachung.org"}/?lang=${encodeURIComponent(l)}`;
    ["#btnOpenApp", "#btnOpenAppTop", "#btnStartApp"].forEach((s) => {
      const a = $(s);
      if (a) a.href = app;
    });
  };
  (async function () {
    const l = lang();
    try {
      apply(await read(l), l);
    } catch (error) {
      console.warn("boot_failed", error);
    }
  })();
})();
