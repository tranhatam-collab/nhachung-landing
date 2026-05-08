#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");

const targets = process.argv.slice(2);
const files = targets.length > 0 ? targets : ["en/index.html"];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function localeForFile(file) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized.startsWith("en/")) return "en";
  if (normalized.startsWith("vi/")) return "vi";
  throw new Error(`unsupported_locale_target:${file}`);
}

for (const relativeFile of files) {
  const locale = localeForFile(relativeFile);
  const htmlPath = path.join(publicDir, relativeFile);
  const dictPath = path.join(publicDir, "content", `${locale}.json`);
  const dict = JSON.parse(fs.readFileSync(dictPath, "utf8"));
  const html = fs.readFileSync(htmlPath, "utf8");

  const updated = html
    .split("\n")
    .map((line) =>
      line.replace(
        /^(\s*<([a-z0-9-]+)\b[^>]*data-i18n="([^"]+)"[^>]*>)(.*?)(<\/\2>\s*)$/i,
        (full, openTag, tagName, key, inner, closeTag) => {
          if (!(key in dict)) return full;
          if (/<[a-z][\s\S]*>/i.test(inner)) return full;
          return `${openTag}${escapeHtml(dict[key])}${closeTag}`;
        },
      ),
    )
    .join("\n");

  fs.writeFileSync(htmlPath, updated, "utf8");
  process.stdout.write(`synced ${relativeFile} from ${locale}.json\n`);
}
