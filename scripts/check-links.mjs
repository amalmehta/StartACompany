// Checks every link the site shows — state filing offices, the
// IRS/SBA/USPTO links inside steps, partner price pages and any live referral
// links — and reports any that fail.
// Usage: npm run check-links
// Some state sites block scripts (403/429) yet work in a browser; those are
// listed separately so they can be checked by hand.

import { execFileSync } from "node:child_process";
import { STATES } from "../src/data/states.js";
import { buildPlan } from "../src/plan.js";
import { PARTNERS } from "../src/data/partners.js";
import { referralUrl } from "../src/partners.js";

const urls = new Map(); // url -> where it's used
const add = (url, where) => urls.set(url, urls.get(url) || where);

for (const s of STATES) add(s.url, `${s.name} filing office`);
for (const p of PARTNERS) {
  add(p.priceSource, `${p.name} price`);
  const ref = referralUrl(p);
  if (ref) add(ref, `${p.name} referral link`);
}
for (const s of STATES) {
  for (const entity of ["llc", "ccorp", "scorp", "sole"]) {
    const plan = buildPlan({ state: s.code, entity, founders: 2, hiring: "employees", salesTax: true, regulated: true });
    for (const step of plan.steps) for (const l of step.links) add(l.url, `step "${step.id}"`);
  }
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
// Node doesn't fetch missing intermediate certificates the way browsers do,
// so retry certificate and network failures with curl (system trust store).
function curlStatus(url) {
  try {
    const out = execFileSync("curl", ["-s", "-o", "/dev/null", "-L", "--max-time", "20", "-A", UA, "-w", "%{http_code}", url]);
    return Number(String(out));
  } catch (e) {
    return e.status === 47 ? "redirect-loop" : 0; // curl 47 = bot wall bouncing scripts
  }
}

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
      if (res.ok) return { ok: true, status: res.status, final: res.url };
      if (method === "GET") return { ok: false, status: res.status };
    } catch (e) {
      if (method === "GET") {
        const code = curlStatus(url);
        if (code >= 200 && code < 400) return { ok: true, status: code };
        if (code === "redirect-loop") return { ok: false, status: code };
        return { ok: false, status: code || (e.name === "TimeoutError" ? "timeout" : e.cause?.code || e.message) };
      }
    }
  }
}

const list = [...urls];
const results = [];
for (let i = 0; i < list.length; i += 8) {
  const batch = list.slice(i, i + 8);
  results.push(...(await Promise.all(batch.map(async ([url, where]) => ({ url, where, ...(await check(url)) })))));
}

const BLOCKED = [301, 302, 401, 403, 429, "redirect-loop"];
const broken = results.filter((r) => !r.ok && !BLOCKED.includes(r.status));
const blocked = results.filter((r) => !r.ok && BLOCKED.includes(r.status));
console.log(`Checked ${results.length} links: ${results.length - broken.length - blocked.length} ok, ${blocked.length} blocked scripts, ${broken.length} broken.`);
for (const r of blocked) console.log(`  blocked  ${r.status}  ${r.url}  (${r.where})`);
for (const r of broken) console.log(`  BROKEN   ${r.status}  ${r.url}  (${r.where})`);
process.exitCode = broken.length ? 1 : 0;
