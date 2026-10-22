# Go Live

Steps only the owner can do to start earning referral income. Everything else is built and tested. Until you finish step 2, the site shows no partner links and no disclosure, so it's safe to deploy at any point.

## 1. Get a lawyer's review first

Before turning on referral links, have a lawyer look at three things:

- **Unauthorised practice of law.** Confirm that a free checklist personalised from someone's answers (structure recommendation, which filings, which state) is general legal information and not the practice of law, in the states you expect users from. Ask whether the "Not legal or tax advice" notices on the checklist, the state pages and the footer are enough, or need stronger wording.
- **Terms of use.** `content/terms.html` is a template. It's marked "Template" on the page; remove that note once it's reviewed.
- **Privacy page.** `content/privacy.html` is a template too. It describes what the code actually stores (one `localStorage` entry, `start-a-company:v1`), but the legal wording needs review, and you may want a contact email instead of "open a GitHub issue".

After editing either file, run `npm run build` to regenerate `terms.html` and `privacy.html`.

## 2. Join the partner programs and paste your IDs

All IDs go in one file: `src/data/partners.js`.

| Partner | Program | Where to apply | Fits |
|---|---|---|---|
| doola | PartnerStack | doola's affiliate page → "Start earning", an onboarding call, then a PartnerStack account | Founders outside the US, Delaware C corps |
| Firstbase | Referral partner program (tracked in Impact) | https://www.firstbase.io/referral-partner-program | Founders outside the US, Delaware C corps |
| LegalZoom | CJ Affiliate | Search "LegalZoom" in the CJ advertiser directory and apply | LLCs |
| Stripe Atlas | No public referral program | Nothing to do. It's listed as "no referral" next to paid options | Delaware C corps, founders outside the US |

Program terms seen on 2026-10-22: doola pays up to $300 per referral (15%) with 90-day cookies; Firstbase pays 10% with 90-day cookies. Confirm the current terms when you join.

For each partner you're approved for:

1. Copy your referral link from the partner dashboard.
2. Open `src/data/partners.js` and either
   - put the unique part in `referralId` if the link matches `referralTemplate` (for example `https://www.doola.com/?via=YOURID` → `referralId: "YOURID"`), or
   - **replace `referralTemplate` with the whole link** and leave `referralId` empty. Do this whenever the dashboard's link format differs from the template; the templates in the file are placeholders, not confirmed formats. CJ (LegalZoom) and Impact (Firstbase) links usually look nothing like them.
3. Check `price` and `priceSource` still match the partner's public pricing page, and set `PRICES_CHECKED` to today.
4. To pause a partner later, set `enabled: false`.

Then:

```bash
npm run build        # rebuilds the state pages with the links
npm test             # the "no IDs ship" test will now fail: see below
npm run check-links  # visits each live referral link
```

One test, "the shipped config has no referral IDs", exists to stop IDs going live by accident. Once you've decided to go live, delete that test and the matching "with no referral IDs, no page carries a sponsored link" test in `tests/site.test.js`. Then bump `?v=` in `index.html` and `ASSET_VERSION` in `scripts/site.mjs` to today's date, run `npm run build` and `npm test` again, and commit.

Check one state page (`/states/delaware/`) and a Delaware C corp plan in the app: the official filing link comes first, then a "Paid links" disclosure, then the partners.

## 3. Custom domain (optional)

1. Buy the domain and add the DNS records GitHub lists under **Settings → Pages → Custom domain**.
2. Add a `CNAME` file at the repo root containing just the domain, for example `startacompany.example`.
3. Run `npm run build`. Canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt` switch to the new domain. All links between pages are relative, so nothing else changes.
4. Tick **Enforce HTTPS** once GitHub offers it.

`robots.txt` only works at a domain root, so it starts helping once the custom domain is live.

## 4. Search engines

Add the site to Google Search Console and Bing Webmaster Tools, verify ownership (a DNS record on a custom domain is easiest) and submit `sitemap.xml`.

## 5. Turn on the weekly check

`.github/workflows/weekly-check.yml` runs every Monday: tests, the generated-pages check, `check-links` and `check-sources`. If anything fails, changes or breaks, it opens an issue labelled `weekly-check`, or comments on the open one.

1. Push the branch and merge it.
2. In **Settings → Actions → General**, make sure Actions are allowed. The workflow asks for `issues: write` itself, so the default "Read" workflow permission is fine.
3. Run it once by hand: **Actions → Weekly check → Run workflow**.
4. GitHub pauses scheduled workflows after 60 days without commits. Re-enable it from the Actions tab if that happens.

When an issue arrives, follow its checklist: compare each changed page with the data, fix any fee, run `npm run build`, then `npm run check-sources -- --update` to record the new baseline, and commit.

## 6. Before each deploy

- `npm test` passes and `npm run build -- --check` says everything is up to date.
- `?v=` in `index.html` and `ASSET_VERSION` in `scripts/site.mjs` are bumped to the same new date.
