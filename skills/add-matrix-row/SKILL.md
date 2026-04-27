---
name: add-matrix-row
description: RETIRED in Phase 4. Matrix rows no longer exist as a separate concept — every question is owned by exactly one screen, and audience lives in that screen's `audience:` frontmatter block. Use `add-question-screen` to introduce a new question (which adds it to a screen's `q_refs` and audience together) or `change-matrix-cell` to flip the audience for a question that already exists on a screen.
---

# Add a matrix row — RETIRED

## What changed

Phase 4 of the simplification plan collapsed `content/generated/matrix.json`
into per-screen `audience:` frontmatter blocks. There is no longer a separate
matrix file or a notion of a "matrix row" detached from a screen — every
question lives on exactly one owning screen, and that screen's audience
gates it.

## What to do instead

- **Need a brand-new question?** Use the `add-question-screen` skill. That
  creates a new screen file with its own `q_refs` and `audience:` block in
  one shot, which is the only way a new question enters the system.

- **Need to add a question to an existing screen?** Edit the screen's
  `q_refs` array to include the new id, and add an `audience` entry for it
  alongside the others. Then run `npm run content:check`.

- **Need to flip the audience for an existing question?** Use
  `change-matrix-cell`.

- **Need to add a predicate for a `conditional` cell?** Use
  `add-engine-predicate`.

## Why this skill is gone

The old `add-matrix-row` skill manipulated `content/generated/matrix.json`,
which no longer exists. Keeping the skill alive would mislead future agents
into trying to write a file that's been deleted. If the user invokes this
skill name, redirect them to one of the alternatives above.
