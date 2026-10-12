import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan, progress, recommendEntity, foreignFee, resolve } from "../src/plan.js";
import { STATES, stateByCode } from "../src/data/states.js";

const ids = (plan) => plan.steps.map((s) => s.id);

test("state data covers all 50 states plus DC with sane values", () => {
  assert.equal(STATES.length, 51);
  assert.equal(new Set(STATES.map((s) => s.code)).size, 51);
  for (const s of STATES) {
    for (const k of ["llc", "corp", "llcAnnual", "corpAnnual", "foreignLlc", "foreignCorp"]) {
      assert.ok(Number.isFinite(s[k]) && s[k] >= 0, `${s.code}.${k}`);
    }
    assert.ok(["annual", "biennial", "none"].includes(s.cadence), s.code);
    assert.match(s.url, /^https:\/\//, s.code);
    assert.ok(s.name && s.due, s.code);
  }
});

test("no plan until a state is picked", () => {
  assert.equal(buildPlan({}), null);
});

test("VC-backed founders get a Delaware C corp with foreign registration", () => {
  const plan = buildPlan({ state: "CA", entity: "unsure", raisingVC: true, founders: 2 });
  assert.equal(plan.entity, "ccorp");
  assert.equal(plan.formState.code, "DE");
  assert.ok(plan.foreign);
  for (const id of ["foreign", "83b", "ip", "founders", "captable", "annual", "annual-home", "minutes"]) {
    assert.ok(ids(plan).includes(id), id);
  }
  // DE corp $109 + CA foreign corp $100 one-time; DE $450 + CA $825 yearly
  assert.deepEqual(plan.totals, { stateOneTime: 209, stateYearly: 1275 });
});

test("C corp formed at home has no foreign registration", () => {
  const plan = buildPlan({ state: "TX", entity: "ccorp", formIn: "home" });
  assert.equal(plan.formState.code, "TX");
  assert.ok(!plan.foreign);
  assert.ok(!ids(plan).includes("foreign"));
});

test("solo LLC skips corporate-only steps", () => {
  const plan = buildPlan({ state: "WY", entity: "llc" });
  const s = ids(plan);
  for (const id of ["83b", "captable", "minutes", "founders", "foreign", "dba"]) assert.ok(!s.includes(id), id);
  assert.ok(s.includes("file") && s.includes("ein"));
  assert.match(plan.steps.find((x) => x.id === "fedreturn").title, /Schedule C/);
  assert.deepEqual(plan.totals, { stateOneTime: 100, stateYearly: 60 });
});

test("multi-member LLC files a partnership return", () => {
  const plan = buildPlan({ state: "OR", entity: "llc", founders: 3 });
  assert.match(plan.steps.find((x) => x.id === "fedreturn").title, /1065/);
});

test("sole proprietor: DBA, no state formation fees", () => {
  const plan = buildPlan({ state: "FL", entity: "sole" });
  const s = ids(plan);
  assert.ok(s.includes("dba"));
  for (const id of ["file", "agent", "annual", "boi"]) assert.ok(!s.includes(id), id);
  assert.deepEqual(plan.totals, { stateOneTime: 0, stateYearly: 0 });
});

test("S corp gets Form 2553 and payroll", () => {
  const plan = buildPlan({ state: "GA", entity: "scorp" });
  assert.ok(ids(plan).includes("scorp"));
  assert.ok(ids(plan).includes("payroll"));
});

test("publication step only where required", () => {
  assert.ok(ids(buildPlan({ state: "NY", entity: "llc" })).includes("publish"));
  assert.ok(!ids(buildPlan({ state: "NY", entity: "ccorp" })).includes("publish"));
  assert.ok(ids(buildPlan({ state: "NE", entity: "llc" })).includes("publish"));
  assert.ok(!ids(buildPlan({ state: "CO", entity: "llc" })).includes("publish"));
});

test("biennial fees are averaged per year; no-report states add nothing", () => {
  assert.equal(buildPlan({ state: "DC", entity: "llc" }).totals.stateYearly, 150);
  const oh = buildPlan({ state: "OH", entity: "llc" });
  assert.equal(oh.totals.stateYearly, 0);
  assert.ok(!ids(oh).includes("annual"));
});

test("optional situations add their steps", () => {
  const plan = buildPlan({ state: "IL", entity: "llc", hiring: "employees", salesTax: true, regulated: true, homeBased: true });
  for (const id of ["contractors", "payroll", "newhire", "workcomp", "salestax", "regulated", "home"]) {
    assert.ok(ids(plan).includes(id), id);
  }
});

test("recommendation logic", () => {
  assert.equal(recommendEntity({ raisingVC: true }).entity, "ccorp");
  assert.equal(recommendEntity({ profitSoon: true }).entity, "scorp");
  assert.equal(recommendEntity({}).entity, "llc");
});

test("every state produces a complete plan for every entity", () => {
  for (const st of STATES) {
    for (const entity of ["llc", "ccorp", "scorp", "sole", "unsure"]) {
      const plan = buildPlan({ state: st.code, entity, founders: 2, hiring: "employees", salesTax: true });
      for (const s of plan.steps) {
        assert.ok(s.title && typeof s.title === "string", `${st.code}/${entity}/${s.id} title`);
        assert.ok(s.body && !/undefined|null|NaN/.test(s.body + s.title + s.costLabel), `${st.code}/${entity}/${s.id}`);
        for (const l of s.links) assert.match(l.url, /^https:\/\//);
      }
    }
  }
});

test("progress counts setup steps only", () => {
  const plan = buildPlan({ state: "WA", entity: "llc" });
  const p0 = progress(plan, {});
  assert.equal(p0.done, 0);
  assert.ok(p0.total < plan.steps.length);
  const p1 = progress(plan, { ein: true, bank: true, annual: true });
  assert.equal(p1.done, 2);
  assert.equal(stateByCode("ZZ"), null);
});

test("foreign registration uses the home state's foreign fee, not its domestic fee", () => {
  const plan = buildPlan({ state: "TX", entity: "ccorp", formIn: "DE" });
  const step = plan.steps.find((x) => x.id === "foreign");
  assert.equal(step.cost, 750);
  assert.equal(plan.totals.stateOneTime, 109 + 750);
  // Falls back to the domestic fee if a state has no foreign figure.
  const c = resolve({ state: "TX", entity: "llc" });
  assert.equal(foreignFee({ llc: 42, corp: 43 }, c), 42);
});

test("conflicting answers produce warnings", () => {
  assert.equal(buildPlan({ state: "CO", entity: "scorp", raisingVC: true }).warnings.length, 1);
  assert.equal(buildPlan({ state: "CO", entity: "llc", raisingVC: true }).warnings.length, 1);
  assert.match(buildPlan({ state: "CO", entity: "sole", founders: 2 }).warnings[0], /general partnership/);
  assert.equal(buildPlan({ state: "CO", entity: "unsure", raisingVC: true }).warnings.length, 0);
  assert.equal(buildPlan({ state: "CO", entity: "llc" }).warnings.length, 0);
});

test("newspaper publication is exposed for the summary card", () => {
  assert.match(buildPlan({ state: "NY", entity: "llc" }).publication.label, /2,000/);
  assert.equal(buildPlan({ state: "GA", entity: "ccorp" }).publication.cost, 40);
  assert.equal(buildPlan({ state: "GA", entity: "llc" }).publication, null);
  assert.equal(buildPlan({ state: "CO", entity: "llc" }).publication, null);
});

test("recurring filings follow hiring and sales-tax answers", () => {
  const busy = ids(buildPlan({ state: "IL", entity: "llc", hiring: "employees", salesTax: true }));
  for (const id of ["payroll-filings", "1099s", "salestax-returns"]) assert.ok(busy.includes(id), id);
  const quiet = ids(buildPlan({ state: "IL", entity: "llc" }));
  for (const id of ["payroll-filings", "1099s", "salestax-returns"]) assert.ok(!quiet.includes(id), id);
  // No statewide sales tax in Oregon, so no recurring returns there.
  assert.ok(!ids(buildPlan({ state: "OR", entity: "llc", salesTax: true })).includes("salestax-returns"));
});

test("sole proprietors with employees must get an EIN", () => {
  const ein = (h) => buildPlan({ state: "FL", entity: "sole", hiring: h }).steps.find((x) => x.id === "ein").body;
  assert.match(ein("none"), /Optional/);
  assert.match(ein("employees"), /Required/);
});

test("Delaware's yearly filing is named for what it is", () => {
  assert.match(buildPlan({ state: "CA", entity: "ccorp", formIn: "DE" }).steps.find((x) => x.id === "annual").title, /franchise tax/);
  assert.match(buildPlan({ state: "DE", entity: "llc" }).steps.find((x) => x.id === "annual").title, /LLC tax/);
  assert.match(buildPlan({ state: "CA", entity: "ccorp", formIn: "DE" }).steps.find((x) => x.id === "annual").body, /Assumed Par Value/);
});

test("states with no recurring report skip the yearly report step", () => {
  for (const code of ["AL", "OH"]) assert.ok(!ids(buildPlan({ state: code, entity: "llc" })).includes("annual"), code);
});

test("short entity names fit the summary card", () => {
  for (const entity of ["llc", "ccorp", "scorp", "sole"]) {
    assert.ok(buildPlan({ state: "WA", entity }).entityShort.length <= 16, entity);
  }
});

test("state URLs are unique per state and official-looking", () => {
  for (const s of STATES) assert.doesNotMatch(s.url, /harborcompliance|llcuniversity|zenbusiness|legalzoom/, s.code);
});

test("index.html import map versions every browser module", async () => {
  const fs = await import("node:fs/promises");
  const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
  const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  const versions = new Set();
  for (const f of ["app.js", "plan.js", "store.js", "data/states.js"]) {
    const v = map[`./src/${f}`];
    assert.ok(v, f);
    versions.add(v.split("?v=")[1]);
  }
  assert.equal(versions.size, 1, "all modules share one version");
  assert.ok(html.includes(`styles.css?v=${[...versions][0]}`), "stylesheet uses the same version");
});
