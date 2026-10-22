// Writes the static pages from the same data the app uses: a page per state,
// the state index, terms, privacy, sitemap.xml and robots.txt, and keeps
// index.html's canonical and Open Graph URLs pointed at the site's base.
// Usage: npm run build            write the files
//        npm run build -- --check  exit 1 if any committed file is out of date

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPages, siteBase } from "./site.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const pages = allPages(root);
const stale = [];

for (const [rel, body] of pages) {
  const file = path.join(root, rel);
  let current = null;
  try {
    current = fs.readFileSync(file, "utf8");
  } catch {
    /* new file */
  }
  if (current === body) continue;
  stale.push(rel);
  if (!check) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
}

const base = siteBase(root);
if (check) {
  if (stale.length) {
    console.log(`${stale.length} page(s) out of date. Run npm run build.\n  ${stale.join("\n  ")}`);
    process.exitCode = 1;
  } else console.log(`All ${pages.size} generated files are up to date (base ${base}).`);
} else {
  console.log(`Built ${pages.size} files for ${base}: ${stale.length} changed.`);
}
