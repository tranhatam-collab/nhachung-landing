/* public/assets/site.js
   - No external libs
   - VI default, EN toggle
   - Robust router (no null render)
   - Status/Verify pages call API_BASE
*/
(function () {
  "use strict";

  const cfg = window.NHACHUNG_CONFIG;
  const app = document.getElementById("app");
  const langBtn = document.getElementById("langBtn");

  if (!cfg || !app) return;

  const state = {
    lang: cfg.DEFAULT_LANG,
    dict: null
  };

  function $(sel, root = document) { return root.querySelector(sel); }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function t(key) {
    const d = state.dict && state.dict[state.lang];
    return (d && d[key]) || key;
  }

  async function loadI18n() {
    const res = await fetch("/assets/i18n.json", { cache: "no-store" });
    if (!res.ok) throw new Error("i18n_load_failed");
    state.dict = await res.json();
    if (!cfg.SUPPORTED_LANGS.includes(state.lang)) state.lang = cfg.DEFAULT_LANG;
  }

  function setLang(next) {
    state.lang = next;
    document.documentElement.lang = next;
    langBtn.textContent = next.toUpperCase();
    // keep lang in URL for share
    const u = new URL(location.href);
    u.searchParams.set("lang", next);
    history.replaceState({}, "", u.toString());
    render();
  }

  // ---- Routing
  function getPath() {
    // Use pathname (Pages redirect fallback serves index.html)
    // Normalize trailing slash
    let p = location.pathname || "/";
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  }

  function navTo(path) {
    const u = new URL(location.href);
    u.pathname = path;
    history.pushState({}, "", u.toString());
    render();
  }

  function markActiveNav() {
    const p = getPath();
    document.querySelectorAll("[data-nav]").forEach(a => {
      const to = a.getAttribute("data-nav");
      a.classList.toggle("is-active", to === p);
    });
  }

  // ---- Network helpers
  function withTimeout(promise, ms) {
    let to;
    const tmo = new Promise((_, rej) => { to = setTimeout(() => rej(new Error("timeout")), ms); });
    return Promise.race([promise, tmo]).finally(() => clearTimeout(to));
  }

  async function apiGet(path) {
    const url = cfg.API_BASE.replace(/\/+$/, "") + path;
    const res = await withTimeout(fetch(url, { headers: { "accept": "application/json" } }), cfg.FETCH_TIMEOUT_MS);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    if (!res.ok) {
      return { ok: false, status: res.status, data };
    }
    return { ok: true, status: res.status, data };
  }

  // ---- Views
  function viewHome() {
    const createLink = cfg.APP_BASE.replace(/\/+$/, "") + "/#/admin";
    const appLink = cfg.APP_BASE.replace(/\/+$/, "") + "/";

    return `
      <section class="hero">
        <h1>${escapeHtml(t("hero_title"))}</h1>
        <p>${escapeHtml(t("hero_sub"))}</p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>${escapeHtml(t("card_create_title"))}</h2>
          <p>${escapeHtml(t("card_create_desc"))}</p>
          <div class="row">
            <a class="btn btn--primary" href="${escapeHtml(createLink)}" rel="noopener"> ${escapeHtml(t("btn_go_admin"))} </a>
            <a class="btn" href="${escapeHtml(appLink)}" rel="noopener"> ${escapeHtml(t("cta_open_app"))} </a>
          </div>
          <p class="muted" style="margin-top:12px">${escapeHtml(t("note_privacy"))}</p>
        </article>

        <article class="card">
          <h2>${escapeHtml(t("card_verify_title"))}</h2>
          <p>${escapeHtml(t("card_verify_desc"))}</p>
          <div class="row">
            <button class="btn" id="goVerify" type="button">${escapeHtml(t("btn_go_verify"))}</button>
          </div>
        </article>

        <article class="card">
          <h2>${escapeHtml(t("card_status_title"))}</h2>
          <p>${escapeHtml(t("card_status_desc"))}</p>
          <div class="row">
            <button class="btn" id="goStatus" type="button">${escapeHtml(t("btn_go_status"))}</button>
          </div>
        </article>

        <article class="card wide">
          <div class="kv">
            <div class="muted">${escapeHtml(t("api_base"))}</div>
            <code id="apiBase">${escapeHtml(cfg.API_BASE)}</code>
            <button class="btn btn--ghost" id="copyApi" type="button">${escapeHtml(t("copy"))}</button>
          </div>
        </article>
      </section>
    `;
  }

  function viewStatus() {
    return `
      <section class="hero">
        <h1>${escapeHtml(t("status_title"))}</h1>
        <p>${escapeHtml(t("status_sub"))}</p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>${escapeHtml(t("status_testdb"))}</h2>
          <p class="muted">GET ${escapeHtml(cfg.API_BASE + cfg.ENDPOINTS.testDb)}</p>
          <div class="row">
            <button class="btn" id="runTestDb" type="button">${escapeHtml(t("run"))}</button>
          </div>
          <pre class="output" id="outTestDb">{}</pre>
        </article>

        <article class="card">
          <h2>${escapeHtml(t("status_list"))}</h2>
          <p class="muted">GET ${escapeHtml(cfg.API_BASE + cfg.ENDPOINTS.listCommitments)}</p>
          <div class="row">
            <button class="btn" id="runList" type="button">${escapeHtml(t("run"))}</button>
          </div>
          <pre class="output" id="outList">{}</pre>
        </article>

        <article class="card">
          <h2>${escapeHtml(t("status_msg404"))}</h2>
          <p class="muted">GET ${escapeHtml(cfg.API_BASE + "/message")}</p>
          <div class="row">
            <button class="btn" id="runMsg" type="button">${escapeHtml(t("run"))}</button>
          </div>
          <pre class="output" id="outMsg">{}</pre>
        </article>

        <article class="card wide">
          <div class="kv">
            <div class="muted">${escapeHtml(t("api_base"))}</div>
            <code>${escapeHtml(cfg.API_BASE)}</code>
            <button class="btn btn--ghost" id="copyApi2" type="button">${escapeHtml(t("copy"))}</button>
          </div>
        </article>
      </section>
    `;
  }

  function viewVerify() {
    return `
      <section class="hero">
        <h1>${escapeHtml(t("verify_title"))}</h1>
        <p>${escapeHtml(t("verify_sub"))}</p>
      </section>

      <section class="grid">
        <article class="card wide">
          <div class="field">
            <input class="input" id="verifyId" placeholder="${escapeHtml(t("verify_placeholder"))}" />
          </div>
          <div class="row">
            <button class="btn btn--primary" id="btnVerify" type="button">${escapeHtml(t("verify_btn"))}</button>
          </div>
          <pre class="output" id="outVerify">{}</pre>
        </article>
      </section>
    `;
  }

  function viewAdmin() {
    const adminLink = cfg.APP_BASE.replace(/\/+$/, "") + "/#/admin";
    const appLink = cfg.APP_BASE.replace(/\/+$/, "") + "/";
    return `
      <section class="hero">
        <h1>${escapeHtml(t("admin_title"))}</h1>
        <p>${escapeHtml(t("admin_sub"))}</p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>App/Admin</h2>
          <p class="muted">${escapeHtml(cfg.APP_BASE)}</p>
          <div class="row">
            <a class="btn btn--primary" href="${escapeHtml(adminLink)}" rel="noopener">${escapeHtml(t("open_admin_app"))}</a>
            <a class="btn" href="${escapeHtml(appLink)}" rel="noopener">${escapeHtml(t("open_user_app"))}</a>
          </div>
        </article>

        <article class="card">
          <h2>${escapeHtml(t("card_status_title"))}</h2>
          <p>${escapeHtml(t("card_status_desc"))}</p>
          <div class="row">
            <button class="btn" id="goStatus2" type="button">${escapeHtml(t("btn_go_status"))}</button>
          </div>
        </article>
      </section>
    `;
  }

  function viewNotFound(path) {
    return `
      <section class="hero">
        <h1>404</h1>
        <p class="muted">${escapeHtml(t("err_not_found"))} ${escapeHtml(path)}</p>
      </section>
      <section class="grid">
        <article class="card">
          <div class="row">
            <button class="btn" id="goHome" type="button">${escapeHtml(t("nav_home"))}</button>
          </div>
        </article>
      </section>
    `;
  }

  function routeToView(path) {
    if (path === cfg.ROUTES.home) return viewHome();
    if (path === cfg.ROUTES.status) return viewStatus();
    if (path === cfg.ROUTES.verify) return viewVerify();
    if (path === cfg.ROUTES.admin) return viewAdmin();
    return viewNotFound(path);
  }

  function wireCommon() {
    const copy = async (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const text = el.textContent || cfg.API_BASE;
      try {
        await navigator.clipboard.writeText(text);
        // tiny feedback
      } catch (_) {}
    };

    const go = (id, path) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", () => navTo(path));
    };

    go("goStatus", cfg.ROUTES.status);
    go("goStatus2", cfg.ROUTES.status);
    go("goVerify", cfg.ROUTES.verify);
    go("goHome", cfg.ROUTES.home);

    const c1 = document.getElementById("copyApi");
    if (c1) c1.addEventListener("click", () => copy("apiBase"));
    const c2 = document.getElementById("copyApi2");
    if (c2) c2.addEventListener("click", () => navigator.clipboard.writeText(cfg.API_BASE).catch(()=>{}));
  }

  function wireStatus() {
    const outTestDb = $("#outTestDb");
    const outList = $("#outList");
    const outMsg = $("#outMsg");

    async function run(outEl, path) {
      if (!outEl) return;
      outEl.textContent = t("loading");
      try {
        const r = await apiGet(path);
        outEl.textContent = JSON.stringify(r.data, null, 2);
      } catch (e) {
        outEl.textContent = (e && e.message === "timeout") ? t("err_timeout") : t("err_api_unreachable");
      }
    }

    const b1 = $("#runTestDb");
    if (b1) b1.addEventListener("click", () => run(outTestDb, cfg.ENDPOINTS.testDb));

    const b2 = $("#runList");
    if (b2) b2.addEventListener("click", () => run(outList, cfg.ENDPOINTS.listCommitments));

    const b3 = $("#runMsg");
    if (b3) b3.addEventListener("click", () => run(outMsg, "/message"));
  }

  function wireVerify() {
    const input = $("#verifyId");
    const out = $("#outVerify");
    const btn = $("#btnVerify");
    if (!btn || !input || !out) return;

    btn.addEventListener("click", async () => {
      const id = (input.value || "").trim();
      if (!id) { out.textContent = "{}"; return; }
      out.textContent = t("loading");
      try {
        const r = await apiGet(cfg.ENDPOINTS.getCommitment + encodeURIComponent(id));
        out.textContent = JSON.stringify(r.data, null, 2);
      } catch (e) {
        out.textContent = (e && e.message === "timeout") ? t("err_timeout") : t("err_api_unreachable");
      }
    });
  }

  function wireHome() {
    // nothing heavy; buttons are wired via wireCommon
  }

  function render() {
    const p = getPath();
    markActiveNav();

    app.innerHTML = routeToView(p);

    wireCommon();
    if (p === cfg.ROUTES.status) wireStatus();
    if (p === cfg.ROUTES.verify) wireVerify();
    if (p === cfg.ROUTES.home) wireHome();

    // Safe: never references missing nodes (no null innerHTML)
  }

  function bootNav() {
    document.addEventListener("click", (e) => {
      const a = e.target && e.target.closest && e.target.closest("[data-nav]");
      if (!a) return;
      e.preventDefault();
      const to = a.getAttribute("data-nav") || "/";
      navTo(to);
    });

    window.addEventListener("popstate", () => render());
  }

  async function boot() {
    await loadI18n();

    // Initialize lang from URL if present
    try {
      const u = new URL(location.href);
      const lang = u.searchParams.get("lang");
      if (lang && cfg.SUPPORTED_LANGS.includes(lang)) state.lang = lang;
    } catch (_) {}

    langBtn.addEventListener("click", () => {
      const idx = cfg.SUPPORTED_LANGS.indexOf(state.lang);
      const next = cfg.SUPPORTED_LANGS[(idx + 1) % cfg.SUPPORTED_LANGS.length];
      setLang(next);
    });

    bootNav();
    render();
  }

  boot().catch(() => {
    app.innerHTML = `<section class="hero"><h1>Nhà Chung</h1><p class="muted">Boot failed.</p></section>`;
  });
})();
