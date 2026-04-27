# Screens README

This folder contains the questionnaire screens. One markdown file equals one screen in the flow.

Use this folder when changing question wording, options, screen order metadata, routing metadata, or the copy shown on the question card.

## File Shape

Each file has YAML frontmatter between `---` lines, then named markdown body sections:

```markdown
---
id: screen.4.A.4.other_property
screen_number: "4.A.4"
title: Other property
section: assets
layout: asymmetric
inputs:
  - id: other_property
    control: radio
    required: true
---

# Headline
Any other property?

# Sub
Optional supporting copy.
```

The app validates this structure with `content/schema.ts`.

## Screen Fields

| Field | What it does |
|---|---|
| `id` | Unique internal screen ID. Do not duplicate it. |
| `screen_number` | Human reference number used in planning docs, such as `4.A.4`. |
| `title` | Short admin/display title for the screen. |
| `section` | Flow section, such as `assets`, `business`, or `priorities`. This drives section grouping and progress context. |
| `layout` | Screen layout. Allowed values: `asymmetric`, `centred`, `transition`, `intro`. |
| `grouped` | Whether the screen is treated as a grouped set of inputs. Usually `false`. |
| `gate_critical` | Whether the screen is essential for assigning the main segment. Use cautiously. |
| `tier_limit` | Questionnaire lengths that include the screen. `A` = thorough, `B` = standard, `C` = quick. |
| `image_family` | Image asset family/category for the visual treatment. |
| `image_direction` | Art direction prompt or note for the image. |
| `q_refs` | Links the screen to question IDs the screen owns, such as `Q4.2`. |
| `audience` | Per-question gating per segment. See below. |
| `logged_as` | Answer keys saved from this screen, such as `other_property`. |
| `conditional_logic` | Optional free-form note for complex routing or reveal rules. |
| `inputs` | The form controls shown on the screen. See below. |
| `transition_icon` | Optional icon for transition screens. |

## Routing Rule

Each screen owns one or more questions (`q_refs`). For every owned question
the screen carries an `audience:` entry mapping each segment S1–S9 to one of
three values:

- `shown` — this segment always sees the question.
- `conditional` — this segment sees the question only if the engine
  predicate (in `src/lib/segmentation/engine.ts`, keyed by question id)
  returns true.
- `hidden` — this segment never sees the question.

A screen is shown for a segment if AT LEAST ONE of its audience entries is
`shown` or `conditional` for that segment. Per-question conditional gating
then runs at the question level inside the screen.

Screens with NO audience block (transitions, intros) are always shown.

Example:

```yaml
q_refs: ["Q3.2", "Q3.3"]
audience:
  "Q3.2":
    S1: hidden
    S2: shown
    S3: shown
    S4: shown
    S5: shown
    S6: shown
    S7: shown
    S8: shown
    S9: shown
  "Q3.3":
    S1: hidden
    S2: hidden
    S3: shown
    ...
```

Some `q_refs` may not have an audience entry — typically follow-up
"a-suffix" inputs like `Q4.1a` that are gated by sibling-input
`conditional_reveal` rules at the input level. The engine never iterates
those independently; they ride along with their parent question.

## Input Fields

| Field | What it does |
|---|---|
| `id` | Answer key stored in the session and summary logic. |
| `label` | Field label shown to the visitor. Optional if the screen headline carries the question. |
| `label_helper` | Small helper text beneath or near the label. |
| `control` | Input type. Allowed values: `radio`, `card_select`, `multi_select`, `slider`, `currency`, `short_text`, `likert_5`, `pair_picker`, `number`. |
| `required` | Whether the visitor must answer this visible input before continuing. |
| `options` | Choices for radio/card/multi controls. |
| `range` | Numeric or slider settings: `min`, `max`, optional `default`, and `step`. |
| `placeholder` | Placeholder for text or number inputs. |
| `max_chars` | Character limit for text inputs. |
| `conditional_reveal` | Predicate controlling when this input appears. |

## Option Fields

| Field | What it does |
|---|---|
| `value` | Stored answer value. Keep this stable once used in logic. |
| `label` | Visitor-facing choice text. |
| `icon` | Optional icon name. |
| `reveal` | Small inline hint shown after selection. |
| `conditional_reveal` | Name of a sibling input to reveal when this option is selected. |

## Conditional Reveals

Two patterns are supported:

```yaml
conditional_reveal: "held_in_limited_company"
```

On an option, this reveals the sibling input with that ID when the option is selected.

```yaml
conditional_reveal: "only when other_property in [two_or_more, portfolio]"
```

On an input, this reveals the input only when the predicate is true.

Supported predicate forms include:

- `only when input_id == value`
- `only when input_id != value`
- `only when input_id in [value_1, value_2]`
- `only when input_id includes value`
- `only when input_id >= value`
- `only when input_id <= value`

## Body Sections

| Section | What it does |
|---|---|
| `# Headline` | Main question/card headline. |
| `# Sub` | Optional supporting copy shown beneath the inputs on the right panel. |
| `# Pullquote` | Optional per-screen pullquote for the left column. See below. |
| `# Body` | Free-form body for intro or transition screens. |

### Pullquote behaviour

Each questionnaire section has a default pullquote defined in `src/lib/sections/sections.ts`. The `# Pullquote` section lets you override or suppress that default for a specific screen.

| `# Pullquote` section in file? | Content | What renders |
|---|---|---|
| No | — | Section default shows (inherited from `sections.ts`) |
| Yes | Has text | That text shows instead of the section default |
| Yes | Empty | Nothing shows — section default is suppressed |

Use the empty form when the section default doesn't fit the specific question. Leave the section out entirely when you want the default to carry through.

**Note:** if a screen has no `# Pullquote` section and no section default, the app uses `# Sub` as the pullquote of last resort. If you have a `# Sub` on a screen and want no pullquote at all, add an empty `# Pullquote` section explicitly.

## Worked Example: Other Property

`screen.4.A.4.other_property` asks whether the visitor owns other property.

Key points:

- `q_refs: ["Q4.2", "Q4.2a"]` lists the question ids the screen owns. Only the
  ones that need engine-level gating get an `audience:` entry — `Q4.2a` is a
  sibling-reveal follow-up gated at the input level, so it has no audience
  entry.
- `audience: { "Q4.2": { S1: shown, ..., S9: shown } }` carries the per-segment
  visibility for `Q4.2`.
- `logged_as: [other_property, held_in_limited_company]` records both answers.
- `other_property` is the main required radio field.
- Choosing `two_or_more` or `portfolio` reveals `held_in_limited_company`.
- `held_in_limited_company` is optional and asks whether any property is held
  in a limited company.
- `tier_limit: [A, B, C]` means the screen appears in all three flow lengths.

