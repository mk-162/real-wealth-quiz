<!-- _AUDIT.md entry: 2.1 (alias of change-matrix-cell with the post-S1 mental model) -->
---
name: edit-screen-audience
description: Edit the per-screen `audience:` frontmatter block — flip a question's visibility for one or more segments between `shown`, `conditional`, and `hidden`. Use this skill whenever the user asks to change who sees a question, hide a question from a segment, expand a question's audience, set conditional visibility, or otherwise modify a screen's `audience` block. Triggers on phrasings like "show Q3.2 to S1", "hide Q5.3 from retired users", "make Q4.A.1 conditional for high-net-worth", "the early accumulator shouldn't see this", or just "change who answers Q-something". Equivalent intent to the older "change matrix cell" name.
---

# Edit a screen's audience

## What this skill does

Flips one or more cells in a screen's `audience:` block. After Phase 4 / S1, audience lives on each screen file's frontmatter — there is no separate matrix file. This skill is the post-simplification name for the same intent the older `change-matrix-cell` skill covers; it points at the same workflow with the new mental model in the description.

If you came here looking for `change-matrix-cell`, that skill still exists and is fully equivalent. Pick whichever name reads more naturally for the request.

## Background — where the audience lives

Each screen carries its own audience block, keyed by `questionId`:

```yaml
q_refs: ["Q3.2", "Q3.3"]
audience:
  "Q3.2":
    S1: hidden
    S2: shown
    S3: shown
    S4: shown
    S5: shown
    S6: shown
    S7: shown
    S8: shown
    S9: shown
  "Q3.3":
    S1: hidden
    S2: hidden
    S3: shown
    ...
```

Three cell values:

- **`shown`** — this segment always sees the question.
- **`conditional`** — visible only when a predicate in `src/lib/segmentation/engine.ts` (keyed by the same `questionId`) returns `true` for the user's gating answers. No predicate = silent skip.
- **`hidden`** — never visible.

The matrix the engine consumes is built at module load by `src/lib/questions/matrix.ts` walking every screen — change the audience block, the matrix updates.

## Inputs you need from the user

1. **Which question.** `questionId` (e.g. `Q3.2`, `Q4.A.1`, `Q5.3`). If the user named a screen or concept, look up the screen file and find the qid in its `q_refs`.
2. **Which segment(s).** One or many of S1–S9. Phrasings:
   - S1 Early accumulator · S2 Mass affluent · S3 High earner · S4 Senior professional · S5 Business growth · S6 Business exit · S7 Pre-retiree · S8 Retired · S9 HNW.
3. **The new value.** `shown` / `conditional` / `hidden`.

## Workflow

This skill delegates to `change-matrix-cell` for the actual file edit. The workflow is identical:

1. Find the owning screen — search `content/screens/` for a file whose `q_refs` contains the questionId.
2. Read the file. Locate the `audience:` block. Note current state of the cell(s).
3. Edit only the named cell(s). Lowercase strings. No quote drift, no key reorder, no indent changes.
4. If any new value is `conditional`, check `src/lib/segmentation/engine.ts` for a matching predicate keyed by the questionId. If absent, surface the question.
5. Validate:
   ```bash
   cd master_template
   npm run content:check
   ```
6. Summarise: file, qid, before → after, predicate action, validator result.

For full detail (examples, gotchas, invariants), see `change-matrix-cell/SKILL.md`. They are the same skill under two names.

## Files touched

- `master_template/content/screens/<n>-<slug>.md` — the owning screen.
- `master_template/src/lib/segmentation/engine.ts` — only if a new `conditional` cell needs a predicate.

## When NOT to use this skill

- **Add a brand-new question** → `add-question-screen` (the question only enters the system when a screen declares it in `q_refs` + `audience`).
- **Rename a question id** → `rename-question-id` (cascades to engine, predicates, fixtures).
- **Change a predicate's body** → `change-engine-predicate`.

## Related skills

- `change-matrix-cell` — same skill, older name. Equivalent.
- `add-question-screen`, `add-engine-predicate`, `change-engine-predicate`.
