// Browser storage for answers, checked-off steps and settings.
// Everything stays in this browser; storage can be blocked (private mode),
// so every access is guarded and the app works without it.

const KEY = "start-a-company:v1";

export const DEFAULT_SETTINGS = {
  theme: "system", // system | light | dark
  showCosts: true,
  hideDone: false,
  expandAll: false,
};

export function load() {
  let d = {};
  try {
    d = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
  return {
    answers: d.answers || {},
    done: d.done || {},
    settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
  };
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function clear() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
