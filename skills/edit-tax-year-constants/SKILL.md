<!-- _AUDIT.md entry: 10.3 -->
---
name: edit-tax-year-constants
description: Update one or more UK tax / regulatory constants (income tax bands, NI thresholds, IHT nil-rate band, ISA allowance, pension annual allowance, state pension rate, etc.) used by the Compass projection engine. Use this skill whenever the user asks to bump the personal allowance, change the basic-rate threshold, update the state pension figure, change the ISA allowance, refresh the IHT nil-rate band, switch a Scottish band, or otherwise modify any value in `src/lib/compass/tax-year-2025-26.ts`. Triggers on phrasings like "bump the personal allowance to £13,000", "the new state pension rate is £12,000", "the ISA allowance is now £25k", "Scottish higher rate moved to 43%", or "update the corporation tax rate".
---

# Edit tax-year constants

## What this skill does

Updates one or more values in `master_template/src/lib/compass/tax-year-2025-26.ts` — the single source of truth for every UK tax / regulatory constant the projection engine consumes. Preserves file shape (named exports, JSDoc citations, types) and runs `tsc --noEmit` after the edit so any syntax slip surfaces immediately.

## Background

`tax-year-2025-26.ts` was introduced during the Compass engine overhaul (see `docs/compass-engine-overhaul-2026-04-27.md`). Every constant in the file carries a JSDoc comment naming the source (HMRC, DWP, Bank of England, Autumn Budget, etc.) so the methodology page can stay in sync. The file is imported from `src/lib/compass/projection.ts` and `src/lib/compass/tile-scoring.ts` — both will fail to compile if a constant is renamed or its type changes.

The admin app exposes a structured-form editor at `/tax-year` that reads the file, lets the user edit values, and writes back via the FS bridge with a typecheck on save. This skill documents the hand-edit equivalent and the cross-references the editor handles automatically.

## Inputs you need from the user

1. **Which constant(s).** By name ("personal allowance", "ISA allowance") or by category ("Scottish bands", "IHT", "state pension"). Map plain-English to the symbol exported from the file:
   - Personal allowance → `INCOME_TAX_PERSONAL_ALLOWANCE`
   - Basic-rate threshold → `INCOME_TAX_BASIC_RATE_LIMIT`
   - Higher-rate threshold → `INCOME_TAX_HIGHER_RATE_LIMIT`
   - Additional-rate threshold → `INCOME_TAX_ADDITIONAL_RATE_LIMIT`
   - State pension full rate → `STATE_PENSION_FULL_RATE_2025_26`
   - ISA annual allowance → `ISA_ANNUAL_ALLOWANCE`
   - Pension annual allowance → `PENSION_ANNUAL_ALLOWANCE`
   - Money purchase annual allowance → `MPAA`
   - IHT nil-rate band → `IHT_NIL_RATE_BAND`
   - Residence nil-rate band → `IHT_RESIDENCE_NIL_RATE_BAND`
   - RNRB taper threshold → `IHT_RNRB_TAPER_THRESHOLD`
   - Capital gains annual exempt amount → `CGT_ANNUAL_EXEMPT_AMOUNT`
   - Dividend allowance → `DIVIDEND_ALLOWANCE`
   - Corporation tax → `CORPORATION_TAX_MAIN_RATE`
   - BADR rate → `BADR_RATE_TO_APR_2026` / `BADR_RATE_FROM_APR_2026`
   - Scottish bands → `SCOTTISH_*` symbols
2. **The new value.** Numeric (no commas). Currency in pounds, percentages as decimals (`0.40` for 40%) or basis points — match the file's existing convention for that symbol.
3. **Source citation.** Where the new value came from (HMRC publication, Budget speech, statutory instrument). Update the JSDoc comment beside the constant.

## Workflow

1. **Read the current file** — `master_template/src/lib/compass/tax-year-2025-26.ts`. Find the symbol(s) the user wants to change. Note the existing JSDoc comment.

2. **Edit the value(s).** Preserve:
   - The export name (other files import by name).
   - The TypeScript type annotation if present.
   - The JSDoc layout, with the new source citation.

3. **Update the methodology table.** `content/report/methodology.md` Section 2 lists every assumption the engine uses — find the matching row and update both the value and the source citation. The two files MUST stay in lockstep; the methodology page is what the user reads in their PDF report.

4. **Typecheck.**
   ```bash
   cd master_template
   npx tsc --noEmit
   ```
   Any rename, missing import, or type drift surfaces here. Do NOT skip — a corrupted constant silently breaks the projection (returns NaN downstream).

5. **Content check.**
   ```bash
   npm run content:check
   ```
   Catches malformed methodology table rows.

6. **Test the engine.**
   ```bash
   npx tsx scripts/test-tile-scoring.ts
   npx tsx scripts/test-tile-scoring-full.ts
   ```
   Tile thresholds reference some of these constants; threshold tests catch drift.

7. **Spot-check a fixture report.** `npm run dev` and open `/report/master/S3` — visually confirm the gauge, balance strip, and assumptions footer reflect the new value.

8. **Summarise.** Report: each constant changed (before → after), the methodology row also flipped, typecheck result, and any test that surfaced a regression.

## Files touched

- `master_template/src/lib/compass/tax-year-2025-26.ts` — the constant file.
- `master_template/content/report/methodology.md` — the published assumptions table (must stay in lockstep).

If you're rolling to a new tax year (not just patching the current one):

- Copy the file to `tax-year-<new-yr>.ts` and switch all imports — keep the old file intact for replaying old sessions (immutable snapshot principle).

## Invariants — never break these

- **Never rename a symbol without a follow-up grep.** Every `import { X } from './tax-year-2025-26'` must update. The typecheck catches it but only if you re-run.
- **Never change the type of a constant.** A value that was `number` must stay `number`. The engine assumes typed numerics.
- **Never edit the constant without updating the methodology row.** The PDF report quotes the methodology — drift here is publicly visible.
- **Never edit Scottish bands without flagging.** The Scottish band logic in `projection.ts` is a separate code path; some authors don't realise it exists.
- **Round-trip via the editor.** The admin's `/tax-year` editor preserves file shape; if you hand-edit, mimic the existing JSDoc + export structure.

## Examples

### Example 1 — bump the state pension

**User:** "The new state pension rate is £12,000 for 2026/27."

Constant: `STATE_PENSION_FULL_RATE_2025_26`. Decision: rolling to a new tax year is a separate operation (copy file, switch imports). For a within-year correction, just update the value + JSDoc + methodology row.

```typescript
/** Full new state pension, 2025/26 (£/year). DWP, April 2025 uprating. */
export const STATE_PENSION_FULL_RATE_2025_26 = 12_000;
```

Methodology row:
```markdown
| State pension (full new rate, 2025/26) | £12,000 per year | DWP published rate, April 2025 uprating |
```

Typecheck: clean. Tests: no regression.

### Example 2 — update the IHT nil-rate band

**User:** "IHT nil-rate band moves to £350k from April 2027."

This is a future-dated change. Don't edit `tax-year-2025-26.ts` — flag the user that:
- The current file represents 2025/26 rates.
- A new tax year file (`tax-year-2027-28.ts`) is the right destination.
- The methodology page may need a "future change" footnote.

Confirm intent before editing.

### Example 3 — don't do this: rename the symbol

**User:** "Rename `INCOME_TAX_PERSONAL_ALLOWANCE` to `PA_2025` — shorter."

Refuse without confirmation: every importer must update. If user confirms, do it as a transactional edit (rename + update every import + typecheck) similar to the rename-question-id pattern.

### Example 4 — Scottish band update

**User:** "Scottish higher rate moves to 43%."

Find the Scottish symbol (likely `SCOTTISH_HIGHER_RATE` or similar). Update the value (decimal: `0.43`). Update the JSDoc citation. Update the methodology row. Typecheck. Run the Scottish-band fixture test if one exists.

## When NOT to use this skill

- **Rolling to a new tax year (annual update).** That's a file-copy + import-switch operation; flag it as a multi-file change, not an in-place edit.
- **Changing the engine math itself** (formulas, drawdown order, taper logic) → that's `change-projection-math` (tier 3, code change).
- **Editing the methodology prose** (Sections 4 + 5 — caveats, regulatory disclosures) → `edit-report-block-global`.
- **Editing the assumptions footer copy.** That's `edit-assumptions-footer` (a content-only surface).

## Related skills

- `edit-assumptions-footer` — the published assumptions footer copy at `content/report/assumptions.md`.
- `edit-report-block-global` — the methodology page (`content/report/methodology.md`).
- `change-projection-math` — engine math edits (Tier 3).
- `annual-tax-year-update` — the once-a-year rollover skill.

## Gotchas

- **The methodology table is what the client sees.** The constant file is engine-only. Drift between the two is publicly visible — both must change, every time.
- **Some constants drive thresholds.** Tile thresholds in `tile-scoring.ts` import constants from this file. A bumped allowance can shift a tile from green to amber for many users — flag in the summary if the constant has scoring downstream.
- **The admin's `/tax-year` editor runs the typecheck for you.** If you're editing inside the admin, the integrity tray will surface a typecheck error before you ship. If hand-editing, run `npx tsc --noEmit` yourself.
- **Don't conflate the symbol's name with the displayed label.** The methodology table uses human-readable labels ("Income tax — personal allowance"); the constant uses an engine name (`INCOME_TAX_PERSONAL_ALLOWANCE`). Map carefully.
