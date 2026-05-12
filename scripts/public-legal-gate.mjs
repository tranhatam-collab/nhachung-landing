import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");

const docs = [
  "terms",
  "privacy",
  "community-principles",
  "resident-agreement",
];

const structuredContentFiles = [
  "content/vi.json",
  "content/en.json",
];

const locales = {
  vi: {
    name: "Nhà Chung",
    vietnamEntity: "CÔNG TY TNHH BỒ CÂU TRẮNG",
    disclaimer:
      "Nhà Chung không phải sàn bất động sản, không phải nơi chào mời góp vốn công khai. Không hứa kết quả tài chính, không hứa thu nhập. Mọi đóng góp tài chính chỉ thực hiện sau khi có hợp đồng pháp lý riêng và tư vấn pháp lý độc lập.",
  },
  en: {
    name: "NhaChung",
    vietnamEntity: "BO CAU TRANG CO., LTD.",
    disclaimer:
      "Nhà Chung is not a real-estate marketplace and not a public capital-solicitation platform. No promised financial outcomes, no promised income. Any financial contribution requires a separate legal contract and independent legal counsel.",
  },
};

const publicPages = [
  "index.html",
  "nha-chung-la-gi.html",
  "hanh-trinh-tham-gia.html",
  "cac-can-nha.html",
  "cau-chuyen.html",
  "nguyen-tac-song-chung.html",
  "lam-viec-muon-noi.html",
  "ung-dung.html",
  "dang-ky.html",
];

const requiredFooterLinks = docs.map((doc) => `/vi/legal/${doc}.html`);

const prohibitedStructuredContentClaims = [
  /\bđầu tư\b/i,
  /\binvesting\b/i,
  /\bkiếm tiền thật\b/i,
  /\bearn real\b/i,
  /\bearning plans\b/i,
  /\bincome pathways\b/i,
  /\breference income range\b/i,
  /\b1\.000-2\.000 usd\b/i,
  /\busd 1,000-2,000\b/i,
];

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${path.relative(projectRoot, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(haystack, needle, label) {
  assert(haystack.includes(needle), `${label} missing required text: ${needle}`);
}

for (const [lang, locale] of Object.entries(locales)) {
  for (const doc of docs) {
    const rel = `${lang}/legal/${doc}.html`;
    const html = readRequired(path.join(publicRoot, rel));
    const url = `https://nhachung.org/${rel}`;
    const counterpart = `https://nhachung.org/${lang === "vi" ? "en" : "vi"}/legal/${doc}.html`;

    assertIncludes(html, "<title>", rel);
    assertIncludes(html, '<meta name="description"', rel);
    assertIncludes(html, `<link rel="canonical" href="${url}"`, rel);
    assertIncludes(html, `hreflang="${lang}" href="${url}"`, rel);
    assertIncludes(html, `href="${counterpart}"`, rel);
    assertIncludes(html, '<link rel="stylesheet" href="/assets/legal.css"', rel);
    assertIncludes(html, "VIET CAN NEW CORP", rel);
    assertIncludes(html, locale.vietnamEntity, rel);
    assertIncludes(html, "pay.iai.one", rel);
    assertIncludes(html, locale.disclaimer, rel);
    assertIncludes(html, "<main", rel);
    assertIncludes(html, locale.name, rel);
  }
}

const redirects = readRequired(path.join(publicRoot, "_redirects"));
for (const doc of docs) {
  const cleanExpected = new RegExp(
    `^/legal/${doc}\\s+/vi/legal/${doc}\\.html\\s+302!$`,
    "m",
  );
  assert(cleanExpected.test(redirects), `Missing forced canonical redirect for /legal/${doc}`);

  const expected = new RegExp(
    `^/legal/${doc}\\.html\\s+/vi/legal/${doc}\\.html\\s+302!$`,
    "m",
  );
  assert(expected.test(redirects), `Missing forced canonical redirect for /legal/${doc}.html`);

  const legacyPath = path.join(publicRoot, "legal", `${doc}.html`);
  assert(!fs.existsSync(legacyPath), `Legacy top-level legal file should not shadow redirect: legal/${doc}.html`);
}

const sitemap = readRequired(path.join(publicRoot, "sitemap.xml"));
for (const lang of Object.keys(locales)) {
  for (const doc of docs) {
    assertIncludes(sitemap, `https://nhachung.org/${lang}/legal/${doc}.html`, "sitemap.xml");
  }
}

for (const page of publicPages) {
  const html = readRequired(path.join(publicRoot, page));
  for (const href of requiredFooterLinks) {
    assertIncludes(html, `href="${href}"`, page);
  }
}

for (const rel of structuredContentFiles) {
  const body = readRequired(path.join(publicRoot, rel));
  for (const claim of prohibitedStructuredContentClaims) {
    assert(
      !claim.test(body),
      `${rel} contains prohibited public-claim wording: ${claim}`,
    );
  }
}

console.log("Public legal gate PASS: 4 P0 legal docs are bilingual, linked, redirected, in sitemap, and structured public copy passes the boundary sweep.");
