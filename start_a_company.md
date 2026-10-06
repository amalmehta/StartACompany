PROJECT NAME: start_a_company

META-INSTRUCTIONS:

<Read it all before acting. Ask about anything unclear, contradictory or
 underspecified — before starting and mid-build. Ask in the question widget
 (AskUserQuestion): related questions batched, concrete options, your
 recommendation first. Plain text only if the widget isn't available.>

<Don't expand scope. Anything not listed here is a proposal, including changes
 to this file — propose it, don't do it.>

<Prefer doing over describing: run the code, write the files, test it.>

<Always in scope, no proposal needed: when it goes on GitHub, a README that is
 easy to read at a glance — a line on what it is, then clear visuals
 (screenshots, a diagram or a chart), then links. Everything else goes in
 linked files: docs/INSTRUCTIONS.md (setup, run, use),
 docs/SYSTEM-DESIGN.md (see below) and docs/FILE-STRUCTURE.md (what's where). If what you're
 building is an application rather than a script, also a small unobtrusive feedback tab, and a settings
 button or tab (⌘, on the Mac) that gathers its preferences in one place.>

<If what you're building is an application, build it as a Mac app first; the
 website comes after, as its own step.>

<Name things the way a person would say them — "Goal Tracker", not
 goal_tracker — for the app, its windows, titles, files people open, repo
 descriptions and README headings. When you create the GitHub repo, name it
 with no "_" or "-": one word or joined words, e.g. GoalTracker.>

<Always in scope: a system design doc in the codebase, docs/SYSTEM-DESIGN.md,
 kept current as the build changes. Cover the architecture (with a Mermaid
 diagram), each component's job, the main flows, where data lives, the key
 design decisions and their trade-offs, how it's tested, and known limits.>

<Finish by listing every deliverable: path, what it is, how to check it works.>

<Git rules (no Claude attribution, never commit .claude/) are in
 ~/.claude/CLAUDE.md and apply on their own — nothing to repeat here.>

<Keep the changelog at the bottom current.>

CONTEXT:

figures out how to deal with all the overhead in terms of legitmizing and starting a company

DELIVERABLES:

website

OPEN QUESTIONS / ASSUMPTIONS:

Asked and answered (2026-10-06):
- What it does: a guided planner. Answer a short questionnaire and get a personal,
  ordered checklist with costs, deadlines and official links. Progress is saved in
  the browser. No backend, no AI.
- Platform: website only. DELIVERABLES says "website", and that takes precedence over the
  Mac-app-first meta-instruction. A Mac wrapper would be a separate proposal.
- Scope: US federal steps plus all 50 states and DC.
- Publishing: local, then a GitHub repo "StartACompany" with GitHub Pages, after confirming
  before the push.

Decided without asking:
- Plain HTML/CSS/ES modules with no framework or build step, tested with Node's built-in test runner.
- State fees were compiled from public Secretary of State schedules and marked "last reviewed
  2026-10-06". Every step links to the official office. Fees are approximate and can go stale.
- Totals count state filing fees only. Agent, lawyer, insurance and CPA costs appear as ranges per step.
- Delaware is offered only for C corps. A VC answer recommends a Delaware C corp plus foreign registration at home.
- BOI reporting is shown as "not needed" for US-formed companies, per FinCEN's March 2025 rule.
- 1099-NEC threshold is shown as $600, or $2,000 for payments from 2026 on.
- Feedback tab opens a prefilled GitHub issue, since there's no backend to receive it.
- Settings (gear, ⌘, / Ctrl+,) holds theme, cost display, hide finished, expand all, export,
  import, print and reset.
- Added a "Compare states" table built from the same fee data, as a small aid for deciding
  where to form.

CHANGELOG:

- 2026-10-06 — created
- 2026-10-06 — built v1 website: guided planner, 51-jurisdiction fee data, state comparison,
  settings, feedback tab, tests, README and docs
- 2026-09-15 — added meta-instruction: built-out applications include a small feedback tab
- 2026-09-15 — added meta-instruction: no "Claude" attribution in commits, PRs, or branches
- 2026-09-16 — added meta-instruction: always include a README when adding to GitHub
- 2026-09-16 — changed meta-instruction: ask clarifying questions in the question widget
- 2026-09-17 — added meta-instructions: Claude never a contributor; never commit .claude/
- 2026-09-26 — compressed the meta-instructions and every field prompt; git rules moved to the global instruction file
- 2026-09-27 — added meta-instruction: applications are built as a Mac app first, then a website
- 2026-09-28 — folded inputs, instructions, constraints, deliverables and done criteria into one free-form CONTEXT
- 2026-09-28 — changed meta-instruction: a README on GitHub always includes a visual
- 2026-09-28 — added meta-instruction: name things like a person would, never snake_case
- 2026-09-28 — changed meta-instruction: README leads with visuals; instructions live in a linked guide
- 2026-09-28 — changed meta-instruction: README is visuals and links; details in docs/INSTRUCTIONS.md and docs/FILE-STRUCTURE.md
- 2026-09-29 — changed meta-instruction: GitHub repo names have no "_" or "-"
- 2026-10-02 — added a DELIVERABLES field after CONTEXT
- 2026-10-02 — added meta-instruction: every project has a system design doc at docs/SYSTEM-DESIGN.md
- 2026-10-05 — added meta-instruction: applications include a settings button or tab
- 2026-10-06 — spot-checked California fees: LLC Statement of Information is biennial ($810/yr, not $820); noted corporations' first-year $800 exemption
