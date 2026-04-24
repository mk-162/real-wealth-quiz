<!-- _AUDIT.md entry: 2.4 -->
---
name: change-engine-predicate
description: Modify an existing predicate in `src/lib/segmentation/engine.ts` — the function that decides whether a C matrix cell fires for a user's gating answers. Use this skill whenever the user asks to change the logic of a predicate, widen or narrow who gets a conditional question, or update the business rule behind a C cell. This is Tier 3 — a code change that can silently flip who sees which questions in production. Triggers on phrasings like "change the Q5.2 predicate to also allow sole traders", "loosen the Q3.2 condition", or "update the logic for the Q4.B.1 C cell".
---

# Change an engine predicate

## What this skill does

Rewrites the body of one entry in the `conditionals` object in `master_template/src/lib/segmentation/engine.ts`. Preserves every other predicate and the rest of the module.

## Human confirm gate (Tier 3)

Before making any edit:

1. Summarise the proposed change in plain English — old logic → new logic.
2. Identify the downstream consequences:
   - Which segments currently hit this predicate (i.e. have `C` in this row)?
   - Which users (by answer pattern) start seeing the question / stop seeing it?
   - Are there fixture tests keyed on the current behaviour?
3. Flag the regression surface — `npm run test` (admin app suite) runs fixture tests; a predicate change can flip expected outputs.
4. Wait for the user to reply "yes" / "proceed" / equivalent. Never proceed on inferred consent.

This is a regulated-financial-content predicate. A quiet widening can surface compliance-gated content to a cohort the reviewer hasn't approved.

## Background

See `add-engine-predicate` for the contract — pure function, `(a: GatingAnswers) => boolean`, reads only the 5 gating answers.

## Inputs you need from the user

1. **Which predicate (questionId).**
2. **The new logic** — verbatim or described in plain English.
3. **Their read on the downstream impact.** If they haven't considered who's affected, pause and walk through it.

## Workflow

1. **Human confirm gate (above).**

2. **Read the current predicate and its matrix row.** Note which segments are `C` (i.e. which segments actually go through this predicate at all).

3. **Walk the impact.** For each `C` segment:
   - Which answer patterns used to match the old predicate but fail the new?
   - Which answer patterns used to fail but now match?
   - Are these shifts intentional?

4. **Rewrite the predicate.** Same signature. Pure. Only reads `GatingAnswers` (or returns `true` if follow-up-gated).

5. **Preserve the comment.** If the current entry has a comment explaining intent, update it to match new logic.

6. **Validate.**
   ```bash
   cd master_template
   npm run typecheck
   npm run test
   ```
   TypeScript catches signature drift. The Vitest suite (admin app) catches fixture regressions.

7. **If any tests fail, surface them.** Don't edit fixtures to pass. The failure is the signal that the behaviour change is non-trivial. Decide with the user: is the new behaviour correct and fixtures need updating to match, or is the predicate wrong?

8. **Summarise.** File, predicate, before → after logic, regression surface (test failures or clean), user cohort implications.

## Files touched

- `master_template/src/lib/segmentation/engine.ts` — one entry.
- Possibly test fixtures if they encoded the old behaviour.

## Invariants — never break these

- **Human-confirm gate first. Every time.**
- **Signature unchanged:** `(a: GatingAnswers) => boolean`.
- **Pure, deterministic.** No side effects, no session lookups, no date-dependent logic (unless that's exactly the intent — and then flag).
- **Reads only `GatingAnswers`.** If the new logic needs a follow-up answer, use the `() => true` stub pattern + comment.
- **Never edit fixture tests to make them pass without surfacing.** Fixtures encode expected behaviour. If the test fails, it's a signal.

## Examples

### Example 1 — widen Q5.2 to include sole traders

**User:** "The Q5.2 predicate currently fires for business_owner OR self_employed. Sole traders should also see it."

**Confirm step:**

> Current `Q5.2` predicate: `(a) => a.workStatus === 'business_owner' || a.workStatus === 'self_employed'`.
>
> "Self-employed" is already the sole-trader workStatus value — what specifically are you widening to? If you mean adding a new workStatus value (e.g. `freelancer`), we'd need to add that value to the input on the relevant screen first.
>
> Or do you mean something else by "sole trader"? Let's confirm intent before changing code.

### Example 2 — tighten Q3.2 to require income confirmation

**User:** "Q3.2 should only fire if income is stated AND estate is at least £500k."

**Confirm:**

> Current `Q3.2`: `(a) => a.income !== 'prefer_not_to_say'`.
>
> Proposed: `(a) => a.income !== 'prefer_not_to_say' && a.estate !== 'lt500k' && a.estate !== 'not_sure'`.
>
> Downstream: S9 users who currently hit Q3.2 (the only C cell for Q3.2 is S9) and declared `estate: 'lt500k'` or `'not_sure'` will stop seeing Q3.2.
>
> Confirm to proceed.

On confirm, rewrite the entry:
```typescript
/* Q3.2 essential spend — HNW only when they've stated income AND estate ≥ £500k. */
'Q3.2': (a) =>
  a.income !== 'prefer_not_to_say' &&
  a.estate !== 'lt500k' &&
  a.estate !== 'not_sure',
```

### Example 3 — don't do this: add a session lookup

User: "Make Q4.B.1 fire only if they have children under 18." `age_of_children` isn't in `GatingAnswers`. Use the `() => true` stub pattern; document that the screen's `conditional_reveal` or a summary-level filter handles the runtime gate.

### Example 4 — don't do this: silently proceed

User: "Just change Q5.2 to also fire for retired people." Do not proceed without confirmation. Predicate changes are code changes with runtime cohort implications.

## When NOT to use this skill

- **Add a new predicate** → `add-engine-predicate`.
- **Remove a predicate** → `change-engine-predicate` with body `() => true` (silent-skip for this segment) OR matrix-cell flip to Y/N (no predicate needed).
- **Flip cells Y/C/N** → `change-matrix-cell`.

## Related skills

- `add-engine-predicate`, `change-matrix-cell`, `change-segment-assignment-rules` (related Tier 3).

## Gotchas

- **Predicate drift from copy.** The screen's copy may have been written assuming the old predicate. A widened predicate may surface copy that doesn't fit the new audience. Review the relevant screen's headline/sub after changing the predicate.
- **Admin DSL parity test doesn't cover engine predicates.** The admin's vendored DSL is for trigger strings; engine predicates are pure TypeScript. Changes here are harder to cross-check — lean on the fixture suite.
- **Silent-skip vs explicit N.** If you effectively want "this segment never sees the question", prefer flipping the matrix cell to `N` rather than returning `false` from the predicate. Fewer moving parts.
