# Instructions

## Use it online

Open **https://amalmehta.github.io/StartACompany/**. Nothing to install.

## Run it locally

You need Python 3 (or any static file server) and, for tests, Node 18+.

```bash
git clone https://github.com/amalmehta/StartACompany.git
cd StartACompany
npm start            # serves at http://localhost:8080
```

ES modules don't load from `file://`, so open the site through the server rather than by double-clicking `index.html`.

## Run the tests

```bash
npm test
```

## How to use it

1. **Your plan** tab: pick your state, then answer the rest. Pick **Not sure** for structure to get a recommendation.
2. Click any step to see why it matters, what it costs, and the official link. Tick the box when it's done.
3. The summary cards show your structure, the state fees to start and each year, and your progress.
4. **Compare states** tab: every state's LLC and corporation fees. Filter by name and click column headers to sort.
5. **Settings** (gear icon, or ⌘, / Ctrl+,): theme, show or hide costs, hide finished steps, expand all details, export or import your plan as JSON, print, or reset.
6. **Feedback** (tab on the right edge): opens a prefilled GitHub issue.

Your answers and progress are saved only in this browser.

## Update the fee data

Edit `src/data/states.js`, bump `DATA_REVIEWED`, and run `npm test`.

## Deploy

The site is published by GitHub Pages from the `main` branch root. Pushing to `main` redeploys it.
