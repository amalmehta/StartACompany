// Turns a founder's answers into an ordered, personal checklist.
// Pure functions only — no DOM, no storage — so it runs in the browser and in
// Node tests alike.

import { stateByCode } from "./data/states.js";

export const PHASES = [
  { id: "decide", title: "Decide" },
  { id: "form", title: "Form the company" },
  { id: "federal", title: "Register with the IRS" },
  { id: "money", title: "Set up the money" },
  { id: "permits", title: "Licenses, taxes and insurance" },
  { id: "hire", title: "Hire people" },
  { id: "yearly", title: "Stay in good standing (every year)" },
];

export const ENTITY_NAMES = {
  llc: "LLC",
  ccorp: "C corporation",
  scorp: "LLC or corporation taxed as an S corp",
  sole: "Sole proprietorship",
};

export const DEFAULT_ANSWERS = {
  state: "",
  entity: "unsure", // llc | ccorp | scorp | sole | unsure
  formIn: "home", // home | DE  (only matters for C corps)
  raisingVC: false,
  founders: 1,
  hiring: "none", // none | contractors | employees
  salesTax: false,
  regulated: false,
  homeBased: false,
  profitSoon: false, // expects > ~$80k/yr profit soon (S corp question)
};

// Plain-language recommendation for people who pick "not sure".
export function recommendEntity(a) {
  if (a.raisingVC) {
    return {
      entity: "ccorp",
      formIn: "DE",
      reason: "Investors almost always require a Delaware C corporation, because they buy preferred stock and Delaware law is what they know.",
    };
  }
  if (a.profitSoon) {
    return {
      entity: "scorp",
      formIn: "home",
      reason: "With solid profit, an S corp election can save self-employment tax: you pay yourself a reasonable salary and take the rest as distributions.",
    };
  }
  return {
    entity: "llc",
    formIn: "home",
    reason: "An LLC in your home state gives you liability protection with the least paperwork. You can elect S corp taxation later, or convert if you raise money.",
  };
}

// Resolve answers into the facts every step needs.
export function resolve(answers) {
  const a = { ...DEFAULT_ANSWERS, ...answers };
  const rec = recommendEntity(a);
  const entity = a.entity === "unsure" ? rec.entity : a.entity;
  const formIn = entity === "ccorp" ? (a.entity === "unsure" ? rec.formIn : a.formIn) : "home";
  const home = stateByCode(a.state);
  const formState = formIn === "DE" ? stateByCode("DE") : home;
  const foreign = Boolean(home && formState && home.code !== formState.code);
  const isCorp = entity === "ccorp";
  const isLLC = entity === "llc" || entity === "scorp";
  const isSole = entity === "sole";
  const multiOwner = Number(a.founders) > 1;
  return { a, rec, entity, formIn, home, formState, foreign, isCorp, isLLC, isSole, multiOwner };
}

const usd = (n) => (n === 0 ? "Free" : `$${n.toLocaleString("en-US")}`);
const fee = (st, c) => (c.isCorp ? st.corp : st.llc);
const annualFee = (st, c) => (c.isCorp ? st.corpAnnual : st.llcAnnual);

// Each step: id, phase, title, body, cost (number|null), costLabel, time,
// links [{label,url}], when(c) → boolean.
const STEPS = [
  // ── Decide ────────────────────────────────────────────────
  {
    id: "entity",
    phase: "decide",
    title: (c) => `Choose your structure: ${ENTITY_NAMES[c.entity]}`,
    body: (c) =>
      c.a.entity === "unsure"
        ? `Recommended for you: ${c.rec.reason}`
        : {
            llc: "An LLC shields your personal assets from business debts. Profit passes through to your personal return, and the paperwork is light.",
            ccorp: "A C corporation can issue different classes of stock and grant options. It's the standard for raising venture money. Profit is taxed at 21% at the company level.",
            scorp: "You form an LLC (or corporation), then elect S corp tax status with the IRS. It's worth it once profit is high enough that paying yourself a salary saves self-employment tax.",
            sole: "No filing is needed to exist, but there's also no liability protection: business debts and lawsuits can reach your personal assets.",
          }[c.entity],
    time: "An afternoon",
    links: [{ label: "SBA: Choose a business structure", url: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure" }],
    when: () => true,
  },
  {
    id: "where",
    phase: "decide",
    title: (c) => (c.formIn === "DE" ? "Incorporate in Delaware" : `Form in ${c.home.name}`),
    body: (c) =>
      c.formIn === "DE"
        ? `Delaware is the default for venture-backed startups. Because you operate in ${c.home.name}, you'll also register there as a "foreign" corporation, which means two sets of yearly fees.`
        : "Forming where you live and work is the simplest and cheapest option: one state, one annual report, and no foreign registration.",
    time: "Decision",
    links: [],
    when: (c) => c.isCorp,
  },
  {
    id: "name",
    phase: "decide",
    title: () => "Check that your name is free",
    body: (c) =>
      `Search the ${c.formState.name} business-name database and the federal trademark register. A name can be legally available in your state and still infringe someone's trademark.`,
    cost: 0,
    time: "1 hour",
    links: [
      { label: "Secretary of State search", url: (c) => c.formState.url },
      { label: "USPTO trademark search", url: "https://tmsearch.uspto.gov" },
    ],
    when: () => true,
  },

  // ── Form ──────────────────────────────────────────────────
  {
    id: "dba",
    phase: "form",
    title: () => "Register a DBA (if you use a business name)",
    body: () =>
      "If you trade under any name other than your own legal name, register a \"doing business as\" name with your county or state. Banks require it to open an account in that name.",
    cost: 50,
    costLabel: "$10–$100",
    time: "1–2 weeks",
    links: [{ label: "SBA: Register your business name", url: "https://www.sba.gov/business-guide/launch-your-business/choose-your-business-name" }],
    when: (c) => c.isSole,
  },
  {
    id: "agent",
    phase: "form",
    title: () => "Pick a registered agent",
    body: (c) =>
      c.formIn === "DE"
        ? "Delaware requires an agent with a Delaware street address to receive legal papers. Use a commercial agent."
        : `Every LLC and corporation needs an agent with a ${c.formState.name} street address. You can serve as your own if you're reliably there during business hours. A commercial agent keeps your home address off public records.`,
    cost: (c) => (c.formIn === "DE" ? 125 : 0),
    costLabel: (c) => (c.formIn === "DE" ? "$50–$300/yr" : "Free (yourself) to $300/yr"),
    time: "Same day",
    links: [],
    when: (c) => !c.isSole,
  },
  {
    id: "file",
    phase: "form",
    title: (c) =>
      `File ${c.isCorp ? "a Certificate / Articles of Incorporation" : "Articles of Organization"} with ${c.formState.name}`,
    body: (c) =>
      `This is the filing that creates the company. File online with the ${c.formState.name} business filing office. ${c.formState.notes || ""}`.trim(),
    cost: (c) => fee(c.formState, c),
    costLabel: (c) => `${usd(fee(c.formState, c))} state fee`,
    time: "Same day to 2 weeks",
    links: [{ label: (c) => `${c.formState.name} filing office`, url: (c) => c.formState.url }],
    when: (c) => !c.isSole,
  },
  {
    id: "publish",
    phase: "form",
    title: () => "Publish notice of formation",
    body: (c) => `${c.formState.name} requires you to publish a notice in local newspapers after forming. ${c.formState.notes}`,
    cost: (c) => (c.formState.code === "NY" ? 1000 : 150),
    costLabel: (c) => (c.formState.code === "NY" ? "$300–$2,000" : "$50–$300"),
    time: "3–6 weeks",
    links: [{ label: "Details", url: (c) => c.formState.url }],
    when: (c) =>
      !c.isSole &&
      ((c.formState.code === "NY" && c.isLLC) || c.formState.code === "NE" || c.formState.code === "AZ"),
  },
  {
    id: "foreign",
    phase: "form",
    title: (c) => `Register in ${c.home.name} as a foreign company`,
    body: (c) =>
      `Because you're formed in ${c.formState.name} but working from ${c.home.name}, you must also register (\"qualify\") in ${c.home.name}. You'll need a Certificate of Good Standing from ${c.formState.name} first.`,
    cost: (c) => fee(c.home, c),
    costLabel: (c) => `~${usd(fee(c.home, c))} state fee`,
    time: "1–3 weeks",
    links: [{ label: (c) => `${c.home.name} filing office`, url: (c) => c.home.url }],
    when: (c) => c.foreign,
  },
  {
    id: "governing",
    phase: "form",
    title: (c) => (c.isCorp ? "Adopt bylaws and issue founder stock" : "Sign an operating agreement"),
    body: (c) =>
      c.isCorp
        ? "The board adopts bylaws, appoints officers and issues founder shares through a written consent. Founders pay for their shares, usually a few dollars at a tiny par value, and sign stock purchase agreements."
        : c.multiOwner
          ? "This sets out who owns what, how decisions are made, and what happens if someone leaves. Most states don't require one, but every multi-member LLC should have one."
          : "Even for a single owner, it helps prove the LLC is separate from you, and banks often ask for it.",
    cost: 0,
    costLabel: "Free with a template; $500–$2,000 with a lawyer",
    time: "1–3 days",
    links: [],
    when: (c) => !c.isSole,
  },
  {
    id: "founders",
    phase: "form",
    title: () => "Write down the founder deal",
    body: (c) =>
      `With ${c.a.founders} founders, agree in writing on ownership splits, vesting (4 years with a 1-year cliff is standard), roles, and what happens if someone leaves. Each founder should also assign their work and inventions to the company.`,
    cost: 0,
    time: "1 week of conversations",
    links: [{ label: "YC: Founder equity & vesting", url: "https://www.ycombinator.com/library/8h-co-founder-equity-split" }],
    when: (c) => c.multiOwner && !c.isSole,
  },
  {
    id: "ip",
    phase: "form",
    title: () => "Assign IP to the company",
    body: () =>
      "Every founder signs an Intellectual Property Assignment (CIIAA) so code, designs and ideas made before and after formation belong to the company. Investors check this in due diligence.",
    cost: 0,
    time: "1 hour",
    links: [],
    when: (c) => c.isCorp,
  },
  {
    id: "83b",
    phase: "form",
    title: () => "File 83(b) elections — within 30 days",
    body: () =>
      "If founder stock vests over time, each founder mails an 83(b) election to the IRS within 30 days of receiving their shares, using Form 15620 or a written statement. Send it certified mail and keep the receipt. Missing this deadline can mean large tax bills as the shares vest. It cannot be fixed later.",
    cost: 10,
    costLabel: "Postage",
    time: "30-day hard deadline",
    links: [{ label: "IRS Form 15620", url: "https://www.irs.gov/forms-pubs/about-form-15620" }],
    when: (c) => c.isCorp,
  },

  // ── Federal ───────────────────────────────────────────────
  {
    id: "ein",
    phase: "federal",
    title: () => "Get an EIN from the IRS",
    body: (c) =>
      c.isSole
        ? "Optional for a sole proprietor with no employees, but it lets you avoid giving clients your Social Security number. It's free and instant online."
        : "This is your company's tax ID. You need it for the bank, payroll and tax filings. It's free and you get it instantly online. Never pay a site to get one.",
    cost: 0,
    time: "15 minutes",
    links: [{ label: "IRS: Apply for an EIN", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" }],
    when: () => true,
  },
  {
    id: "scorp",
    phase: "federal",
    title: () => "Elect S corp status (Form 2553)",
    body: () =>
      "File within 75 days of forming, or by March 15 for it to apply to the current year. After that, run payroll and pay yourself a reasonable salary.",
    cost: 0,
    time: "75-day deadline",
    links: [{ label: "IRS Form 2553", url: "https://www.irs.gov/forms-pubs/about-form-2553" }],
    when: (c) => c.entity === "scorp",
  },
  {
    id: "boi",
    phase: "federal",
    title: () => "Beneficial ownership (BOI) report: not needed",
    body: () =>
      "Since FinCEN's March 2025 rule, companies formed in the US are exempt from BOI reporting. Only companies formed abroad and registered to do business in the US must file. Ignore letters that say otherwise; they're a common scam.",
    cost: 0,
    time: "No action",
    links: [{ label: "FinCEN BOI", url: "https://www.fincen.gov/boi" }],
    when: (c) => !c.isSole,
  },

  // ── Money ─────────────────────────────────────────────────
  {
    id: "bank",
    phase: "money",
    title: () => "Open a business bank account",
    body: (c) =>
      c.isSole
        ? "Keep business money separate from personal money. Bring your ID, EIN (or SSN) and DBA certificate."
        : "Bring your formation documents, EIN and operating agreement or bylaws. Never mix personal and business money. Mixing them is how owners lose their liability protection.",
    cost: 0,
    time: "1 hour",
    links: [],
    when: () => true,
  },
  {
    id: "books",
    phase: "money",
    title: () => "Set up bookkeeping",
    body: () =>
      "Connect accounting software to the business account from day one and keep every receipt. Your tax return, investors and any audit all start here.",
    cost: 30,
    costLabel: "$0–$50/mo",
    time: "1 hour",
    links: [],
    when: () => true,
  },
  {
    id: "captable",
    phase: "money",
    title: () => "Start a cap table",
    body: () =>
      "Record who owns which shares, options and SAFEs. A spreadsheet works at first; move to cap-table software before your first priced round.",
    cost: 0,
    time: "1 hour",
    links: [],
    when: (c) => c.isCorp,
  },

  // ── Permits ───────────────────────────────────────────────
  {
    id: "local",
    phase: "permits",
    title: () => "Get a city or county business license",
    body: () =>
      "Most cities and counties require a general business license or tax registration, even for online businesses. Check your city's website.",
    cost: 50,
    costLabel: "$0–$150/yr",
    time: "1–2 weeks",
    links: [{ label: "SBA: Licenses & permits", url: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits" }],
    when: () => true,
  },
  {
    id: "home",
    phase: "permits",
    title: () => "Check home-business zoning",
    body: () =>
      "Many cities require a home-occupation permit, especially if customers visit or you store inventory. Also check your lease or HOA rules.",
    cost: 50,
    costLabel: "$0–$100",
    time: "1–2 weeks",
    links: [],
    when: (c) => c.a.homeBased,
  },
  {
    id: "regulated",
    phase: "permits",
    title: (c) => `Get industry licenses in ${c.home.name}`,
    body: () =>
      "Food, alcohol, health care, finance, childcare, construction, real estate, cosmetology and others need state or federal licenses before you operate. Some take months.",
    cost: null,
    costLabel: "Varies widely",
    time: "Weeks to months",
    links: [{ label: "SBA: Federal licenses", url: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits" }],
    when: (c) => c.a.regulated,
  },
  {
    id: "salestax",
    phase: "permits",
    title: (c) => `Register for sales tax in ${c.home.name}`,
    body: (c) =>
      ["DE", "MT", "NH", "OR"].includes(c.home.code)
        ? `${c.home.name} has no statewide sales tax, but you may still owe it in states where you have many customers ("economic nexus").`
        : `Get a seller's permit from the ${c.home.name} revenue department before your first sale, then collect and file on schedule. Selling online into other states can create obligations there too.`,
    cost: 0,
    costLabel: "Usually free",
    time: "1–2 weeks",
    links: [{ label: "SBA: State & local taxes", url: "https://www.sba.gov/business-guide/launch-your-business/register-state-local-taxes" }],
    when: (c) => c.a.salesTax,
  },
  {
    id: "insurance",
    phase: "permits",
    title: () => "Get business insurance",
    body: () =>
      "General liability covers most small businesses. Add professional liability (E&O) if you give advice or build software for clients, and cyber coverage if you hold customer data.",
    cost: 500,
    costLabel: "$300–$1,500/yr",
    time: "1–3 days",
    links: [],
    when: () => true,
  },
  {
    id: "trademark",
    phase: "permits",
    title: () => "Consider a federal trademark",
    body: () =>
      "Registering your name and logo with the USPTO gives nationwide rights. It's optional, but worth it once the brand matters.",
    cost: 350,
    costLabel: "$350 per class (USPTO)",
    time: "8–12 months",
    links: [{ label: "USPTO trademarks", url: "https://www.uspto.gov/trademarks" }],
    when: () => true,
  },

  // ── Hire ──────────────────────────────────────────────────
  {
    id: "contractors",
    phase: "hire",
    title: () => "Paperwork for contractors",
    body: () =>
      "Collect a W-9 before you pay anyone. File Form 1099-NEC by January 31 for anyone you paid $600 or more ($2,000 or more for payments from 2026 on). Use a written contractor agreement that assigns IP to the company.",
    cost: 0,
    time: "Ongoing",
    links: [{ label: "IRS: Form 1099-NEC", url: "https://www.irs.gov/forms-pubs/about-form-1099-nec" }],
    when: (c) => c.a.hiring !== "none",
  },
  {
    id: "payroll",
    phase: "hire",
    title: () => "Set up payroll",
    body: (c) =>
      `Use a payroll provider. It handles withholding, Forms 941/940 and W-2s. Register with ${c.home.name} for withholding tax and unemployment insurance before the first paycheck.`,
    cost: 50,
    costLabel: "$40–$150/mo",
    time: "1 week",
    links: [{ label: "IRS: Employment taxes", url: "https://www.irs.gov/businesses/small-businesses-self-employed/employment-taxes" }],
    when: (c) => c.a.hiring === "employees" || c.entity === "scorp",
  },
  {
    id: "newhire",
    phase: "hire",
    title: () => "New-hire paperwork",
    body: (c) =>
      `For each employee: Form I-9 within 3 days, a W-4, and a report to the ${c.home.name} new-hire registry within 20 days. Also put up the required federal and state labor posters.`,
    cost: 0,
    time: "Per hire",
    links: [{ label: "USCIS: Form I-9", url: "https://www.uscis.gov/i-9" }],
    when: (c) => c.a.hiring === "employees",
  },
  {
    id: "workcomp",
    phase: "hire",
    title: () => "Get workers' compensation insurance",
    body: () => "Required in nearly every state once you have employees.",
    cost: 600,
    costLabel: "$400–$2,000/yr",
    time: "1–3 days",
    links: [],
    when: (c) => c.a.hiring === "employees",
  },

  // ── Yearly ────────────────────────────────────────────────
  {
    id: "annual",
    phase: "yearly",
    title: (c) => `${c.formState.name} ${c.formState.cadence === "biennial" ? "biennial" : "annual"} report`,
    body: (c) =>
      `${c.formState.due}. ${annualFee(c.formState, c) === 0 ? "No fee, but you still have to file." : ""} If you miss it, the state can dissolve the company.`.replace(/\s+/g, " "),
    cost: (c) => annualFee(c.formState, c),
    costLabel: (c) => `${usd(annualFee(c.formState, c))}${c.formState.cadence === "biennial" ? " every 2 years" : "/yr"}`,
    time: "Recurring",
    recurring: true,
    links: [{ label: (c) => `${c.formState.name} filing office`, url: (c) => c.formState.url }],
    when: (c) => !c.isSole && c.formState.cadence !== "none",
  },
  {
    id: "annual-home",
    phase: "yearly",
    title: (c) => `${c.home.name} report for foreign companies`,
    body: (c) => `${c.home.due}. You file this on top of the ${c.formState.name} report.`,
    cost: (c) => annualFee(c.home, c),
    costLabel: (c) => `~${usd(annualFee(c.home, c))}${c.home.cadence === "biennial" ? " every 2 years" : "/yr"}`,
    time: "Recurring",
    recurring: true,
    links: [{ label: (c) => `${c.home.name} filing office`, url: (c) => c.home.url }],
    when: (c) => c.foreign && c.home.cadence !== "none",
  },
  {
    id: "fedreturn",
    phase: "yearly",
    title: (c) =>
      c.isCorp
        ? "Federal corporate return (Form 1120) — Apr 15"
        : c.entity === "scorp"
          ? "S corp return (Form 1120-S) — Mar 15"
          : c.isLLC && c.multiOwner
            ? "Partnership return (Form 1065) — Mar 15"
            : "Schedule C with your personal 1040 — Apr 15",
    body: (c) =>
      c.isCorp
        ? "The company pays 21% federal tax on profit and files even in a loss year. Dates assume a calendar tax year."
        : c.entity === "scorp" || (c.isLLC && c.multiOwner)
          ? "The company files an information return and gives each owner a K-1, which they report on their own returns. The deadline is a month before personal returns."
          : "Business profit is reported on your personal return, plus 15.3% self-employment tax.",
    cost: null,
    costLabel: "CPA: $500–$3,000",
    time: "Recurring",
    recurring: true,
    links: [{ label: "IRS: Business taxes", url: "https://www.irs.gov/businesses/small-businesses-self-employed/business-taxes" }],
    when: () => true,
  },
  {
    id: "estimated",
    phase: "yearly",
    title: () => "Quarterly estimated taxes",
    body: (c) =>
      c.isCorp
        ? "Due Apr 15, Jun 15, Sep 15 and Dec 15 once the company expects to owe $500 or more."
        : "Due Apr 15, Jun 15, Sep 15 and Jan 15 on your share of the profit. Use Form 1040-ES.",
    cost: null,
    costLabel: "Depends on profit",
    time: "Recurring",
    recurring: true,
    links: [{ label: "IRS: Estimated taxes", url: "https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes" }],
    when: () => true,
  },
  {
    id: "minutes",
    phase: "yearly",
    title: () => "Hold the annual board and shareholder meeting",
    body: () =>
      "Elect directors, approve major decisions, and keep written minutes or consents. Skipping this weakens your liability protection.",
    cost: 0,
    time: "Recurring",
    recurring: true,
    links: [],
    when: (c) => c.isCorp,
  },
];

const val = (v, c) => (typeof v === "function" ? v(c) : v);

// Build the plan for a set of answers. Returns null until a state is chosen.
export function buildPlan(answers) {
  const c = resolve(answers);
  if (!c.home || !c.formState) return null;

  const steps = STEPS.filter((s) => s.when(c)).map((s) => {
    const cost = val(s.cost, c);
    return {
      id: s.id,
      phase: s.phase,
      title: val(s.title, c),
      body: val(s.body, c),
      cost: cost === undefined ? null : cost,
      costLabel: val(s.costLabel, c) ?? (cost === 0 ? "Free" : cost == null ? "" : usd(cost)),
      time: val(s.time, c),
      recurring: Boolean(s.recurring),
      links: (s.links || []).map((l) => ({ label: val(l.label, c), url: val(l.url, c) })),
    };
  });

  const phases = PHASES.map((p) => ({ ...p, steps: steps.filter((s) => s.phase === p.id) })).filter(
    (p) => p.steps.length
  );

  // State fees only — the numbers people most often get wrong.
  let stateOneTime = 0;
  let stateYearly = 0;
  if (!c.isSole) {
    stateOneTime += fee(c.formState, c);
    if (c.foreign) stateOneTime += fee(c.home, c);
    const perYear = (st) => {
      const f = annualFee(st, c);
      if (st.cadence === "biennial") return f / 2;
      if (st.cadence === "none") return 0;
      return f;
    };
    stateYearly += perYear(c.formState);
    if (c.foreign) stateYearly += perYear(c.home);
  }

  return {
    entity: c.entity,
    entityName: ENTITY_NAMES[c.entity],
    recommended: c.a.entity === "unsure" ? c.rec : null,
    formState: c.formState,
    home: c.home,
    foreign: c.foreign,
    phases,
    steps,
    totals: { stateOneTime, stateYearly: Math.round(stateYearly) },
  };
}

export function progress(plan, done) {
  if (!plan) return { done: 0, total: 0, pct: 0 };
  const setup = plan.steps.filter((s) => !s.recurring);
  const n = setup.filter((s) => done[s.id]).length;
  return { done: n, total: setup.length, pct: setup.length ? Math.round((n / setup.length) * 100) : 0 };
}
