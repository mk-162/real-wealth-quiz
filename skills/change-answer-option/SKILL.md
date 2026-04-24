<!-- _AUDIT.md entry: 1.2 -->
---
name: change-answer-option
description: Edit the label, value, icon, reveal hint, or conditional_reveal of an existing answer option on a questionnaire screen in the Real Wealth Wealth Conversation. Use this skill whenever the user asks to rename a card label, change the text of a radio option, tweak an option's inline hint, add an icon to a choice, rewire which sibling input an option reveals, or otherwise modify one entry in an `inputs[].options[]` array WITHOUT adding or removing options. Triggers on phrasings like "rename the 'curious' option", "update the business-owner card hint", "change the label on the 'on_track' choice", or just "the 'life_change' option needs different wording".
---

# Change an answer option

## What this skill does

Edits one or more fields (`label`, `value`, `icon`, `reveal`, `conditional_reveal`) of a single existing option inside a screen's `inputs[].options[]` frontmatter array. Does not add or remove options. Preserves every other field on the screen. Flags the cascade when a `value` rename is proposed — the option value is a foreign key that segmentation predicates and sibling `conditional_reveal`s resolve against.

## Background — what an option looks like

Options live under `inputs[].options[]` in a screen's frontmatter. Each object is:

```yaml
- value: life_change        # machine key — ASCII snake_case
  label: "A life change is coming up"
  icon: sparkle             # optional — admin maps to a known icon set
  reveal: "Tell us what's coming up."   # optional — inline hint after selection
  conditional_reveal: "life_change_text"  # optional — id of a sibling input to show
```

- `value` is the machine-readable key. It's referenced from `src/lib/segmentation/engine.ts` predicates, sibling inputs' conditional_reveal strings, summary resolvers, and the projection engine's input-band mappers. **Renaming it is a cascade, not a text tweak** — escalate to the user.
- `label` is the human-readable card text. Editing it is safe.
- `icon` is an optional illustrative key. Only change it to a value the admin's icon registry recognises.
- `reveal` is the tiny confirmation hint that appears beneath the card after selection. Editing it is safe; keep it short.
- `conditional_reveal` names a sibling input's `id` that becomes visible when this option is chosen. Never point it at an id that doesn't exist on the same screen.

## Inputs you need from the user

1. **Which screen.** File path (`content/screens/3.1-what-brought-you.md`), screen_number (`3.1`), or the concept ("the question about what brought them here"). Glob `3.1-*.md` if only the number is given.
2. **Which option.** Named by its current `label`, its `value`, or a description ("the 'life change' card"). Look at the file and confirm which option is meant.
3. **Which field(s).** `label`, `value`, `icon`, `reveal`, or `conditional_reveal`. If the user just gave new text, assume `label` unless the text is snake_case (then ask whether they mean `value`).
4. **The new content.** Verbatim or described.

## Workflow

1. **Locate the file.** Screens under `master_template/content/screens/`. Filename pattern `<section>.<n>-<slug>.md`.

2. **Read the whole file.** Understand the option in context — what value it holds, what reveals off it, what segments see this screen.

3. **If the user wants a `value` rename, STOP and escalate.** Ask them to confirm they understand the cascade:
   - `src/lib/segmentation/engine.ts` predicates that compare against this value.
   - Any sibling input on the same screen whose `conditional_reveal` string still says "only when X == old_value".
   - Any content file that names the value in a trigger DSL (provocations, awareness checks).
   - The projection engine's `src/lib/compass/inputs.ts` mapper that turns runtime values into engine bands.
   Do the rename only after explicit confirmation, and run the grep (step 7) before handing back.

4. **Edit the option in frontmatter.** Change only the field(s) named. Preserve YAML key order and indentation. Don't touch other options, other inputs, or any body section.

5. **Respect character budgets.** Soft limits in `admin_app/shared/character-budgets.ts`:
   - `option.label` — ideal 40, hard 60.
   - `option.reveal` — ideal 80, hard 140.
   Over-hard writes still save but the integrity tray flashes. Trim or flag.

6. **Voice.** Option labels are buttons — quiet, sentence-case, no exclamation marks. "Curious — just having a look" is right; "I'm SO curious!!!" is wrong. The full ruleset lives in `scripts/banned-phrases.json` and `content/microcopy/voice-rules.md`.

7. **If `value` changed, grep for the old value.** From `master_template/`:
   ```bash
   grep -rn "<old_value>" src/lib/ content/
   ```
   Every hit is a place to flip in the same commit — engine predicates, sibling `conditional_reveal` strings, trigger DSL, projection inputs. Don't silently leave dangling references.

8. **If `conditional_reveal` changed, verify the target exists.** The new string must match an `inputs[].id` on the same screen. Otherwise the admin integrity check `screens:option-conditional-reveal-sibling` will flag it.

9. **Validate.** From `master_template/`:
   ```bash
   npm run content:check
   npm run voice:check
   ```
   Plus, if `value` changed, `npm run typecheck` (caught by engine predicate string literal drift in TS unions).

10. **Summarise.** Report file path, option touched, field(s) edited, before → after, and any grep/cascade follow-ups.

## Files touched

- `master_template/content/screens/<section>.<n>-<slug>.md` for the option edit.
- On a `value` rename: also `src/lib/segmentation/engine.ts`, potentially `src/lib/compass/inputs.ts`, potentially provocation/awareness trigger DSL in `content/provocations/` and `content/awareness-checks/`.

## Invariants — never break these

- **`value` rename is a cascade, not a tweak.** Escalate before touching it. Immutable id principle — the runtime uses the string as a foreign key.
- **Never add or remove options here.** That's `add-answer-option` / `remove-answer-option`.
- **Never rename the containing input's `id`.** That's a different cascade.
- **`value` must stay ASCII snake_case** (e.g. `life_change`, not `LifeChange` or `life change`). The schema enforces the existing format.
- **`value` must be unique within the input.** If the user wanted to rename to a value that already exists, they're merging two options — stop and ask.
- **`conditional_reveal` must point at a sibling on the same screen.** Not a different screen, not an input outside the current `inputs[]` block.
- **Round-trip fidelity.** Use YAML AST editing (gray-matter + yaml package), not naive string replace — key ordering and quoting style must survive a re-save.

## Examples

### Example 1 — safe label tweak

**User:** "The 'curious — just having a look' option feels a bit flippant. Can we make it 'Curious, having a look around'?"

**Target:** `content/screens/3.1-what-brought-you.md`. Option `value: curious`.

**Before:**
```yaml
- value: curious
  label: "Curious — just having a look"
```

**After:**
```yaml
- value: curious
  label: "Curious, having a look around"
```

Cascade: none (value unchanged). Validation: `option.label` 27 chars — well under ideal 40. `voice:check` clean.

### Example 2 — change the reveal hint

**User:** "Update the hint on the 'life_change' card on Q1.1 — say something like 'Tell us a little about it'."

**Target:** same file. Option `value: life_change`.

**Before:** no `reveal` field.

**After:**
```yaml
- value: life_change
  label: "A life change is coming up"
  reveal: "Tell us a little about it."
  conditional_reveal: "life_change_text"
```

Cascade: none. Validation: `option.reveal` 27 chars. Clean.

### Example 3 — `value` rename (escalate)

**User:** "Rename the 'on_track' option to 'checking_in' — 'on track' sounds too corporate."

STOP. Respond:

> Renaming the `value` cascades beyond this file. I'd need to flip it in:
> - the matrix predicate in `engine.ts` (if any references `on_track`),
> - any sibling input's `conditional_reveal` string,
> - trigger DSL in provocations / awareness checks if they name it,
> - `src/lib/compass/inputs.ts` if this is a mapped band.
>
> If you want a display-only rename, I can change `label` to "Checking in" and keep `value: on_track` — cheaper and safer. Want me to do that instead, or proceed with the full cascade?

### Example 4 — don't do this: adding a new option

**User:** "Add a 'prefer not to say' option to Q3.1."

Not this skill. Use `add-answer-option`. Stop and redirect.

## When NOT to use this skill

- **Adding a new option** → `add-answer-option`.
- **Removing an option** → `remove-answer-option`.
- **Wiring a fresh reveal between an option and a new sibling input** → `add-conditional-reveal`.
- **Changing the screen's headline / sub / body** → `change-question-wording`.
- **Changing which segments see the screen** → `change-matrix-cell`.

## Related skills

- `add-answer-option` — insert a new option.
- `remove-answer-option` — delete an option, including dangling-reference clean-up.
- `add-conditional-reveal` — wire an option to show a child input.
- `rename-question-id` — if the rename target is a `questionId`, not an option value.

## Gotchas

- **The admin app is the safer path.** Its option editor prevents `value` collisions and refuses dangling `conditional_reveal` targets. Only hand-edit when you need a script or bulk run.
- **Value renames silently pass `content:check`.** The validator checks shape, not content semantics. Always run the grep in step 7 on a rename; the admin's integrity tray surfaces orphans but the CLI does not.
- **YAML quoting.** The existing file uses `"..."` quotes on labels with punctuation. Keep the same style — a switch to unquoted or single-quoted is a diff the reviewer has to sanity-check.
- **Icons are admin-registered keys, not file paths.** `icon: sparkle` refers to an admin icon registry entry; don't point it at a PNG path.
