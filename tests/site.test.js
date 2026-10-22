import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STATES } from "../src/data/states.js";
import { PARTNERS } from "../src/data/partners.js";
import { allPages, siteBase, slug, statePage, setHeadUrls, sitemap, DEFAULT_BASE, ASSET_VERSION } from "../scripts/site.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = DEFAULT_BASE;

test("the committed pages match what the build would write", () => {
  const stale = [];
  for (const [rel, body] of allPages(root, {})) {
    let current = null;
    try {
      current = fs.readFileSync(path.join(root, rel), "utf8");
    } catch {
      /* missing */
    }
    if (current !== body) stale.push(rel);
  }
  assert.deepEqual(stale, [], "run npm run build");
});

test("one page per state, with its fees, sources and its own title", () => {
  const pages = allPages(root, {});
  assert.equal(STATES.length, 51);
  const titles = new Set();
  for (const st of STATES) {
    const html = pages.get(`states/${slug(st.name)}/index.html`);
    assert.ok(html, st.code);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    titles.add(title);
    assert.match(title, new RegExp(st.name));
    assert.match(html, /<meta name="description" content="[^"]{60,}">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="${base}states/${slug(st.name)}/">`));
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /<meta property="og:image" content="https:\/\//);
    assert.ok(html.includes(`$${st.llc.toLocaleString("en-US")}`), `${st.code} LLC fee`);
    assert.ok(html.includes(st.url.replace(/&/g, "&amp;")), `${st.code} official link`);
    assert.match(html, /Not legal or tax advice/);
    assert.ok(html.includes(`?state=${st.code}#plan`), `${st.code} checklist link`);
    assert.doesNotMatch(html, /undefined|NaN|\[object/);
  }
  assert.equal(titles.size, 51, "titles are unique");
  assert.equal(slug("District of Columbia"), "district-of-columbia");
});

test("pages only use relative links, so they work under /StartACompany/ and at a domain root", () => {
  for (const [rel, html] of allPages(root, {})) {
    if (!rel.endsWith(".html")) continue;
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^https?:\/\//.test(url) || url.startsWith("#")) continue;
      assert.ok(!url.startsWith("/"), `${rel}: root-relative link ${url}`);
      // Resolve against the page and check the file exists.
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), url.split(/[?#]/)[0]));
      if (target === "." || target === "") continue;
      const file = path.join(root, target.endsWith("/") || !path.extname(target) ? path.join(target, "index.html") : target);
      assert.ok(fs.existsSync(file) || allPages(root, {}).has(path.relative(root, file)), `${rel}: ${url} → ${target}`);
    }
  }
});

test("the base URL follows SITE_URL, then CNAME, then GitHub Pages", () => {
  const tmp = fs.mkdtempSync(path.join(root, ".tmp-site-"));
  try {
    assert.equal(siteBase(tmp, {}), DEFAULT_BASE);
    fs.writeFileSync(path.join(tmp, "CNAME"), "startacompany.example\n");
    assert.equal(siteBase(tmp, {}), "https://startacompany.example/");
    assert.equal(siteBase(tmp, { SITE_URL: "https://x.example/sub" }), "https://x.example/sub/");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  const html = setHeadUrls(fs.readFileSync(path.join(root, "index.html"), "utf8"), "https://startacompany.example/");
  assert.match(html, /<link rel="canonical" href="https:\/\/startacompany\.example\/">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/startacompany\.example\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/startacompany\.example\/docs\/images\/plan\.png">/);
  assert.match(statePage(STATES[0], "https://startacompany.example/"), /href="https:\/\/startacompany\.example\/states\/alabama\/"/);
});

test("sitemap lists the app, every state page and the legal pages", () => {
  const xml = sitemap(base);
  assert.equal((xml.match(/<url>/g) || []).length, 1 + 1 + 51 + 2);
  assert.ok(xml.includes(`<loc>${base}states/new-york/</loc>`));
  assert.ok(xml.includes(`<loc>${base}privacy.html</loc>`));
  assert.ok(fs.readFileSync(path.join(root, "robots.txt"), "utf8").includes(`Sitemap: ${base}sitemap.xml`));
});

test("generated pages use the same asset version as index.html", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.ok(html.includes(`styles.css?v=${ASSET_VERSION}`));
});

test("with no referral IDs, no page carries a sponsored link or a disclosure", () => {
  assert.ok(PARTNERS.every((p) => !p.referralId));
  for (const [rel, html] of allPages(root, {})) {
    assert.doesNotMatch(html, /rel="sponsored/, rel);
    assert.doesNotMatch(html, /class="services"/, rel);
  }
});

test("state pages show fitting partners once IDs are in, after the official link", () => {
  const de = STATES.find((s) => s.code === "DE");
  const tx = STATES.find((s) => s.code === "TX");
  const original = PARTNERS.map((p) => p.referralId);
  PARTNERS.forEach((p) => p.referral && (p.referralId = `test-${p.id}`));
  try {
    const dePage = statePage(de, base);
    const txPage = statePage(tx, base);
    assert.match(dePage, /test-doola/);
    assert.match(dePage, /test-firstbase/);
    assert.match(dePage, /test-legalzoom/); // the LLC section
    assert.doesNotMatch(txPage, /test-doola|test-firstbase/); // no Delaware corp section in Texas
    assert.match(txPage, /test-legalzoom/);
    assert.ok(txPage.indexOf(tx.url) < txPage.indexOf("test-legalzoom"), "official link first");
    for (const a of dePage.match(/<a [^>]*test-[^>]*>/g)) assert.match(a, /rel="sponsored noopener"/);
  } finally {
    PARTNERS.forEach((p, i) => (p.referralId = original[i]));
  }
});

test("terms and privacy are marked as templates and describe the real storage", () => {
  const terms = fs.readFileSync(path.join(root, "terms.html"), "utf8");
  const privacy = fs.readFileSync(path.join(root, "privacy.html"), "utf8");
  for (const html of [terms, privacy]) assert.match(html, /Template\.<\/strong>.*lawyer/);
  assert.match(terms, /id="referrals"/);
  assert.match(terms, /Not legal or tax advice/);
  // Privacy names the one storage key the app uses and every answer it keeps.
  const store = fs.readFileSync(path.join(root, "src/store.js"), "utf8");
  const key = store.match(/const KEY = "([^"]+)"/)[1];
  assert.ok(privacy.includes(key));
  for (const words of ["state", "founders", "venture", "outside the US", "theme", "ticked"]) assert.ok(privacy.includes(words), words);
});

test("the app page carries the advice notice and footer links", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /class="note small advice"><strong>Not legal or tax advice/);
  for (const href of ["terms.html", "privacy.html", "states/"]) assert.ok(html.includes(`href="${href}"`), href);
  assert.match(html, /name="nonUS"/);
});
