<!-- _AUDIT.md entry: 8.2 -->
---
name: edit-banding-cases
description: Add, remove, or reorder `{ when, body }` entries in the `banding_cases[]` list of a Real Wealth report insight. Use this skill whenever the user asks to add a new band to an insight, remove a stale case, split a band into two, or otherwise manipulate the LIST of cases (not the body inside one case — that's `edit-banded-insight`). Triggers on phrasings like "add a very-low-cash case", "drop the out-of-range upper band", "split the 3-6 months band into 3-4 and 4-6", or "we need a new band for high-essential-spend households".
---

# Edit banding cases

## What this skill does

Adds, removes, or reorders entries in a report insight's `banding_cases[]` list. Paired with `edit-banded-insight` (which handles body-only edits inside one case). This skill is the list-level shape change.

## Background

See `edit-banded-insight` for insight schema. Each case is `{ when: <DSL>, body: <prose> }`. Admin integrity check `report:banding-exhaustiveness` verifies the union of all `when` predicates (plus `fallback`) covers every possible input-band combination. Adding or removing cases shifts the coverage map.

## Inputs you need from the user

1. **Which insight.** Path / slug.
2. **Operation.** Add / remove / reorder.
3. **For ADD:** the new `when` predicate and the body prose.
4. **For REMOVE:** identify by `when` or by plain description.
5. **For REORDER:** the new order. (Order matters — first-match wins.)

## Workflow

1. **Locate the file.** `master_template/content/report/insights/<slug>.md`.

2. **Read the full case list and fallback.** Understand current coverage.

3. **For ADD:**
   - Compose the new `when` expression. Use the insight's banding DSL (e.g. `cash_months_of_essential_spend between 3 and 6`).
   - Insert in the right list position — usually ordered by range, low to high.
   - Confirm the new case doesn't create a gap or overlap with neighbours.
   - Write the body prose (same register as siblings).

4. **For REMOVE:**
   - Identify the case.
   - Before deleting, check coverage: does the case's range fall through to `fallback`, another case, or become a gap? Flag.
   - Remove only after confirmation.

5. **For REORDER:**
   - Reorder the array. First-match-wins means overlapping cases depend on order.
   - Most insights are ordered low-to-high by range — match the existing style.

6. **Character budget on new bodies:** `report.insight.body` — ideal 200, hard 420.

7. **Placeholder tokens.** Any new body that uses `{{token}}` must use registry-known tokens.

8. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   Plus admin integrity scan — `report:banding-exhaustiveness`, `report:placeholder-known`.

9. **Summarise.** File, operation, cases before → after, coverage implications.

## Files touched

- `master_template/content/report/insights/<slug>.md` — `banding_cases[]` list.

## Invariants — never break these

- **First-match-wins.** Case order is semantic. Document any reorder explicitly.
- **Coverage exhaustiveness.** The union of cases + fallback must cover every input combination.
- **Preserve `{{placeholder}}` tokens** in preserved cases.
- **Don't change an existing case's `when` in this skill** without reviewing coverage — the `edit-banded-insight` skill is for body-only; `when` changes here are shape changes that must respect the exhaustiveness gate.
- **Never delete `fallback`** — it's the safety net.
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — add a very-low-cash case

**User:** "Add a case for households with less than 1 month of essential spend on the cash-surplus insight."

Target: `content/report/insights/cash-surplus.md`.

Read existing cases: say the list starts at `between 1 and 3` (no case for < 1). Add:

```yaml
banding_cases:
  - when: "cash_months_of_essential_spend < 1"
    body: "You currently hold less than one month of essential spend in cash. That's a thinner cushion than most households we talk to are comfortable with — the first conversation is usually about which 2–3 months' buffer would let the rest of the plan breathe."
  - when: "cash_months_of_essential_spend between 1 and 3"
    body: "..."
  - ...
```

Coverage: previously < 1 fell to `fallback`; now handled explicitly. Fallback remains for edge cases (e.g. missing data).

### Example 2 — remove an obsolete case

**User:** "Drop the over-24-months case — we decided that's just noise."

Check: does >24 months now fall to `fallback`? If `fallback` reads appropriately, safe to remove. If `fallback` assumes a normal range, add the condition to `fallback` body or add a replacement case.

### Example 3 — split a band

**User:** "Split the 3-6 months band into 3-4 and 4-6 so we can give a nudge for the lower half."

Remove the single `between 3 and 6` case, add two:
```yaml
- when: "cash_months_of_essential_spend between 3 and 4"
  body: "You have 3-4 months of essential spend in cash. Close to the 6-month figure most households aim for; small, regular top-ups usually close the gap faster than a single transfer."
- when: "cash_months_of_essential_spend between 4 and 6"
  body: "You have 4-6 months of essential spend in cash. Sitting in the range most households aim for — the question shifts to whether any surplus above 6 months is working hard enough."
```

Each body fits its narrower slice. Coverage unchanged overall.

### Example 4 — don't do this: leave a gap

**User:** "Delete the 6-9 months case."

If there's no neighbour covering 6–9 and `fallback` doesn't read as "6-9 months" acceptable, you'd leave a gap. Admin integrity scan flags it. Either extend a neighbour to cover, update fallback, or push back on the delete.

## When NOT to use this skill

- **Edit one case's body prose** → `edit-banded-insight`.
- **Change the fallback** → audit 8.3 (not in this batch).
- **Rename a placeholder token** → `rename-placeholder-token` (Tier 3).
- **Change the `when` DSL on a single existing case without shape implications** → that's still this skill, because it affects coverage.

## Related skills

- `edit-banded-insight` — body-only edits.
- `rename-placeholder-token` — token rename (Tier 3).
- `advance-compliance-status`.

## Gotchas

- **`when` DSL varies per insight.** Different inputs use different bands — cash uses `months_of_essential_spend`, IHT uses `estate_band`. Use the DSL idiom already in the file.
- **Exhaustiveness is computed.** The admin walks all possible input values (not all real sessions) — so a mathematically-uncovered combination flags even if no real user would hit it.
- **Ordering matters.** Low-to-high by range is conventional. An out-of-order case that happens to match first can override a later, more-specific one.
