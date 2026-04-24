<!-- _AUDIT.md entry: 2.3 -->
---
name: remove-matrix-row
description: Delete a question row from `content/generated/matrix.json`. Use this skill whenever the user asks to drop a matrix row, remove a question from the matrix entirely, retire a q_ref, or clean up an orphan row. Triggers on phrasings like "drop Q10.3 from the matrix", "remove the old Q2.5 row", or "retire this question everywhere".
---

# Remove a matrix row

## What this skill does

Deletes one row from `content/generated/matrix.json` and, in the same pass, surfaces every screen whose `q_refs` still points at the removed id — those are dangling references to clean up.

## Inputs you need from the user

1. **The `questionId`.** `Q<x.y>`.
2. **Intended follow-up.** Just remove the row and flag orphans? Or do the full deprecation — remove the row AND the screen that references it? This skill's scope is the matrix; screens are `1.8` (not in this batch).

## Workflow

1. **Confirm the row exists.** Read `matrix.json`. If missing, stop — nothing to remove.

2. **Grep for orphans before deleting.**
   ```bash
   cd master_template
   grep -rn "\"<questionId>\"" content/screens/ src/lib/
   ```
   Look for:
   - Screens with `q_refs: [..., "Q<x.y>", ...]`.
   - Engine predicates keyed on the id (`'Q<x.y>': (a) => ...`).
   - Trigger DSL or logged_as referencing it.

3. **Present the cascade.** List what else mentions the id. Ask the user:
   - Are they removing the question entirely (including the screen)? If yes, plan that as a separate commit.
   - Are they leaving a dangling q_ref on purpose (unusual)?
   - Do they want the matrix row removed but screens to keep their q_refs (breaks at runtime)?

4. **If a conditional predicate exists on this id, remove it too.** In `engine.ts`, delete the entry in `conditionals`. Confirm with user.

5. **Red flag: zero-Y column.** After removal, check each segment's column: if a segment now has zero `Y` cells across all remaining rows, that segment would see no questions. Surface this — it's almost always a mistake.

6. **Remove the row.** JSON array splice. Preserve 2-space indent, trailing newline.

7. **Validate.**
   ```bash
   npm run content:check
   ```
   Fails on dangling q_refs — that's the signal to clean up screens next (via audit 1.8 skill).

8. **Summarise.** Row removed, orphans surfaced, predicate (if any) removed, any zero-Y columns flagged.

## Files touched

- `master_template/content/generated/matrix.json`.
- Possibly `master_template/src/lib/segmentation/engine.ts` (predicate removal).
- Flagged (not edited by this skill): screen files with dangling q_refs.

## Invariants — never break these

- **Never leave a dangling q_ref without flagging.** The runtime skips unmatched q_refs but it's a visible warning.
- **Never delete a row in the middle of array without checking order.** JSON arrays are ordered; the engine reads in declared order.
- **A segment with zero Y cells is a red flag.** Confirm intent.
- **Round-trip fidelity.** `JSON.stringify(arr, null, 2)` + `\n`.

## Examples

### Example 1 — remove a deprecated question

**User:** "Drop Q10.3 — we never used it."

Grep: no screens reference it. No predicate in `engine.ts`. Clean removal.

Delete the row. Summary:

> Removed `Q10.3` from matrix. No orphans. All 9 segment columns still have at least one `Y` cell per question — safe.

### Example 2 — removal with live orphans

**User:** "Drop Q4.B.3 — we're replacing it."

Grep:
- `content/screens/4.B.3-protection.md` — `q_refs: ["Q4.B.3"]`.
- No engine predicate.

Present:

> Removing Q4.B.3 while screen `4.B.3-protection.md` still references it will leave a dangling q_ref (the runtime will skip the screen's matrix lookup silently — visible in dev warnings only).
>
> Options:
> 1. Remove the row AND the screen in one commit.
> 2. Remove the q_ref from the screen first, then the row.
> 3. Hold — you're mid-migration and the screen will be updated separately.
>
> Which?

### Example 3 — don't do this: silent removal

Bad: user says "drop Q4.B.3"; you delete without grepping; the screen silently breaks.

## When NOT to use this skill

- **Flip cell values** → `change-matrix-cell`.
- **Remove a predicate but keep the row** → `change-engine-predicate` (set back to `() => true` or rewrite).
- **Remove the backing screen** → audit 1.8 (not in this batch).

## Related skills

- `change-matrix-cell`, `add-matrix-row`, `change-engine-predicate`.

## Gotchas

- **`content:check` catches dangling q_refs.** Run it — the failure message names the screen. Fix in a follow-up commit.
- **Don't remove a row to "fix" a screen-level issue.** If a screen is showing wrongly, usually the fix is to flip cells, not delete the row.
