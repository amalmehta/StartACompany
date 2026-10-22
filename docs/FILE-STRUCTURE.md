# File Structure

```
StartACompany/
├── index.html              Page shell: tabs, questionnaire, plan, state table, dialogs, import map
├── styles.css              All styles, with light/dark tokens, responsive, print and reduced-motion rules
├── package.json            npm start / build / test / check-links / check-sources
├── terms.html              Generated: terms of use (template for legal review)
├── privacy.html            Generated: privacy page (template for legal review)
├── sitemap.xml, robots.txt Generated: every page's URL for search engines
├── states/                 Generated: index.html plus <state>/index.html for 50 states + DC
├── content/
│   ├── terms.html          Text of the terms page (edit here, then npm run build)
│   └── privacy.html        Text of the privacy page
├── .nojekyll               Tells GitHub Pages to serve files as-is
├── start_a_company.md      Project brief, assumptions and changelog
├── src/
│   ├── app.js              UI controller: rendering, events, settings, feedback, routing
│   ├── plan.js             Pure planning logic: step catalogue, warnings, totals
│   ├── store.js            Guarded localStorage load/save/clear
│   ├── partners.js         Which formation services fit, referral URLs, disclosure HTML
│   └── data/
│       ├── states.js       Fees, foreign fees, due dates and links for 50 states + DC
│       └── partners.js     Partner config: offer, public price, referral template and ID
├── scripts/
│   ├── serve.mjs           No-cache local dev server (redirects folders to a trailing slash, like Pages)
│   ├── check-links.mjs     Checks every official, partner-price and live referral link
│   ├── site.mjs            Builds the state pages, legal pages, sitemap and head URLs (pure)
│   ├── build-pages.mjs     npm run build: writes those files, or --check that they're current
│   ├── check-sources.mjs   npm run check-sources: fingerprints each fee source, reports changes
│   └── source-snapshots.json  Stored Last-Modified and text hash per source URL
├── tests/
│   ├── plan.test.js        Node tests for plan.js, states.js and the import map
│   ├── partners.test.js    Partner fit, referral URLs, rel="sponsored", disclosure, no-ID default
│   ├── site.test.js        Generated pages: freshness, titles, relative links, sitemap, base URL
│   └── sources.test.js     Source fingerprints, change detection and the issue report
├── .github/workflows/
│   ├── test.yml            Runs the tests on every push and pull request
│   └── weekly-check.yml    Mondays: tests, links, fee sources; opens an issue on problems
└── docs/
    ├── INSTRUCTIONS.md     Setup, run, use, update data, deploy
    ├── SYSTEM-DESIGN.md    Architecture, flows, decisions, limits
    ├── FILE-STRUCTURE.md   This file
    ├── GO-LIVE.md          Owner-only steps: lawyer review, partner IDs, domain, weekly check
    ├── IMPROVEMENTS.md     Log of the 2026-10-11 review
    └── images/             README screenshots
```

Where to change things:

- **A rule, step or warning**: `STEPS` and `warnings()` in `src/plan.js`. Add a test.
- **A fee, due date or link**: `src/data/states.js`, then `npm run build`, `npm run check-links` and `npm run check-sources -- --update`.
- **A partner, its price or referral ID**: `src/data/partners.js`, then `npm run build`. See `docs/GO-LIVE.md`.
- **Terms or privacy wording**: `content/*.html`, then `npm run build`.
- **State page layout**: `statePage()` in `scripts/site.mjs`, then `npm run build`.
- **Look and feel**: `styles.css`. Colors are the variables at the top.
- **Before deploying JS or CSS changes**: bump `?v=` in `index.html` and `ASSET_VERSION` in `scripts/site.mjs`, then `npm run build`.
