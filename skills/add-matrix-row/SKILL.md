<!-- _AUDIT.md entry: 2.2 -->
---
name: add-matrix-row
description: Register a new question id in `content/generated/matrix.json` with explicit Y/C/N values for each of the 9 segments. Use this skill whenever the user asks to add a new matrix row, register Q-something in the matrix, add a new question's visibility row, or otherwise create an entry for a question id that doesn't yet exist. Triggers on phrasings like "register Q4.A.1 in the matrix", "add a row for the new compass question", or "the new screen needs a matrix entry".
---

# Add a matrix row

## What this skill does

Appends (or inserts) a new object `{ questionId, S1, S2, S3, S4, S5, S6, S7, S8, S9 }` into `master_template/content/generated/matrix.json`. Preserves every existing row, JSON formatting (2-space indent, trailing newline), and column order.

## Background

The matrix is now authored (the old xlsx pipeline is archived — see `HOW_IT_IS_MANAGED.md`). Each row gates one question across 9 segments. `Y` = always shown, `C` = conditional (requires predicate in `src/lib/segmentation/engine.ts`), `N` = never shown.

## Inputs you need from the user

1. **The `questionId`.** Format `Q<major>.<minor>` or `Q<major>.<sub>.<n>` (e.g. `Q4.A.1`).
2. **The 9 cell values** (S1–S9). Accept shorthand like "Y for everyone", "Y except S8 and S9 which are N", "C for HNW".
3. **The screen backing it.** Confirm a screen file references this q_ref (otherwise the row is orphaned).

## Workflow

1. **Check for duplicate.** Read `content/generated/matrix.json`. If `questionId` already exists, this is `change-matrix-cell`, not `add-matrix-row`. Stop and redirect.

2. **Check for the backing screen.** Grep `q_refs: *.*"<questionId>"` across `content/screens/`. If no screen references this id, confirm with the user — a row with no screen is dead until a screen is added.

3. **Assemble the row.** Exactly 9 segment columns, values one of `"Y"`, `"C"`, `"N"`. Example:
   ```json
   {
     "questionId": "Q4.A.6",
     "S1": "Y", "S2": "Y", "S3": "Y", "S4": "Y", "S5": "Y",
     "S6": "Y", "S7": "Y", "S8": "N", "S9": "Y"
   }
   ```

4. **Insert into the array.** Preserve the existing array order. By convention rows are grouped by section; insert next to neighbours of the same section (e.g. new Q4.A.6 goes after Q4.A.5).

5. **If any cell is `C`, ensure a predicate exists** in `src/lib/segmentation/engine.ts`. If not, call `add-engine-predicate`, or confirm with the user that silent-skip-for-this-segment is the intent.

6. **Format.** `JSON.stringify(rows, null, 2) + '\n'`. 2-space indent, trailing newline. No tabs.

7. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Fails on missing columns, invalid values, or a screen referencing this q_ref but the row missing a column.

8. **Summarise.** Row added, cell values, predicate status (already present / added / needs adding / intentional silent-skip).

## Files touched

- `master_template/content/generated/matrix.json` — new row only.
- Optionally `master_template/src/lib/segmentation/engine.ts` — new predicate for a C cell.

## Invariants — never break these

- **`questionId` format.** `Q<major>.<minor>` or `Q<major>.<sub>.<n>`. Uppercase Q.
- **9 segment columns, all present, values exactly `"Y"` / `"C"` / `"N"`.**
- **C without a predicate is silent-skip.** Fine if intentional, but confirm.
- **JSON formatting matches neighbours.** 2-space indent, quoted keys, trailing newline.
- **Never reorder existing rows.** Insert only.
- **Round-trip fidelity.** `JSON.stringify(arr, null, 2)` + `\n`.

## Examples

### Example 1 — new Q4.A.6 for pension contributions

User: "Add a row for Q4.A.6 — Y everywhere except S8 retired, which is N."

```json
{
  "questionId": "Q4.A.6",
  "S1": "Y", "S2": "Y", "S3": "Y", "S4": "Y", "S5": "Y",
  "S6": "Y", "S7": "Y", "S8": "N", "S9": "Y"
}
```

Predicate check: no C cells, so no engine change needed.

### Example 2 — new Q with a conditional

User: "Q5.4 — business exit valuation. Y for S5 and S6. C for S7 (only if they're a business owner). N everywhere else."

Row:
```json
{
  "questionId": "Q5.4",
  "S1": "N", "S2": "N", "S3": "N", "S4": "N", "S5": "Y",
  "S6": "Y", "S7": "C", "S8": "N", "S9": "N"
}
```

Predicate check: `engine.ts` must gain `'Q5.4': (a) => a.workStatus === 'business_owner' || a.workStatus === 'self_employed'`. Either add now (via `add-engine-predicate`) or surface as a follow-up.

### Example 3 — don't do this: duplicate row

User: "Add a row for Q3.2." If Q3.2 already exists, stop. Redirect to `change-matrix-cell`.

## When NOT to use this skill

- **Edit existing cells** → `change-matrix-cell`.
- **Remove a row** → `remove-matrix-row`.
- **Add a predicate** → `add-engine-predicate`.
- **Rename a question id** → `rename-question-id` (high-risk cascade).

## Related skills

- `change-matrix-cell`, `remove-matrix-row`, `add-engine-predicate`, `change-engine-predicate`, `rename-question-id`, `add-question-screen`.

## Gotchas

- **Character-cased keys.** Uppercase `"S1"`, `"S2"`, ..., `"S9"`. Not `"s1"`, not `"S01"`.
- **Insertion position matters for readability, not correctness.** The engine doesn't care where the row sits — but reviewers expect logical grouping. Match the surrounding neighbourhood.
- **Orphan rows are silent.** A row with no screen q_ref is harmless; no screen means no question shown. But it's dead code and clutters the file. Remove if not needed.
