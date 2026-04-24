<!-- _AUDIT.md entry: 1.7 -->
---
name: add-question-screen
description: Create a new questionnaire screen markdown file under `content/screens/` with valid frontmatter and body sections. Use this skill whenever the user asks to add a new question, create a new screen, introduce a question about X, or otherwise extend the questionnaire with a new screen. Triggers on phrasings like "add a new screen for dependants' ages", "create a question about pension consolidation", or "new Q4.F section on philanthropy".
---

# Add a new question screen

## What this skill does

Creates a new `.md` file under `master_template/content/screens/` with every required frontmatter field, valid body sections for the chosen layout, and (optionally) a matrix.json row that registers the new question id. Keeps the file shape 1:1 with existing screens so the admin's round-trip tests pass.

## Background — what every screen needs

Schema (from `content/schema.ts` → `screenFrontmatter` + `screenSchema`):

**Required frontmatter:**
- `id: screen.<section>.<n>.<slug-snake>`
- `screen_number: "<section>.<n>"` (string, not number)
- `title: "<plain-English title>"`
- `section: "<section_key>"`
- `layout: "asymmetric" | "centred" | "transition" | "intro"`

**Common optional frontmatter:**
- `grouped`, `gate_critical` (booleans, default false)
- `segments_served: [all]` (almost always — matrix is the gate; see `HOW_IT_IS_MANAGED.md` §Matrix precedence)
- `tier_limit: [A, B, C]` (default)
- `image_family`, `image_direction` (for asymmetric layouts)
- `q_refs: ["Q<x.y>"]` — the matrix row ids this screen participates in
- `logged_as: ["<signal_name>"]` — what the answer is persisted as
- `inputs: [...]` — the interactive bits

**Body sections** (depend on layout):
- `asymmetric` / `centred` — `# Headline`, `# Sub` required; `# Pullquote` optional.
- `transition` / `intro` — `# Body` common; `# Headline` + `# Sub` optional.

## Inputs you need from the user

1. **Section and position.** Which section (`set_the_tone`, `money_today`, `transition_money`, `about_you`, etc.) and which ordinal number within it (`4.A.6` → after A.5).
2. **Layout.** Default `asymmetric` for question screens; `transition` for section breaks; `centred` for questions with no supporting image; `intro` for the very first screen.
3. **Title and q_ref.** Plain-English title and the matrix question id (`Q4.A.6`). If the `q_ref` is new, a matrix row must be added too.
4. **Input(s).** Control type (`radio | card_select | multi_select | slider | currency | short_text | likert_5 | pair_picker | number`) + options or range.
5. **Copy.** Headline, sub (or body for transition).

## Workflow

1. **Pick the filename.** `master_template/content/screens/<screen_number>-<slug>.md`. Slug is kebab-case derived from title.

2. **Check for collisions.** Glob `master_template/content/screens/<screen_number>-*.md`. If an existing screen shares the number, clarify: is this replacing, or does the numbering need to shift?

3. **Compose frontmatter.** Minimal valid:
   ```yaml
   ---
   id: screen.4.A.6.contributions
   screen_number: "4.A.6"
   title: Pension contributions
   section: money_today
   layout: asymmetric
   grouped: false
   gate_critical: false
   segments_served: [all]
   tier_limit: [A, B, C]
   image_family: family_1_life_shape
   image_direction: "Short art-direction note for the image family."
   q_refs: ["Q4.A.6"]
   logged_as: [pension_contribution_rate]
   inputs:
     - id: pension_contribution
       control: radio
       required: true
       options:
         - value: under_5
           label: "Less than 5%"
         - value: 5_to_10
           label: "5–10%"
         - value: 10_plus
           label: "More than 10%"
         - value: unsure
           label: "Not sure"
   ---
   ```

4. **Compose body.** For asymmetric:
   ```markdown
   # Headline
   What proportion goes into your pension each month?

   # Sub
   Including employer contributions — a ballpark is fine.
   ```

5. **Add the matrix row** (if the `q_ref` is new). Open `content/generated/matrix.json`, add a row with every S1–S9 column. See `add-matrix-row` skill for the full treatment — this skill calls that one.

6. **If a C cell exists, ensure the predicate is registered** in `src/lib/segmentation/engine.ts`. See `add-engine-predicate`.

7. **Respect budgets.** Headline 50/80, Sub 120/180, options per `change-answer-option` skill.

8. **Voice.** See `change-question-wording`.

9. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   Plus admin integrity scan — verifies `q_refs` have matrix rows and option values are unique.

10. **Preview.** `npm run dev` and walk to the screen.

11. **Summarise.** New file path, matrix row added (if so), any engine predicate added, and the screen's place in its section.

## Files touched

- `master_template/content/screens/<new-file>.md` (new).
- `master_template/content/generated/matrix.json` (if new q_ref).
- `master_template/src/lib/segmentation/engine.ts` (if new C predicate).

## Invariants — never break these

- **`id` format:** `screen.<section>.<n>.<slug-snake>`. Match exactly — it's the runtime foreign key.
- **`screen_number` is a string,** even when it looks like a float. YAML parses bare `3.1` as number 3.1 (lossy — `4.10` becomes `4.1`). Always quote.
- **`q_refs` must have matrix rows.** Declaring `q_refs: ["Q4.A.6"]` without a matrix row fails the admin's orphan check and breaks the runtime engine (the row lookup returns undefined).
- **`segments_served` defaults `[all]`.** Use the matrix to gate — not this field. See `HOW_IT_IS_MANAGED.md` §Matrix precedence.
- **Every required field must be present.** Schema validation is fail-loud at build.
- **Round-trip fidelity.** YAML AST emission, preserved quoting.

## Examples

### Example 1 — add Q4.A.6 contributions

(Uses the frontmatter above.) Matrix row appended:
```json
{
  "questionId": "Q4.A.6",
  "S1": "Y", "S2": "Y", "S3": "Y", "S4": "Y", "S5": "Y",
  "S6": "Y", "S7": "Y", "S8": "N", "S9": "Y"
}
```

Validation clean.

### Example 2 — transition screen

Simpler — no inputs, no q_refs:
```yaml
---
id: screen.4.F.0.transition-philanthropy
screen_number: "4.F.0"
title: Philanthropy transition
section: transition_philanthropy
layout: transition
transition_icon: heart
---

# Body
A few questions about what you'd want to pass on — and to whom.
```

No matrix row required (transitions aren't questions).

### Example 3 — don't do this: invent q_refs without a matrix row

User says: "Add a screen for Q4.F.1 philanthropy intent." Before saving, add the matrix row for Q4.F.1 or flag the requirement. Don't ship a screen that references a non-existent row.

## When NOT to use this skill

- **Rewording an existing screen** → `change-question-wording`.
- **Adding options to an existing input** → `add-answer-option`.
- **Removing a screen** → separate (audit 1.8, not this batch).
- **Just adding a matrix row** (no new screen) → `add-matrix-row`.

## Related skills

- `add-matrix-row`, `add-engine-predicate`, `change-question-wording`, `add-answer-option`, `add-conditional-reveal`.

## Gotchas

- **Quote `screen_number`.** YAML coerces `4.10` → 4.1 → "4.1" on re-emit. Round-trip breaks silently.
- **`image_family` must exist.** Admin integrity check `images:path-resolves` verifies the folder.
- **`logged_as` drives analytics and persistence.** Match existing naming (`intent`, `pension_contribution_rate`) — snake_case, specific.
- **Order comes from `screen_number`** via the build-time `generated-order.ts`. If you insert a new screen mid-section, neighbouring screens don't need renumbering unless you're reshuffling.
