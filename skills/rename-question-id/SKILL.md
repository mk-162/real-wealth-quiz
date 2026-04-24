<!-- _AUDIT.md entry: 10.1 -->
---
name: rename-question-id
description: Rename a question id (e.g. `Q3.1` → `Q3.1a`) across the matrix, every screen's `q_refs`, every provocation/awareness trigger, every `logged_as`, and any code reference. Cross-cutting and high-risk — do it transactionally. Use this skill whenever the user asks to rename a question id, bump a q_ref to make room for a new sub-question, reshape the numbering scheme, or otherwise cascade a question-id change through the codebase. Triggers on phrasings like "rename Q3.1 to Q3.1a to make room for a new subquestion", "renumber the Compass questions", or "rename the q_ref on the intent screen".
---

# Rename a question id

## What this skill does

Performs a transactional rename of a `questionId` across every file that references it:
- `content/generated/matrix.json` — the row's `questionId` field.
- `content/screens/*.md` — every screen's `q_refs` entry.
- `content/provocations/*.md` + `content/awareness-checks/*.md` — any trigger DSL referencing the id (rare but possible).
- `src/lib/segmentation/engine.ts` — any predicate keyed on the id.
- `src/lib/compass/inputs.ts` — any input-band mapper keyed on the id.
- Any other code reference.

## Background

Question ids are foreign keys into the matrix. A silent rename (change matrix row only, don't update screens) breaks the runtime: screens with the old q_ref fail to look up their visibility row.

The admin has a "rename question id" transactional action that does the cascade in one atomic commit. This skill documents the hand-edit equivalent.

## Inputs you need from the user

1. **Old id.** `Q<x.y>`.
2. **New id.** `Q<x.y[a]>`. Same format.

## Workflow

1. **Human confirm gate (recommended).** This is cross-cutting and high-risk:

   > Renaming `Q3.1` to `Q3.1a` touches the matrix row, every screen with `q_refs: [..., "Q3.1", ...]`, and any engine predicate or trigger DSL keyed on the old id. I'll do the rename in a single commit so nothing dangles. Confirm to proceed.

   Wait for explicit "yes".

2. **Grep before touching anything.**
   ```bash
   cd master_template
   grep -rn "\"Q3.1\"" content/ src/
   grep -rn "'Q3.1'" content/ src/
   grep -rn "Q3.1" content/generated/matrix.json
   ```
   Capture every hit. This is the work list.

3. **Plan the rename. Each hit becomes one edit:**
   - Matrix row: `"questionId": "Q3.1"` → `"questionId": "Q3.1a"`.
   - Screen `q_refs`: `"Q3.1"` → `"Q3.1a"` in every affected screen.
   - Engine predicate: `'Q3.1': (a) => ...` key renamed.
   - Trigger DSL: very rare; rename in place.

4. **Execute all edits in one pass.** A single commit. No partial state.

5. **Validate.**
   ```bash
   npm run content:check
   npm run typecheck
   npm run voice:check
   ```

6. **Re-grep** for the old id. Expect zero hits.

7. **Summarise.** Every file touched, count of references flipped, confirmation of zero remaining old-id hits.

## Files touched

Many, by design:
- `master_template/content/generated/matrix.json` (1 row).
- `master_template/content/screens/*.md` (every screen that referenced the old id).
- `master_template/src/lib/segmentation/engine.ts` (if predicate exists).
- `master_template/src/lib/compass/inputs.ts` (if band-mapper keyed on the id).
- Any provocation / awareness file with trigger DSL that names the id (very rare).
- Any test fixture naming the id.

## Invariants — never break these

- **Atomic.** One commit. Partial renames break runtime silently.
- **Post-rename, zero hits on old id.** Always grep after.
- **Preserve cell values.** This skill only renames; Y/C/N cells stay put.
- **Preserve predicate bodies.** Only the key changes.
- **Round-trip fidelity.** YAML AST + JSON canonical format.

## Examples

### Example 1 — Q3.1 → Q3.1a

**User:** "Rename Q3.1 to Q3.1a to make room for a new Q3.1 subquestion."

Grep: let's say 5 hits.
- `content/generated/matrix.json` — 1 hit (row key).
- `content/screens/3.1-what-brought-you.md` — 1 hit (`q_refs`).
- `src/lib/segmentation/engine.ts` — 0 hits (Q3.1 is Y-everywhere, no predicate).
- `src/lib/compass/inputs.ts` — 0 hits.
- Other content — 0.

Plan: 2 edits. Execute. Validate. Re-grep — expect zero. Summary:

> Renamed `Q3.1` → `Q3.1a` across 2 files:
> - `content/generated/matrix.json` (row key)
> - `content/screens/3.1-what-brought-you.md` (q_refs)
>
> No engine predicates, no trigger DSL, no compass mapper referenced the old id. Zero residual hits on `Q3.1` post-rename. Now safe to add a new `Q3.1` for the new subquestion.

### Example 2 — heavy cascade

**User:** "Rename Q5.2 to Q5.2a — we're adding branching."

Q5.2 is referenced in matrix, in a screen, and has a conditional predicate. All three files flipped in one commit.

### Example 3 — don't do this: rename in pieces

Bad: rename matrix row today, rename screen tomorrow. Between commits, every user session targeting Q5.2 at runtime fails its visibility lookup. Always atomic.

## When NOT to use this skill

- **Change cell values** → `change-matrix-cell`.
- **Add a new matrix row** → `add-matrix-row`.
- **Rename an option value (not a question id)** → `change-answer-option` (with its own cascade).
- **Restructure a whole section's numbering** — use this skill iteratively but plan the sequence carefully; each rename is atomic.

## Related skills

- `add-matrix-row`, `change-matrix-cell`, `change-engine-predicate`, `change-answer-option`.

## Gotchas

- **TypeScript catches some errors, not all.** Engine predicates keyed on a string literal `Q3.1` are typed by the `QuestionId` union — if that union is an enum, renaming fails to compile until the enum is updated. But if it's a loose string, the compiler misses the rename.
- **The admin's transactional rename action is preferred.** It does the cascade + validates + offers undo. Hand-edit only when the admin isn't available.
- **Test fixtures often hardcode question ids.** After renaming, run the full test suite — any fixture still using the old id will surface as a test failure.
- **Downstream session data.** Existing user sessions in localStorage keyed on the old id don't automatically migrate. Usually acceptable (they re-enter answers on next visit) but flag if the rename is mid-release with live sessions in flight.
