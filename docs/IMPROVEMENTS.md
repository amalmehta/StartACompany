# Improvements — 2026-10-11 pass

110 changes from a full review. The fees for all 50 states and DC were checked against official sources (Secretary of State and state tax-agency fee schedules, and statutes); a few came from law-firm summaries or search results where the official page blocked automated access. Every link was checked by script and in a real browser.

## Fee data (48)

| # | Change |
|---|---|
| 1 | **Alabama**: removed the $50 yearly minimum. Business Privilege Tax of $100 or less has been waived since 2024. |
| 2 | Alabama: noted the required name reservation (~$28) |
| 3 | Arizona: fixed a broken (404) filing-office link |
| 4 | **Delaware**: LLC annual tax $300 → $400 (HB 400, 2026) |
| 5 | **Delaware**: corporation yearly cost $225 → $450, the realistic Assumed Par Value minimum for a startup with millions of authorized shares |
| 6 | DC: fixed a broken filing-office link |
| 7 | **Georgia**: added the corporation newspaper-notice requirement ($40) |
| 8 | Hawaii: annual report $13 → $15 |
| 9 | Illinois: corrected the franchise-tax note (first $10,000 exempt since 2025) |
| 10 | **Iowa**: corporation biennial report $30 → $60; corrected odd/even filing years |
| 11 | Iowa: fixed a broken link |
| 12 | **Kansas**: LLC formation $160 → $90 (2026 fee cut) |
| 13 | Kansas: reports are now biennial, $90 |
| 14 | Kansas: fixed a broken link |
| 15 | **Louisiana**: fees raised on Oct 1, 2026 (LLC $125, corp $95, report $35) |
| 16 | Louisiana: fixed a broken link |
| 17 | Maine: fixed a broken link |
| 18 | Maryland: noted that the $300 report fee is owed even with no property |
| 19 | **Massachusetts**: corporation yearly cost now includes the $456 minimum excise |
| 20 | Massachusetts: replaced a link that returned 403 |
| 21 | Minnesota: updated the link to the current domain |
| 22 | **Nebraska**: formation $100 for LLCs and corporations; LLC biennial report $25 |
| 23 | Nevada: link moved off the retired SilverFlume portal |
| 24 | New Hampshire: fixed a broken link |
| 25 | **New Jersey**: corporation yearly cost now includes the $500 Corporation Business Tax minimum; noted the $150-per-owner LLC fee |
| 26 | New York: corporation formation $125 → $135 (minimum share tax) |
| 27 | New York: added the LLC Transparency Act filing and the $50 Certificate of Publication |
| 28 | New York: fixed a broken link |
| 29 | **North Carolina**: corporation yearly cost now includes the $200 franchise-tax minimum |
| 30 | **Oklahoma**: franchise tax repealed from 2024, so corporations have no yearly filing |
| 31 | Pennsylvania: corrected the dissolution rule (6 months after a missed report, from 2027) |
| 32 | Pennsylvania: fixed a redirected link |
| 33 | **Rhode Island**: added the $400 minimum tax for LLCs and corporations |
| 34 | South Dakota: annual report $50 → $55 |
| 35 | **Tennessee**: added the $100 minimum franchise tax |
| 36 | Texas: the No Tax Due report was eliminated; the information report is still due May 15 |
| 37 | Texas: fixed a broken link |
| 38 | Utah: updated the link |
| 39 | **Vermont**: corporation $125 → $155; LLC report $35 → $45; corporation report $45 → $60; separate LLC due date |
| 40 | Vermont: fixed a broken link; noted the $250 minimum entity tax |
| 41 | Washington: noted the Initial Report due within 120 days |
| 42 | Wisconsin: updated the link to the current domain |
| 43 | Georgia and Ohio: links updated to their current addresses |
| 44 | **Foreign registration fees for all 51 jurisdictions.** The plan used to guess from the domestic fee, so registering a Delaware corp in Texas was quoted at $300 instead of $750. |
| 45 | One rule for yearly cost in every state: report fee + any minimum tax, documented in the data file |
| 46 | Fixed a broken IRS Form 15620 (83(b)) link |
| 47 | Fixed a broken SBA state-taxes link |
| 48 | Review date shown on the site: 2026-10-11 |

## Plan logic (16)

| # | Change |
|---|---|
| 49 | Warning: S corps can't take venture money |
| 50 | Warning: most VCs won't fund an LLC |
| 51 | Warning: a home-state C corp when you plan to raise |
| 52 | Warning: a "sole prop" with several founders is really a general partnership |
| 53 | Warning: investors can't buy into a sole proprietorship |
| 54 | EIN marked required for sole proprietors with employees |
| 55 | S corp step explains eligibility (≤100 shareholders, US owners, one class of stock) |
| 56 | I-9 deadline stated precisely (third business day) |
| 57 | Delaware's yearly item named for what it is, with how to avoid the scary franchise-tax bill |
| 58 | New recurring item: payroll filings (941, 940, W-2) |
| 59 | New recurring item: 1099-NEC by Jan 31 |
| 60 | New recurring item: sales-tax returns |
| 61 | Newspaper-notice costs shown under "State fees to start" |
| 62 | Publication rules moved into one table (NY, AZ, NE, GA) |
| 63 | Foreign-registration step mentions the home-state registered agent |
| 64 | Short structure names so the summary card doesn't wrap to four lines |

## Experience (23)

| # | Change |
|---|---|
| 65 | One-line explanation under each structure choice |
| 66 | Delaware-or-home-state hint |
| 67 | "See your plan ↓" button on phones, where the plan sits below the form |
| 68 | "Next" badge on the first unfinished step |
| 69 | "Setup done" banner at 100% |
| 70 | Message instead of a blank page when every step is hidden |
| 71 | Expand all / Collapse all |
| 72 | Founders box can be cleared while typing |
| 73 | Corrected the hero copy (it said "seven questions"; there are nine) |
| 74 | Sole proprietor summary says "no state filing" |
| 75 | Questions panel scrolls on short screens instead of being cut off |
| 76 | State table highlights your state |
| 77 | State table shows a match count and a "no match" message |
| 78 | State table on phones: sticky state column, clamped notes, sensible row heights |
| 79 | Feedback can include your state and structure (on by default, can be unticked) |
| 80 | Feedback won't open an empty issue |
| 81 | Feedback tab no longer covers content on phones |
| 82 | Import checks the file and reports problems inline instead of in an alert |
| 83 | Inline status after import and reset |
| 84 | Export file is labelled with the app name and version |
| 85 | Browser tab title changes per page |
| 86 | Switching pages scrolls to the top |
| 87 | Settings shortcut shows ⌘, on Mac and Ctrl+, elsewhere |

## Accessibility (11)

| # | Change |
|---|---|
| 88 | Keyboard focus stays on the checkbox after ticking a step |
| 89 | Screen readers hear "Done. 3 of 18 setup steps finished." |
| 90 | Progress bar exposes role and value |
| 91 | Step toggles use `aria-expanded` and `aria-controls` |
| 92 | Navigation uses `aria-current` instead of misused tab roles |
| 93 | Sortable column headers are real buttons with `aria-sort` |
| 94 | Table has a caption and row headers |
| 95 | Skip-to-content link |
| 96 | External links say "opens in a new tab" |
| 97 | Animations are turned off for people who prefer reduced motion |
| 98 | The feedback box has a label, and dialogs are named |

## Platform, quality and tooling (12)

| # | Change |
|---|---|
| 99 | No light flash when dark mode is forced (theme applied before first paint) |
| 100 | Phone browser bar color follows the theme |
| 101 | Social preview (Open Graph / Twitter) and a canonical URL |
| 102 | `noscript` message |
| 103 | **Versioned import map**, so after a deploy browsers never mix new logic with cached old fee data. That mix happened during testing. |
| 104 | `npm start` is now a no-cache Node server, so Python isn't needed |
| 105 | `.nojekyll` for faster, safer GitHub Pages builds |
| 106 | GitHub Actions runs the tests on every push |
| 107 | `npm run check-links` checks every official link the site shows |
| 108 | 10 new tests (24 total) |
| 109 | Printed plans show link URLs and a summary line |
| 110 | README gains a phone screenshot |

## Proposed, not done (new scope)

- Calendar (.ics) export of the yearly deadlines.
- Shareable link that encodes the answers.
- Per-state links to the sales-tax agency and new-hire registry, instead of SBA guidance.
- A Mac app wrapper. The brief's DELIVERABLES says "website", so it wasn't built.
- A scheduled job that runs `check-links` monthly and opens an issue on failures.
