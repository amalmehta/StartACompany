# File Structure

```
StartACompany/
├── index.html            Page shell: tabs, questionnaire, plan, state table, dialogs
├── styles.css            All styles, with light/dark tokens, responsive and print rules
├── package.json          `npm start` (local server) and `npm test`
├── start_a_company.md    Project brief and changelog
├── src/
│   ├── app.js            UI controller: rendering, events, settings, feedback, routing
│   ├── plan.js           Pure planning logic and the step catalogue
│   ├── store.js          Guarded localStorage load/save/clear
│   └── data/
│       └── states.js     Fees, due dates and links for 50 states + DC
├── tests/
│   └── plan.test.js      Node tests for plan.js and states.js
└── docs/
    ├── INSTRUCTIONS.md   Setup, run and use
    ├── SYSTEM-DESIGN.md  Architecture, flows, decisions, limits
    ├── FILE-STRUCTURE.md This file
    └── images/           README screenshots
```

Where to change things:

- **A rule or step**: the `STEPS` array in `src/plan.js`. Add a test in `tests/plan.test.js`.
- **A fee or due date**: `src/data/states.js`.
- **Look and feel**: `styles.css`. Colors are the variables at the top.
