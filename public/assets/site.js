(function () {
  "use strict";

  const cfg = window.NHACHUNG_APP_CONFIG;
  const app = document.getElementById("app");
  const langBtn = document.getElementById("langBtn");
  const tokenChip = document.getElementById("tokenChip");
  const tokenState = document.getElementById("tokenState");

  if (!cfg || !app) return;

  const state = {
    lang: cfg.DEFAULT_LANG,
    dict: null
  };

  const $ = (sel, root = document) => root.querySelector(sel);

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

  function getAdminToken() {
    try { return localStorage.getItem(cfg.STORAGE_KEYS.adminToken) || ""; } catch (_) { return ""; }
  }

  function setAdminToken(v) {
    try { localStorage.setItem(cfg.STORAGE_KEYS.adminToken, v || ""); } catch (_) {}
    paintTokenState();
  }

  function clearAdminToken() {
    try { localStorage.removeItem(cfg.STORAGE_KEYS.adminToken); } catch (_) {}
    paintTokenState();
  }

  function paintTokenState() {
    const tok = getAdminToken();
    tokenState.textContent = tok ? "ON" : "OFF";
    tokenState.style.opacity = tok ? "1" : ".7";
  }

  async function loadI18n() {
    const res = await fetch("/assets/i18n.json", { cache: "no-store" });
    if (!res.ok) throw new Error("i18n_load_failed");
    state.dict = await res.json();
  }

  function setLang(next) {
    state.lang = next;
    document.documentElement.lang = next;
    langBtn.textContent = next.toUpperCase();
    try { localStorage.setItem(cfg.STORAGE_KEYS.lang, next); } catch (_) {}

    const u = new URL(location.href);
    u.searchParams.set("lang", next);
    history.replaceState({}, "", u.toString());
    render();
  }

  function loadLangFromStorageOrUrl() {
    try {
      const u = new URL(location.href);
      const q = u.searchParams.get("lang");
      const saved = localStorage.getItem(cfg.STORAGE_KEYS.lang);
      const lang = q || saved || cfg.DEFAULT_LANG;
      if (cfg.SUPPORTED_LANGS.includes(lang)) state.lang = lang;
    } catch (_) {}
  }

  // ---- Routing (supports legacy /r/home)
  function normalizePath(p) {
    if (!p) return "/";
    // legacy pattern: /r/home -> /
    if (p.startsWith("/r/")) {
      const tail = p.slice(3);
      if (tail === "home") return "/";
      if (tail === "admin") return cfg.ROUTES.admin;
      if (tail === "create") return cfg.ROUTES.create;
      if (tail === "verify") return cfg.ROUTES.verify;
      if (tail === "status") return cfg.ROUTES.status;
      return "/" + tail;
    }
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  }

  function getPath() {
    return normalizePath(location.pathname || "/");
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

  document.addEventListener("click", (e) => {
    const a = e.target && e.target.closest && e.target.closest("[data-nav]");
    if (!a) return;
    e.preventDefault();
    navTo(a.getAttribute("data-nav") || "/");
  });

  window.addEventListener("popstate", () => render());

  // ---- Network
  function withTimeout(promise, ms) {
    let to;
    const tmo = new Promise((_, rej) => { to = setTimeout(() => rej(new Error("timeout")), ms); });
    return Promise.race([promise, tmo]).finally(() => clearTimeout(to));
  }

  async function apiFetch(path, opts = {}) {
    const url = cfg.API_BASE.replace(/\/+$/, "") + path;
    const res = await withTimeout(fetch(url, opts), cfg.FETCH_TIMEOUT_MS);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    return { ok: res.ok, status: res.status, data };
  }

  function pretty(obj) {
    return JSON.stringify(obj, null, 2);
  }

  // ---- Views
  function viewHome() {
    return `
      <section class="hero">
        <h1>${escapeHtml(t("home_title"))}</h1>
        <p>${escapeHtml(t("home_sub"))}</p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>${escapeHtml(t("create_title"))}</h2>
          <p>${escapeHtml(t("create_sub"))}</p>
          <div class="row">
            <button class="btn btn--primary" id="goCreate" type="button">${escapeHtml(t("nav_create"))}</button>
            <button class="btn" id="goAdmin" type="button">${escapeHtml(t("nav_admin"))}</button>
          </div>
        </article>

        <article class="card">
          <h2>${escapeHtml(t("verify_title"))}</h2>
          <p>${escapeHtml(t("verify_sub"))}</p>
          <div class="row">
            <button class="btn" id="goVerify" type="button">${escapeHtml(t("nav_verify"))}</button>
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

  function viewCreate() {
    return `
      <section class="hero">
        <h1>${escapeHtml(t("create_title"))}</h1>
        <p>${escapeHtml(t("create_sub"))}</p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>${escapeHtml(t("create_title"))}</h2>
          <div class="two">
            <div class="field">
              <div class="label">${escapeHtml(t("member_id"))}</div>
              <input class="input" id="member_id" placeholder="${escapeHtml(t("member_id"))}" />
            </div>
            <div class="field">
              <div class="label">${escapeHtml(t("project_id"))}</div>
              <input class="input" id="project_id" placeholder="${escapeHtml(t("project_id"))}" />
            </div>
            <div class="field">
              <div class="label">${escapeHtml(t("title"))}</div>
              <input class="input" id="title" placeholder="${escapeHtml(t("title"))}" />
            </div>
            <div class="field">
              <div class="label">${escapeHtml(t("difficulty"))}</div>
              <input class="input" id="difficulty" value="2" placeholder="${escapeHtml(t("difficulty"))}" />
            </div>
          </div>

          <div class="row">
            <button class="btn btn--primary" id="btnCreate" type="button">${escapeHtml(t("btn_create"))}</button>
            <button class="btn btn--ghost" id="btnShowCurl" type="button">${escapeHtml(t("btn_show_curl"))}</button>
            <button class="btn" id="btnGoAdmin" type="button">${escapeHtml(t("nav_admin"))}</button>
          </div>
          <div class="small" style="margin-top:8px">${escapeHtml(t("curl_note"))}</div>

          <pre class="output" id="outCreate">{}</pre>
          <pre class="output" id="outCurl" style="display:none">{}</pre>
        </article>

        <article class="card">
          <h2>${escapeHtml(t("list_title"))}</h2>
          <div class="row">
            <button class="btn" id="btnList" type="button">${escapeHtml(t("btn_list"))}</button>
          </div>
          <pre class="output" id="outList">{}</pre>
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
            <div class="label">${escapeHtml(t("verify_title"))}</div>
            <input class="input" id="verifyId" placeholder="${escapeHtml(t("verify_placeholder"))}" />
          </div>
          <div class="row">
            <button class="btn btn--primary" id="btnVerify" type="button">${escapeHtml(t("btn_verify"))}</button>
          </div>
          <pre class="output" id="outVerify">{}</pre>
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
          <h2>Test DB</h2>
          <p class="muted">GET ${escapeHtml(cfg.API_BASE + cfg.ENDPOINTS.testDb)}</p>
          <div class="row"><button class="btn" id="runTestDb" type="button">${escapeHtml(t("run"))}</button></div>
          <pre class="output" id="outTestDb">{}</pre>
        </article>

        <article class="card">
          <h2>List commitments</h2>
          <p class="muted">GET ${escapeHtml(cfg.API_BASE + cfg.ENDPOINTS.listCommitments)}</p>
          <div class="row"><button class="btn" id="runList" type="button">${escapeHtml(t("run"))}</button></div>
          <pre class="output" id="outList">{}</pre>
        </article>

        <article class="card">
          <h2>Message (expect 404)</h2>
          <p class="muted">GET ${escapeHtml(cfg.API_BASE + "/message")}</p>
          <div class="row"><button class="btn" id="runMsg" type="button">${escapeHtml(t("run"))}</button></div>
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

  function viewAdmin() {
    return `
      <section class="hero">
        <h1>${escapeHtml(t("admin_title"))}</h1>
        <p>${escapeHtml(t("admin_sub"))}</p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>${escapeHtml(t("admin_token"))}</h2>
          <div class="field">
            <input class="input" id="adminToken" placeholder="Paste ADMIN_TOKEN_V2" />
          </div>
          <div class="row">
            <button class="btn btn--primary" id="btnSaveToken" type="button">${escapeHtml(t("btn_save"))}</button>
            <button class="btn" id="btnClearToken" type="button">${escapeHtml(t("btn_clear"))}</button>
          </div>
          <pre class="output" id="outToken">{}</pre>
        </article>

        <article class="card">
          <h2>${escapeHtml(t("audit_title"))}</h2>
          <div class="row">
            <button class="btn" id="btnAudit" type="button">${escapeHtml(t("btn_audit"))}</button>
          </div>
          <pre class="output" id="outAudit">{}</pre>
        </article>
      </section>
    `;
  }

  function viewNotFound(p) {
    return `
      <section class="hero">
        <h1>404</h1>
        <p class="muted">Not found: ${escapeHtml(p)}</p>
      </section>
      <section class="grid">
        <article class="card">
          <div class="row"><button class="btn" id="goHome" type="button">${escapeHtml(t("nav_home"))}</button></div>
        </article>
      </section>
    `;
  }

  function routeToView(p) {
    if (p === cfg.ROUTES.home) return viewHome();
    if (p === cfg.ROUTES.create) return viewCreate();
    if (p === cfg.ROUTES.verify) return viewVerify();
    if (p === cfg.ROUTES.status) return viewStatus();
    if (p === cfg.ROUTES.admin) return viewAdmin();
    return viewNotFound(p);
  }

  // ---- Wiring helpers
  function wireCommon() {
    markActiveNav();

    const copyText = async (text) => {
      try { await navigator.clipboard.writeText(text); } catch (_) {}
    };

    const c1 = $("#copyApi");
    if (c1) c1.addEventListener("click", () => copyText(cfg.API_BASE));
    const c2 = $("#copyApi2");
    if (c2) c2.addEventListener("click", () => copyText(cfg.API_BASE));

    const go = (id, path) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", () => navTo(path));
    };

    go("goCreate", cfg.ROUTES.create);
    go("goAdmin", cfg.ROUTES.admin);
    go("goVerify", cfg.ROUTES.verify);
    go("goHome", cfg.ROUTES.home);

    // token chip quick jump
    if (tokenChip) tokenChip.onclick = () => navTo(cfg.ROUTES.admin);
  }

  function setOut(el, objOrText) {
    if (!el) return;
    el.textContent = typeof objOrText === "string" ? objOrText : pretty(objOrText);
  }

  function needTokenOrExplain(outEl) {
    const tok = getAdminToken();
    if (!tok) {
      setOut(outEl, { ok: false, error: t("err_need_token") });
      return "";
    }
    return tok;
  }

  async function runGet(outEl, path) {
    setOut(outEl, t("loading"));
    try {
      const r = await apiFetch(path, { headers: { "accept": "application/json" } });
      setOut(outEl, r.data);
    } catch (e) {
      setOut(outEl, (e && e.message === "timeout") ? t("err_timeout") : t("err_api_unreachable"));
    }
  }

  function wireStatus() {
    const outTestDb = $("#outTestDb");
    const outList = $("#outList");
    const outMsg = $("#outMsg");

    const b1 = $("#runTestDb");
    if (b1) b1.onclick = () => runGet(outTestDb, cfg.ENDPOINTS.testDb);

    const b2 = $("#runList");
    if (b2) b2.onclick = () => runGet(outList, cfg.ENDPOINTS.listCommitments);

    const b3 = $("#runMsg");
    if (b3) b3.onclick = () => runGet(outMsg, "/message");
  }

  function wireVerify() {
    const input = $("#verifyId");
    const out = $("#outVerify");
    const btn = $("#btnVerify");
    if (!btn || !input || !out) return;

    btn.onclick = async () => {
      const id = (input.value || "").trim();
      if (!id) return setOut(out, {});
      setOut(out, t("loading"));
      try {
        const r = await apiFetch(cfg.ENDPOINTS.getCommitment + encodeURIComponent(id), {
          headers: { "accept": "application/json" }
        });
        setOut(out, r.data);
      } catch (e) {
        setOut(out, (e && e.message === "timeout") ? t("err_timeout") : t("err_api_unreachable"));
      }
    };
  }

  function wireCreate() {
    const outCreate = $("#outCreate");
    const outCurl = $("#outCurl");
    const outList = $("#outList");

    const member = $("#member_id");
    const project = $("#project_id");
    const title = $("#title");
    const diff = $("#difficulty");

    const btnCreate = $("#btnCreate");
    const btnShowCurl = $("#btnShowCurl");
    const btnGoAdmin = $("#btnGoAdmin");
    const btnList = $("#btnList");

    if (btnGoAdmin) btnGoAdmin.onclick = () => navTo(cfg.ROUTES.admin);

    if (btnList) btnList.onclick = () => runGet(outList, cfg.ENDPOINTS.listCommitments);

    if (btnShowCurl) btnShowCurl.onclick = () => {
      const tok = getAdminToken() || "<ADMIN_TOKEN_V2>";
      const payload = {
        member_id: (member?.value || "m1").trim(),
        project_id: (project?.value || "p1").trim(),
        title: (title?.value || "Prod Test").trim(),
        difficulty: Number((diff?.value || "2").trim()) || 2
      };
      const curl =
`BASE="${cfg.API_BASE}"
curl -s -X POST "$BASE${cfg.ENDPOINTS.createCommitment}" \\
  -H "Content-Type: application/json" \\
  -H "x-admin-token: ${tok}" \\
  -d '${JSON.stringify(payload)}' | cat`;
      if (outCurl) {
        outCurl.style.display = "block";
        setOut(outCurl, curl);
      }
    };

    if (btnCreate) btnCreate.onclick = async () => {
      const tok = needTokenOrExplain(outCreate);
      if (!tok) return;

      const payload = {
        member_id: (member?.value || "").trim(),
        project_id: (project?.value || "").trim(),
        title: (title?.value || "").trim(),
        difficulty: Number((diff?.value || "2").trim()) || 2
      };

      if (!payload.member_id || !payload.project_id || !payload.title) {
        return setOut(outCreate, { ok: false, error: "missing_fields" });
      }

      setOut(outCreate, t("loading"));
      try {
        const r = await apiFetch(cfg.ENDPOINTS.createCommitment, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "x-admin-token": tok
          },
          body: JSON.stringify(payload)
        });
        setOut(outCreate, r.data);

        // refresh list right away
        runGet(outList, cfg.ENDPOINTS.listCommitments);
      } catch (e) {
        setOut(outCreate, (e && e.message === "timeout") ? t("err_timeout") : t("err_api_unreachable"));
      }
    };
  }

  function wireAdmin() {
    const input = $("#adminToken");
    const out = $("#outToken");
    const outAudit = $("#outAudit");

    const btnSave = $("#btnSaveToken");
    const btnClear = $("#btnClearToken");
    const btnAudit = $("#btnAudit");

    // show current (masked)
    const current = getAdminToken();
    if (input) input.value = current ? current : "";

    if (btnSave) btnSave.onclick = () => {
      const v = (input?.value || "").trim();
      if (!v) return setOut(out, { ok: false, error: "empty_token" });
      setAdminToken(v);
      setOut(out, { ok: true, saved: true });
    };

    if (btnClear) btnClear.onclick = () => {
      clearAdminToken();
      if (input) input.value = "";
      setOut(out, { ok: true, cleared: true });
    };

    if (btnAudit) btnAudit.onclick = async () => {
      const tok = needTokenOrExplain(outAudit);
      if (!tok) return;

      setOut(outAudit, t("loading"));
      try {
        const r = await apiFetch(cfg.ENDPOINTS.adminAudit, {
          headers: {
            "accept": "application/json",
            "x-admin-token": tok
          }
        });
        setOut(outAudit, r.data);
      } catch (e) {
        setOut(outAudit, (e && e.message === "timeout") ? t("err_timeout") : t("err_api_unreachable"));
      }
    };
  }

  function render() {
    const p = getPath();
    app.innerHTML = routeToView(p);

    // Always wire common (safe)
    wireCommon();

    // Route-specific wiring
    if (p === cfg.ROUTES.status) wireStatus();
    if (p === cfg.ROUTES.verify) wireVerify();
    if (p === cfg.ROUTES.create) wireCreate();
    if (p === cfg.ROUTES.admin) wireAdmin();

    paintTokenState();
  }

  async function boot() {
    await loadI18n();
    loadLangFromStorageOrUrl();

    langBtn.addEventListener("click", () => {
      const i = cfg.SUPPORTED_LANGS.indexOf(state.lang);
      const next = cfg.SUPPORTED_LANGS[(i + 1) % cfg.SUPPORTED_LANGS.length];
      setLang(next);
    });

    // If user hits legacy path (/r/home), normalize once
    const normalized = normalizePath(location.pathname);
    if (normalized !== location.pathname) {
      const u = new URL(location.href);
      u.pathname = normalized;
      history.replaceState({}, "", u.toString());
    }

    render();
  }

  boot().catch(() => {
    app.innerHTML = `<section class="hero"><h1>App</h1><p class="muted">Boot failed.</p></section>`;
  });
})();
