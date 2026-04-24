<!-- _AUDIT.md entry: 1.3 -->
---
name: add-answer-option
description: Insert a new option into the `inputs[].options[]` array on a Real Wealth questionnaire screen. Use this skill whenever the user asks to add a new answer choice, drop in a "prefer not to say" option, wire up a new card on a card-select, add an extra radio choice, or otherwise extend an existing input's option list. Triggers on phrasings like "add a 'prefer not to say' to Q3.1", "new answer choice on the life-change question", or "add an option for retired business owners".
---

# Add an answer option

## What this skill does

Appends (or inserts) a new option object — `{ value, label, icon?, reveal?, conditional_reveal? }` — into the `options[]` array of a named input on a screen. Preserves every existing option, every other input, and all frontmatter / body.

## Inputs you need from the user

1. **Which screen.** Path / screen_number / concept.
2. **Which input** (when the screen has multiple). By `id` or by description.
3. **The new `value`** (machine key — ASCII snake_case) and `label` (human text). If only a label is given, propose a snake_case value and confirm.
4. **Optional fields** — icon, reveal hint, conditional_reveal (which sibling input to reveal when this option is chosen).
5. **Placement.** End of the list is the default; if the user wants a specific position ("before 'other'"), honour it.

## Workflow

1. **Locate the file.** `master_template/content/screens/<section>.<n>-<slug>.md`.

2. **Read the input's existing options.** Check for:
   - Value collision — the new `value` must be unique within the input.
   - Convention — match the existing snake_case style (`life_change`, not `lifeChange`).
   - Ordering — "other" and "prefer not to say" typically go last; insertion order matters.

3. **Add the option.** YAML array append. For a `conditional_reveal`, the target sibling input id must already exist on the screen — if not, you're in `add-conditional-reveal` + `add-answer-option` territory; add the sibling first, then this option.

4. **Character budget.** `option.label` — ideal 40, hard 60. `option.reveal` — ideal 80, hard 140.

5. **Voice.** Sentence case, no exclamation, quiet register. See `content/microcopy/voice-rules.md` + `scripts/banned-phrases.json`.

6. **If the new option adds a follow-up flow:** set `conditional_reveal` pointing at a sibling input id. Admin integrity check `screens:option-conditional-reveal-sibling` verifies the target exists.

7. **Consider the segmentation side.** A new option expands the value space. If any existing segmentation predicate in `src/lib/segmentation/engine.ts` compares against this input's values (e.g. `a.intent === 'curious'`), the predicate now has a new possible value — confirm whether it should match, not match, or be handled explicitly. Grep to find the predicates:
   ```bash
   grep -n "a\.<input_id>" master_template/src/lib/segmentation/engine.ts
   ```

8. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Plus admin integrity scan (`screens:option-value-unique`, `screens:option-conditional-reveal-sibling`).

9. **Summarise.** Screen, input, new option value + label, position, and any segmentation follow-ups identified.

## Files touched

- `master_template/content/screens/<section>.<n>-<slug>.md` — frontmatter `inputs[].options[]` only.

## Invariants — never break these

- **`value` must be unique within the input.** Collision fails the admin integrity check.
- **`value` must be ASCII snake_case.** Match the convention of siblings.
- **`conditional_reveal` target must exist.** Point at a sibling `inputs[].id` on the same screen.
- **Never break an existing option's ordering without explicit request.** Users may have mental models about which option is "first". Insert at the end unless told.
- **Never add options to a control type that doesn't support them.** `short_text`, `slider`, `currency`, `number` don't have `options[]`. `radio`, `card_select`, `multi_select`, `pair_picker`, `likert_5` do.
- **Round-trip fidelity.** YAML AST editing — preserve the existing list's quoting style.

## Examples

### Example 1 — add "prefer not to say" to Q3.1 intent

**Target:** `content/screens/3.1-what-brought-you.md`.

**Before (last few options on the `intent` input):**
```yaml
- value: suggested
  label: "Someone suggested it"
- value: other
  label: "Something else"
```

**After:**
```yaml
- value: suggested
  label: "Someone suggested it"
- value: prefer_not_to_say
  label: "Prefer not to say"
- value: other
  label: "Something else"
```

Segmentation check: `grep "a\.intent" src/lib/segmentation/engine.ts` — none reference it as a gating answer, so the new option is safe. Validation clean.

### Example 2 — new option with a conditional reveal

**User:** "Add a 'selling the business in 12-18 months' option to Q5.3 that reveals a date-picker sibling input."

Check: does the date-picker sibling exist? If not, add it first (requires `add-conditional-reveal` companion). If yes, append the option with `conditional_reveal: "<sibling_id>"`.

### Example 3 — don't do this: add options to a short_text input

**User:** "Add some example options to the life-change text box."

`short_text` inputs don't have options; they have a `placeholder` field. Redirect.

## When NOT to use this skill

- **Edit an existing option** → `change-answer-option`.
- **Remove an option** → `remove-answer-option`.
- **Add a conditional reveal to an existing option** → `add-conditional-reveal`.
- **Add a brand-new input** to a screen → not in this batch (separate skill).

## Related skills

- `change-answer-option`, `remove-answer-option`, `add-conditional-reveal`.

## Gotchas

- **"Prefer not to say" has value-space consequences.** Many segmentation predicates treat `prefer_not_to_say` as "user opted out of this gating signal" and behave defensively. Before adding, check `engine.ts` for how neighbours handle it.
- **Icons are admin-registered keys, not file paths.** If unsure which icon to use, omit; admin editor sets later.
- **Conditional reveals cascade at runtime.** The renderer reveals the sibling only when this option is the selected value. Confirm the UX by walking the screen in `npm run dev`.
