import { test } from "node:test";
import assert from "node:assert/strict";
import { PARTNERS } from "../src/data/partners.js";
import { referralUrl, anyLive, servicesFor, servicesHTML, situations, DISCLOSURE } from "../src/partners.js";
import { buildPlan, resolve } from "../src/plan.js";

// A copy of the config with made-up IDs, so tests never depend on real ones.
const withIds = (ids) => PARTNERS.map((p) => ({ ...p, referralId: ids[p.id] ?? p.referralId }));
const live = withIds({ doola: "test-doola", firstbase: "test-fb", legalzoom: "test-lz" });
const names = (list) => list.map((s) => s.id);

test("every partner has the fields the config promises", () => {
  for (const p of PARTNERS) {
    for (const k of ["id", "name", "offers", "price", "priceSource", "referralTemplate"]) assert.ok(p[k], `${p.id}.${k}`);
    assert.match(p.priceSource, /^https:\/\//, p.id);
    assert.match(p.referralTemplate, /^https:\/\//, p.id);
    assert.equal(typeof p.enabled, "boolean", p.id);
    assert.equal(typeof p.referral, "boolean", p.id);
    assert.ok(p.fits.length && p.fits.every((f) => ["nonUS", "deCorp", "llc"].includes(f)), p.id);
  }
});

test("the shipped config has no referral IDs, so no partner links show", () => {
  for (const p of PARTNERS) assert.equal(p.referralId, "", `${p.id} should ship without an ID`);
  assert.equal(anyLive(), false);
  for (const sit of [["llc"], ["deCorp"], ["nonUS"], ["llc", "nonUS"]]) assert.deepEqual(servicesFor(new Set(sit)), []);
  // ...and the real plan shows none either.
  const plan = buildPlan({ state: "CA", entity: "ccorp", formIn: "DE", nonUS: true });
  assert.ok(plan.steps.every((s) => s.services.length === 0));
});

test("referral URLs fill the {id} placeholder and refuse anything unfinished", () => {
  const p = { enabled: true, referral: true, referralTemplate: "https://example.com/?via={id}", referralId: "a b" };
  assert.equal(referralUrl(p), "https://example.com/?via=a%20b");
  assert.equal(referralUrl({ ...p, referralId: "" }), null);
  assert.equal(referralUrl({ ...p, referralId: "   " }), null);
  assert.equal(referralUrl({ ...p, enabled: false }), null);
  assert.equal(referralUrl({ ...p, referral: false }), null);
  assert.equal(referralUrl({ ...p, referralTemplate: "http://example.com/{id}" }), null);
  // A full link pasted from a dashboard works without an ID.
  assert.equal(referralUrl({ ...p, referralTemplate: "https://example.com/r/abc", referralId: "" }), "https://example.com/r/abc");
});

test("partners only show where they fit the answers", () => {
  const sit = (a) => situations(resolve(a));
  assert.deepEqual(names(servicesFor(sit({ state: "TX", entity: "llc" }), live)), ["legalzoom"]);
  assert.deepEqual(names(servicesFor(sit({ state: "TX", entity: "ccorp", formIn: "DE" }), live)), ["doola", "firstbase", "atlas"]);
  assert.deepEqual(names(servicesFor(sit({ state: "TX", entity: "llc", nonUS: true }), live)), ["doola", "firstbase", "legalzoom", "atlas"]);
  // A C corp formed at home by US founders: nothing fits.
  assert.deepEqual(servicesFor(sit({ state: "TX", entity: "ccorp", formIn: "home" }), live), []);
  // Sole proprietors don't file anything with the state.
  assert.deepEqual(servicesFor(sit({ state: "TX", entity: "sole", nonUS: true }), live), []);
  // A disabled partner never shows, even with an ID.
  const off = live.map((p) => (p.id === "legalzoom" ? { ...p, enabled: false } : p));
  assert.deepEqual(servicesFor(sit({ state: "TX", entity: "llc" }), off), []);
});

test("a service with no referral program only appears next to a live paid partner", () => {
  const onlyAtlas = withIds({});
  assert.deepEqual(servicesFor(new Set(["deCorp"]), onlyAtlas), []);
  const list = servicesFor(new Set(["deCorp"]), live);
  assert.equal(list.at(-1).id, "atlas");
  assert.equal(list.at(-1).sponsored, false);
});

test("paid links are marked sponsored and disclosed right above them", () => {
  const html = servicesHTML(servicesFor(new Set(["deCorp"]), live));
  const paid = html.match(/<a href="[^"]*via=test-doola"[^>]*>/)[0];
  assert.match(paid, /rel="sponsored noopener"/);
  assert.match(paid, /target="_blank"/);
  const atlas = html.match(/<a href="https:\/\/stripe\.com\/atlas"[^>]*>/)[0];
  assert.match(atlas, /rel="noopener"/);
  assert.doesNotMatch(atlas, /sponsored/);
  assert.ok(html.indexOf("may earn a fee") < html.indexOf("test-doola"), "disclosure comes before the links");
  assert.match(DISCLOSURE, /official link/);
  assert.equal(servicesHTML([]), "");
});

test("in the plan, services ride on the filing step after the official link", () => {
  // Swap in live IDs through the real module to exercise buildPlan end to end.
  const original = PARTNERS.map((p) => p.referralId);
  PARTNERS.find((p) => p.id === "legalzoom").referralId = "test-lz";
  try {
    const plan = buildPlan({ state: "OH", entity: "llc" });
    const file = plan.steps.find((s) => s.id === "file");
    assert.deepEqual(names(file.services), ["legalzoom"]);
    assert.match(file.links[0].url, /ohiosos\.gov/);
    for (const s of plan.steps) if (s.id !== "file") assert.deepEqual(s.services, [], s.id);
  } finally {
    PARTNERS.forEach((p, i) => (p.referralId = original[i]));
  }
});
