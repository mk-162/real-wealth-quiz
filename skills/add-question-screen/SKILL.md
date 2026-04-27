<!-- _AUDIT.md entry: 1.7 -->
---
name: add-question-screen
description: Create a new questionnaire screen markdown file under `content/screens/` with valid frontmatter and body sections. Use this skill whenever the user asks to add a new question, create a new screen, introduce a question about X, or otherwise extend the questionnaire with a new screen. Triggers on phrasings like "add a new screen for dependants' ages", "create a question about pension consolidation", or "new Q4.F section on philanthropy".
---

# Add a new question screen

## What this skill does

Creates a new `.md` file under `master_template/content/screens/` with every required frontmatter field, valid body sections for the chosen layout, and a per-question `audience:` block declaring which segments see each question. Keeps the file shape 1:1 with existing screens so the admin's round-trip tests pass.

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
- `tier_limit: [A, B, C]` (default)
- `image_family`, `image_direction` (for asymmetric layouts)
- `q_refs: ["Q<x.y>"]` — the question ids this screen owns. Each id that needs
  engine-level gating (i.e. anything iterated by the segmentation engine)
  must have a matching `audience:` entry. Sibling-reveal follow-ups (the
  "a-suffix" inputs like `Q4.1a`) appear in `q_refs` but typically have no
  audience entry — they ride along with their parent input.
- `audience: { Q<x.y>: { S1: shown|conditional|hidden, ... } }` — per-question
  visibility per segment. Required for any q_ref the engine should iterate.
- `logged_as: ["<signal_name>"]` — what the answer is persisted as
- `inputs: [...]` — the interactive bits

**Body sections** (depend on layout):
- `asymmetric` / `centred` — `# Headline`, `# Sub` required; `# Pullquote` optional.
- `transition` / `intro` — `# Body` common; `# Headline` + `# Sub` optional.

## Inputs you need from the user

1. **Section and position.** Which section (`set_the_tone`, `money_today`, `transition_money`, `about_you`, etc.) and which ordinal number within it (`4.A.6` → after A.5).
2. **Layout.** Default `asymmetric` for question screens; `transition` for section breaks; `centred` for questions with no supporting image; `intro` for the very first screen.
3. **Title and q_ref.** Plain-English title and the question id (`Q4.A.6`). The screen owns this question — there's no separate matrix file any more.
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
   tier_limit: [A, B, C]
   image_family: family_1_life_shape
   image_direction: "Short art-direction note for the image family."
   q_refs: ["Q4.A.6"]
   audience:
     "Q4.A.6":
       S1: shown
       S2: shown
       S3: shown
       S4: shown
       S5: shown
       S6: shown
       S7: shown
       S8: hidden
       S9: shown
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

5. **Audience block.** Already part of the frontmatter above. Every q_ref the
   engine should iterate needs a matching `audience:` entry with all 9 segment
   values (`shown` / `conditional` / `hidden`). Sibling-reveal follow-ups
   (suffixed `a` like `Q4.1a`) belong in `q_refs` for documentation but
   typically have no audience entry.

6. **If a `conditional` cell exists, ensure the predicate is registered** in
   `src/lib/segmentation/engine.ts`. See `add-engine-predicate`.

7. **Respect budgets.** Headline 50/80, Sub 120/180, options per `change-answer-option` skill.

8. **Voice.** See `change-question-wording`.

9. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   The Zod schema enforces the audience shape. Plus admin integrity scan —
   verifies option values are unique.

10. **Preview.** `npm run dev` and walk to the screen.

11. **Summarise.** New file path, audience entries added, any engine predicate added, and the screen's place in its section.

## Files touched

- `master_template/content/screens/<new-file>.md` (new).
- `master_template/src/lib/segmentation/engine.ts` (if new conditional predicate).
- `master_template/src/lib/questions/matrix.ts` (only when adding a brand-new
  question id — append it to the hardcoded `questionOrder` list at the
  position you want `buildQuestionList` to emit it).

## Invariants — never break these

- **`id` format:** `screen.<section>.<n>.<slug-snake>`. Match exactly — it's the runtime foreign key.
- **`screen_number` is a string,** even when it looks like a float. YAML parses bare `3.1` as number 3.1 (lossy — `4.10` becomes `4.1`). Always quote.
- **`q_refs` matches `audience` keys.** A q_ref that needs engine-level gating must have a matching `audience:` entry. The exception is sibling-reveal follow-ups (`Q4.1a`-style) which the engine never iterates — those live in `q_refs` for documentation but have no audience entry.
- **No `segments_served` / `skip` fields.** Phase 4 collapsed those into per-question audience. Don't add them — the schema rejects unknown keys silently in some cases and authoring tools won't show them.
- **Every required field must be present.** Schema validation is fail-loud at build.
- **Round-trip fidelity.** YAML AST emission, preserved quoting.

## Examples

### Example 1 — add Q4.A.6 contributions

Uses the frontmatter above. The audience block is part of the screen file —
no separate matrix file to edit. After saving, append `'Q4.A.6'` to the
hardcoded `questionOrder` array in `src/lib/questions/matrix.ts` at the
position the engine should emit it (typically next to its section
neighbours).

Validation clean.

### Example 2 — transition screen

Simpler — no inputs, no q_refs, no audience:
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

No audience block — transitions are always shown.

### Example 3 — don't do this: q_ref without an audience entry

User says: "Add a screen for Q4.F.1 philanthropy intent." If you declare
`q_refs: ["Q4.F.1"]` without a matching `audience: { "Q4.F.1": {...} }`
entry, the engine never iterates the question — it stays silently invisible.
Always include the audience entry alongside the q_ref.

## When NOT to use this skill

- **Rewording an existing screen** → `change-question-wording`.
- **Adding options to an existing input** → `add-answer-option`.
- **Removing a screen** → separate (audit 1.8, not this batch).
- **Adding a question to an existing screen** → hand-edit the screen's
  `q_refs` and `audience:` block (no separate skill — it's the same shape).

## Related skills

- `change-matrix-cell`, `add-engine-predicate`, `change-question-wording`,
  `add-answer-option`, `add-conditional-reveal`. (`add-matrix-row` is
  RETIRED — see its SKILL.md for redirects.)

## Gotchas

- **Quote `screen_number`.** YAML coerces `4.10` → 4.1 → "4.1" on re-emit. Round-trip breaks silently.
- **`image_family` must exist.** Admin integrity check `images:path-resolves` verifies the folder.
- **`logged_as` drives analytics and persistence.** Match existing naming (`intent`, `pension_contribution_rate`) — snake_case, specific.
- **Screen-flow order comes from `screen_number`.** This is what the user actually sees. The `questionOrder` in `src/lib/questions/matrix.ts` is a separate concept — it controls the iteration order of `buildQuestionList` (a deterministic API), not the screen flow. Update both when adding a question.
