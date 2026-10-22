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
npm test             # 49 tests: planning logic, data, partners, generated pages, source checks
npm run check-links  # visits every official link, partner price page and live referral link
npm run check-sources  # compares each fee source with its stored fingerprint
npm run build -- --check  # says whether the generated pages are up to date
```

`check-links` puts sites that block scripts (403/429) in a separate "blocked" list. Open those in a browser to confirm. Anything listed as **BROKEN** needs a new URL.

`check-sources` reports official fee pages whose Last-Modified date or text changed since the baseline in `scripts/source-snapshots.json`, and partner pages that no longer show the price in `src/data/partners.js`. A change is a prompt to look, not proof a fee moved. After reviewing, record the new baseline with `npm run check-sources -- --update`. A GitHub Actions workflow runs all of this weekly and opens an issue (see [GO-LIVE](GO-LIVE.md)).

## How to use it

1. **Your plan**: pick your state, then answer the rest. Pick **Not sure** for structure to get a recommendation. Yellow "Heads up" notes flag answers that conflict.
2. Click a step to see why it matters, what it costs, and the official link. Tick the box when it's done. The **Next** badge marks what to do next.
3. The summary cards show your structure, the state fees to start and each year, and your progress.
4. **Compare states**: every state's fees. Filter by name and click a column header to sort. Your state is highlighted.
5. **Settings** (gear icon, or ⌘, / Ctrl+,): theme, show or hide costs, hide finished steps, show details by default, export or import your plan, print, or reset.
6. **Feedback** (tab on the right edge): opens a prefilled GitHub issue.

Your answers and progress are saved only in this browser. The [privacy page](https://amalmehta.github.io/StartACompany/privacy.html) lists exactly what's stored.

Each state also has its own page, for example **/states/delaware/**, with its fees, filings, yearly upkeep and sources, and a button that starts a plan for that state.

## Generated pages

`npm run build` writes, from the same data the app uses:

- `states/<state>/index.html` for all 50 states and DC, and `states/index.html`
- `terms.html` and `privacy.html`, from the text in `content/terms.html` and `content/privacy.html`
- `sitemap.xml` and `robots.txt`
- the canonical and Open Graph URLs in `index.html`

The generated files are committed, because GitHub Pages serves the repo as-is. A test fails if they're out of date, so run `npm run build` after changing fees, partners or the legal text. Absolute URLs use `SITE_URL` if set, else the domain in a `CNAME` file, else `https://amalmehta.github.io/StartACompany/`. Links between pages are relative, so the site works under that path and at a custom domain root.

## Partner links

Partners live in `src/data/partners.js`: name, what they offer, public price and source, a referral URL template, an ID and an enabled flag. A partner shows only when it's enabled and has an ID, only where it fits the answers (doola and Firstbase for founders outside the US or Delaware C corps; LegalZoom for LLCs), and always after the official filing link, with a disclosure above it and `rel="sponsored noopener"` on the link. With no IDs, nothing shows. Joining the programs and pasting IDs is in [GO-LIVE](GO-LIVE.md).

## Update the fee data

1. Edit the state's row in `src/data/states.js`. The header comment defines each field, including the yearly-cost rule: report fee + any minimum tax.
2. Set `DATA_REVIEWED` to today's date.
3. Run `npm run build`, `npm test` and `npm run check-links`.
4. Run `npm run check-sources -- --update` to record the pages you checked as the new baseline.

## Deploy

GitHub Pages publishes the `main` branch root. Before pushing changes to JS or CSS, bump the `?v=` version in the import map and the stylesheet link in `index.html`, and `ASSET_VERSION` in `scripts/site.mjs`, then run `npm run build` (`npm test` checks they all match). Otherwise returning visitors can get a mix of cached old files and new ones for up to 10 minutes.
