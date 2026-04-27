<!-- _AUDIT.md entry: 2.5 -->
---
name: add-engine-predicate
description: Add a predicate function for a conditional (C) matrix cell in `src/lib/segmentation/engine.ts`. Use this skill whenever the user wants a new C cell to actually fire, wire a predicate for a matrix cell currently silent-skipping, or add conditional logic tied to the 5 gating answers. Triggers on phrasings like "add a predicate for Q4.B.1 — skip it for retired users", "Q5.2 needs conditional logic", or "wire the predicate for the new C cell".
---

# Add an engine predicate

## What this skill does

Adds a new entry to the `conditionals: Partial<Record<QuestionId, (a: GatingAnswers) => boolean>>` object in `master_template/src/lib/segmentation/engine.ts`. Preserves every existing predicate and the rest of the module.

## Background — the predicate contract

From `src/lib/segmentation/engine.ts`:

```typescript
const conditionals: Partial<Record<QuestionId, (a: GatingAnswers) => boolean>> = {
  'Q3.2': (a) => a.income !== 'prefer_not_to_say',
  'Q4.3': () => true,
  'Q5.2': (a) => a.workStatus === 'business_owner' || a.workStatus === 'self_employed',
  // ...
};
```

Rules:
- Key must be an existing C cell's `questionId`.
- Predicate is `(a: GatingAnswers) => boolean`. Pure, deterministic, reads only the 5 gating answers.
- If the runtime answer needed isn't in `GatingAnswers` (it's a follow-up), the conventional pattern is `() => true` + a comment explaining the screen's `conditional_reveal` handles gating. See `Q4.3`, `Q4.C.2`, `Q4.1a`, `Q4.3a`.

## Inputs you need from the user

1. **The `questionId`.** Must be a C cell in the screen's `audience:` block for at least one segment.
2. **The predicate logic.** Plain English — "skip for retired users", "only ask business owners", "always fire".
3. **Whether the predicate depends on `GatingAnswers` or a follow-up.** If follow-up, use the `() => true` pattern.

## Workflow

1. **Verify the cell is `conditional` somewhere.** Find the screen owning the questionId (look in `content/screens/*.md` for a `q_refs` containing it), open its `audience:` block, and confirm at least one segment is `conditional` for that question. If no `conditional` cells exist, adding a predicate does nothing — redirect to `change-matrix-cell` to flip a cell first.

2. **Verify the key isn't already in `conditionals`.** If it is, this is `change-engine-predicate`, not `add-engine-predicate`.

3. **Write the predicate.**
   - For `GatingAnswers`-based logic: express via the existing `a.income`, `a.workStatus`, `a.estate`, `a.age`, `a.household` fields.
   - For follow-up-based logic: use `() => true` and add a comment.

4. **Add the entry** to the `conditionals` object. Keep alphabetical-by-id or match existing ordering in the file (the existing order loosely groups by section).

5. **Example entry — GatingAnswers-based:**
   ```typescript
   /* Q4.B.1 dependants — skip for retired users who typically no longer have dependent children. */
   'Q4.B.1': (a) => a.workStatus !== 'fully_retired' && a.workStatus !== 'partly_retired',
   ```

6. **Example entry — follow-up-based:**
   ```typescript
   /* Q4.3 pensions — gating depends on whether they said they have ≥1 pot at Q4.A,
      which isn't in GatingAnswers. Always true here; the screen's conditional_reveal
      handles runtime gating. */
   'Q4.3': () => true,
   ```

7. **Validate.**
   ```bash
   cd master_template
   npm run typecheck
   npm run test
   ```
   TypeScript catches union/enum mismatches. Vitest (admin app — `cd admin_app && npm run test`) has relevant fixture tests.

8. **Summarise.** Predicate added, which questionId, which kind (gating-based vs follow-up stub), and whether test coverage follows.

## Files touched

- `master_template/src/lib/segmentation/engine.ts` — one entry added to `conditionals`.

## Invariants — never break these

- **Key must be an existing C cell somewhere.** Adding a predicate for a cell that's all Y/N is dead code.
- **Predicate signature:** `(a: GatingAnswers) => boolean`. Pure, deterministic.
- **Never reach outside `GatingAnswers`.** If you need a follow-up, use the `() => true` stub pattern; don't import session state or localStorage.
- **Never call side-effecting functions** inside the predicate.
- **Document the follow-up pattern with a comment.** Future maintainers need to know why `() => true` is the right answer.
- **Round-trip fidelity** (not the main concern for .ts, but preserve formatting — Prettier-style).

## Examples

### Example 1 — predicate for a new Q4.B.1

**User:** "Add a predicate for Q4.B.1 — skip it for retired users."

Check the screen's `audience:` block: Q4.B.1 has `S7: conditional` (pre-retirees are conditional). Good.

Add:
```typescript
/* Q4.B.1 dependants — skip for S7 pre-retirees who've retired early. */
'Q4.B.1': (a) => a.workStatus !== 'fully_retired' && a.workStatus !== 'partly_retired',
```

Validation: `npm run typecheck` clean.

### Example 2 — stub for a follow-up-gated C cell

**User:** "Q4.B.3 protection — gate on whether they have dependants. But dependants are from Q4.B.1, not the gating answers."

Use the stub pattern:
```typescript
/* Q4.B.3 protection — gating depends on Q4.B.1 follow-up (has_dependants),
   which isn't in GatingAnswers. Always true here; the screen's conditional_reveal
   or a summary-level filter handles runtime gating. */
'Q4.B.3': () => true,
```

### Example 3 — don't do this: add for a Y/N-only row

User: "Add a predicate for Q1.1." Q1.1 is Y across all 9 segments. A predicate does nothing. Stop and clarify.

## When NOT to use this skill

- **Change existing logic** → `change-engine-predicate` (Tier 3).
- **Flip cells Y/C/N** → `change-matrix-cell`.
- **Add a new question** → `add-question-screen` (creates the screen + audience together).

## Related skills

- `change-matrix-cell`, `change-engine-predicate`, `add-question-screen`.

## Gotchas

- **`GatingAnswers` is a tight union.** The 5 fields are `income`, `age`, `estate`, `workStatus`, `household`. Anything else isn't available here — use the stub pattern.
- **Predicate order doesn't matter.** Object key order is not semantically meaningful — but match the existing file's visual grouping for readability.
- **No tests for new predicates can be tempting.** Add a fixture case. The admin app's Vitest suite has a test hook for predicate boundary cases; new predicates that change behaviour deserve coverage.
- **Silent-skip is often the right call.** An empty predicate (no entry) makes the C cell behave like N for users hitting it. Sometimes that's exactly right — the conditional_reveal on the screen handles show/hide. Confirm intent.
