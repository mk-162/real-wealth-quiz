# Guide — How it works & How to do things

Single orientation doc for the Real Wealth lead-magnet app. Two parts:

- **Part A — How it works** (architecture)
- **Part B — How to do things** (recipes)

Last updated: 2026-04-24

---

# Part A — How it works

## The project in one paragraph

A Next.js 16 / React 19 / TypeScript app that walks a user through a short questionnaire, segments them into one of 9 wealth personas (S1–S9), runs a financial projection engine over their answers, and renders a personalised 9-page PDF-shaped report. Real-client copy lives in markdown under `content/`; each screen file declares its own audience (which segments see it) directly in frontmatter; engine predicates for `conditional` cells live in `src/lib/segmentation/engine.ts`; the report's numbers come from a pure TypeScript engine at `src/lib/compass/`. An email-unlock gate sits between the questionnaire and the report.

## The three repos

| Path | Role |
|---|---|
| `master_template/` | **The web app.** This is where all code + content lives. |
| `admin_app/` | Separate Electron editor (v1: editor-only). Lets non-engineers edit content markdown without touching git. |
| `Lead Magnet App/` | Plan docs, brainstorms, handoff notes. No code. |

Everything in this guide is inside `master_template/`.

## End-to-end data flow

```
  homepage (/)
      │
      ▼
  questionnaire (/conversation)
    • markdown screens in content/screens/ drive the UI
    • answers persisted to localStorage[`real-wealth:conversation`]
    • 5 gating answers determine segment (S1..S9) via src/lib/segmentation/
      │
      ▼
  summary (/conversation/summary)
    • email-gate requires localStorage[`real-wealth:report-unlocked`]=true
    • after unlock, renders CompassReportSection inline
      │
      ▼ (same process, server-side)
  buildCompassInputs(answers)           — src/lib/compass/inputs.ts
    • maps runtime input.id → engine enum bands
      │
      ▼
  buildReport(inputs)                    — src/lib/compass/projection.ts
    • year-by-year projection (age → 95)
    • balance sheet, scores (coverage %), assumptions
      │
      ▼
  scoreAllTiles(inputs, report)          — src/lib/compass/tile-scoring.ts  [NEW]
    • 12 tile scorers → { status, metrics, scoreable }
      │
      ▼
  enrichSegmentView(base, coverage, requireApproved?, tileScores)
    • merges fixture baseline + per-segment markdown + engine scores
    • template substitution on tile notes (applyTemplate)
      │
      ▼
  9-page report rendered by src/components/compass/* + PageFrame
```

## The 9-page report structure

| # | Name | Source |
|---|---|---|
| 01 | Cover | Name + segment + date |
| 02 | Snapshot | Gauge + donut + balance strip + takeaway |
| 03 | Planning grid + Goals | 12 tiles + 3-5 goals per segment |
| 04 | Projection | Chart + milestones + readings + CTA |
| 05 | Where you are today | Narrative (segment-tuned) |
| 06 | Five things worth a conversation | Curated awareness checks |
| 07 | Silent gaps + Planner's read | Silent-gap rules + planner lens |
| 08 | Next step | Segment-tailored CTA |
| 09 | Methodology | Published assumptions + regulatory disclosures |

Pages 2, 3, 4 are data-heavy (numbers come from engine). Pages 1, 5-9 are content-heavy (prose comes from markdown).

## What's personal to the client vs segment archetype

| Element | Personal? | Source |
|---|---|---|
| Cover name + segment label | ✓ | Session answers |
| Gauge % + balance totals + chart curve | ✓ | `buildReport(inputs)` |
| Planning-grid tile statuses | ✓ | `scoreAllTiles(inputs, report)` **[new, as of 2026-04-24]** |
| Planning-grid tile notes | ✓ numbers, ✗ prose | Tokens substituted into per-segment prose |
| Goals, narrative pages 5-7 | ✗ | Per-segment markdown (same for every S2 client) |
| Methodology | ✗ | Static regulatory disclosures |

## Tile-scoring engine (the thing that made page 3 personal)

**Pure function:** `scoreAllTiles(inputs, report): TileScoreMap`.
Takes `CompassInputs` + `CompassReport`, returns a map keyed by `TileKey` with `{ status, metrics, scoreable }` per tile.

**Threshold philosophy:** thresholds are named constants in TS, not markdown. Authors own words, engineers own numbers.

**Template substitution:** per-segment tile notes can contain `{token}` placeholders. Engine's `metrics` are pre-formatted strings with suffix conventions:
- `_k` — integer thousands ("45")
- `_pct` — integer percentage ("88")
- `_mo` / `_months` — month count
- `_yr` — year count
- `_m` — integer millions

Template parser (`applyTemplate` in `tile-template.ts`) is single-pass. Unknown tokens are left literal so bugs are visible.

**Compliance gate integration:** when `compliance_status` on a tile isn't `approved_to_ship`, the rendering layer silently degrades the tile to `grey / "Not checked"` in production. Engine still runs (so metrics could be logged to analytics), but aren't shown.

## Segmentation (S1–S9)

Five gating questions decide which of 9 segments a client lands in:

| ID | Name | Rough profile |
|---|---|---|
| S1 | Early Accumulator | 28, solo, renter, light savings |
| S2 | Mass-Affluent Mid-Career | 42, partner + kids, mortgaged, £75k income |
| S3 | High-Earner Mid-Career | 45, £150k, £100k tax trap |
| S4 | Senior Professional | 55, £200k, 5 years from exit |
| S5 | Business Owner Growth | 48, business ~£500k, no exit plan |
| S6 | Business Owner Exit | 58, exiting in ~3 years |
| S7 | Pre-Retiree Affluent | 63, 18 months to retirement |
| S8 | Retired | 70, drawing down, £45k/yr |
| S9 | HNW Multi-Generational | 68, £6m estate, IHT exposed |

Rules in `src/lib/segmentation/rules.ts`. Engine in `src/lib/segmentation/engine.ts`.

## The two sources of truth

1. **`master_template/content/`** — all copy, options, CTAs, tile prose, **and** per-screen audience (which segments see each question). Zod-validated on build.
2. **`src/lib/segmentation/engine.ts`** — predicates that gate `conditional` audience cells (e.g. "S5 sees Q3.2 only if income is not 'prefer_not_to_say'"). One predicate per `questionId`.

Generated files under `src/lib/content/` (`catalogue.ts` etc.) are read by the app but never edited by hand. The legacy `content/generated/matrix.json`, `Question Segment Master.xlsx`, and `scripts/parse-segment-master.ts` pipeline have been removed — audience now lives on the screen file itself.

## Audience precedence — the rule non-obvious to new editors

Each screen carries an `audience` block in frontmatter, keyed by `questionId`:

```yaml
audience:
  "Q3.2":
    S1: hidden
    S2: shown
    S3: shown
    ...
  "Q3.3":
    ...
```

Cell values are `shown | hidden | conditional`. A `conditional` cell needs a matching predicate in `src/lib/segmentation/engine.ts` keyed by the same `questionId` — without one, the engine silently treats it as hidden.

`src/lib/questions/matrix.ts` walks every screen at module load and assembles the `SegmentMatrix` the engine consumes. There is no separate matrix file.

## Compliance gate

All user-facing markdown has a `compliance_status: draft | in_review | approved_to_ship` frontmatter field. `src/lib/content/compliance.ts` provides:

- `canPublishInProduction(status)` — false for non-`approved_to_ship` in prod, true otherwise
- `filterApproved([items])` — array filter
- Env var `RW_BYPASS_COMPLIANCE=1` forces permissive mode (demo/staging only; never set in real production)

Loaders in `src/lib/compass/pdf-content.ts` have an optional `requireApproved` flag that throws when unapproved content is requested in production. Report routes pass `requireApproved: process.env.NODE_ENV === 'production'`. Preview/debug routes don't.

## Key file map

```
src/lib/compass/
├── types.ts                    CompassInputs, SegmentView, PlanningTile, TileKey, TileStatus
├── inputs.ts                   buildCompassInputs(answers) — runtime→engine mapper
├── projection.ts               buildReport(inputs) — year-by-year projection, balance sheet, scores
├── tile-scoring.ts             scoreAllTiles(inputs, report) — the 12 scorers    [NEW]
├── tile-scoring-types.ts       TileScore, TileMetrics, TileScoreMap              [NEW]
├── tile-template.ts            applyTemplate(template, metrics) — {token} parser [NEW]
├── pdf-content.ts              loadPlanningTiles, enrichSegmentView, loadMethodology etc
├── fixtures.ts                 9 canned personas (preview-only data)
├── fixtures-fields.ts          Field-map debug fixture for /report/master-fields
└── index.ts                    Barrel

src/lib/content/
├── compliance.ts               canPublishInProduction + RW_BYPASS_COMPLIANCE     [NEW]
└── __tests__/compliance.test.ts                                                  [NEW]

src/app/
├── conversation/
│   ├── page.tsx                Questionnaire entry
│   ├── summary/
│   │   ├── page.tsx            Server-component wrapper (pre-renders CompassReportSection per segment)
│   │   ├── SummaryClient.tsx   Client UI (considered list + unlock + report embed)
│   │   └── CompassReportSection.tsx   Server component — full 9-page report
└── report/
    ├── master/[segment]/page.tsx      Production-shaped 9-page report (SSG × 9)
    ├── master-fields/page.tsx         Debug field-map view
    ├── compass-preview/page.tsx       Dev segment tab-picker
    └── compass-client-view/...        Clean client-facing view

content/report/
├── health-gauge.md             Gauge interpretations per segment × zone
├── takeaway-banners.md         Page 2 headline per segment
├── methodology.md              Page 9 — 5 sections, 2 tables
├── planning-grid/tile-NN-*.md  × 12 — tile notes per segment (with {tokens} now)
├── goals/S[n]-*.md             × 9 — wellbeing goals per segment
└── awareness-checks-expanded/  × 26

scripts/
├── test-tile-scoring.ts        74 unit tests
├── test-tile-template.ts       10 template tests
├── test-tile-scoring-full.ts   126 integration assertions
├── test-compass-inputs.ts      9-segment coverage self-test
├── parse-segment-master.ts     ARCHIVED — xlsx pipeline retired; kept for reference only
└── add-compass-questions.py    xlsx row adder

tests/
└── flows.spec.ts               Playwright E2E — 10 tests, ~30s
```

---

# Part B — How to do things

## Run it locally

```bash
cd master_template
npm install                      # first time only
npm run dev                      # starts Next on port 5000 + content-watch
```

Open http://localhost:5000. The `dev` script runs Next and a chokidar watcher for markdown changes in parallel.

## See the sample report

```
http://localhost:5000/report/master/S2
```

For any other segment, swap `S2` for S1..S9. For a debug view showing which data fields drive each slot:

```
http://localhost:5000/report/master-fields
```

## Preview the summary (post-unlock) report

The summary page is email-gated. To bypass for demo, open DevTools console and run:

```js
localStorage.setItem('real-wealth:report-unlocked', 'true'); location.reload();
```

Or walk the questionnaire from http://localhost:5000/conversation to land on the summary properly.

## Run all tests

```bash
# TypeScript
npx tsc --noEmit

# All test suites (Node built-in test runner)
npx tsx --test scripts/test-tile-scoring.ts
npx tsx --test scripts/test-tile-template.ts
npx tsx --test src/lib/content/__tests__/compliance.test.ts
npx tsx --test scripts/test-tile-scoring-full.ts

# Content validation
npm run content:check

# 9-segment coverage self-test
npx tsx scripts/test-compass-inputs.ts

# E2E (needs dev server running)
npx playwright test tests/flows.spec.ts
```

Expected: all green. Any failure is a regression.

## Edit a tile note (content authoring)

1. Open `content/report/planning-grid/tile-06-emergency-cash.md` (or whichever tile).
2. Find the per-segment H1 block you want to change (e.g. `# S2 — Mass-Affluent Mid-Career`).
3. Edit the `note:` field. Use `{token}` substitution where you want the client's actual numbers:

   ```
   note: "£{cash_k}k covers {cash_months} months of essentials. Thin for a single-earner household with dependants."
   ```

4. Available metric tokens per tile are listed in `src/lib/compass/tile-scoring-types.ts`. Reading that file is the fastest way to see which `_k`, `_pct`, `_mo` tokens each tile exposes.
5. Save. **Restart the dev server** (module-level tile cache doesn't invalidate on markdown change — see Outstanding Items).
6. Visit `http://localhost:5000/report/master/S2` and confirm the note reads sensibly.
7. Run the integration test to catch typos:

   ```bash
   npx tsx --test scripts/test-tile-scoring-full.ts
   ```

   This checks that no `{token}` remains unresolved in any of the 108 tile/segment combinations.

## Change a tile's scoring rule

Tile statuses are computed in `src/lib/compass/tile-scoring.ts`. Each of the 12 tiles has its own `scoreXxx(inputs, report)` function.

1. Find the scorer function. Read its logic.
2. Thresholds are named constants at the top of the file (e.g. `CASH_GREEN_MONTHS_WITH_DEPS = 6`). Change there, not in the function body.
3. Run the unit tests after the change — they cover the boundary conditions:

   ```bash
   npx tsx --test scripts/test-tile-scoring.ts
   ```

4. If you changed a threshold, update the test expectations too. Every unit test is small; the file is ~680 lines and easy to navigate.

## Add a new questionnaire screen

1. Create `content/screens/<section>.<n>-<slug>.md` following the existing schema. Easiest path: copy an adjacent screen and adjust.
2. Add the new `input.id` to `INPUT_QUESTION_IDS` in `src/lib/compass/inputs.ts` if the answer needs to feed the engine.
3. If the answer maps to a `CompassInputs` enum band, add a label→band table (see `ESTATE_LABEL_TO_BAND` etc. for examples).
4. Audience is declared on the screen file itself. In the screen's frontmatter, add an `audience:` block keyed by each `questionId` carried by the screen, with a value of `shown | hidden | conditional` for every segment S1–S9. If any cell is `conditional`, add a matching predicate to `conditionals` in `src/lib/segmentation/engine.ts` (see existing examples).

5. Validate:

   ```bash
   npm run content:check
   npx tsx scripts/test-compass-inputs.ts
   ```

## Deploy a demo build (draft content)

```bash
RW_BYPASS_COMPLIANCE=1 npm run build
# then deploy .next/ however you normally deploy
```

Or on Vercel, set the env var in the preview environment, leave it unset in production.

## Approve content for real production

1. Review the markdown file with compliance.
2. Edit the frontmatter: `compliance_status: draft` → `compliance_status: approved_to_ship`.
3. Commit.
4. Once all required files are approved, `npm run build` succeeds without the bypass.

Files that must be approved for the 9-page report to render without the bypass:

- `content/report/health-gauge.md`
- `content/report/takeaway-banners.md`
- `content/report/methodology.md`
- All `content/report/planning-grid/tile-*.md` (12 files)
- All `content/report/goals/S[n]-*.md` (9 files)
- Any awareness checks surfaced on page 6 for the segments you care about

Tiles that aren't approved fall back to `grey / "Not checked"` — not fatal, just ugly.

## Edit a screen's audience (which segments see a question)

Audience lives on each screen file's frontmatter. The matrix is built at module load by walking every screen — there is no separate matrix file.

Two ways to edit:

1. **Admin app** — open the Matrix editor under Segments. The admin walks every screen, builds the visible matrix, and writes back to whichever screen owns the questionId you click. Cycle cells (`hidden → conditional → shown`), Save. (Recommended for content leads.)
2. **Direct frontmatter** — find the screen carrying the questionId (search `q_refs:` for the `Q3.2`-style id). Open it; locate the `audience:` block; flip the `<segment>: <state>` line:

   ```yaml
   audience:
     "Q3.2":
       S1: hidden    # was: shown
       S2: shown
       ...
   ```

   Save, then:

   ```bash
   git diff content/screens/<file>.md
   npm run content:check
   ```

Either path edits the same source. `npm run content:check` catches structural errors (unknown segment id, missing cell, etc.).

If you add a new `conditional` cell, make sure a predicate exists in `src/lib/segmentation/engine.ts` keyed by the same `questionId` — the engine silently skips conditional cells with no predicate. Follow the shape of the existing entries (e.g. `'Q3.2': (a) => a.income !== 'prefer_not_to_say'`). Predicates that depend on follow-up answers (not `GatingAnswers`) can return `true` and let the screen's `conditional_reveal` do the runtime gating — see `Q4.3`, `Q4.C.2`, `Q4.1a`, `Q4.3a` for the pattern.

## Use the field-map debug view

`/report/master-fields` shows the 9-page layout with every content slot replaced by its data-field path (e.g. `{view.headline.title}`). Engine-driven numbers still render real values so the chart and gauge look realistic. Great for understanding which data source drives which visual slot.

Fixture backing it: `src/lib/compass/fixtures-fields.ts`. Uses S2 band values.

## Rebuild mockup snapshots (Ctrl-P → Save as PDF)

Any of the `/report/master/*` routes is set up for A4 print (`@page { size: A4; margin: 0 }`). Open the page, Ctrl+P, Save as PDF → Chrome produces 9 clean A4 pages. Good for sharing static snapshots.

## Reset a stuck test session

```js
localStorage.removeItem('real-wealth:conversation');
localStorage.removeItem('real-wealth:report-unlocked');
location.reload();
```

## Rollback — if something's broken

```bash
cd master_template
git log --oneline -10                     # find the good commit
git reset --hard <good-commit-sha>        # discards local changes, moves HEAD back
```

Today's tile-scoring work is at commit `978e8b7`. The commit before that, `aa1cfc9`, was the clean pre-tile-scoring state.

---

## Where to find more

- **Plan history:** `Lead Magnet App/PHASE_1_NOTES.md`, `Lead Magnet App/MASTER_REPORT_PLAN.md`.
- **Project-level README:** `master_template/README.md` (orientation + command reference).
- **Content editorial workflow:** `master_template/HOW_IT_IS_MANAGED.md`.
- **Questionnaire design:** `master_template/docs/questionnaire-methodology.md`.
