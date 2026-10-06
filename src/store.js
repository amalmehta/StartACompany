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
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return {
        answers: d.answers || {},
        done: d.done || {},
        settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
      };
    }
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
  return { answers: {}, done: {}, settings: { ...DEFAULT_SETTINGS } };
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
