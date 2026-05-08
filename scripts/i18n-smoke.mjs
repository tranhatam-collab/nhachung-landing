import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");

const files = {
  config: path.join(publicDir, "assets", "config.js"),
  site: path.join(publicDir, "assets", "site.js"),
  contentVi: path.join(publicDir, "content", "vi.json"),
  contentEn: path.join(publicDir, "content", "en.json")
};

const scripts = {
  config: await readFile(files.config, "utf8"),
  site: await readFile(files.site, "utf8"),
  contentVi: JSON.parse(await readFile(files.contentVi, "utf8")),
  contentEn: JSON.parse(await readFile(files.contentEn, "utf8"))
};

function createStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    }
  };
}

function createElement(id, i18nKey = null) {
  return {
    id,
    href: "",
    textContent: "",
    dataset: i18nKey ? { i18n: i18nKey } : {},
    attributes: {},
    listeners: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      if (name === "data-i18n") return i18nKey;
      return this.attributes[name] || null;
    },
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    }
  };
}

async function runLanding(url, navigatorLanguages = ["vi-VN"]) {
  const storage = createStorage();
  const location = new URL(url);
  const elements = {
    langBtn: createElement("langBtn"),
    year: createElement("year"),
    btnOpenApp: createElement("btnOpenApp"),
    btnOpenAppTop: createElement("btnOpenAppTop"),
    btnStartApp: createElement("btnStartApp"),
    btnStartAdmin: createElement("btnStartAdmin"),
    btnStartApi: createElement("btnStartApi"),
    btnOpenAPI: createElement("btnOpenAPI"),
    heroTitle: createElement("heroTitle", "hero.h1"),
    brandName: createElement("brandName", "brand.name")
  };

  const i18nElements = [elements.heroTitle, elements.brandName];

  const document = {
    documentElement: {
      lang: "vi",
      dir: "ltr",
      dataset: {}
    },
    querySelector(selector) {
      if (selector.startsWith("#")) return elements[selector.slice(1)] || null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-i18n]") return i18nElements;
      if (selector === "#langBtn") return elements.langBtn ? [elements.langBtn] : [];
      return [];
    }
  };

  const history = {
    replaceState(_state, _title, next) {
      const updated = new URL(next, location.origin);
      location.href = updated.href;
      location.pathname = updated.pathname;
      location.search = updated.search;
    }
  };

  const context = {
    console,
    URL,
    Response,
    location,
    history,
    document,
    localStorage: storage,
    navigator: {
      language: navigatorLanguages[0] || "vi-VN",
      languages: navigatorLanguages
    },
    fetch: async (requestUrl) => {
      const requested = typeof requestUrl === "string" ? requestUrl : requestUrl.url;
      if (requested.includes("/content/vi.json")) {
        return new Response(JSON.stringify(scripts.contentVi), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (requested.includes("/content/en.json")) {
        return new Response(JSON.stringify(scripts.contentEn), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ ok: false }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
  };

  context.window = context;

  vm.runInNewContext(scripts.config, context, { filename: files.config });
  vm.runInNewContext(scripts.site, context, { filename: files.site });

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  return {
    hero: elements.heroTitle.textContent,
    brand: elements.brandName.textContent,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    appHref: elements.btnOpenApp.href,
    langButton: elements.langBtn.textContent
  };
}

const checks = [
  {
    name: "landing uses English when lang=en is requested",
    result: await runLanding("https://nhachung.org/?lang=en"),
    assert(result) {
      return result.hero.includes("NhaChung is where people live real");
    }
  },
  {
    name: "landing follows browser English preference when no query is set",
    result: await runLanding("https://nhachung.org/", ["en-US"]),
    assert(result) {
      return result.lang === "en" && result.langButton === "EN";
    }
  },
  {
    name: "landing falls back to Vietnamese for unsupported locale",
    result: await runLanding("https://nhachung.org/?lang=fr", ["fr-FR"]),
    assert(result) {
      return result.lang === "vi" && result.hero.includes("Nhà Chung là nơi để sống thật");
    }
  }
];

let failed = 0;

for (const test of checks) {
  if (!test.assert(test.result)) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(JSON.stringify(test.result, null, 2));
  } else {
    console.log(`PASS: ${test.name}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log("PASS: landing i18n smoke complete");
}
