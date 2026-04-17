# Questionnaire Methodology & UX Spec

Single source of truth for how option-based questions behave in the lead-magnet
questionnaire. Covers three concerns:

1. Single vs. multi-answer classification
2. Exclusive options inside multi-selects
3. Validation UX when Continue is clicked on an incomplete question

This doc is the editorial contract. Code lives in
`src/lib/questions/catalogue.ts`, the engine (`src/lib/questionnaire/`), and the
question components (`src/components/QuestionCard`, `OptionTile`,
`QuestionShell`).

---

## 1. Single vs. multi-answer classification

### The flag

The existing `Question.input` discriminator already encodes this. No new
boolean is needed. Use these values consistently:

| `input` value   | Semantics                           | Render                                |
| --------------- | ----------------------------------- | ------------------------------------- |
| `radio`         | Single choice, list / stacked rows  | Radio-style rows                      |
| `card_select`   | Single choice, tile grid            | Tile grid, one selected at a time     |
| `multi_select`  | Multi choice, tile grid             | Tile grid, checkbox semantics         |
| `likert_5`      | Single choice, 1–5 scale            | Scale control                         |
| `slider`        | Numeric                             | Slider                                |
| `numeric`       | Numeric                             | Number input                          |
| `short_text`    | Free-text                           | Textarea                              |

If tile-style multi-select differs structurally from `multi_select` today,
either:

- Reuse `multi_select` for tile multi (preferred — one discriminator), **or**
- Introduce `card_multi` alongside `card_select` and deprecate `multi_select`
  into a stacked-list variant only if that distinction is semantically useful.

Pick one direction. Do **not** add a parallel `multi: boolean` flag on top of
`input` — it creates impossible states.

### Decision rule (for editorial)

Apply this decision tree when authoring or reviewing any option-based question:

| Question nature                                                  | Flag            |
| ---------------------------------------------------------------- | --------------- |
| Motivation / state of mind — could genuinely be two at once      | `multi_select`  |
| Selection from a list where combinations matter (things held)    | `multi_select`  |
| Mutually exclusive categorical fact (income band, work status)   | `radio`         |
| Forced prioritisation / preference ("if you had to choose…")     | `card_select`   |
| Emotion / single closest feeling ("which feels closest?")        | `card_select`   |
| Scale / agreement                                                | `likert_5`      |

### Applied to the current catalogue

Changes from current state:

| Question | Current       | Change to      | Reason                                                     |
| -------- | ------------- | -------------- | ---------------------------------------------------------- |
| Q1.1     | `card_select` | `multi_select` | "What brought you here" — often more than one reason       |
| Q1.2     | `card_select` | `multi_select` | Freedom + security is a common, valid combination          |

Keep as single-select (`card_select`) — forced prioritisation is the design:

- Q3.5 — "which feels **closest**"
- Q5.3 — "which feels closest"
- Q6.2 — "which feels closest"
- Q7.2 — "**first** feeling that comes up"
- Q10.1 — "if you had to **choose**"

Already correct:

- Multi: Q2.2, Q5.2, Q6.3
- Radio bands: Q3.1, Q3.2, Q4.3, Q4.4, Q4.5, Q2.3, Q10.2, Q10.3

### Auto-helper copy

Render an auto-generated helper line under the stem based on `input`. The
author does not need to type this into `micro`:

| Input          | Helper                                        |
| -------------- | --------------------------------------------- |
| `card_select`  | "Pick the one closest to you"                 |
| `radio`        | (no helper — row list is self-explanatory)    |
| `multi_select` | "Pick all that apply"                         |

If `multi_select` contains any `exclusive: true` option (see §2), the helper
becomes: **"Pick all that apply, or choose one of the options below."**

The authored `micro` field, when present, renders below this auto-helper.

---

## 2. Exclusive options inside multi-selects

### The problem

Some options inside a multi-select are logically mutually exclusive with every
other option. Example: Q2.2 "Who else is part of the plan?" offers `solo`
("Nobody else — it's just me") alongside `partner`, `dependent_children`, etc.
Today a user can select `solo` **and** `adult_children`, which is nonsensical.

### The flag

Add one optional boolean to the `Option` interface:

```ts
export interface Option {
  value: string;
  label: string;
  description?: string;
  /**
   * When true, selecting this option clears all other selections.
   * Selecting any non-exclusive option clears this one.
   * Only meaningful on multi_select questions.
   */
  exclusive?: boolean;
}
```

### Selection rule (engine / component)

On every toggle in a `multi_select`:

1. If the toggled option has `exclusive: true` → set the selection to **just
   that option** (clear everything else).
2. If the toggled option is non-exclusive **and** a currently-selected option
   has `exclusive: true` → remove the exclusive one before adding the new one.
3. Otherwise → standard add/remove.

This handles both directions automatically. No special cases in UI code.

### Applied to the current catalogue

| Question | Option `value`  | Mark exclusive? | Note                                            |
| -------- | --------------- | --------------- | ----------------------------------------------- |
| Q2.2     | `solo`          | ✅ yes          | "Nobody else — it's just me"                    |
| Q5.2     | `accountant`    | ✅ yes          | "My accountant handles it — I'm not sure"       |
| Q5.2     | `leave_in`      | ⚠️ confirm      | Business logic — may coexist with salary etc.   |
| Q6.3     | `no_will`       | ✅ yes          | Can't have "no will" AND "a will"               |
| Q6.3     | `lpa_unsure`    | ✅ yes          | Uncertainty can't coexist with "I have LPA"     |

### Q6.3 — a sub-issue

`will_fresh` and `will_old` are mutually exclusive **with each other** (you
have one will, not two states of will). The cleanest fix is to split Q6.3 into
two sub-questions:

- **Q6.3a Will status** — `radio`: `will_fresh` / `will_old` / `no_will`
- **Q6.3b LPA status** — `multi_select`: `lpa_health` / `lpa_finance`, with
  `lpa_unsure` as `exclusive: true`

Keep this change optional — only do it if splitting doesn't break the flow
engine's question-id dependencies. Otherwise, document that Q6.3 currently
permits an impossible state between `will_fresh` and `will_old` and handle it
in the consumer of the data (summary / segmentation).

### Visual treatment of exclusive options

Exclusive options are not peers of the other tiles. Treat them as an escape
hatch:

- Render in a full-width row **below** the regular tile grid
- Subtle divider above (or 8–12px extra vertical spacing)
- Slightly muted label colour; same tile chrome
- Same treatment applies to "Other — tell us" tiles on single-selects

When a user clicks an exclusive option while others are selected, briefly
animate the others deselecting (150ms fade) so the behaviour is legible rather
than surprising. Disable this animation under `prefers-reduced-motion`.

### "Prefer not to say" on radio questions

Q3.1 and Q4.4 include `prefer_not_to_say`. Radios are single-select so no
logic change is needed. If any of those later become `multi_select`, the
`exclusive: true` flag applies.

---

## 3. Validation UX — the Continue button

### Principle

Do **not** disable the Continue button when the question is incomplete.
Disabled buttons fail users: no feedback on why, poor screen-reader support,
feel broken on touch. Keep Continue fully enabled, visually unchanged, and
respond on click.

This matches GOV.UK Design System and Nielsen Norman Group guidance, and
aligns with WCAG 3.3.1 (Error Identification).

### On-click behaviour when invalid

1. **Find the first invalid question** in DOM/reading order.
2. **Smooth-scroll** to it with ~100px top offset (clear of any sticky header).
3. **Move focus** to the question's first interactive element (critical for
   keyboard and screen-reader users).
4. **Set `aria-invalid="true"`** on the question's field container.
5. **Apply error state**: 2px red left-border on the question card + red
   outline pulse on the field for 500ms (2 cycles, ease-out).
6. **Render inline error** directly under the stem, inside a container with
   `role="alert"` so it's announced immediately.
7. **Switch that field to live-validate** from now on — the error clears the
   moment the user picks something valid, without waiting for another Continue
   click.

### Reduced motion

Under `prefers-reduced-motion`, skip the pulse entirely. Static red border +
error message is sufficient. Colour is never the only signal (WCAG 1.4.1) — an
icon and text are always present.

### Error copy (per input type)

| Input          | Message                                         |
| -------------- | ----------------------------------------------- |
| `card_select`  | "Pick the one closest to you to continue"       |
| `radio`        | "Pick an option to continue"                    |
| `multi_select` | "Pick at least one option to continue"          |
| `slider`       | "Drag the slider to set your answer"            |
| `numeric`      | "Enter a number to continue"                    |
| `short_text`   | "Add a line or two, or skip this question"      |
| `likert_5`     | "Tap one of the five to continue"               |

Be specific. Not "This field is required." Say what to do.

### Lazy validation before first Continue click

Do **not** show errors on fields the user hasn't attempted yet. Validation
fires on Continue click only. After a question has been errored once, it
switches to live-validate mode (see step 7 above) for the remainder of the
session.

### Accessibility checklist

- `aria-invalid="true"` on the errored field container
- `aria-describedby` on the field points to the error message's `id`
- Error message container: `role="alert"` (or `aria-live="assertive"`)
- Focus moves to the field (not to the error text)
- Error never relies on colour alone — icon + text always present
- Red border meets 3:1 contrast against the card background

### Conditional fields (tile + textarea)

When a question has a conditional second field (e.g. the "Other — tell us"
tile on Q1.2 that reveals a textarea), validate them as a unit:

- Tile selected + textarea empty → error message: *"Add a few words, or pick
  a different option"*
- Apply error state to the textarea, not the tile

### Analytics

Fire an event on every invalid-Continue attempt, with:

- `question_id`
- `input` type
- number of selections at time of click (0 for empty, N for exclusive-conflict
  if that ever applies)

Use this to identify confusing questions — if Q1.1 accounts for 40% of all
failed-Continue events, the stem or option labels need another pass.

---

## 4. Visual issues to fix alongside this work

Observed on the current Q1.2 render (desktop):

| # | Issue                                                              | Fix                                                     |
| - | ------------------------------------------------------------------ | ------------------------------------------------------- |
| 1 | Orphan tile on row 2 with two empty columns to its right           | Use 2-col grid on orphan rows, or centre-justify row    |
| 2 | "Other" textarea spans full width; trigger tile is 1/3 width       | Inline textarea inside the expanded "Other" tile        |
| 3 | Large vertical gap between textarea and the divider above buttons  | Remove the divider; tighten vertical rhythm             |
| 4 | Three-across button row (Why we ask / Back / Continue) floats      | Two groups: "Why we ask" left; `Back` + `Continue` right |
| 5 | Outer card padding compounds with already-generous page whitespace | Reduce card padding by ~25–30%, keep tile padding       |

---

## 5. Implementation summary

One-paragraph version for the implementer:

> Add `exclusive?: boolean` to `Option`. Update the `multi_select` selection
> logic so toggling an exclusive option clears all others, and toggling any
> non-exclusive option clears a currently-selected exclusive one. Flip Q1.1 and
> Q1.2 from `card_select` to `multi_select`. Mark Q2.2 `solo`, Q5.2
> `accountant`, Q6.3 `no_will`, and Q6.3 `lpa_unsure` as `exclusive: true`.
> Auto-render a helper under the stem based on `input` (and whether any option
> is exclusive). Stop disabling the Continue button — on click, if invalid,
> scroll-to + focus the first invalid question, set `aria-invalid`, pulse a
> red border for 500ms (respecting `prefers-reduced-motion`), show a
> type-specific error inside a `role="alert"` container under the stem, and
> switch that field to live-validate. Fire an analytics event on every
> invalid-Continue attempt with the question id.

---

## 6. Changelog

- **2026-04-16** — initial spec. Covers classification, exclusive options,
  and Continue-button validation UX.
