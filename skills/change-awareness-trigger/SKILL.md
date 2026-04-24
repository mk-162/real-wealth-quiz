<!-- _AUDIT.md entry: 5.2 -->
---
name: change-awareness-trigger
description: Edit the `trigger` DSL expression in a Real Wealth awareness check's frontmatter. Use this skill whenever the user asks to change when an awareness check fires, widen or narrow its conditions, or update the trigger logic on a "did you know" prompt. Triggers on phrasings like "change when the emergency-fund check fires", "make the MPAA check fire for anyone drawing from a pension", or "widen the trigger on NI gaps".
---

# Change an awareness check's trigger

## What this skill does

Rewrites the `trigger` string in the frontmatter of one `content/awareness-checks/<slug>.md` file. Preserves body, rank, core flag, and all other frontmatter.

## Background

Awareness-check triggers use the same DSL as provocations — parsed by `src/lib/questionnaire/triggers.ts`. See `change-provocation-trigger` for the full atom list. Admin integrity check `awareness:trigger-parses` gates shipping.

## Inputs you need from the user

1. **Which awareness check.** Path / slug / topic.
2. **The new trigger** — verbatim DSL or plain-English description.

## Workflow

1. **Locate the file.** Read the current trigger and `compliance_status`.

2. **If `approved_to_ship`,** surface the same compliance question as provocation trigger changes (see `change-provocation-trigger` step 2).

3. **Translate intent to DSL.** Use the flat grammar (left-to-right AND/OR, no parens). See `change-provocation-trigger` for the full atom list.

4. **Edit the `trigger` field.** Frontmatter only.

5. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Plus admin integrity check `awareness:trigger-parses`.

6. **Semantic test.** Walk 2–3 sample answer patterns mentally to confirm users who should see it now do, and users who shouldn't still don't.

7. **Summarise.** File, before → after trigger, compliance implications, walk-through examples.

## Files touched

- `master_template/content/awareness-checks/<slug>.md` — frontmatter `trigger` only.

## Invariants — never break these

- **Must parse.** `awareness:trigger-parses` is the gate.
- **Flat grammar.** No parens, left-to-right AND/OR.
- **Never touch body or rank here.**
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — widen MPAA to any drawdown

**User:** "Fire the MPAA awareness check for anyone drawing from a pension, not just those who've crystallised."

**Target:** `content/awareness-checks/mpaa.md`.

Before (example): `"pension_pots >= 1 AND pension_crystallised"`
After: `"pension_pots >= 1 AND (pension_drawdown_active OR pension_crystallised)"`

Wait — no parens allowed. Restructure:

After: `"pension_pots >= 1 AND pension_drawdown_active OR pension_pots >= 1 AND pension_crystallised"`

Note the expansion. Left-to-right eval means this reads: `(>=1 AND drawdown) OR (>=1 AND crystallised)` — correct.

Alternatively, introduce a single bare token `pension_accessed` defined elsewhere that collapses both: `"pension_pots >= 1 AND pension_accessed"`. Prefer that if the token exists.

### Example 2 — narrow to employed-only

**User:** "The NI gaps check should only fire for employed users."

Append `AND work_status == 'employed'` to the current trigger.

### Example 3 — don't do this: parens

Same guidance as `change-provocation-trigger` — DSL doesn't support them.

## When NOT to use this skill

- **Change copy** → `edit-awareness-check`.
- **Change rank / core / tier_limit** → separate (not in this batch).
- **Add a new check** → `add-awareness-check`.
- **Advance compliance** → `advance-compliance-status`.

## Related skills

- `edit-awareness-check`, `add-awareness-check`, `advance-compliance-status`, `change-provocation-trigger` (same DSL, provocation side).

## Gotchas

- **Bare tokens.** Many awareness-check triggers use bare tokens that look up `answers[token]` truthiness. Confirm the token is set elsewhere — otherwise the trigger always evaluates false.
- **Parity with the admin's vendored DSL.** Admin has `admin_app/features/shared/dsl.ts` — a parse-only vendored copy. Its schema-drift test catches divergence but not every semantic edge case. Prefer idioms used elsewhere in the file tree.
- **Widening audience without tightening tier_limit** means more users see it. Match trigger changes with tier_limit review.
