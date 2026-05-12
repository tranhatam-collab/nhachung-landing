import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require("sharp");
} catch {
  throw new Error(
    "Missing dependency: sharp. Run with NODE_PATH pointing at an installed sharp package, for example: NODE_PATH=../apps/worker/node_modules node scripts/export-brand-icons.mjs",
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const iconRoot = path.join(projectRoot, "public/assets/icons");
const appIconRoot = path.join(iconRoot, "app");
const logoRoot = path.join(projectRoot, "public/assets/logo");
const ogRoot = path.join(projectRoot, "public/assets/og");
const manifestPath = path.join(projectRoot, "public/assets/brand-export-manifest.json");

const faviconSizes = [16, 32, 64, 128, 256, 512, 1024];
const appIconSizes = [180, 192, 512];
const rasterLogoExports = [
  { source: "01-monogram.svg", width: 1024, output: "01-monogram.png" },
  { source: "02-wordmark-primary.svg", width: 1800, output: "02-wordmark-primary.png" },
  { source: "03-horizontal-lockup.svg", width: 1800, output: "03-horizontal-lockup.png" },
  { source: "04-stacked-lockup.svg", width: 1400, output: "04-stacked-lockup.png" },
];
const ogExports = [
  "home",
  "nha-chung-la-gi",
  "hanh-trinh-tham-gia",
  "cac-can-nha",
  "cau-chuyen",
  "nguyen-tac-song-chung",
  "lam-viec-muon-noi",
  "ung-dung",
  "dang-ky",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function renderSvgToPng(sourceSvg, outputPath, resizeOptions) {
  let pipeline = sharp(sourceSvg, { density: 384 });
  if (resizeOptions) {
    pipeline = pipeline.resize(resizeOptions);
  }

  await pipeline
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}

async function writePng(sourceSvg, size, outputDir, name = `icon-${size}.png`) {
  await renderSvgToPng(sourceSvg, path.join(outputDir, name), {
    width: size,
    height: size,
    fit: "cover",
  });
}

function writeIco(outputPath, images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + (16 * images.length);
  const entries = [];
  const payloads = [];

  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(image.size >= 256 ? 0 : image.size, 0);
    entry.writeUInt8(image.size >= 256 ? 0 : image.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.buffer.length;
    entries.push(entry);
    payloads.push(image.buffer);
  }

  fs.writeFileSync(outputPath, Buffer.concat([header, ...entries, ...payloads]));
}

async function exportFaviconIco(sourceSvg) {
  const icoSizes = [16, 32, 64];
  const images = [];

  for (const size of icoSizes) {
    const buffer = await sharp(sourceSvg, { density: 384 })
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
    images.push({ size, buffer });
  }

  writeIco(path.join(projectRoot, "public/assets/favicon.ico"), images);
}

ensureDir(iconRoot);
ensureDir(appIconRoot);

const monogramSvg = path.join(logoRoot, "01-monogram.svg");

for (const size of faviconSizes) {
  await writePng(monogramSvg, size, iconRoot);
}

await writePng(monogramSvg, 180, appIconRoot, "apple-touch-icon.png");
await writePng(monogramSvg, 192, iconRoot, "icon-192.png");
await writePng(monogramSvg, 192, appIconRoot, "icon-192-maskable.png");
await writePng(monogramSvg, 512, appIconRoot, "icon-512-maskable.png");
await exportFaviconIco(monogramSvg);

for (const exportItem of rasterLogoExports) {
  await renderSvgToPng(
    path.join(logoRoot, exportItem.source),
    path.join(logoRoot, exportItem.output),
    { width: exportItem.width, fit: "contain", withoutEnlargement: false },
  );
}

for (const name of ogExports) {
  await renderSvgToPng(
    path.join(ogRoot, `${name}.svg`),
    path.join(ogRoot, `${name}.png`),
    { width: 1200, height: 630, fit: "contain", background: "#0A0A0A" },
  );
}

fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      source: "public/assets/logo/*.svg and public/assets/og/*.svg",
      icons: [
        ...faviconSizes.map((size) => `assets/icons/icon-${size}.png`),
        "assets/icons/icon-192.png",
        "assets/icons/app/apple-touch-icon.png",
        "assets/icons/app/icon-192-maskable.png",
        "assets/icons/app/icon-512-maskable.png",
        "assets/favicon.ico",
        "assets/favicon.svg",
      ],
      logos: rasterLogoExports.map((item) => `assets/logo/${item.output}`),
      og_images: ogExports.map((name) => `assets/og/${name}.png`),
    },
    null,
    2,
  ),
);

console.log(
  `Exported Nhà Chung asset pack: favicon ${faviconSizes.join(", ")}, 192 any, app ${appIconSizes.join(", ")}, ${rasterLogoExports.length} logo PNGs, ${ogExports.length} OG PNGs, favicon.ico.`,
);
