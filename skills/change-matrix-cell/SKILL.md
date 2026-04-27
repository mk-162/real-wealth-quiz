---
name: change-matrix-cell
description: Flip a Shown / Conditional / Hidden cell in the Real Wealth question × segment audience that controls which respondents see which questions. Use this skill whenever the user asks to hide a question from a segment, show a previously-hidden question, make a question conditional, change who sees Q-something, adjust segment routing, turn a question on/off for a persona, or otherwise modify the per-screen `audience:` block. Triggers on any phrasing about "who sees X" or "change the matrix" — including when the user just names the segment ("don't show this to S1") without saying the word "matrix".
---

# Change a matrix cell

## What this skill does

Edits one or more cells in the per-screen `audience:` block under
`master_template/content/screens/<n>-<slug>.md`. Preserves YAML frontmatter
shape (eemeli/yaml round-trip — no quote drift, no key reorder, no indent
changes). Runs the content validator before handing back.

## Background — where the matrix lives now

After Phase 4 (S1) of the simplification plan, the matrix is no longer a
separate file. Each screen carries its own audience for the questions it owns:

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
- **`conditional`** — this segment sees the question only when the predicate
  in `src/lib/segmentation/engine.ts` returns `true` for the user's gating
  answers. If no predicate exists for a `conditional` cell, the engine
  silently skips the question for this segment.
- **`hidden`** — this segment never sees the question.

(The legacy aliases `Y`/`C`/`N` may still appear in old skill notes — same
meaning.)

## Policy reminders (from the audit)

- **Audience is the source of truth.** A screen's `q_refs` lists the question
  ids the screen owns; the `audience:` block is the runtime gate per
  questionId. Never invent an audience entry for a `q_refs` token that
  doesn't have one — the engine already silently skips those (they're
  follow-up inputs gated by sibling reveals, like `Q4.1a`).
- **Audience is per-question.** A screen with multiple `q_refs` has one
  audience entry per question. Each is gated independently. Don't collapse
  them into a single screen-level audience — the engine and predicates are
  question-keyed.
- **`conditional` cells need predicates.** If you set a cell to `conditional`
  and no predicate exists in `engine.ts` for that `questionId`, the engine
  silently skips the question. Either add a predicate (see
  `add-engine-predicate` skill) or confirm with the user that
  conditional-without-predicate (permanent skip for this segment) is the
  intent.

## Inputs you need from the user

1. **Which question.** The `questionId` string (e.g. `Q3.2`, `Q4.A.1`,
   `Q5.3`). If the user named a screen (`3.1-what-brought-you`) or a concept
   ("the business exit question"), look up the screen file and the qid in its
   `q_refs`.
2. **Which segment(s).** One or many of `S1` – `S9`. Phrases like "HNW",
   "retired", "early accumulator" map via:
   - S1 Early accumulator · S2 Mass affluent · S3 High earner ·
     S4 Senior professional · S5 Business growth · S6 Business exit ·
     S7 Pre-retiree · S8 Retired · S9 HNW.
3. **The new value.** `shown` / `conditional` / `hidden`. If the user said
   "hide", "skip", "don't ask" → `hidden`. If "show" / "include" / "ask" →
   `shown`. If "sometimes" / "only if" / "conditional" → `conditional` (and
   ask about the predicate).

## Workflow

1. **Find the screen.** Search `master_template/content/screens/` for a file
   whose `q_refs` contains the questionId. There is exactly ONE owning screen
   per questionId today.

2. **Read the file.** It has YAML frontmatter (between `---` fences) followed
   by markdown body sections. Find the `audience:` block under the
   frontmatter and locate the row for the questionId.

3. **Record the before state.** Snapshot the cell(s) you're about to change
   so you can summarise accurately afterward.

4. **Edit the cell(s).** Only change the specified cells. Do not touch other
   rows in the same audience block, other segments on the same row, the
   audience-key order, or the surrounding frontmatter. Values must be exactly
   the lowercase strings `shown`, `conditional`, `hidden`.

5. **Preserve formatting.** YAML round-trip rules:
   - Match the existing indent (typically 2 spaces).
   - Don't quote audience values (they're plain).
   - Keep segment column order `S1, S2, S3, S4, S5, S6, S7, S8, S9`.
   - Keep audience-key order matching `q_refs` order.
   The admin app uses eemeli/yaml in document mode for byte-identical
   round-trips; if you're hand-editing, mimic that shape.

6. **If any new cell is `conditional`, check the predicate.** Read
   `master_template/src/lib/segmentation/engine.ts`. If the `questionId` is
   NOT a key in the `conditionals` object, either:
   - Add a predicate (use the `add-engine-predicate` skill).
   - OR confirm with the user that "silent-skip for this segment" is the
     intent.
   For conditional cells where the predicate depends on a follow-up answer
   (not in `GatingAnswers`), the accepted pattern is a stub `() => true` with
   a comment.

7. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Catches missing audience keys, invalid values, and Zod schema drift. Fix
   anything it flags before handing back.

8. **Summarise.** Report: the screen file, the questionId, the before/after
   values, whether any predicate action was taken, and whether the validator
   passed. Don't commit — the user does that.

## Files touched

- `master_template/content/screens/<n>-<slug>.md` — the screen owning the
  questionId you're flipping.
- `master_template/src/lib/segmentation/engine.ts` — only if a new
  `conditional` cell needs a predicate.

## Invariants — never break these

- **Never edit a `questionId` string.** It's the foreign key the engine reads.
  Renaming is a separate, high-risk skill.
- **Never remove a segment column** (S1–S9 must all be present on every
  audience row).
- **Never add a new question id here.** Questions belong to screens — adding
  one means adding a new screen (`add-question-screen` skill) or adding a
  q_ref + audience entry to an existing screen.
- **Never reorder audience keys** — keep them in `q_refs` order.
- **Never use uppercase or boolean values.** The schema is a three-state
  string enum: `shown` | `conditional` | `hidden`.

## Examples

### Example 1 — hide one question from one segment

**User:** "Don't show Q5.3 to S1 anymore — too advanced for early
accumulators."

Find: `Q5.3` is in `4.C1.2-taking-money-out.md` (`q_refs: ["Q5.2", "Q5.3"]`).

**Before (fragment):**
```yaml
audience:
  "Q5.3":
    S1: shown
    S2: shown
    ...
```

**After:**
```yaml
audience:
  "Q5.3":
    S1: hidden
    S2: shown
    ...
```

Predicate check: not needed (cell went from shown to hidden, no new
conditional). Validation: clean.

### Example 2 — add a conditional with an existing predicate

**User:** "Make Q3.2 conditional for S9 — only ask high-net-worth folks
about essential spend if they answered Q3.1."

Find: `Q3.2` is in `4.A.1-monthly-shape.md`.

**Before:**
```yaml
audience:
  "Q3.2":
    ...
    S9: shown
```

**After:**
```yaml
audience:
  "Q3.2":
    ...
    S9: conditional
```

Predicate check: `engine.ts` already has
`'Q3.2': (a) => a.income !== 'prefer_not_to_say'`. Good — the intent matches.
No code change needed.

### Example 3 — bulk change across multiple segments

**User:** "Show the new Compass pension question to everyone except S8 and
S9."

Translate: `Q4.A.1`, set S1–S7 = `shown`, S8 = `hidden`, S9 = `hidden`. Find
the owning screen (`4.E.1-pension-pot.md`), open the audience for `Q4.A.1`,
flip the cells that aren't already at the target value, save.

## When NOT to use this skill

- **The question doesn't exist on any screen yet** → use
  `add-question-screen` (a question id only enters the system when a screen
  declares it).
- **The question needs to be removed entirely** → first delete the
  q_ref + audience entry from the owning screen, then remove the screen via
  the screen-removal flow if it has no other questions.
- **The user wants a different predicate on an existing conditional cell** →
  use `change-engine-predicate`.
- **The user wants to rename a questionId** → use `rename-question-id`
  (high-risk, cascades everywhere).

## Related skills

- `add-question-screen` — register a new screen with its own audience block.
- `add-engine-predicate` — wire a predicate for a new or existing conditional
  cell.
- `change-engine-predicate` — modify an existing predicate's logic.
- `rename-question-id` — cascading rename across screens + triggers.

## Gotchas

- **Predicate drift.** The admin app vendors a parse-only DSL validator at
  `admin_app/features/shared/dsl.ts`. If you change a predicate's logic, the
  admin's DSL parity test won't catch it (it only checks trigger DSL, not
  engine predicates). Manually verify the predicate does what the user
  expects.
- **`q_refs` ⊇ audience keys.** A screen's `q_refs` may list more question
  ids than `audience` does — typically follow-up "a-suffix" inputs like
  `Q4.1a` that are gated by sibling reveals at the input level. Don't add
  audience entries for those.
- **Conditional with no predicate is a silent skip.** This is sometimes the
  desired behaviour (e.g. the runtime has its own conditional_reveal that
  does the gating). When in doubt, check the screen's input-level
  `conditional_reveal` field — if it exists and matches the intent,
  conditional-with-no-predicate is correct.
- **Character-cased segment keys.** The audience uses `S1`, `S2`, etc. —
  uppercase. Don't write `s1` or `S01`.
