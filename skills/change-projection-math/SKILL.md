<!-- _AUDIT.md entry: 8.15 -->
---
name: change-projection-math
description: Edit the math in Real Wealth's projection engine at `src/lib/compass/projection.ts` — growth-rate assumptions, band thresholds, tax-year rates, or formula changes. Use this skill ONLY when the user wants to change the projection engine's behaviour. This is Tier 3 — every downstream report number depends on this; regression tests and fixture snapshots will flag drift. Triggers on phrasings like "bump the balanced growth rate to 6.5%", "update the inflation assumption", "change the essential-spend band threshold", or "the projection math needs tweaking".
---

# Change the projection math

## What this skill does

Edits `master_template/src/lib/compass/projection.ts` (and possibly `types.ts`, `assumptions.ts`, `tile-scoring.ts`) to change the math of the projection engine — growth rates, inflation assumptions, band thresholds, formula changes.

## Human confirm gate (Tier 3)

Before making any edit:

1. **Summarise the change.** Current assumption / formula → proposed.
2. **Identify the downstream.** Every report's numbers depend on this — page 2 (snapshot), page 3 (planning grid tiles), page 4 (projection chart + milestones), page 7 (silent-gaps based on scored tiles).
3. **Flag the fixture surface.** The admin app has projection fixture tests — sample `CompassInputs` → expected output. A math change will flip fixture expectations. Not a bug — a signal.
4. **Flag compliance.** Projection math sits behind the report's headline numbers. A rate change that surfaces different numbers to existing clients is a notification-worthy change (consumer duty).
5. **Flag historical snapshot.** The project's convention (see `_AUDIT.md` §10.3) is to keep old tax-year files for replaying old sessions under their historical rates. If the change is a tax-year update, don't overwrite — add a new file.
6. Wait for explicit "yes" / "proceed".

## Background

Projection engine: `src/lib/compass/projection.ts`. Pure TypeScript, deterministic, no side effects. Produces a year-by-year projection from `CompassInputs` (built from session answers).

Supporting files:
- `src/lib/compass/types.ts` — `ProjectionYear`, `CompassInputs`, `CompassReport`.
- `src/lib/compass/tile-scoring.ts` — scores 12 planning-grid tiles from inputs + report.
- `src/lib/compass/inputs.ts` — maps runtime answers → engine bands.
- `src/lib/compass/tax-year-2025-26.ts` — single source of truth for every UK tax / regulatory constant (use `edit-tax-year-constants` for in-year changes; `annual-tax-year-update` for the rollover).

## Inputs you need from the user

1. **What's changing.** A rate, a formula, a band threshold.
2. **The new value or logic.** Verbatim.
3. **Source of the change.** Why: new economic assumption? Compliance update? Client feedback? Captured for commit message.

## Workflow

1. **Human confirm gate (above).**

2. **Read the relevant file(s).** Understand the current logic, the inputs it consumes, the outputs it produces.

3. **Edit the math.** Preserve:
   - Function signatures (consumers rely on shape).
   - Deterministic purity.
   - Type correctness — every output field still typed by `ProjectionYear`.
   - Named constants — prefer editing a constant than inlining a new number.

4. **Run fixture tests.**
   ```bash
   cd master_template
   npm run test
   ```
   Fixtures fail when outputs change. Expected — don't edit them to pass without a deliberate review.

5. **Review each failing fixture.** Is the new output correct? If yes, update the fixture snapshot with a clear commit message.

6. **Validate TS + build.**
   ```bash
   npm run typecheck
   npm run build
   ```

7. **Render a sample report.** Walk through a sample session's projection chart and report numbers with the user. Confirm they're sensible under the new math.

8. **Summarise.** File(s), constant or formula changed, fixture deltas, sample-render comparison.

## Files touched

- `master_template/src/lib/compass/projection.ts` — the primary file.
- Possibly `master_template/src/lib/compass/assumptions.ts` (if constants extracted).
- Possibly `master_template/src/lib/compass/types.ts` (if a new output field).
- Fixture test files (after deliberate review).

## Invariants — never break these

- **Human-confirm gate first.**
- **Deterministic purity.** No random sources, no side effects, no date-dependent logic unless intentional.
- **Types preserved.** `ProjectionYear` shape unchanged.
- **Fixture failures are signals.** Update intentionally, not silently.
- **For tax-year changes, use the annual-update pattern.** Don't overwrite historical rates — add new files. See `annual-tax-year-update` skill.
- **Functions still idempotent.** Same inputs → same outputs, every time.

## Examples

### Example 1 — bump balanced growth rate

**User:** "Bump the balanced growth rate from 5.5% to 6.5%."

**Confirm:**

> Current `BALANCED_GROWTH_RATE = 0.055` in `src/lib/compass/assumptions.ts`. Proposed → `0.065`.
>
> Downstream: every projection for "balanced" risk profile produces higher terminal value. Every fixture test anchored on balanced growth will fail and need updating. The projection chart's slope steepens; milestones shift earlier.
>
> Compliance: if existing clients have reports anchored on 5.5%, changing the assumption affects their next-report numbers. Is this a policy update the firm has signed off on?
>
> Confirm.

On confirmation, edit the constant. Run tests — several fail. Walk each failure: is the new number correct? Update fixtures.

### Example 2 — change an essential-spend band threshold

**User:** "The 'low essential spend' band threshold should be 2 months, not 3."

Edit the threshold constant. Re-score fixture sessions — their tile statuses shift. Review, confirm.

### Example 3 — don't do this: silently fix a test

Bad: tests fail after a rate change; edit the fixtures to match without review. Now the engine's new behaviour is "correct by definition" and nobody can tell if it's intended.

Always: surface each fixture failure, walk through the expected vs actual, confirm with user, then update.

### Example 4 — don't do this: tax-year overwrite

User: "Update state pension figure to the 2027/28 value." That's not this skill — use `annual-tax-year-update`. Historical rates must be preserved for replaying old sessions.

## When NOT to use this skill

- **Tax-year rates update** → `annual-tax-year-update`.
- **Per-segment content variants in the report** → audit 8.14 (not in this batch).
- **Projection display / rendering** → template change (`change-report-template-structure`).

## Related skills

- `annual-tax-year-update`, `change-report-template-structure`, `rename-placeholder-token`.

## Gotchas

- **Tile scoring consumes projection output.** A projection change propagates through `scoreAllTiles()` — tile statuses flip from green to amber, say. Review tile summaries for sample sessions.
- **Chart axes.** If the projection bands widen, chart y-axis scales change. Visual regression on the projection chart.
- **Assumptions documentation.** The methodology page lists key assumptions. A rate change in the engine without a methodology update creates inconsistency — the report now says 5.5% while the engine uses 6.5%. Coordinate with `edit-disclaimer-or-methodology`.
- **Floats.** Projection math uses floats; small formula changes can accumulate rounding differences across years. Snapshot tests that compare to 2 d.p. are usually resilient; tests comparing to full precision may surface spurious diffs.
