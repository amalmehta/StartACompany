// Watches the pages the fee data and partner prices come from, and reports any
// that changed or broke since the last review.
//
// Two kinds of source, checked differently:
//
// Official fee pages (each state's filing office). scripts/source-snapshots.json
// keeps a fingerprint per URL:
//   lastModified  the server's Last-Modified header, when it's a real date
//                 (dynamic pages that stamp "now" on every request are ignored)
//   hash          SHA-256 of the page's visible text, with scripts, styles,
//                 tags, clock times, long random tokens and whitespace stripped
// The page counts as changed when Last-Modified moved, or, with no usable
// Last-Modified on both sides, when the text hash changed.
//
// Partner price pages (src/data/partners.js). Marketing pages change their
// wording and run A/B tests constantly, so instead of a hash the check looks
// for every dollar amount in the partner's configured price (e.g. "$297") on
// the page. A missing amount is reported as a change.
//
// Bot walls (403/429, or a "Request unsuccessful" interstitial) are listed as
// blocked, to check by hand, and never open an issue on their own.
//
// Usage:
//   npm run check-sources                     compare; exit 1 if anything changed or broke
//   npm run check-sources -- --report out.md  also write a Markdown report (for the issue)
//   npm run check-sources -- --update         record today's fingerprints as the new baseline
//
// After a change is reported: open the page, update src/data/states.js or
// src/data/partners.js if a fee moved, then run --update and commit.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { STATES } from "../src/data/states.js";
import { PARTNERS } from "../src/data/partners.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_FILE = path.join(root, "scripts", "source-snapshots.json");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
export const BLOCKED = [401, 403, 429, "redirect-loop", "bot-wall"];

// Dollar amounts in a piece of text, normalized: "$1,999.00" -> "$1999".
export const amounts = (text) =>
  [...new Set((String(text).match(/\$\s?\d[\d,]*(?:\.\d+)?/g) || []).map((a) => "$" + a.replace(/[$\s,]/g, "").replace(/\.0+$/, "")))].sort();

// Every page a number on the site comes from: url -> { where, kind, expect }.
export function sources(states = STATES, partners = PARTNERS) {
  const m = new Map();
  for (const s of states) if (!m.has(s.url)) m.set(s.url, { where: `${s.name} fees`, kind: "official" });
  for (const p of partners) {
    if (p.priceSource && !m.has(p.priceSource)) m.set(p.priceSource, { where: `${p.name} price`, kind: "partner", expect: amounts(p.price) });
  }
  return m;
}

// The visible text of a page, minus things that change on every load.
export function normalizeText(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp]\.?[Mm]\.?)?\b/g, " ") // clocks
    .replace(/\b[A-Za-z0-9+/_=-]{32,}\b/g, " ") // session ids, CSRF tokens, view state
    .replace(/\s+/g, " ")
    .trim();
}

export const hashText = (text) => createHash("sha256").update(text).digest("hex");

// Pages a firewall serves to scripts instead of the real page.
export const isBotWall = (text) =>
  /Request unsuccessful\. Incapsula|Attention Required! \| Cloudflare|Just a moment\.\.\.|Access Denied|Pardon Our Interruption/i.test(text) ||
  text.split(" ").length < 20;

// Last-Modified is only trusted if it's a valid date clearly older than the
// response itself; many dynamic sites send the current time.
export function stableLastModified(headers) {
  const lm = headers["last-modified"];
  if (!lm) return null;
  const t = Date.parse(lm);
  if (!Number.isFinite(t)) return null;
  const now = Date.parse(headers.date || "") || Date.now();
  return now - t > 60 * 60 * 1000 ? new Date(t).toISOString() : null;
}

// A fingerprint from a fetched response: { status, ok, lastModified, hash, amounts }.
export function fingerprint({ status, headers = {}, body = "" }) {
  const ok = typeof status === "number" && status >= 200 && status < 300;
  if (!ok) return { status, ok: false };
  const text = normalizeText(body);
  if (isBotWall(text)) return { status: "bot-wall", ok: false };
  return { status, ok: true, lastModified: stableLastModified(headers), hash: hashText(text), amounts: amounts(text) };
}

// Compare stored fingerprints with fresh ones. prev and next are { url: fingerprint };
// info is the Map from sources().
export function compare(prev, next, info = new Map()) {
  const r = { changed: [], broken: [], blocked: [], added: [], unchanged: [] };
  for (const [url, now] of Object.entries(next)) {
    const src = info.get(url) || { where: prev[url]?.where || "", kind: "official" };
    const row = { url, where: src.where };
    if (!now.ok) {
      (BLOCKED.includes(now.status) ? r.blocked : r.broken).push({ ...row, status: now.status });
      continue;
    }
    if (src.kind === "partner") {
      const missing = (src.expect || []).filter((a) => !now.amounts.includes(a));
      if (missing.length) r.changed.push({ ...row, how: `price ${missing.join(", ")} no longer on the page` });
      else r.unchanged.push(row);
      continue;
    }
    const was = prev[url];
    if (!was || !was.hash) {
      r.added.push(row);
      continue;
    }
    const byDate = was.lastModified && now.lastModified;
    const moved = byDate ? was.lastModified !== now.lastModified : was.hash !== now.hash;
    (moved ? r.changed : r.unchanged).push({ ...row, how: byDate ? "Last-Modified" : "page text" });
  }
  return r;
}

export const needsAttention = (r) => r.changed.length + r.broken.length > 0;

// Markdown for the GitHub issue the weekly workflow opens.
export function report(r, date = new Date().toISOString().slice(0, 10)) {
  const list = (rows, fmt) => rows.map(fmt).join("\n") || "- none";
  return `## Official sources check, ${date}

${r.changed.length} changed · ${r.broken.length} broken · ${r.blocked.length} blocked scripts · ${r.added.length} without a baseline · ${r.unchanged.length} unchanged

### Changed since the last review
${list(r.changed, (x) => `- [ ] ${x.where}: ${x.url} (${x.how})`)}

### Broken
${list(r.broken, (x) => `- [ ] ${x.where}: ${x.url} (status ${x.status})`)}

### Blocked scripts (check in a browser)
${list(r.blocked, (x) => `- ${x.where}: ${x.url} (status ${x.status})`)}

### What to do
1. Open each changed page and compare its fees with \`src/data/states.js\` or \`src/data/partners.js\`.
2. Fix any fee that moved, set \`DATA_REVIEWED\` or \`PRICES_CHECKED\`, and run \`npm run build\`.
3. Fix broken links with the page's new address.
4. Run \`npm run check-sources -- --update\` to record the new baseline, then commit.

A changed page often means a redesign or a new date stamp, not a new fee. It's a prompt to look, not proof of a change.
`;
}

// ── Fetching ───────────────────────────────────────────────
export async function fetchPage(url) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": UA }, signal: AbortSignal.timeout(25000) });
    const headers = Object.fromEntries(res.headers);
    return { status: res.status, headers, body: res.ok ? await res.text() : "" };
  } catch {
    return curlPage(url);
  }
}

// Node can't always verify certificate chains that browsers accept (it doesn't
// fetch missing intermediates), so retry with curl and the system trust store.
function curlPage(url) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sources-"));
  const headerFile = path.join(dir, "headers.txt");
  try {
    const body = execFileSync("curl", ["-sSL", "--max-time", "25", "-A", UA, "-D", headerFile, url], { maxBuffer: 50e6, stdio: ["ignore", "pipe", "ignore"] }).toString();
    // With redirects, -D holds every hop's headers; the last block is the final page.
    const blocks = fs.readFileSync(headerFile, "utf8").trim().split(/\r?\n\r?\n/);
    const last = blocks.at(-1).split(/\r?\n/);
    const status = Number(last[0].split(" ")[1]) || 0;
    const headers = {};
    for (const line of last.slice(1)) {
      const i = line.indexOf(":");
      if (i > 0) headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
    return { status, headers, body: status >= 200 && status < 300 ? body : "" };
  } catch (e) {
    return { status: e.status === 47 ? "redirect-loop" : e.status === 28 ? "timeout" : 0, headers: {}, body: "" };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const update = args.includes("--update");
  const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;
  const info = sources();
  let prev = {};
  try {
    prev = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
  } catch {
    /* first run */
  }

  const next = {};
  const list = [...info.keys()];
  for (let i = 0; i < list.length; i += 8) {
    await Promise.all(list.slice(i, i + 8).map(async (url) => (next[url] = fingerprint(await fetchPage(url)))));
  }
  const r = compare(prev, next, info);
  console.log(
    `Checked ${list.length} sources: ${r.changed.length} changed, ${r.broken.length} broken, ${r.blocked.length} blocked, ${r.added.length} new, ${r.unchanged.length} unchanged.`
  );
  for (const x of r.changed) console.log(`  CHANGED  ${x.url}  (${x.where}, ${x.how})`);
  for (const x of r.broken) console.log(`  BROKEN   ${x.status}  ${x.url}  (${x.where})`);
  for (const x of r.blocked) console.log(`  blocked  ${x.status}  ${x.url}  (${x.where})`);

  if (reportPath) fs.writeFileSync(reportPath, report(r));
  if (update) {
    const today = new Date().toISOString().slice(0, 10);
    const out = {};
    for (const url of list) {
      const now = next[url];
      // Keep the old baseline for pages that couldn't be read this time.
      out[url] = now.ok
        ? { where: info.get(url).where, lastModified: now.lastModified, hash: now.hash, checked: today }
        : prev[url] || { where: info.get(url).where, lastModified: null, hash: null, checked: null };
    }
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(out, null, 2) + "\n");
    console.log(`Baseline written to ${path.relative(root, SNAPSHOT_FILE)}.`);
  } else if (needsAttention(r)) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) await main();
