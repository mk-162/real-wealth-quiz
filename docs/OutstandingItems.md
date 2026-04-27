# Outstanding Items

Known gaps, tech debt, and unfinished threads. Grouped by severity.

Last updated: 2026-04-27 (post-simplification S5/S2/S4/S3/S1).

## Closed in the simplification phases

These items from the prior round of outstanding work were addressed by phases S1–S5:

- **`content/generated/matrix.json` + xlsx pipeline** — replaced by per-screen `audience:` frontmatter blocks (S1). The legacy script `scripts/parse-segment-master.ts` is archived in-place with a header comment.
- **3 folders for "the report"** (`content/report/` empty stubs, `content/pdf-report/` live, `templates/report/` dead) — collapsed to one folder `content/report/` (S2).
- **6+ bespoke pdf-report file shapes** — unified to one canonical shape: `kind: per_segment` (with `# S1 … # S9`) or `kind: global` (with `# Body`) (S4).
- **Body-section vocabulary drift** — every editable content type now uses a small canonical vocabulary (`# Headline / # Body / # Cta / # Notes` and per-type variants). Provocations, segment CTAs, awareness checks, screens all aligned (S3).
- **Vendored schema mirror in `admin_app`** — replaced by direct `@master/schema` import via Turbopack workspace root config (S5). Drift test + sync script removed.
- **Backup xlsx files in parent folder** — irrelevant post-simplification (xlsx pipeline retired); item closed.

---

## Code — real client impact

### `ownPensionContribPct` defaults to `'unsure'` when fixtures bypass the mapper
**File:** `src/lib/compass/inputs.ts`
**Impact:** Real questionnaire sessions now feed through correctly (the screen was added in today's Wave 1C). But the 9 fixtures in `src/lib/compass/fixtures.ts` pre-date the question and set the field directly. Fixture previews therefore use whatever the fixture author wrote, not the new mapping. Not a real-client issue — only affects preview pages.
**Fix:** None needed right now. Fixtures are preview-only data.

### `_tileCache` in pdf-content.ts doesn't invalidate on markdown changes
**File:** `src/lib/compass/pdf-content.ts`
**Impact:** Author edits a tile markdown, dev server still serves the old text until server is restarted. Only affects authoring workflow; production builds are fine (fresh process per build).
**Fix:** Add mtime-based cache invalidation, or just drop the caches (12 markdown files, reads are cheap).
**Effort:** ~30 min.

---

## Content — compliance + prose

### Most `content/report/*.md` files are `compliance_status: draft`
**Files:** `health-gauge.md`, `takeaway-banners.md`, `methodology.md`, `planning-grid/tile-*.md` × 12, `goals/S[n]-*.md` × 9, `awareness-checks-expanded/*.md` × 26.
**Impact:** `NODE_ENV=production npm run build` fails loudly unless `RW_BYPASS_COMPLIANCE=1` is set. Escape hatch is fine for demos; real production needs real compliance review.
**Fix:** Route each file through compliance review. Flip frontmatter to `approved_to_ship` once signed off.
**Effort:** varies with compliance cadence — not an engineering problem.

### Tile prose may feel off when engine flips status
**Files:** `content/report/planning-grid/tile-NN-*.md`
**Impact:** Each segment has one note per tile, written for the segment's expected status archetype. If the engine scores an individual client differently from the archetype, the prose can mismatch the status chip. E.g. S2 archetype is amber cash; a wealthy S2 client gets green cash status but the note still reads amber-voiced.
**Fix options:**
- Accept the mismatch for MVP (numbers in tokens are still accurate, just the surrounding prose feels slightly off).
- Rewrite notes to be status-agnostic ("£{cash_k}k. {cash_months} months of essentials.") — factual, no opinion.
- Add per-status note variants to the markdown schema (bigger architectural change).
**Current choice:** Accept for MVP. Revisit if clients flag it.

### Cash tile has a minor spec deviation
**File:** `src/lib/compass/tile-scoring.ts` (scoreCash)
**Detail:** The Wave 2 engine agent extended the spec's ISA-softening rule beyond the original zero-cash case. Today, if a client has any ISA AND would score red on cash coverage, they get amber instead. Defensible (ISAs are liquid enough to serve as buffer), but stricter than spec.
**Fix:** One-line edit to revert if you want strict cash-only scoring.

---

## Process / ops

### Admin CMS v2 has no plan
**File:** none yet.
**Impact:** `Lead Magnet App/PLAN_admin_app.md` covers v1 (editor-only Electron). v2 needs to cover the content-aware patterns from tile-scoring work (inline `{token}` validation, per-segment live preview with engine output, compliance-status flip UI).
**Fix:** Draft `PLAN_admin_app_v2.md` when v1 ships.

### Preview HTML files in `public/report-preview/` are legacy
**Files:** `public/report-preview/*.html`, `public/report-preview/v1/`
**Impact:** Static HTML mockups from earlier design iterations. Not linked from anywhere. Confusing to find in the repo.
**Fix:** Archive to a `legacy-mockups/` folder or delete. No functional impact.

### Backup xlsx files in parent folder
**Files:** `C:\Users\matty\Real Wealth\Question Segment Master.AUTO-BACKUP.xlsx`, `...MANUAL-BACKUP.xlsx`
**Impact:** Not in repo (parent folder, not tracked). But clutter.
**Fix:** Delete once you trust today's matrix output.

---

## Stale docs to reconcile

These docs in `Lead Magnet App/` contain references that pre-date today's work. Worth a once-over to merge or archive.

| Doc | Stale because | Suggested action |
|---|---|---|
| `PLAN_pdf_report.md` | Describes Phase 1B as pending; Phase 1B landed today (summary-page integration) | Add closing note at top: "Phases 1A/1A+/1A++/1B complete. See `MASTER_REPORT_PLAN.md` §10 for current state." |
| `HANDOFF_NEXT_MODEL.md` | Lists blockers from a prior QA session (2026-04-23); most fixed, two still open | Mark completed items struck-through; keep open items; date the pass |
| `DECISION_LOG.md` | Not reviewed in the last two pushes; may overlap with `MASTER_REPORT_PLAN.md` §9 | Read and merge or retire |
| `audit-handoff-2026-04-17.md` | From a prior session; tile-scoring work has moved on significantly | Archive or append date-stamped note |
| `PLAN_deep_dive_e2e_review.md` | Covered the previous QA pass; some items addressed, some still open | Annotate current status per item |

None are blockers. Doing the pass improves onboarding for anyone new (including future-you).

---

## Risks we explicitly accepted (for reference)

During the tile-scoring work we made deliberate trade-offs. These aren't bugs — they're known MVP compromises:

1. **Per-segment note authoring** — one note per segment-tile pair, not one per (segment × status) pair. Simpler content model; accepts occasional prose/status mismatch.
2. **No persistence of engine-computed scores** — scores computed at render time, no analytics persistence. Hook exists if we want it (`scoreAllTiles` returns `TileScoreMap` which could be logged), just not wired.
3. **Hard-coded thresholds in TS, not in markdown** — content authors write prose; engineers own numbers. Review via git diff, not via CMS.
4. **Fixture-based preview pages diverge from engine output** — `/report/master/[segment]` now shows engine-scored tiles even for fixture inputs, which may differ from the fixture's hand-authored grid values. This is correct (engine wins) but visible.
