# docs/

Consolidated working documentation for the Real Wealth lead-magnet app.

## What's here

| Doc | When to read it |
|---|---|
| **[EDITING_FLOWS.md](./EDITING_FLOWS.md)** | Single-page lookup: every kind of edit, the file(s) to touch, the validator(s) to run, the relevant skill, and the admin surface. The first place to look when handed the repo. |
| **[Actions.md](./Actions.md)** | What you need to do right now. Grouped by urgency. Quick command + URL reference at the bottom. |
| **[OutstandingItems.md](./OutstandingItems.md)** | Known gaps, tech debt, MVP trade-offs, stale docs to reconcile. Read before planning the next piece of work. |
| **[Guide.md](./Guide.md)** | Orientation. Part A — how the app works (architecture, data flow, file map). Part B — how to do things (recipes for common tasks). |
| **[Testing.md](./Testing.md)** | How to test everything — automated suite, URL shortcuts to every page, paste-ready DevTools snippets to seed any of the 9 segments, visual QA checklist, compliance/production build verification. |
| **[HardcodedNumbers.md](./HardcodedNumbers.md)** | Reference doc. Full audit of hardcoded numbers in tile notes (11 Category A, 10 Category B, 8 Category C), root-cause analysis, and 5 solution options with a recommendation. |
| **[SIMPLIFICATION_PLAN_2026-04-27.md](./SIMPLIFICATION_PLAN_2026-04-27.md)** | The 5-phase simplification orchestration plan (S1–S5). Source of truth for the post-simplification architecture. |
| **[compass-engine-overhaul-2026-04-27.md](./compass-engine-overhaul-2026-04-27.md)** | Engine + form + visualisation overhaul (raw values, UK tax/NI, personalised SPA, drawdown order, etc.). |
| **[questionnaire-methodology.md](./questionnaire-methodology.md)** | Single source of truth for question-input semantics (single vs multi, exclusive options, validation UX). |

## What's NOT here

Deeper per-area docs already live elsewhere. This folder is an orientation layer, not a replacement.

- **Plan history** — `Lead Magnet App/MASTER_REPORT_PLAN.md`, `Lead Magnet App/PHASE_1_NOTES.md`
- **Command + component reference** — `master_template/README.md`
- **Editorial workflow** — `master_template/HOW_IT_IS_MANAGED.md`
- **Questionnaire design** — `master_template/docs/questionnaire-methodology.md`
- **Per-agent prompts / briefs** — `Lead Magnet App/PROMPT_*.md`

## Refresh cadence

These three docs should be updated after any meaningful feature push. The Actions list in particular gets stale fast — treat it as working memory, not a permanent record.

Last full refresh: 2026-04-27 (post-simplification S5/S2/S4/S3/S1 + EDITING_FLOWS.md added).
