<!-- _AUDIT.md entry: 3.5 -->
---
name: change-segment-assignment-rules
description: Edit the ranked predicate list in `src/lib/segmentation/rules.ts` that decides which segment a respondent lands in. Use this skill whenever the user wants to change who gets which segment — "someone under 40 with £1m shouldn't be S3, they should be S9", "tighten the S6 predicate", or "move S4 above S3 in priority". This is Tier 3 — a code change affecting runtime segment assignment for every new session. Triggers on phrasings about "who becomes S-something", "segment rules", "assignment logic", or reranking priorities.
---

# Change segment-assignment rules

## What this skill does

Modifies one or more entries in `master_template/src/lib/segmentation/rules.ts` — the ranked predicate list. Can include: editing a predicate body, changing a rule's rank, adjusting the two-stage S5→S6 upgrade logic.

## Human confirm gate (Tier 3)

Before making any edit:

1. Summarise the current logic and the proposed change in plain English.
2. Walk through 3–4 concrete user patterns:
   - Who currently lands in segment X?
   - Who would land there after the change?
   - Are there users shifting from one segment to another? Which and why?
3. Flag compliance implications: each segment has its own CTA + segment-gated provocations/awareness checks. A shift means users see different commercial messaging. Review if the new routing matches intent.
4. Flag regression tests: `npm run test` runs segment-assignment fixtures.
5. Wait for explicit "yes" / "proceed" / equivalent.

## Background

See `src/lib/segmentation/rules.ts` — rules are ranked; first match wins. Default fallback is S1. The Stage-2 upgrade (S5 → S6 on Q5.3 exit-intent) is preserved separately in `upgradeSegment()`.

`content/generated/rules.json` holds the metadata (rank, id, label, predicate description). The executable predicates are in `rules.ts`. The admin reads both.

## Inputs you need from the user

1. **Which rule.** By segment id (S3, S6, etc.) or by rank position.
2. **The change.** New predicate body, new rank, or structural change.
3. **Their read on who shifts.** If they haven't considered which users move, pause.

## Workflow

1. **Human confirm gate (above).**

2. **Read the current rules.** Full list, in rank order.

3. **Identify the change.** Body-of-predicate? Rank move? New rule (that's `add-segment`, different skill).

4. **For a body edit:** update the predicate. Preserve the rule's rank, id, and description.

5. **For a rank change:** reorder both `rules.ts` and `content/generated/rules.json`. Both must stay in sync.

6. **For the Stage-2 upgrade:** `upgradeSegment()` is the S5→S6 logic. Changes here are rare; walk carefully.

7. **Update `content/generated/rules.json`** if the human-readable predicate description changed.

8. **Run regressions.**
   ```bash
   cd master_template
   npm run typecheck
   npm run test
   ```
   Fixture tests exercise the ranked assignment for specific answer patterns. Any test failure is a signal.

9. **Don't "fix" failing tests by editing fixtures.** If a fixture now assigns a different segment than expected, that's the behaviour change. Surface with user — confirm the new assignment is intended before updating the fixture.

10. **Summarise.** File(s), rule(s) changed, rank order before → after, test failures (if any), cohort implications.

## Files touched

- `master_template/src/lib/segmentation/rules.ts`.
- `master_template/content/generated/rules.json` (if description / rank changes).
- Test fixtures (only after confirming intent).

## Invariants — never break these

- **Human-confirm gate first.**
- **First-match wins.** Rank order is semantic.
- **Default fallback to S1.** If no rule matches, user lands in S1.
- **Stage-2 upgrade preserved** unless explicitly changed. Losing the S5→S6 upgrade on Q5.3 silently strips business-exit users of their tailored journey.
- **`rules.ts` and `rules.json` stay in sync.**
- **Pure predicates, deterministic.**

## Examples

### Example 1 — narrow S3 to exclude young high-earners

**User:** "Young people under 30 earning £200k shouldn't be S3 (high earner) — they should be S9 (HNW) if their estate is ≥£1m. Otherwise S1."

**Confirm:**

> Current S3 predicate: `income >= 200_000` (let's say).
> Current S9 predicate: estate ≥ £3m OR (income ≥ £200k AND estate ≥ £1m).
>
> Proposed: tighten S3 to exclude anyone under 30. Those under-30 users then fall through to S9 (if estate ≥ £1m) or S1 (default).
>
> Users shifting: a 28-year-old earning £250k with £800k estate currently → S3. After change → S1 (drops below S9's estate floor too). Does that match intent? If not, we need to widen S9's estate band for young income-earners instead.
>
> Confirm.

If confirmed, rewrite S3 predicate with an age floor. Update `rules.json` description. Run tests.

### Example 2 — move S4 above S3

**User:** "Senior professionals should catch before high earners — move S4 rank above S3."

**Confirm:**

> Current: S3 rank 3, S4 rank 4. First-match means S3 currently wins on shared patterns.
>
> Proposed: swap ranks. Users matching both S4 predicate (age 45+, income £100k+, say) and S3 predicate (income £200k+) currently → S3. After change → S4.
>
> Which users shift? A 50-year-old earning £250k: currently S3, after change S4. Does that match the commercial CTA routing you want? S4 gets a different CTA and different provocations.
>
> Confirm.

### Example 3 — don't do this: shipping without test check

Always run `npm run test`. Rule changes change fixture outputs. Failing tests are the surface area of the change; they must be reviewed before shipping.

## When NOT to use this skill

- **Add a new segment** → `add-segment` (Tier 3, bigger surface).
- **Add / change a conditional predicate** (C cell, not assignment rule) → `change-engine-predicate`.
- **Change the Y/C/N matrix** → `change-matrix-cell`.

## Related skills

- `add-segment`, `change-engine-predicate`, `change-matrix-cell`.

## Gotchas

- **`rules.json` is authoritative for metadata.** If the admin reads from it, edits to `rules.ts` alone miss the description update.
- **Stage-2 upgrade is separate.** `upgradeSegment()` runs after Q5.3 is answered. If you widen S5 in Stage-1, you may also want to widen the Q5.3 upgrade logic.
- **Compliance per-segment copy.** Each segment has its own CTA and possibly segment-gated provocations. A rule change routes users to different commercial content — double-check the CTA + provocations still make sense for the new cohort.
- **Tests may encode assumptions.** Fixtures are the regression surface. Changing a rule often means updating a fixture — do it deliberately, document which fixture changed and why.
