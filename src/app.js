// Wires the questionnaire, checklist, state table, settings and feedback to
// the pure planning logic in plan.js.

import { buildPlan, progress, DEFAULT_ANSWERS, ENTITY_NAMES } from "./plan.js";
import { STATES, DATA_REVIEWED, stateByCode } from "./data/states.js";
import { load, save, clear, DEFAULT_SETTINGS } from "./store.js";
import { servicesHTML } from "./partners.js";

const REPO = "amalmehta/StartACompany";
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const usd = (n) => `$${n.toLocaleString("en-US")}`;
const extLink = (url, label, cls = "") =>
  `<a href="${esc(url)}" target="_blank" rel="noopener"${cls ? ` class="${cls}"` : ""}>${esc(label)}<span class="sr-only"> (opens in a new tab)</span></a>`;

const ENTITY_HINTS = {
  unsure: "We'll recommend one from your other answers.",
  llc: "Liability protection with light paperwork. Profit passes through to your personal return.",
  ccorp: "Needed to raise venture money or grant stock options. The company pays its own tax.",
  scorp: "An LLC or corporation that elects S corp tax status to save on self-employment tax.",
  sole: "Just you, no filing to form, and no liability protection.",
};

let state = load();
state.answers = { ...DEFAULT_ANSWERS, ...state.answers };
// State pages link here with ?state=XX to start a plan for that state.
const linked = new URLSearchParams(location.search).get("state");
if (linked && stateByCode(linked.toUpperCase())) {
  state.answers.state = linked.toUpperCase();
  save(state);
  history.replaceState(null, "", location.pathname + location.hash);
}
const expanded = new Set(); // step ids whose details are open

function persist() {
  save(state);
}

// ── Theme ──────────────────────────────────────────────────
function applyTheme() {
  const t = state.settings.theme;
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  document.body.classList.toggle("hide-costs", !state.settings.showCosts);
  const dark =
    t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  $('meta[name="theme-color"]').setAttribute("content", dark ? "#121514" : "#f6f4ef");
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

// ── Questionnaire ─────────────────────────────────────────
const form = $("#answers");
const stateSelect = form.elements.state;
for (const s of STATES) stateSelect.add(new Option(s.name, s.code));

function fillForm() {
  const a = state.answers;
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === "radio") el.checked = String(a[el.name]) === el.value;
    else if (el.type === "checkbox") el.checked = Boolean(a[el.name]);
    else el.value = a[el.name] ?? "";
  }
  syncFormHints();
}

function syncFormHints() {
  const a = state.answers;
  $("#formin-field").hidden = a.entity !== "ccorp";
  $("#entity-hint").textContent = ENTITY_HINTS[a.entity] || "";
  $("#formin-hint").textContent =
    a.formIn === "DE" ? "The startup default. You'll also register in your home state." : "Simplest and cheapest if you won't raise money.";
}

form.addEventListener("input", () => {
  const a = { ...state.answers };
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === "radio") {
      if (el.checked) a[el.name] = el.value;
    } else if (el.type === "checkbox") a[el.name] = el.checked;
    else if (el.type === "number") {
      if (el.value === "") continue; // let people clear the box while typing
      a[el.name] = Math.max(1, Math.min(20, parseInt(el.value, 10) || 1));
    } else a[el.name] = el.value;
  }
  state.answers = a;
  syncFormHints();
  persist();
  renderPlan();
});
// Normalise the founders box when it loses focus.
form.elements.founders.addEventListener("blur", (e) => {
  e.target.value = state.answers.founders;
});

$("#jump-plan").addEventListener("click", () => {
  $("#plan").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});

// ── Plan ──────────────────────────────────────────────────
function renderPlan() {
  const plan = buildPlan(state.answers);
  $("#empty").hidden = Boolean(plan);
  $("#plan").hidden = !plan;
  $("#jump-plan").hidden = !plan;
  if (!plan) return;

  $("#s-entity").textContent = plan.entityShort;
  $("#s-where").textContent = plan.foreign
    ? `Formed in ${plan.formState.name}, registered in ${plan.home.name}`
    : plan.entity === "sole"
      ? `In ${plan.home.name}, no state filing`
      : `Formed in ${plan.formState.name}`;
  $("#s-once").textContent = usd(plan.totals.stateOneTime);
  $("#s-once-sub").textContent = plan.publication
    ? `one time, plus ${plan.publication.label} for the newspaper notice`
    : "one time";
  $("#s-year").textContent = usd(plan.totals.stateYearly);
  $("#print-summary").textContent = `${plan.entityName} · ${$("#s-where").textContent} · ${state.answers.founders} founder${state.answers.founders > 1 ? "s" : ""} · printed ${new Date().toLocaleDateString()}`;

  const rec = $("#recommend");
  rec.hidden = !plan.recommended;
  if (plan.recommended) {
    rec.innerHTML = `<strong>Our pick for you: ${esc(plan.entityShort)}.</strong> ${esc(plan.recommended.reason)}`;
  }
  $("#warnings").innerHTML = plan.warnings
    .map((w) => `<div class="note warn" role="note"><strong>Heads up.</strong> ${esc(w)}</div>`)
    .join("");

  const p = progress(plan, state.done);
  $("#s-progress").textContent = `${p.done} of ${p.total}`;
  $("#s-bar").style.width = `${p.pct}%`;
  $("#s-bar").parentElement.setAttribute("aria-valuenow", p.pct);
  $("#done-banner").hidden = !(p.total && p.done === p.total);

  const nextId = plan.steps.find((s) => !s.recurring && !state.done[s.id])?.id;
  const { hideDone, expandAll } = state.settings;
  const html = plan.phases
    .map((ph, i) => {
      const visible = ph.steps.filter((s) => !(hideDone && state.done[s.id]));
      if (!visible.length) return "";
      const n = ph.steps.filter((s) => state.done[s.id]).length;
      return `
      <section class="phase" aria-labelledby="ph-${ph.id}">
        <header class="phase-head">
          <span class="phase-num" aria-hidden="true">${i + 1}</span>
          <h2 id="ph-${ph.id}">${esc(ph.title)}</h2>
          <span class="phase-count" aria-label="${n} of ${ph.steps.length} done">${n}/${ph.steps.length}</span>
        </header>
        <ol class="steps">
          ${visible.map((s) => stepHTML(s, expandAll || expanded.has(s.id), s.id === nextId)).join("")}
        </ol>
      </section>`;
    })
    .join("");
  $("#phases").innerHTML =
    html || `<div class="card empty small-empty"><p>Every step is done and hidden. Turn off <em>Hide finished steps</em> in Settings to see them.</p></div>`;
}

function stepHTML(s, isOpen, isNext) {
  const done = Boolean(state.done[s.id]);
  const links = s.links.map((l) => extLink(l.url, `${l.label} ↗`)).join("");
  const did = `d-${s.id}`;
  return `
  <li class="step${done ? " done" : ""}${isOpen ? " open" : ""}${isNext ? " next" : ""}" data-id="${esc(s.id)}">
    <label class="tick" title="Mark done">
      <input type="checkbox" ${done ? "checked" : ""} aria-label="Mark “${esc(s.title)}” done">
      <span class="box" aria-hidden="true"></span>
    </label>
    <div class="step-main">
      <button class="step-title" aria-expanded="${isOpen}" aria-controls="${did}">
        <span>${esc(s.title)}</span>
        ${isNext ? '<span class="badge">Next</span>' : ""}
        <span class="chev" aria-hidden="true">›</span>
      </button>
      <div class="meta">
        ${s.costLabel ? `<span class="pill cost">${esc(s.costLabel)}</span>` : ""}
        ${s.time ? `<span class="pill">${esc(s.time)}</span>` : ""}
      </div>
      <div class="details" id="${did}">
        <p>${esc(s.body)}</p>
        ${links ? `<div class="links">${links}</div>` : ""}
        ${servicesHTML(s.services || [])}
      </div>
    </div>
  </li>`;
}

$("#phases").addEventListener("click", (e) => {
  const title = e.target.closest(".step-title");
  if (!title) return;
  const li = title.closest(".step");
  const id = li.dataset.id;
  const isOpen = li.classList.toggle("open");
  title.setAttribute("aria-expanded", isOpen);
  if (isOpen) expanded.add(id);
  else expanded.delete(id);
});

$("#phases").addEventListener("change", (e) => {
  if (e.target.type !== "checkbox") return;
  const id = e.target.closest(".step").dataset.id;
  if (e.target.checked) state.done[id] = true;
  else delete state.done[id];
  persist();
  renderPlan();
  // Re-rendering replaces the checkbox; keep keyboard focus where it was.
  const again = $(`.step[data-id="${CSS.escape(id)}"] input`);
  (again || $("#s-progress")).focus?.();
  $("#announce").textContent = `${e.target.checked ? "Done" : "Not done"}. ${$("#s-progress").textContent} setup steps finished.`;
});

$("#expand-all").addEventListener("click", () => {
  const plan = buildPlan(state.answers);
  if (!plan) return;
  const allOpen = plan.steps.every((s) => expanded.has(s.id));
  plan.steps.forEach((s) => (allOpen ? expanded.delete(s.id) : expanded.add(s.id)));
  $("#expand-all").textContent = allOpen ? "Expand all" : "Collapse all";
  renderPlan();
});

// ── State table ───────────────────────────────────────────
let sortKey = "name";
let sortDir = 1;

function renderStates() {
  const q = $("#state-filter").value.trim().toLowerCase();
  const rows = STATES.filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q)
    .slice()
    .sort((x, y) => {
      const a = x[sortKey];
      const b = y[sortKey];
      return (typeof a === "number" ? a - b : String(a).localeCompare(String(b))) * sortDir;
    });
  const per = (s, k) =>
    s.cadence === "none" ? "$0" : `${usd(s[k])}${s.cadence === "biennial" && s[k] ? '<span class="muted"> /2 yrs</span>' : ""}`;
  const home = state.answers.state;
  $("#state-table tbody").innerHTML = rows.length
    ? rows
        .map(
          (s) => `<tr${s.code === home ? ' class="home"' : ""}>
        <th scope="row">${extLink(s.url, s.name)}${s.code === home ? ' <span class="badge">You</span>' : ""}${s.notes ? `<div class="muted small">${esc(s.notes)}</div>` : ""}</th>
        <td class="num">${usd(s.llc)}</td>
        <td class="num">${per(s, "llcAnnual")}</td>
        <td class="num">${usd(s.corp)}</td>
        <td class="num">${per(s, "corpAnnual")}</td>
        <td class="small">${esc(s.due)}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="6" class="muted">No state matches “${esc(q)}”.</td></tr>`;
  $$("#state-table thead th").forEach((th) => {
    const on = th.dataset.k === sortKey;
    th.setAttribute("aria-sort", on ? (sortDir > 0 ? "ascending" : "descending") : "none");
  });
  $("#state-count").textContent = `${rows.length} of ${STATES.length}`;
}

$("#state-filter").addEventListener("input", renderStates);
$$("#state-table thead th button").forEach((btn) =>
  btn.addEventListener("click", () => {
    const k = btn.parentElement.dataset.k;
    if (sortKey === k) sortDir = -sortDir;
    else {
      sortKey = k;
      sortDir = 1;
    }
    renderStates();
  })
);

// ── Pages (hash routing) ──────────────────────────────────
function route() {
  const tab = location.hash === "#states" ? "states" : "plan";
  $("#view-plan").hidden = tab !== "plan";
  $("#view-states").hidden = tab !== "states";
  $$(".tabs a").forEach((a) =>
    a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")
  );
  document.title = tab === "states" ? "State Fees · Start a Company" : "Start a Company";
  if (tab === "states") renderStates();
}
window.addEventListener("hashchange", () => {
  route();
  window.scrollTo(0, 0);
});

// ── Settings ──────────────────────────────────────────────
const settingsDlg = $("#settings");
const sForm = $("#settings-form");

function openSettings() {
  const s = state.settings;
  for (const el of sForm.elements) {
    if (!el.name) continue;
    if (el.type === "radio") el.checked = s[el.name] === el.value;
    else if (el.type === "checkbox") el.checked = Boolean(s[el.name]);
  }
  if (!settingsDlg.open) settingsDlg.showModal();
}

sForm.addEventListener("change", (e) => {
  const el = e.target;
  if (!el.name) return;
  state.settings[el.name] = el.type === "checkbox" ? el.checked : el.value;
  persist();
  applyTheme();
  renderPlan();
});

$("#open-settings").addEventListener("click", openSettings);
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === ",") {
    e.preventDefault();
    openSettings();
  }
});
const shortcut = IS_MAC ? "⌘," : "Ctrl+,";
$("#shortcut-hint").textContent = `Shortcut: ${shortcut}`;
$("#open-settings").title = `Settings (${shortcut})`;

$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ app: "Start a Company", version: 1, ...state }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Start a Company plan.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
});

$("#import").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (!d || typeof d !== "object" || typeof d.answers !== "object") throw new Error("shape");
    if (d.answers.state && !stateByCode(d.answers.state)) throw new Error("state");
    state = {
      answers: { ...DEFAULT_ANSWERS, ...d.answers },
      done: typeof d.done === "object" && d.done ? d.done : {},
      settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
    };
    expanded.clear();
    persist();
    applyTheme();
    fillForm();
    renderPlan();
    openSettings();
    $("#data-status").textContent = "Imported.";
  } catch {
    $("#data-status").textContent = "That file isn't a Start a Company export.";
  }
});

$("#print").addEventListener("click", () => {
  settingsDlg.close();
  if (location.hash === "#states") location.hash = "#plan";
  route();
  setTimeout(() => window.print(), 50);
});

$("#reset").addEventListener("click", () => {
  if (!confirm("Clear your answers, checked-off steps and settings?")) return;
  clear();
  state = { answers: { ...DEFAULT_ANSWERS }, done: {}, settings: { ...DEFAULT_SETTINGS } };
  expanded.clear();
  applyTheme();
  fillForm();
  renderPlan();
  openSettings();
  $("#data-status").textContent = "Everything was reset.";
});

// ── Feedback ──────────────────────────────────────────────
const fbDlg = $("#feedback");
$("#open-feedback").addEventListener("click", () => {
  fbDlg.showModal();
  $("#feedback-text").focus();
});
$("#feedback-send").addEventListener("click", (e) => {
  const text = $("#feedback-text").value.trim();
  if (!text) {
    e.preventDefault();
    $("#feedback-text").focus();
    $("#feedback-text").setAttribute("aria-invalid", "true");
    return;
  }
  const a = state.answers;
  const context =
    $("#feedback-context").checked && a.state
      ? `\nState: ${a.state} · Structure: ${ENTITY_NAMES[a.entity] || "Not sure"}${a.entity === "ccorp" ? ` (${a.formIn === "DE" ? "Delaware" : "home state"})` : ""}`
      : "";
  const body = `${text}\n\n---\nPage: ${location.hash || "#plan"}${context}\nData reviewed: ${DATA_REVIEWED}`;
  const title = `Feedback: ${text.split("\n")[0].slice(0, 60)}`;
  window.open(
    `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
    "_blank",
    "noopener"
  );
  $("#feedback-text").value = "";
  $("#feedback-text").removeAttribute("aria-invalid");
});

// Close dialogs by clicking the backdrop.
for (const dlg of [fbDlg, settingsDlg]) {
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
}

// ── Boot ──────────────────────────────────────────────────
$("#reviewed").textContent = `Fees last reviewed ${DATA_REVIEWED}`;
$("#foot-reviewed").textContent = `State fees last reviewed ${DATA_REVIEWED}.`;
applyTheme();
fillForm();
renderPlan();
route();
document.documentElement.classList.add("ready");
