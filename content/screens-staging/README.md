# Staged screens (not yet live)

This folder holds markdown drafts for the four new Compass screens that the
PDF report needs. They are **not** picked up by the content build — they live
outside `content/screens/` on purpose so a broken file here cannot break
production.

## What's here

| File | New fields captured | Conditional |
|---|---|---|
| `compass-01-pension-pot.md`  | `totalPensionValue`                                          | any respondent with a pension |
| `compass-02-liquid-wealth.md` | `cashSavings`, `isaBalance`, `giaBalance`                    | all |
| `compass-03-contributions.md` | `monthlySavingAmount`, `employerPensionContribPct`, `mortgageMonthlyPayment`, `mortgageEndAge` | all (mortgage items conditional) |
| `compass-04-state-pension-ni.md` | `statePensionExpectedAmount`, `niQualifyingYears`, `retirementSpendRatio` | all |

These provide the 12 fields that `src/lib/compass/inputs.ts` currently expects
but are not yet collected by the live form. See `PHASE_1_NOTES.md` for the
activation plan.

## Activation checklist

1. Open each `compass-0X-*.md` and finalise the copy with the content lead.
2. Rename and move to `content/screens/` using the live naming convention
   (probably `4.E.1-…`, `4.E.2-…`, etc. — confirm the next free slot with engineering).
3. Update the question-ID references in `src/lib/compass/inputs.ts` (`INPUT_QUESTION_IDS`) to match the final IDs in the frontmatter.
4. Update `Question Segment Master.xlsx` Sheet 2 to add the new rows with
   `Y` / `C` / `N` per segment. Use `scripts/add-new-compass-questions.py`
   for a safe, scripted edit (see that script's docstring).
5. Run `npx tsx scripts/parse-segment-master.ts` to regenerate `content/generated/matrix.json`.
6. Run `npm run content:check` then `npm run content:build` to validate and compile.
7. Preview locally (`npm run dev`) — confirm the new screens render in the journey.
8. Commit and push on `dev`.

**Do not** bypass step 4 by editing `matrix.json` directly — the next xlsx parse will overwrite it.
