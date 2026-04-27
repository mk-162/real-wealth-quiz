---
name: remove-matrix-row
description: RETIRED in Phase 4. Matrix rows no longer exist as a separate concept. To retire a question, remove its q_ref entry and audience entry from the owning screen file (and remove the input definition if it's no longer used). To retire a whole screen, delete the markdown file under `content/screens/`. Use `change-matrix-cell` if you only want to hide it from all segments.
---

# Remove a matrix row — RETIRED

## What changed

Phase 4 of the simplification plan collapsed `content/generated/matrix.json`
into per-screen `audience:` frontmatter blocks. There is no longer a separate
matrix file or a notion of a "matrix row" detached from a screen — every
question lives on exactly one owning screen, and removing the question means
editing or deleting that screen.

## What to do instead

- **Want to retire a question completely?**
  1. Open the owning screen under `master_template/content/screens/`.
  2. Remove the questionId from the `q_refs` array.
  3. Remove the matching entry from the `audience:` block.
  4. Remove or rename the related `inputs[]` entry if no other question on
     the screen uses it.
  5. If the screen now has zero questions, consider deleting the screen file
     entirely (and any orphaned `logged_as` references in code).
  6. Run `npm run content:check`.

- **Want to hide a question from every segment but keep the data shape?**
  Use `change-matrix-cell` to set every segment to `hidden`. The engine
  silently skips it but the screen + audience entry remains — reversible
  later.

- **Want to remove a `conditional` predicate?** Use `change-engine-predicate`
  (delete the entry from the `conditionals` map in
  `src/lib/segmentation/engine.ts`).

## Cascade checklist when retiring a question

After removing the question, grep for the questionId across the codebase to
catch any stragglers:

```bash
cd master_template
grep -rn "Q4.B.3" content/ src/lib/
```

Look for:

- Other screens with `q_refs: [..., "Q4.B.3", ...]` (rare — there's exactly
  one owning screen per question, but conditional-reveal references on
  sibling inputs may name it).
- Engine predicates keyed on the id in `engine.ts`.
- Trigger DSL or `logged_as` that names the input id.

## Why this skill is gone

The old `remove-matrix-row` skill manipulated `content/generated/matrix.json`,
which no longer exists. Keeping the skill alive would mislead future agents
into trying to delete from a file that's been deleted.
