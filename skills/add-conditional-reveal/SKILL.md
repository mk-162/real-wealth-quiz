<!-- _AUDIT.md entry: 1.5 -->
---
name: add-conditional-reveal
description: Wire an answer option to reveal a sibling input only when that option is chosen. Use this skill whenever the user asks to reveal a text box when a certain card is picked, add a follow-up field for a specific choice, show-only-if an option is selected, or otherwise add a conditional_reveal link between an option and a sibling input. Triggers on phrasings like "reveal the text box only when 'life change' is picked", "add a follow-up when they pick 'selling the business'", or "show the date field only for the retired option".
---

# Add a conditional reveal

## What this skill does

Sets the `conditional_reveal` field on one option to name a sibling input on the same screen. Optionally documents the reveal's runtime intent in the sibling input's own `conditional_reveal` string. Preserves every other field.

## Background — the two conditional_reveal fields

There are two distinct `conditional_reveal` fields in the schema:

- **Option-level** (`options[].conditional_reveal: "<sibling_input_id>"`) — machine key. Names the sibling input id that should appear when this option is selected. The admin uses this for renderer logic.
- **Input-level** (`inputs[].conditional_reveal: "only when intent == life_change"`) — human-readable note. Documents the reveal condition. The runtime visibility helper reads the option-level field; the input-level field is documentation.

An existing example (Q1.1, `content/screens/3.1-what-brought-you.md`):

```yaml
- id: intent
  options:
    - value: life_change
      label: "A life change is coming up"
      conditional_reveal: "life_change_text"   # option-level — machine key
- id: life_change_text
  control: short_text
  conditional_reveal: "only when intent == life_change"   # input-level — doc note
```

## Inputs you need from the user

1. **Which screen.**
2. **Which option.** By `value`.
3. **Which sibling input** should be revealed. By `id`. If it doesn't exist yet, you need to add it first (see step 3 below).

## Workflow

1. **Locate the screen and read both ends.** Verify the option exists and the sibling input exists.

2. **If the sibling input doesn't exist yet, flag and ask.** Creating a new sibling input is structural — outside this skill. Options:
   - User wants to add the sibling, then wire the reveal → split into two steps: add the sibling (separate skill — currently manual), then this skill.
   - User just wants to rename an existing sibling → `change-answer-option` or similar.

3. **Set `conditional_reveal` on the option** to the sibling input's id.
   ```yaml
   - value: life_change
     label: "A life change is coming up"
     conditional_reveal: "life_change_text"
   ```

4. **Set the input-level `conditional_reveal` note** on the sibling input to document the rule:
   ```yaml
   - id: life_change_text
     control: short_text
     conditional_reveal: "only when intent == life_change"
   ```
   This is human-readable — match the existing doc-note style on the screen.

5. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Admin integrity check `screens:option-conditional-reveal-sibling` verifies the target exists.

6. **Test locally.** Run `npm run dev` and walk the screen to confirm the reveal fires.

7. **Summarise.** Screen, option, sibling, both fields set.

## Files touched

- `master_template/content/screens/<section>.<n>-<slug>.md` — two frontmatter fields on two different options/inputs.

## Invariants — never break these

- **The target must be a sibling input on the same screen.** Not a different screen, not an input outside the current `inputs[]` block.
- **Never make two options reveal the same sibling without coordinating.** Multiple options can reveal the same sibling — that's fine (OR semantics). But the doc-note on the sibling should describe the full condition.
- **Option-level field is the source of truth.** The runtime visibility helper only reads this. Don't rely on the doc-note string.
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — wire life-change option to text box

**User:** "Reveal the life-change text box only when the 'life_change' card is picked on Q1.1."

(Already wired in the shipping app — this is the canonical example.) Set option's `conditional_reveal` to `"life_change_text"`; set sibling input's `conditional_reveal` to `"only when intent == life_change"`.

### Example 2 — sibling doesn't exist yet

**User:** "Add a 'sale_window' option and reveal a date picker when it's chosen."

Two steps:
1. Add the `sale_window` option (via `add-answer-option`).
2. Add the `sale_date` input block to the screen (structural — hand-edit or escalate).
3. Return to this skill: wire `sale_window.conditional_reveal: "sale_date"`.

Flag the second step as outside this skill; confirm with user before proceeding.

### Example 3 — don't do this: point across screens

**User:** "When 'business_owner' is picked on Q3.2, show the business sub-question on Q5.3."

Cross-screen reveals aren't supported by `conditional_reveal`. That's matrix + predicate territory — see `change-matrix-cell` and `add-engine-predicate`.

## When NOT to use this skill

- **Cross-screen gating** → matrix + engine predicate (`change-matrix-cell`, `add-engine-predicate`).
- **Adding the sibling input itself** → structural, not in this batch.
- **Renaming a reveal target** → `change-answer-option` (since the option's `conditional_reveal` is the field changing).

## Related skills

- `add-answer-option`, `change-answer-option`, `remove-answer-option`.
- `change-matrix-cell`, `add-engine-predicate` — cross-screen equivalents.

## Gotchas

- **The input-level string is documentation only.** Don't over-engineer it — a plain English clause like "only when intent == life_change" is enough.
- **`conditional_reveal` on the option and on the sibling are different schema fields.** Both names overlap in the frontmatter. The renderer reads the option's one; the sibling's one is a doc note.
- **Multi-option reveals are an OR.** If two options point at the same sibling, the sibling shows when either is picked. The renderer doesn't support AND semantics — use a predicate upstream if needed.
