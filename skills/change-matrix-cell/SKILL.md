---
name: change-matrix-cell
description: Flip a Y / C / N cell in the Real Wealth question × segment matrix that controls which respondents see which questions. Use this skill whenever the user asks to hide a question from a segment, show a previously-hidden question, make a question conditional, change who sees Q-something, adjust segment routing, turn a question on/off for a persona, or otherwise modify `content/generated/matrix.json`. Triggers on any phrasing about "who sees X" or "change the matrix" — including when the user just names the segment ("don't show this to S1") without saying the word "matrix".
---

# Change a matrix cell

## What this skill does

Edits one or more cells in `master_template/content/generated/matrix.json` — the Y/C/N grid that gates question visibility per segment (S1 … S9). Preserves JSON byte-shape (2-space indent, trailing newline, segment-column order). Runs the content validator before handing back.

## Background — the three cell values

- **`Y`** (shown) — this segment always sees the question.
- **`C`** (conditional) — this segment sees the question only when the predicate in `src/lib/segmentation/engine.ts` returns `true` for the user's gating answers. If no predicate exists for a C cell, the engine silently skips the question.
- **`N`** (hidden) — this segment never sees the question.

## Policy reminders (from the audit)

- **The matrix wins.** A screen's `segments_served: [all]` frontmatter is declarative intent. The matrix row is the runtime gate. Keep screens at `[all]` in almost every case; use the matrix to do per-segment gating.
- **`content/generated/matrix.json` is authored, not generated.** The old `Question Segment Master.xlsx` + `scripts/parse-segment-master.ts` pipeline is archived. Edit JSON directly.
- **`C` cells need predicates.** If you set a cell to `C` and no predicate exists in `engine.ts` for that `questionId`, the engine silently skips the question. Either add a predicate (see `add-engine-predicate` skill) or confirm with the user that C-without-predicate (permanent skip for this segment) is the intent.

## Inputs you need from the user

1. **Which question.** The `questionId` string (e.g. `Q3.2`, `Q4.A.1`, `Q5.3`). If the user named a screen (`3.1-what-brought-you`) or a concept ("the business exit question"), look up its `q_refs` in the screen file.
2. **Which segment(s).** One or many of `S1` – `S9`. Phrases like "HNW", "retired", "early accumulator" map via:
   - S1 Early accumulator · S2 Mass affluent · S3 High earner · S4 Senior professional · S5 Business growth · S6 Business exit · S7 Pre-retiree · S8 Retired · S9 HNW.
3. **The new value.** `Y` / `C` / `N`. If the user said "hide", "skip", "don't ask" → `N`. If "show" / "include" / "ask" → `Y`. If "sometimes" / "only if" / "conditional" → `C` (and ask about the predicate).

## Workflow

1. **Open the matrix.** Read `master_template/content/generated/matrix.json`. It's a JSON array of `{ questionId, S1, S2, … S9 }` objects.

2. **Find the row.** Match on `questionId`. If the row doesn't exist, STOP — this is the `add-matrix-row` skill's job. Don't silently create it.

3. **Record the before state.** Snapshot the cell(s) you're about to change so you can summarise accurately afterward.

4. **Edit the cell(s).** Only change the specified cells. Do not touch other rows, other segments on the same row, or the array order. Values must be exactly the string `"Y"`, `"C"`, or `"N"`.

5. **Preserve formatting.** JSON writes must:
   - Use 2-space indent (match the existing file).
   - End with a single `\n`.
   - Keep segment column order `S1, S2, S3, S4, S5, S6, S7, S8, S9`.
   The idiomatic way: `JSON.stringify(rows, null, 2) + '\n'`. Do not use tabs, single-line, or mixed indent — the content:check will flag it.

6. **If any new cell is `C`, check the predicate.** Read `master_template/src/lib/segmentation/engine.ts`. If the `questionId` is NOT a key in the `conditionals` object, either:
   - Add a predicate (use the `add-engine-predicate` skill).
   - OR confirm with the user that "silent-skip for this segment" is the intent.
   For C cells where the predicate depends on a follow-up answer (not in `GatingAnswers`), the accepted pattern is a stub `() => true` with a comment — see `Q4.3`, `Q4.C.2`, `Q4.1a`, `Q4.3a` in `engine.ts`.

7. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   This catches missing columns, invalid values, and orphan rows. Fix anything it flags before handing back.

8. **Summarise.** Report: the row, the before/after values, whether any predicate action was taken, and whether the validator passed. Don't commit — the user does that.

## Files touched

- `master_template/content/generated/matrix.json` — the only file for a pure cell flip.
- `master_template/src/lib/segmentation/engine.ts` — only if a new `C` cell needs a predicate.

## Invariants — never break these

- **Never edit a `questionId` string.** It's the foreign key that screen `q_refs` point at. Renaming is a separate, high-risk skill.
- **Never remove a segment column** (S1–S9 must all be present on every row).
- **Never add a new row here.** That's `add-matrix-row`.
- **Never reorder rows** — keep the existing array order; it matches the question-order the engine reads.
- **Never use lowercase `y`/`c`/`n` or boolean true/false.** The schema is a three-state string enum: `"Y"` | `"C"` | `"N"`.

## Examples

### Example 1 — hide one question from one segment

**User:** "Don't show Q5.3 to S1 anymore — too advanced for early accumulators."

**Before (fragment):**
```json
{
  "questionId": "Q5.3",
  "S1": "Y",
  "S2": "Y",
  ...
}
```

**After:**
```json
{
  "questionId": "Q5.3",
  "S1": "N",
  "S2": "Y",
  ...
}
```

Predicate check: not needed (cell went from Y to N, no new C). Validation: clean.

### Example 2 — add a conditional with an existing predicate

**User:** "Make Q3.2 conditional for S9 — only ask high-net-worth folks about essential spend if they answered Q3.1."

**Before:**
```json
{ "questionId": "Q3.2", ..., "S9": "Y" }
```

**After:**
```json
{ "questionId": "Q3.2", ..., "S9": "C" }
```

Predicate check: `engine.ts` already has `'Q3.2': (a) => a.income !== 'prefer_not_to_say'`. Good — the intent matches. No code change needed.

### Example 3 — conditional WITHOUT an existing predicate

**User:** "Make Q4.B.1 conditional for S6."

Check `engine.ts` — `Q4.B.1` entry exists: `(a) => a.workStatus !== 'fully_retired' && a.workStatus !== 'partly_retired'`. That's the "not retired" predicate. Does it match the user's intent for S6 (business exit)? Business-exit users are typically NOT retired yet, so the predicate will usually return `true` → Q4.B.1 will usually fire for S6. If that matches intent, proceed. If not, either add a new, more specific predicate or pick `Y` / `N` instead.

### Example 4 — bulk change across multiple segments

**User:** "Show the new Compass pension question to everyone except S8 and S9."

Translate: `Q4.A.1`, set S1–S7 = `Y`, S8 = `N`, S9 = `N`. Read the row, flip the cells that aren't already at the target value, save.

## When NOT to use this skill

- **The question doesn't exist in the matrix yet** → use `add-matrix-row`.
- **The question needs to be removed entirely** → use `remove-matrix-row`.
- **The user wants a different predicate on an existing C cell** → use `change-engine-predicate`.
- **The user wants to rename a questionId** → use `rename-question-id` (high-risk, cascades everywhere).

## Related skills

- `add-matrix-row` — register a new `questionId` in the matrix.
- `add-engine-predicate` — wire a predicate for a new or existing C cell.
- `change-engine-predicate` — modify an existing predicate's logic.
- `rename-question-id` — cascading rename across matrix + screens + triggers.

## Gotchas

- **Predicate drift.** The admin app has a vendored parse-only DSL validator at `admin_app/features/shared/dsl.ts`. If you change a predicate's logic, the admin's DSL parity test won't catch it (it only checks trigger DSL, not engine predicates). Manually verify the predicate does what the user expects.
- **Matrix precedence over segments_served.** If a screen has `segments_served: [S3, S4]` but the matrix has `Y` for S5, the matrix wins — S5 gets asked. This is intentional (see `docs/Guide.md` §Matrix precedence). Don't "fix" segments_served to match the matrix unless the user asked for that.
- **Character-cased segment keys.** The matrix uses `"S1"`, `"S2"`, etc. — uppercase. Don't write `"s1"` or `"S01"`.
- **Empty predicate for a C cell is a silent skip.** This is sometimes the desired behaviour (e.g. the runtime has its own conditional_reveal that does the gating). When in doubt, check the screen's input-level `conditional_reveal` field — if it exists and matches the intent, C-with-stub-predicate is correct.
