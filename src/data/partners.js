// Formation services the site can refer people to, and the only place their
// referral IDs live. The site earns a referral fee when someone signs up
// through one of these links; founders never pay the site anything.
//
// Each partner:
//   id, name: shown on the page.
//   offers: one plain sentence on what you get.
//   price: the public price, in words, and priceSource: where it was checked
//     (PRICES_CHECKED below). npm run check-sources watches these pages.
//   referralTemplate: the link with {id} where the referral ID goes. If the
//     partner dashboard hands you a full link instead, paste it here and leave
//     the {id} out.
//   referralId: paste the ID from the partner dashboard. Empty = not live.
//   enabled: false switches a partner off without deleting its ID.
//   fits: which answers it genuinely suits (see fitsPartner in src/partners.js):
//     "nonUS"   some founders live outside the US
//     "deCorp"  a Delaware C corporation
//     "llc"     an LLC (including an LLC taxed as an S corp)
//   referral: false for a service with no referral program. It is listed for
//     comparison next to paid partners, with a plain link and no fee to the site.
//
// A partner link only appears when enabled is true AND referralId is filled in
// (or the template is a full link with no {id}). With no IDs, the site shows
// no partner links and no disclosure at all.

export const PRICES_CHECKED = "2026-10-22";

export const PARTNERS = [
  {
    id: "doola",
    name: "doola",
    offers: "Forms a US LLC or C corp from anywhere, with an EIN, registered agent and US business address. Built for founders outside the US.",
    price: "Starter $297/yr plus state fees",
    priceSource: "https://www.doola.com/pricing/",
    program: "PartnerStack",
    referralTemplate: "https://www.doola.com/?via={id}",
    referralId: "",
    enabled: true,
    referral: true,
    fits: ["nonUS", "deCorp"],
  },
  {
    id: "firstbase",
    name: "Firstbase",
    offers: "Forms a Delaware or Wyoming company with an expedited EIN, and helps open a US bank account. Works for founders in any country.",
    price: "Start $399 one time plus a registered agent (often discounted)",
    priceSource: "https://www.firstbase.io/pricing",
    program: "Firstbase referral partner program (Impact)",
    referralTemplate: "https://get.firstbase.io/{id}",
    referralId: "",
    enabled: true,
    referral: true,
    fits: ["nonUS", "deCorp"],
  },
  {
    id: "legalzoom",
    name: "LegalZoom",
    offers: "Files your LLC's Articles of Organization in any state. Paid tiers add an EIN, operating agreement and faster filing.",
    price: "Basic $0, Pro $249, Premium $299, each plus state fees",
    priceSource: "https://www.legalzoom.com/business/business-formation/llc-overview.html",
    program: "CJ Affiliate",
    referralTemplate: "https://www.legalzoom.com/business/business-formation/llc-overview.html?{id}",
    referralId: "",
    enabled: true,
    referral: true,
    fits: ["llc"],
  },
  {
    id: "atlas",
    name: "Stripe Atlas",
    offers: "Forms a Delaware C corp or LLC with an EIN, founder stock and 83(b) filing, from anywhere.",
    price: "$500 one time, then $100/yr registered agent from year two",
    priceSource: "https://stripe.com/atlas",
    program: null,
    referralTemplate: "https://stripe.com/atlas",
    referralId: "",
    enabled: true,
    referral: false,
    fits: ["nonUS", "deCorp"],
  },
];
