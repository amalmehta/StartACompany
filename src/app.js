// Wires the questionnaire, checklist, state table, settings and feedback to
// the pure planning logic in plan.js.

import { buildPlan, progress, DEFAULT_ANSWERS } from "./plan.js";
import { STATES, DATA_REVIEWED } from "./data/states.js";
import { load, save, clear, DEFAULT_SETTINGS } from "./store.js";

const REPO = "amalmehta/StartACompany";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const usd = (n) => (n === 0 ? "$0" : `$${n.toLocaleString("en-US")}`);

let state = load();
state.answers = { ...DEFAULT_ANSWERS, ...state.answers };
const open = new Set(); // step ids whose details are expanded

function persist() {
  save(state);
}

// ── Theme ──────────────────────────────────────────────────
function applyTheme() {
  const t = state.settings.theme;
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  document.body.classList.toggle("hide-costs", !state.settings.showCosts);
}

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
  syncFormVisibility();
}

function syncFormVisibility() {
  $("#formin-field").hidden = state.answers.entity !== "ccorp";
}

form.addEventListener("input", () => {
  const a = { ...state.answers };
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === "radio") {
      if (el.checked) a[el.name] = el.value;
    } else if (el.type === "checkbox") a[el.name] = el.checked;
    else if (el.type === "number") a[el.name] = Math.max(1, Math.min(20, parseInt(el.value, 10) || 1));
    else a[el.name] = el.value;
  }
  state.answers = a;
  syncFormVisibility();
  persist();
  renderPlan();
});

// ── Plan ──────────────────────────────────────────────────
function renderPlan() {
  const plan = buildPlan(state.answers);
  $("#empty").hidden = Boolean(plan);
  $("#plan").hidden = !plan;
  if (!plan) return;

  $("#s-entity").textContent = plan.entityName;
  $("#s-where").textContent = plan.foreign
    ? `Formed in ${plan.formState.name}, registered in ${plan.home.name}`
    : `Formed in ${plan.formState.name}`;
  $("#s-once").textContent = usd(plan.totals.stateOneTime);
  $("#s-year").textContent = usd(plan.totals.stateYearly);
  renderProgress(plan);

  const rec = $("#recommend");
  rec.hidden = !plan.recommended;
  if (plan.recommended) {
    rec.innerHTML = `<strong>Our pick for you: ${esc(plan.entityName)}.</strong> ${esc(plan.recommended.reason)}`;
  }

  const { hideDone, expandAll } = state.settings;
  $("#phases").innerHTML = plan.phases
    .map((ph, i) => {
      const visible = ph.steps.filter((s) => !(hideDone && state.done[s.id]));
      if (!visible.length) return "";
      const n = ph.steps.filter((s) => state.done[s.id]).length;
      return `
      <section class="phase">
        <header class="phase-head">
          <span class="phase-num">${i + 1}</span>
          <h2>${esc(ph.title)}</h2>
          <span class="phase-count">${n}/${ph.steps.length}</span>
        </header>
        <ol class="steps">
          ${visible.map((s) => stepHTML(s, expandAll || open.has(s.id))).join("")}
        </ol>
      </section>`;
    })
    .join("");
}

function stepHTML(s, expanded) {
  const done = Boolean(state.done[s.id]);
  const links = s.links
    .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`)
    .join("");
  return `
  <li class="step${done ? " done" : ""}${expanded ? " open" : ""}" data-id="${esc(s.id)}">
    <label class="tick" title="Mark done">
      <input type="checkbox" ${done ? "checked" : ""} aria-label="Mark “${esc(s.title)}” done">
      <span class="box" aria-hidden="true"></span>
    </label>
    <div class="step-main">
      <button class="step-title" aria-expanded="${expanded}">
        <span>${esc(s.title)}</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
      <div class="meta">
        ${s.costLabel ? `<span class="pill cost">${esc(s.costLabel)}</span>` : ""}
        ${s.time ? `<span class="pill">${esc(s.time)}</span>` : ""}
      </div>
      <div class="details">
        <p>${esc(s.body)}</p>
        ${links ? `<div class="links">${links}</div>` : ""}
      </div>
    </div>
  </li>`;
}

function renderProgress(plan) {
  const p = progress(plan, state.done);
  $("#s-progress").textContent = `${p.done} of ${p.total}`;
  $("#s-bar").style.width = `${p.pct}%`;
}

$("#phases").addEventListener("click", (e) => {
  const title = e.target.closest(".step-title");
  if (!title) return;
  const li = title.closest(".step");
  const id = li.dataset.id;
  const isOpen = li.classList.toggle("open");
  title.setAttribute("aria-expanded", isOpen);
  if (isOpen) open.add(id);
  else open.delete(id);
});

$("#phases").addEventListener("change", (e) => {
  if (e.target.type !== "checkbox") return;
  const id = e.target.closest(".step").dataset.id;
  if (e.target.checked) state.done[id] = true;
  else delete state.done[id];
  persist();
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
  const per = (s, k) => `${usd(s[k])}${s.cadence === "biennial" && s[k] ? '<span class="muted"> /2 yrs</span>' : ""}`;
  $("#state-table tbody").innerHTML = rows
    .map(
      (s) => `<tr>
        <td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>${s.notes ? `<div class="muted small">${esc(s.notes)}</div>` : ""}</td>
        <td class="num">${usd(s.llc)}</td>
        <td class="num">${s.cadence === "none" ? "$0" : per(s, "llcAnnual")}</td>
        <td class="num">${usd(s.corp)}</td>
        <td class="num">${s.cadence === "none" ? "$0" : per(s, "corpAnnual")}</td>
        <td class="small">${esc(s.due)}</td>
      </tr>`
    )
    .join("");
  $$("#state-table th").forEach((th) => {
    th.classList.toggle("sorted", th.dataset.k === sortKey);
    th.dataset.dir = sortDir > 0 ? "asc" : "desc";
  });
}

$("#state-filter").addEventListener("input", renderStates);
$$("#state-table th").forEach((th) =>
  th.addEventListener("click", () => {
    if (sortKey === th.dataset.k) sortDir = -sortDir;
    else {
      sortKey = th.dataset.k;
      sortDir = 1;
    }
    renderStates();
  })
);

// ── Tabs (hash routing) ───────────────────────────────────
function route() {
  const tab = location.hash === "#states" ? "states" : "plan";
  $("#view-plan").hidden = tab !== "plan";
  $("#view-states").hidden = tab !== "states";
  $$(".tabs a").forEach((a) => a.setAttribute("aria-selected", a.dataset.tab === tab));
}
window.addEventListener("hashchange", route);

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

$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Start a Company plan.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#import").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    state = {
      answers: { ...DEFAULT_ANSWERS, ...(d.answers || {}) },
      done: d.done || {},
      settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
    };
    persist();
    applyTheme();
    fillForm();
    renderPlan();
    openSettings();
  } catch {
    alert("That file isn't a Start a Company export.");
  }
  e.target.value = "";
});

$("#print").addEventListener("click", () => {
  settingsDlg.close();
  location.hash = "#plan";
  route();
  document.body.classList.add("printing");
  window.print();
  document.body.classList.remove("printing");
});

$("#reset").addEventListener("click", () => {
  if (!confirm("Clear your answers, checked-off steps and settings?")) return;
  clear();
  state = { answers: { ...DEFAULT_ANSWERS }, done: {}, settings: { ...DEFAULT_SETTINGS } };
  open.clear();
  applyTheme();
  fillForm();
  renderPlan();
  openSettings();
});

// ── Feedback ──────────────────────────────────────────────
const fbDlg = $("#feedback");
$("#open-feedback").addEventListener("click", () => fbDlg.showModal());
$("#feedback-send").addEventListener("click", () => {
  const text = $("#feedback-text").value.trim();
  const body = `${text || "(describe the issue)"}\n\n---\nPage: ${location.pathname}${location.hash}`;
  const url = `https://github.com/${REPO}/issues/new?title=${encodeURIComponent("Feedback: " + (text.split("\n")[0].slice(0, 60) || "Start a Company"))}&body=${encodeURIComponent(body)}`;
  window.open(url, "_blank", "noopener");
  $("#feedback-text").value = "";
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
renderStates();
route();
