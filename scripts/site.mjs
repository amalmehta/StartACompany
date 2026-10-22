// Builds the static pages search engines and link previews see: one page per
// state, a state index, the terms and privacy pages, sitemap.xml and
// robots.txt. Pure functions that return strings; scripts/build-pages.mjs
// writes them and the tests compare them with what's committed.
//
// Every link between pages is relative, so the same files work under
// GitHub Pages' /StartACompany/ path and at the root of a custom domain.
// Only canonical, Open Graph and sitemap URLs are absolute; they come from
// siteBase(): SITE_URL if set, else the domain in CNAME, else GitHub Pages.

import fs from "node:fs";
import path from "node:path";
import { STATES, DATA_REVIEWED } from "../src/data/states.js";
import { buildPlan, PUBLICATION } from "../src/plan.js";
import { esc, servicesFor, servicesHTML } from "../src/partners.js";

export const DEFAULT_BASE = "https://amalmehta.github.io/StartACompany/";
export const ASSET_VERSION = "2026-10-22"; // keep in step with ?v= in index.html
const OG_IMAGE = "docs/images/plan.png";

// The site's absolute base URL, always ending in "/".
export function siteBase(root, env = process.env) {
  let base = env.SITE_URL;
  if (!base) {
    try {
      const cname = fs.readFileSync(path.join(root, "CNAME"), "utf8").trim().split(/\s+/)[0];
      if (cname) base = `https://${cname.replace(/^https?:\/\//, "")}/`;
    } catch {
      /* no custom domain */
    }
  }
  base = base || DEFAULT_BASE;
  return base.endsWith("/") ? base : `${base}/`;
}

export const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const usd = (n) => (n === 0 ? "$0" : `$${n.toLocaleString("en-US")}`);
const per = (st, n) => (st.cadence === "none" ? "Nothing yearly" : st.cadence === "biennial" ? `${usd(n)} every 2 years` : `${usd(n)} a year`);
const ext = (url, label) =>
  `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗<span class="sr-only"> (opens in a new tab)</span></a>`;

// ── Shared page chrome ─────────────────────────────────────
function page({ base, pathName, up, title, description, body }) {
  const url = base + pathName;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#f6f4ef">
  <link rel="canonical" href="${esc(url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Start a Company">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(base + OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${up}favicon.ico" sizes="32x32">
  <link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${up}apple-touch-icon.png">
  <script>
    try {
      var t = (JSON.parse(localStorage.getItem("start-a-company:v1")) || {}).settings;
      if (t && (t.theme === "dark" || t.theme === "light")) document.documentElement.setAttribute("data-theme", t.theme);
    } catch (e) {}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${up}styles.css?v=${ASSET_VERSION}">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="topbar">
    <div class="wrap topbar-inner">
      <a class="brand" href="${up}">
        <span class="logo" aria-hidden="true">✓</span>
        <span>Start a Company</span>
      </a>
      <nav class="tabs" aria-label="Pages">
        <a href="${up}#plan">Your plan</a>
        <a href="${up}#states">Compare states</a>
      </nav>
    </div>
  </header>
  <main class="wrap page" id="main" tabindex="-1">
${body}
    <footer class="foot">
      <p><strong>Not legal or tax advice.</strong> Fees and rules change. Confirm on the official site before you file. State fees last reviewed ${esc(DATA_REVIEWED)}. <a href="https://github.com/amalmehta/StartACompany" target="_blank" rel="noopener">Source on GitHub</a>.</p>
      <p class="foot-links"><a href="${up}states/">Fees by state</a> · <a href="${up}terms.html">Terms</a> · <a href="${up}privacy.html">Privacy</a> · <a href="${up}terms.html#referrals">How the site is paid for</a></p>
    </footer>
  </main>
</body>
</html>
`;
}

// ── One state ──────────────────────────────────────────────
const FILING_IDS = ["file", "publish", "annual"];

function filings(plan) {
  const items = plan.steps
    .filter((s) => FILING_IDS.includes(s.id))
    .map((s) => `<li><strong>${esc(s.title)}</strong> <span class="pill cost">${esc(s.costLabel)}</span><br><span class="small">${esc(s.body)}</span></li>`);
  if (!plan.steps.some((s) => s.id === "annual")) items.push("<li><strong>No recurring state report.</strong> Check the notes above for any tax return the state still expects.</li>");
  return items.join("\n          ");
}

export function statePage(st, base) {
  const llc = buildPlan({ state: st.code, entity: "llc" });
  const corp = buildPlan({ state: st.code, entity: "ccorp", formIn: "home" });
  const pub = PUBLICATION[st.code];
  const pubRow = pub
    ? `<tr><th scope="row">Newspaper notice</th><td>${esc(pub.label)}, required for ${[pub.llc && "LLCs", pub.corp && "corporations"].filter(Boolean).join(" and ")}</td></tr>`
    : "";
  const llcServices = servicesHTML(servicesFor(new Set(["llc"])), { heading: `Or pay a service to form your ${st.name} LLC` });
  const deServices =
    st.code === "DE" ? servicesHTML(servicesFor(new Set(["deCorp"])), { heading: "Forming a Delaware C corp to raise money? These services do the filing" }) : "";
  const title = `${st.name} LLC and Corporation Fees · Start a Company`;
  const description = `Forming a company in ${st.name}: ${usd(st.llc)} for an LLC, ${usd(st.corp)} for a corporation, then ${per(st, st.llcAnnual).toLowerCase()} (LLC). Filings, due dates and official links, reviewed ${DATA_REVIEWED}.`;
  const body = `    <div class="hero">
      <h1>Forming a company in ${esc(st.name)}</h1>
      <p>What ${esc(st.name)} charges to form an LLC or corporation, what you file each year, and where to file it. Fees last reviewed ${esc(DATA_REVIEWED)}.</p>
    </div>

    <section class="card" aria-labelledby="fees-h">
      <h2 id="fees-h">Fees at a glance</h2>
      <div class="table-scroll">
        <table class="facts">
          <caption class="sr-only">${esc(st.name)} state fees</caption>
          <tbody>
            <tr><th scope="row">LLC to form</th><td>${usd(st.llc)}</td></tr>
            <tr><th scope="row">LLC to keep each year</th><td>${per(st, st.llcAnnual)}</td></tr>
            <tr><th scope="row">Corporation to form</th><td>${usd(st.corp)}</td></tr>
            <tr><th scope="row">Corporation to keep each year</th><td>${per(st, st.corpAnnual)}</td></tr>
            <tr><th scope="row">Report due</th><td>${esc(st.due)}</td></tr>
            <tr><th scope="row">Registering an out-of-state company here</th><td>${usd(st.foreignLlc)} (LLC), ${usd(st.foreignCorp)} (corporation)</td></tr>
            ${pubRow}
          </tbody>
        </table>
      </div>
      <p class="small muted">Yearly cost is the report fee plus any minimum tax owed no matter how much you earn. Taxes that grow with revenue or shares aren't included.</p>
      ${st.notes ? `<p>${esc(st.notes)}</p>` : ""}
    </section>

    <section class="card" aria-labelledby="llc-h">
      <h2 id="llc-h">Filings for an LLC</h2>
      <ul>
          ${filings(llc)}
      </ul>
      <div class="links">${ext(st.url, `File yourself: ${st.name} filing office`)}</div>
      ${llcServices}
    </section>

    <section class="card" aria-labelledby="corp-h">
      <h2 id="corp-h">Filings for a corporation</h2>
      <ul>
          ${filings(corp)}
      </ul>
      <div class="links">${ext(st.url, `File yourself: ${st.name} filing office`)}</div>
      ${deServices}
    </section>

    <section class="card" aria-labelledby="next-h">
      <h2 id="next-h">Your whole checklist</h2>
      <p>State filings are a small part of it. Answer a few questions to get every step in order for ${esc(st.name)}: the IRS, bank, licenses, hiring and yearly upkeep.</p>
      <a class="btn cta" href="../../?state=${st.code}#plan">Build my ${esc(st.name)} checklist</a>
    </section>

    <section class="card" aria-labelledby="src-h">
      <h2 id="src-h">Sources</h2>
      <ul>
        <li>${ext(st.url, `${st.name} business filing office`)}, checked ${esc(DATA_REVIEWED)}</li>
        <li><a href="../">Every state's fees</a></li>
      </ul>
      <p class="small muted">Spotted a wrong fee? Use the Feedback tab on the <a href="../../">main page</a> or open an issue on GitHub.</p>
    </section>
`;
  return page({ base, pathName: `states/${slug(st.name)}/`, up: "../../", title, description, body });
}

export function statesIndex(base) {
  const items = STATES.map((s) => `<li><a href="${slug(s.name)}/">${esc(s.name)}</a></li>`).join("\n        ");
  const body = `    <div class="hero">
      <h1>Company fees by state</h1>
      <p>What every state and DC charges to form and keep an LLC or corporation, with filings, due dates and official links. Last reviewed ${esc(DATA_REVIEWED)}.</p>
    </div>
    <section class="card" aria-label="States">
      <ul class="state-list">
        ${items}
      </ul>
    </section>
`;
  return page({
    base,
    pathName: "states/",
    up: "../",
    title: "Company Fees by State · Start a Company",
    description: "LLC and corporation formation fees, yearly costs and filing deadlines for all 50 states and DC, with official links.",
    body,
  });
}

// Terms and privacy: the text lives in content/*.html so it can be edited
// (and reviewed by a lawyer) without touching code.
export function contentPage(root, base, name, { title, description }) {
  const body = fs.readFileSync(path.join(root, "content", `${name}.html`), "utf8");
  return page({ base, pathName: `${name}.html`, up: "", title, description, body });
}

export const LEGAL = {
  terms: { title: "Terms of Use · Start a Company", description: "The terms for using Start a Company, including how the site is paid for through referral fees." },
  privacy: { title: "Privacy · Start a Company", description: "What Start a Company stores (only in your browser) and what it never collects." },
};

export function sitemap(base) {
  const urls = [
    ["", null],
    ["states/", DATA_REVIEWED],
    ...STATES.map((s) => [`states/${slug(s.name)}/`, DATA_REVIEWED]),
    ["terms.html", null],
    ["privacy.html", null],
  ];
  const rows = urls
    .map(([p, mod]) => `  <url><loc>${esc(base + p)}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ""}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

// Search engines only read robots.txt at a domain root, so this matters once a
// custom domain is set. Under github.io it's harmless.
export const robots = (base) => `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`;

// Point the hand-written index.html's canonical and Open Graph URLs at the base.
export function setHeadUrls(html, base) {
  return html
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${base}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${base}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${base}${OG_IMAGE}$2`);
}

// Every generated file: relative path → contents.
export function allPages(root, env = process.env) {
  const base = siteBase(root, env);
  const out = new Map();
  out.set("index.html", setHeadUrls(fs.readFileSync(path.join(root, "index.html"), "utf8"), base));
  out.set("states/index.html", statesIndex(base));
  for (const st of STATES) out.set(`states/${slug(st.name)}/index.html`, statePage(st, base));
  for (const [name, meta] of Object.entries(LEGAL)) out.set(`${name}.html`, contentPage(root, base, name, meta));
  out.set("sitemap.xml", sitemap(base));
  out.set("robots.txt", robots(base));
  return out;
}
