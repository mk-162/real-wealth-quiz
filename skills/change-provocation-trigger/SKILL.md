<!-- _AUDIT.md entry: 4.2 -->
---
name: change-provocation-trigger
description: Edit the `trigger` DSL expression in a Real Wealth provocation's frontmatter. Use this skill whenever the user asks to change when a provocation fires, widen or narrow the firing condition, update the trigger logic on an existing callout, or change which answer patterns surface a provocation. Triggers on phrasings like "change the IHT trigger to also include £1.5m estates", "make the pension-pots-tease fire for anyone with ≥3 pots", or "update when the close-to-line provocation shows up".
---

# Change a provocation trigger

## What this skill does

Rewrites the `trigger` string in the frontmatter of one `content/provocations/<slug>.md` file. Preserves body, segments list, compliance status, and signoff dates (with the compliance-reset caveat below).

## Background — the trigger DSL

The DSL is parsed by `src/lib/questionnaire/triggers.ts` (`evaluateTrigger`). The admin has a vendored parse-only validator at `admin_app/features/shared/dsl.ts` and an integrity check `provocations:trigger-parses`.

Supported atoms (from `triggers.ts`):
- `age >= N | age <= N | age between N and M`
- `income >= N | income == 'band' | income_band == 'band' | income_band in [a, b]`
- `estate >= N | estate == 'not_sure' | estate in [..]`
- `pension_pots >= N`
- `household includes dependent_children | household includes elderly_parent`
- `work_status == 'x' | work_status in ['x', 'y']`
- `business_owner | has_dependants | has_mortgage | currently_advised`
- `succession == 'x' | role == 'x'`
- `life_cover == 'x' | money_mindset == 'x' | retirement_feel == 'x'`
- `one_thing == 'x' | tradeoff == 'x' | urgency == 'x' | current_adviser == 'x'`
- `<bare_token>` — looks up answers[token] truthiness
- `NOT <atom>` — negation

Combinators: `AND`, `OR` (case-insensitive), strictly left-to-right, no parens.

Examples (real):
- `"estate >= 2_000_000 AND rnrb_taper_awareness_did_not_fire"` (iht-2m-cliff)
- `"work_status == 'self_employed' AND income >= 75_000 AND pension_pots <= 1"` (self-employed-pension)
- `"current_adviser == 'yes_but_looking'"` (advised-looking)

## Inputs you need from the user

1. **Which provocation.** Path / slug / topic.
2. **The new trigger** — verbatim DSL, or a plain-English description that you translate.

## Workflow

1. **Locate the file.** `master_template/content/provocations/<slug>.md`.

2. **Read current trigger + compliance status.** If `compliance_status: approved_to_ship`, flag: a trigger change is substantive — the reviewer will want to re-confirm. Not automatic reset (unlike body edits), but surface the question: "This is approved — does changing when it fires still match your original review?"

3. **Translate the user's intent to the DSL.** Use the atoms and combinators above.
   - "At or above £1.5m estates" → `estate >= 1_500_000`.
   - "Self-employed with low pension" → `work_status == 'self_employed' AND pension_pots <= 1`.
   - "Anyone currently advised but looking" → `current_adviser == 'yes_but_looking'`.

4. **Sanity-check via the parser's atom list.** If the user's intent can't be expressed in the flat DSL (needs parens, nested OR-AND), either:
   - Rewrite to use De Morgan's or separate AND branches.
   - Split into multiple provocations.
   - Escalate to engine-level logic (major change).

5. **Edit the `trigger` field.** Frontmatter only. Use the same quoting style (double-quoted string) as existing triggers.

6. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Plus the admin integrity check `provocations:trigger-parses` (runs in admin UI when the file is opened).

7. **Manually test the semantics.** Walk a sample set of answer patterns mentally (or via admin Preview) to confirm:
   - Users who should see it: do they match the new trigger?
   - Users who shouldn't: do they correctly miss it?

8. **Summarise.** File, before → after trigger, compliance implications, test cases walked.

## Files touched

- `master_template/content/provocations/<slug>.md` — frontmatter `trigger` only.

## Invariants — never break these

- **Must parse.** `provocations:trigger-parses` is the gate — a malformed trigger fails the admin integrity scan and never fires in production.
- **Flat grammar.** No parentheses. Left-to-right AND/OR. If the logic needs parens, restructure.
- **Never touch body sections here.** That's `edit-provocation-body`.
- **Never advance compliance_status** — trigger changes are structural but don't auto-advance.
- **Round-trip fidelity.** YAML AST editing; preserve the triple-hyphen frontmatter delimiters and quoting.

## Examples

### Example 1 — widen an estate threshold

**User:** "The IHT 2m cliff provocation should also fire for £1.5m+ estates."

**Target:** `content/provocations/iht-2m-cliff.md`.

**Before:**
```yaml
trigger: "estate >= 2_000_000 AND rnrb_taper_awareness_did_not_fire"
```

**After:**
```yaml
trigger: "estate >= 1_500_000 AND rnrb_taper_awareness_did_not_fire"
```

Semantics check: £2m+ still fire (subset of £1.5m+). £1.5m–£2m new cohort — confirm the body copy still reads correctly for them ("above £2m of total estate" in the body now contradicts the trigger). Flag to the user: body may need adjustment (that's `edit-provocation-body`).

### Example 2 — add a conjunction

**User:** "Only fire the close-to-line provocation for business owners."

Append: `AND work_status == 'business_owner'`.

Before: `"income >= 150_000 AND spending_ratio >= 0.85"`
After: `"income >= 150_000 AND spending_ratio >= 0.85 AND work_status == 'business_owner'"`

### Example 3 — don't do this: use parens

**User:** "Fire it when (estate >= 2m AND rnrb unaware) OR (income >= 200k AND no pension)."

DSL doesn't support parens. Options:
1. Restructure: `estate >= 2_000_000 AND rnrb_taper_awareness_did_not_fire OR income >= 200_000 AND pension_pots == 0` — warn: left-to-right eval may not express intent. Trace each atom.
2. Split into two provocations.

Push back to the user with these options; don't silently ship ambiguous logic.

## When NOT to use this skill

- **Change body copy** → `edit-provocation-body`.
- **Change segments list** → `change-provocation-segments`.
- **Advance compliance** → `advance-compliance-status`.
- **Add or remove a provocation** → `add-provocation` / removal (not in this batch).

## Related skills

- `edit-provocation-body`, `change-provocation-segments`, `advance-compliance-status`, `add-provocation`.
- `change-awareness-trigger` — same pattern for awareness checks.

## Gotchas

- **`_` in numbers is allowed.** `2_000_000` is the convention for readability; `2000000` also parses. Match the existing style.
- **Bare tokens look up `answers[token]` truthiness.** Names like `rnrb_taper_awareness_did_not_fire` are custom flags set elsewhere. When using a new bare token, confirm it exists in the answer space — otherwise it always returns false.
- **The admin parse-only validator may drift from the runtime parser.** They share semantics but are independent implementations (admin vendored). If behaviour differs, the admin's `schema-drift.test.ts` flags it.
- **Trigger widening changes audience.** More users see the callout. Review body + segments list together — they should agree with the new trigger.
