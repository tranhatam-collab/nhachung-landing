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
const sourceSvg = path.join(projectRoot, "public/assets/logo/01-monogram.svg");
const iconRoot = path.join(projectRoot, "public/assets/icons");
const appIconRoot = path.join(iconRoot, "app");

const faviconSizes = [16, 32, 64, 128, 256, 512, 1024];
const appIconSizes = [180, 192, 512];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function writePng(size, outputDir, name = `icon-${size}.png`) {
  await sharp(sourceSvg, { density: 384 })
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(outputDir, name));
}

ensureDir(iconRoot);
ensureDir(appIconRoot);

for (const size of faviconSizes) {
  await writePng(size, iconRoot);
}

await writePng(180, appIconRoot, "apple-touch-icon.png");
await writePng(192, appIconRoot, "icon-192-maskable.png");
await writePng(512, appIconRoot, "icon-512-maskable.png");

console.log(
  `Exported Nhà Chung PNG icons: favicon ${faviconSizes.join(", ")}; app ${appIconSizes.join(", ")}.`,
);
