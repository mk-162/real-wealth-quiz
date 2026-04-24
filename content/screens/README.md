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
| `segments_served` | Documentation/intended audience for the screen. When `q_refs` exists, the routing matrix is the source of truth. |
| `skip` | Documentation/intended skipped segments. When `q_refs` exists, the routing matrix is the source of truth. |
| `tier_limit` | Questionnaire lengths that include the screen. `A` = thorough, `B` = standard, `C` = quick. |
| `image_family` | Image asset family/category for the visual treatment. |
| `image_direction` | Art direction prompt or note for the image. |
| `q_refs` | Links the screen to question IDs in the routing matrix, such as `Q4.2`. |
| `logged_as` | Answer keys saved from this screen, such as `other_property`. |
| `conditional_logic` | Optional free-form note for complex routing or reveal rules. |
| `inputs` | The form controls shown on the screen. See below. |
| `transition_icon` | Optional icon for transition screens. |

## Routing Rule

If a screen has `q_refs`, the app checks the routing matrix for those question IDs. A screen is shown for a segment when at least one referenced question is `Y` or `C` for that segment.

That means `segments_served` and `skip` are useful documentation, but the matrix is the source of truth when `q_refs` is present.

If a screen has no `q_refs`, the app falls back to `segments_served`.

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

- `q_refs: ["Q4.2", "Q4.2a"]` links the screen to the routing matrix.
- `logged_as: [other_property, held_in_limited_company]` records both answers.
- `other_property` is the main required radio field.
- Choosing `two_or_more` or `portfolio` reveals `held_in_limited_company`.
- `held_in_limited_company` is optional and asks whether any property is held in a limited company.
- `tier_limit: [A, B]` means the screen appears in thorough and standard flows, not quick.
- If the screen metadata and matrix disagree about segment visibility, the matrix wins because `q_refs` exists.

