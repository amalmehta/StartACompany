// Picks the formation services that genuinely fit someone's answers and
// renders them with a referral disclosure. Pure functions only, so the app,
// the state-page build and the tests all share them.
//
// Rules that keep the site honest:
// - The official do-it-yourself filing link always comes first; services are
//   an "or", never a replacement.
// - Paid links carry rel="sponsored noopener" and a plain disclosure right
//   above them.
// - If no partner has a referral ID, nothing is shown: no links, no disclosure.

import { PARTNERS, PRICES_CHECKED } from "./data/partners.js";

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

export const DISCLOSURE =
  "Paid links: if you sign up through a link marked “referral”, Start a Company may earn a fee from that company. You don't pay the site anything, and filing yourself through the official link costs only the state fee.";

// The referral link for a partner, or null if it isn't ready to show.
export function referralUrl(p) {
  if (!p || !p.enabled || !p.referral) return null;
  const tpl = String(p.referralTemplate || "").trim();
  const id = String(p.referralId || "").trim();
  if (!/^https:\/\//.test(tpl)) return null;
  if (tpl.includes("{id}")) {
    if (!id) return null;
    return tpl.replaceAll("{id}", encodeURIComponent(id));
  }
  return tpl; // a full link pasted from the partner dashboard
}

export const isLive = (p) => Boolean(referralUrl(p));

// True when at least one paid partner has an ID. With none, partner links are off.
export const anyLive = (partners = PARTNERS) => partners.some(isLive);

// Which situations an answer set is in. c is resolve(answers) from plan.js.
export function situations(c) {
  const s = new Set();
  if (!c || c.isSole) return s;
  if (c.a.nonUS) s.add("nonUS");
  if (c.isCorp && c.formIn === "DE") s.add("deCorp");
  if (c.isLLC) s.add("llc");
  return s;
}

const fits = (p, sit) => p.fits.some((f) => sit.has(f));

// Services that fit, paid partners first, then services with no referral
// program for comparison. Empty unless at least one paid partner fits and is live.
export function servicesFor(sit, partners = PARTNERS) {
  const paid = partners.filter((p) => isLive(p) && fits(p, sit));
  if (!paid.length) return [];
  const free = partners.filter((p) => p.enabled && !p.referral && fits(p, sit));
  return [
    ...paid.map((p) => ({ ...view(p), url: referralUrl(p), sponsored: true })),
    ...free.map((p) => ({ ...view(p), url: p.referralTemplate, sponsored: false })),
  ];
}

const view = (p) => ({ id: p.id, name: p.name, offers: p.offers, price: p.price, priceSource: p.priceSource });

// HTML for a services box. Returns "" for an empty list.
export function servicesHTML(list, { heading = "Or pay a service to file it for you" } = {}) {
  if (!list.length) return "";
  const items = list
    .map((s) => {
      const rel = s.sponsored ? "sponsored noopener" : "noopener";
      const tag = s.sponsored ? '<span class="pill ref">referral</span>' : '<span class="pill">no referral</span>';
      return `<li><a href="${esc(s.url)}" target="_blank" rel="${rel}">${esc(s.name)} ↗<span class="sr-only"> (opens in a new tab)</span></a> ${tag}
          <div class="small">${esc(s.offers)}</div>
          <div class="small muted">${esc(s.price)} (<a href="${esc(s.priceSource)}" target="_blank" rel="noopener">public price<span class="sr-only">, opens in a new tab</span></a>, checked ${esc(PRICES_CHECKED)})</div></li>`;
    })
    .join("");
  return `<div class="services">
        <p class="services-head">${esc(heading)}</p>
        <p class="disclosure small">${esc(DISCLOSURE)}</p>
        <ul>${items}</ul>
      </div>`;
}
