import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeText, hashText, stableLastModified, fingerprint, compare, report, needsAttention, sources, amounts, isBotWall, SNAPSHOT_FILE } from "../scripts/check-sources.mjs";

const page = (text) => `<html><head><style>.x{}</style><script>var t=${Date.now()}</script></head><body><p>${text}</p></body></html>`;
const filler = "Form your company online with the Secretary of State filing office business services division today please read the fee schedule below before you file anything at all";

test("normalized text ignores scripts, tags, clocks, tokens and spacing", () => {
  const a = normalizeText(page(`${filler} LLC fee $100. Updated 10:15:02 AM`) + `<input value="${"a".repeat(40)}">`);
  const b = normalizeText(`<div>${filler}   LLC   fee $100.</div><!-- c --> Updated 3:04 pm <i>${"b".repeat(40)}</i>`);
  assert.equal(a, b);
  assert.notEqual(hashText(normalizeText(`${filler} LLC fee $100.`)), hashText(normalizeText(`${filler} LLC fee $125.`)));
});

test("Last-Modified is only trusted when it's clearly older than the response", () => {
  const date = "Thu, 22 Oct 2026 12:00:00 GMT";
  assert.equal(stableLastModified({ "last-modified": "Mon, 05 Oct 2026 09:00:00 GMT", date }), "2026-10-05T09:00:00.000Z");
  assert.equal(stableLastModified({ "last-modified": date, date }), null); // dynamic page
  assert.equal(stableLastModified({ "last-modified": "garbage", date }), null);
  assert.equal(stableLastModified({}), null);
});

test("bot walls and error statuses are not fingerprinted", () => {
  assert.equal(fingerprint({ status: 200, body: "Request unsuccessful. Incapsula incident ID: 123" }).status, "bot-wall");
  assert.ok(isBotWall("short"));
  assert.equal(fingerprint({ status: 404 }).ok, false);
  assert.ok(fingerprint({ status: 200, body: page(filler) }).ok);
});

test("dollar amounts are found and normalized", () => {
  assert.deepEqual(amounts("Starter $297/yr, $1,999 or $ 5.00 and $297"), ["$1999", "$297", "$5"]);
});

const fp = (text, headers = {}) => fingerprint({ status: 200, headers, body: page(`${filler} ${text}`) });
const info = new Map([
  ["https://sos.example/a", { where: "A fees", kind: "official" }],
  ["https://sos.example/b", { where: "B fees", kind: "official" }],
  ["https://sos.example/c", { where: "C fees", kind: "official" }],
  ["https://sos.example/d", { where: "D fees", kind: "official" }],
  ["https://sos.example/e", { where: "E fees", kind: "official" }],
  ["https://partner.example/p", { where: "P price", kind: "partner", expect: ["$297"] }],
]);

test("compare sorts sources into changed, broken, blocked, new and unchanged", () => {
  const old = "Mon, 05 Oct 2026 09:00:00 GMT";
  const prev = {
    "https://sos.example/a": fp("LLC $100"),
    "https://sos.example/b": fp("LLC $100", { "last-modified": old, date: "Thu, 22 Oct 2026 12:00:00 GMT" }),
    "https://sos.example/c": fp("LLC $100"),
    "https://sos.example/d": fp("LLC $100"),
  };
  const next = {
    "https://sos.example/a": fp("LLC $125"), // text changed
    "https://sos.example/b": fp("LLC $100 new footer", { "last-modified": old, date: "Thu, 22 Oct 2026 12:00:00 GMT" }), // same date wins
    "https://sos.example/c": { ok: false, status: 404 },
    "https://sos.example/d": { ok: false, status: 403 },
    "https://sos.example/e": fp("LLC $90"), // no baseline yet
    "https://partner.example/p": fp("Now $349 a year"),
  };
  const r = compare(prev, next, info);
  assert.deepEqual(r.changed.map((x) => x.url), ["https://sos.example/a", "https://partner.example/p"]);
  assert.equal(r.changed[0].how, "page text");
  assert.match(r.changed[1].how, /\$297/);
  assert.deepEqual(r.unchanged.map((x) => x.url), ["https://sos.example/b"]);
  assert.deepEqual(r.broken.map((x) => x.status), [404]);
  assert.deepEqual(r.blocked.map((x) => x.status), [403]);
  assert.deepEqual(r.added.map((x) => x.url), ["https://sos.example/e"]);
  assert.ok(needsAttention(r));
  assert.ok(!needsAttention(compare(prev, { "https://sos.example/a": fp("LLC $100") }, info)));
  // A partner page that still shows its price is fine, whatever else changed.
  assert.equal(compare({}, { "https://partner.example/p": fp("Starter $297/yr, new banner") }, info).unchanged.length, 1);
});

test("the issue report lists what to look at and how to fix it", () => {
  const r = { changed: [{ url: "https://sos.example/a", where: "A fees", how: "page text" }], broken: [], blocked: [], added: [], unchanged: [] };
  const md = report(r, "2026-10-22");
  assert.match(md, /2026-10-22/);
  assert.match(md, /- \[ \] A fees: https:\/\/sos\.example\/a \(page text\)/);
  assert.match(md, /--update/);
});

test("every state's filing office and every partner price page is watched, with a baseline", () => {
  const src = sources();
  assert.ok(src.size >= 51);
  assert.ok([...src.values()].some((s) => s.kind === "partner" && s.expect.length));
  const snap = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
  for (const url of src.keys()) assert.ok(url in snap, `no baseline entry for ${url}`);
});
