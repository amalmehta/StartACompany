# Instructions

## Use it online

Open **https://amalmehta.github.io/StartACompany/**. Nothing to install.

## Run it locally

You need Node 20 or newer.

```bash
git clone https://github.com/amalmehta/StartACompany.git
cd StartACompany
npm start            # http://localhost:8080 — use `npm start -- --port 3000` if 8080 is taken
```

ES modules don't load from `file://`, so open the site through the server rather than by double-clicking `index.html`. The dev server sends `no-store`, so a normal reload always picks up your edits.

## Check it

```bash
npm test             # 24 unit tests for the planning logic and data
npm run check-links  # visits every official link the site shows
```

`check-links` puts sites that block scripts (403/429) in a separate "blocked" list. Open those in a browser to confirm. Anything listed as **BROKEN** needs a new URL.

## How to use it

1. **Your plan**: pick your state, then answer the rest. Pick **Not sure** for structure to get a recommendation. Yellow "Heads up" notes flag answers that conflict.
2. Click a step to see why it matters, what it costs, and the official link. Tick the box when it's done. The **Next** badge marks what to do next.
3. The summary cards show your structure, the state fees to start and each year, and your progress.
4. **Compare states**: every state's fees. Filter by name and click a column header to sort. Your state is highlighted.
5. **Settings** (gear icon, or ⌘, / Ctrl+,): theme, show or hide costs, hide finished steps, show details by default, export or import your plan, print, or reset.
6. **Feedback** (tab on the right edge): opens a prefilled GitHub issue.

Your answers and progress are saved only in this browser.

## Update the fee data

1. Edit the state's row in `src/data/states.js`. The header comment defines each field, including the yearly-cost rule: report fee + any minimum tax.
2. Set `DATA_REVIEWED` to today's date.
3. Run `npm test` and `npm run check-links`.

## Deploy

GitHub Pages publishes the `main` branch root. Before pushing changes to JS or CSS, bump the `?v=` version in the import map and the stylesheet link in `index.html` (`npm test` checks they match). Otherwise returning visitors can get a mix of cached old files and new ones for up to 10 minutes.
