<!-- _AUDIT.md entry: 1.4 -->
---
name: remove-answer-option
description: Delete an option from the `inputs[].options[]` array on a Real Wealth questionnaire screen. Use this skill whenever the user asks to drop a card, remove an answer choice, retire a radio option, or otherwise delete one entry from an input's options list. Triggers on phrasings like "drop the 'other' option", "remove the 'prefer not to say' choice", or "retire the 'on_track' card".
---

# Remove an answer option

## What this skill does

Deletes one `{ value, label, ... }` object from an input's `options[]` array. Checks for and surfaces every downstream reference to that value — segmentation predicates, sibling conditional reveals, trigger DSL, projection inputs — so the user can decide whether to remove them in the same commit or flag them as follow-ups.

## Inputs you need from the user

1. **Which screen.** Path / screen_number / concept.
2. **Which input** (if multiple).
3. **Which option.** By `value` or current `label`.

## Workflow

1. **Locate the file and option.** `master_template/content/screens/<section>.<n>-<slug>.md`.

2. **Grep for the option's `value` first, before deleting anything.** This is the heart of the skill: removing an option whose value is referenced breaks the runtime silently.

   ```bash
   cd master_template
   grep -rn "'<value>'" src/lib/ content/
   grep -rn "\"<value>\"" src/lib/ content/
   grep -rn "<value>" src/lib/segmentation/engine.ts src/lib/compass/inputs.ts
   ```

   Places the value might be referenced:
   - `src/lib/segmentation/engine.ts` — conditional predicates comparing `a.<input_id> === '<value>'`.
   - Sibling input `conditional_reveal` strings on the same screen (`only when intent == <value>`).
   - Trigger DSL in `content/provocations/*.md` or `content/awareness-checks/*.md`.
   - `src/lib/compass/inputs.ts` — input-band mappers.

3. **Present the cascade to the user.** List every hit with file + line. Ask which approach:
   - **Surgical removal** — delete the option and also update every referring site in the same commit.
   - **Flag-and-hold** — don't delete yet; leave the option and address references first.
   - **Force-delete** — delete the option without touching references. Only sensible if the references are dead code; risky otherwise.

4. **If force-delete isn't safe, default to "flag-and-hold".** This is a Tier 2 skill but behaves with Tier 3 caution on references.

5. **After confirmation, remove the option.** YAML array deletion. Preserve every other option's order.

6. **If the removed option is the only trigger for a `conditional_reveal` sibling input:** the sibling input is now dead (nothing ever reveals it). Flag this — the user may want to delete the sibling too.

7. **Save and validate.**
   ```bash
   npm run content:check
   npm run voice:check
   ```
   Plus admin integrity scan.

8. **Summarise.** Screen, input, option removed, referring sites touched (if any), remaining references (if flag-and-hold).

## Files touched

- `master_template/content/screens/<section>.<n>-<slug>.md` — the option removal.
- Possibly `src/lib/segmentation/engine.ts`, `src/lib/compass/inputs.ts`, sibling screens' conditional_reveal strings, trigger DSL in provocations / awareness checks — only if the user opts in to surgical removal.

## Invariants — never break these

- **Never silently delete an option whose value is referenced.** The grep is mandatory.
- **Never leave a dangling `conditional_reveal` sibling.** If the sibling is now unreachable, surface it.
- **Never touch other options' order** as a side-effect.
- **Never delete the last option of an input** without confirming — a required input with zero options is broken.
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — safe removal (no references)

**User:** "Drop the 'other' option on Q1.1 — we don't need the escape hatch."

Grep `'other'` across `src/lib/` and `content/` — let's say zero hits in predicates or triggers, only within the screen file itself.

Confirm with user: "No external references. Safe surgical removal."

Delete the option. Validation clean.

### Example 2 — referenced option (escalate)

**User:** "Remove the 'prefer_not_to_say' income option on Q3.1."

Grep `'prefer_not_to_say'`:
- `src/lib/segmentation/engine.ts` — `'Q3.2': (a) => a.income !== 'prefer_not_to_say'` (the C-cell predicate for Q3.2).
- `src/lib/compass/inputs.ts` — band mapper handles it as `null`.

Present cascade. Ask:

> Removing `prefer_not_to_say` from Q3.1 will break the Q3.2 predicate (it currently uses `a.income !== 'prefer_not_to_say'` to decide whether to ask S9 about essential spend). Options:
> 1. Rewrite the predicate to not reference the removed value.
> 2. Keep the option and do something different.
>
> Which?

### Example 3 — don't do this: delete without grepping

Bad behaviour: user says "drop 'suggested'", you delete it, ship. A trigger DSL somewhere fires on `intent == 'suggested'`. It silently stops firing in production. No one notices until a client conversation.

Always grep. Every time.

## When NOT to use this skill

- **Rename an option's value** → `change-answer-option` (still a cascade — escalate).
- **Edit label only** → `change-answer-option`.
- **Remove the whole input** → not in this batch (separate skill).

## Related skills

- `change-answer-option`, `add-answer-option`, `add-conditional-reveal`.

## Gotchas

- **CI doesn't catch all dangling references.** `content:check` validates shape, not value-space referential integrity. Trigger DSL that mentions a no-longer-existing value still parses; it just never fires. The grep is the safety net.
- **The admin app offers "impact preview" on option removal.** If the user is in the admin, that's the preferred path — the removal modal surfaces references automatically.
- **`prefer_not_to_say` is often load-bearing.** Many predicates treat it as a special "opt-out" case. Before removing, consider whether collapsing opt-out into a normal value changes anyone's segment.
