# File Structure

```
StartACompany/
├── index.html              Page shell: tabs, questionnaire, plan, state table, dialogs, import map
├── styles.css              All styles, with light/dark tokens, responsive, print and reduced-motion rules
├── package.json            npm start / test / check-links
├── .nojekyll               Tells GitHub Pages to serve files as-is
├── start_a_company.md      Project brief, assumptions and changelog
├── src/
│   ├── app.js              UI controller: rendering, events, settings, feedback, routing
│   ├── plan.js             Pure planning logic: step catalogue, warnings, totals
│   ├── store.js            Guarded localStorage load/save/clear
│   └── data/
│       └── states.js       Fees, foreign fees, due dates and links for 50 states + DC
├── scripts/
│   ├── serve.mjs           No-cache local dev server
│   └── check-links.mjs     Checks every official link the site shows
├── tests/
│   └── plan.test.js        Node tests for plan.js, states.js and the import map
├── .github/workflows/
│   └── test.yml            Runs the tests on every push and pull request
└── docs/
    ├── INSTRUCTIONS.md     Setup, run, use, update data, deploy
    ├── SYSTEM-DESIGN.md    Architecture, flows, decisions, limits
    ├── FILE-STRUCTURE.md   This file
    ├── IMPROVEMENTS.md     Log of the 2026-10-11 review
    └── images/             README screenshots
```

Where to change things:

- **A rule, step or warning**: `STEPS` and `warnings()` in `src/plan.js`. Add a test.
- **A fee, due date or link**: `src/data/states.js`, then run `npm run check-links`.
- **Look and feel**: `styles.css`. Colors are the variables at the top.
- **Before deploying JS or CSS changes**: bump `?v=` in `index.html`.
