<!-- _AUDIT.md entry: 8.4 -->
---
name: edit-report-block-global
description: Rewrite the body prose of a global (non-per-segment) report block under `content/report/` — methodology sections, expanded awareness-check copy, assumptions footnotes, or any other file whose frontmatter declares `kind: global`. Use this skill whenever the user asks to update the methodology page, rewrite an expanded awareness-check (e.g. "the LPA expanded copy"), tweak the assumptions text, soften a regulatory disclaimer, or otherwise modify the single-body content of a global block. Triggers on phrasings like "update the methodology", "rewrite the LPA expanded paragraph", "the BADR expanded copy is dated", or just "the methodology page intro".
---

# Edit the body of a global report block

## What this skill does

Updates the body (the single `# Body` H1 section, or the entire body when no `# Body` heading is used) inside a `content/report/<file>.md` block whose frontmatter declares `kind: global`. Preserves frontmatter — including the kind-specific extras (`source_id`, `image_slug`, etc.) — and round-trip fidelity.

## Background

After Phase 2 / S4, every file under `content/report/` is one of two canonical shapes:

- **`kind: per_segment`** — body has `# S1` … `# S9` H1 sections. Use `edit-report-block-segment`.
- **`kind: global`** — body is one cohesive piece, wrapped in a single `# Body` H1.

Global blocks are the parts of the report that are the same for every reader: the methodology page, the 26 expanded awareness checks (one per topic), and the assumptions footer (added in Phase 5).

The methodology page in particular is compliance-sensitive — every assumption number must be traceable, and the regulatory disclosures must not be reworded without CFP and Compliance sign-off. This skill handles the prose; advancing the compliance status is a separate skill.

## Inputs you need from the user

1. **Which file.** Path or topic name. If the user named the topic ("LPA", "BADR", "the £100k trap"), look under `content/report/awareness-checks-expanded/` for a file whose `source_id` or filename matches.
2. **Which sub-section.** Most global blocks have an internal structure under H2 / H3 headings. Confirm before editing — methodology has 5 numbered sections; awareness-expanded files have one H1 topic title, 1–3 free-prose paragraphs under it, and an optional set of frontmatter-driven rich blocks (see "Awareness-expanded rich blocks" below).
3. **The new text** or the intent.

## Awareness-expanded rich blocks

Files under `content/report/awareness-checks-expanded/` render through `AwarenessCheckPage`, which conditionally adds visual richness when these optional frontmatter fields are present. Every block is optional — a file with only paragraphs renders as before. **Author selectively** — overloading every page with every block makes them feel uniform; pick the 1–3 blocks that genuinely earn their slot for each topic.

| Field | Type | Renders as | When to use |
|---|---|---|---|
| `image_slug` | string | Hero illustration in a 180×180 box, top-right of the title row. Looks for `public/report-preview/assets/illustrations/<slug>.svg`. | Topic has a memorable visual hook (LPA → shield, IHT → tree). One per page max. |
| `risk_band` | `low` \| `watch` \| `urgent` | Coloured chip beside the title. Green / amber / red respectively. | Use sparingly — the band is a planner's-voice cue, not a verdict. Most pages need no chip. |
| `key_facts` | list of `{label, value}` (2–4 items) | 3-up stat strip under the title, paper-warm box, italic teal display values. | Topic hangs on numbers (carry-forward £200k, 100k trap 60% rate). Skip when there's no concrete figure worth highlighting. |
| `pull_quote` | string | Italic teal serif callout between paragraphs 1 and 2 (re-uses the existing `narrativePullquote` treatment). | A single-line idea worth slowing the reader on. Usually a planner-voice phrase or a striking number. ≤ 200 chars. |
| `at_a_glance` | list of strings (2–3 items) | Bordered box with teal left-rule and orange bullet dots, between paragraphs 2 and 3. | Topic has a clean "what / why / when" or "rule / number / window" structure. ≤ 90 chars per bullet. |
| `worth_a_conversation` | string | Orange-ruled callout box at the page foot. | Replaces the boring boilerplate bridge paragraph with something page-specific. Speak in the planner's voice — what the conversation typically covers. ≤ 280 chars. |

### Authoring example (LPA)

```yaml
---
id: report.expanded.lpa
kind: global
source_id: pitfall.lpa
title: "Lasting Power of Attorney — expanded PDF copy"
image_slug: lpa-shield
risk_band: urgent
key_facts:
  - label: Registration fee
    value: "£82 per LPA"
  - label: Solicitor setup
    value: "£300–£600"
  - label: Court of Protection alternative
    value: "£3,000–£5,000"
pull_quote: "The cost of not having LPAs, when they're needed, is measured in months of delay and a significant loss of control."
at_a_glance:
  - "Two separate documents — one for finances, one for health and welfare."
  - "Both must be registered with the Office of the Public Guardian before they can be used."
  - "Without LPAs, the Court of Protection route takes 6+ months and £3,000–£5,000."
worth_a_conversation: "If neither LPA is registered, this is the most urgent legal item on the page. A planner will usually walk you through the registration process in a single sitting."
compliance_status: draft
---

# Lasting Power of Attorney — the legal gap that costs the most to discover late

A Lasting Power of Attorney is a legal document that …
```

### Page-fit budget

The page is fixed at A4 (794×1123 px) with 70 px chrome top + bottom — **983 px of body**. The renderer doesn't paginate; if content overflows, it's silently clipped. Rough heights:

| Element | Approx height |
|---|---|
| Title row (with hero image) | 200 px |
| Title row (no image) | 120 px |
| Key facts strip | 80 px |
| Each paragraph | ~80 px |
| Pull quote | 70 px |
| At-a-glance box (3 bullets) | 110 px |
| Worth-a-conversation callout | 100 px |

A page with all blocks plus three paragraphs is right at the budget. Drop one paragraph if you add the full block set, or trim the prose. **Always preview the page after authoring** — visible clipping at the bottom is the only signal of overflow.

## Workflow

1. **Locate the file.** Common locations:
   - `content/report/methodology.md` — the final-page methodology.
   - `content/report/awareness-checks-expanded/<slug>.md` — 26 files, one per expanded topic.
   - (Phase 5 will add `content/report/assumptions.md` for the assumptions footer.)

2. **Read it whole.** Confirm `kind: global` in frontmatter. Note the H2 / H3 structure inside the body.

3. **Edit the prose under the named heading.** Body-only; leave frontmatter untouched.

4. **Voice.** Match the file's existing register:
   - Methodology — neutral, precise, traceable. Every number has a source. Plain English; avoid jargon. No directive language.
   - Expanded awareness checks — explanatory, slightly warm. Three paragraphs typically: context → specifics → bridge to the conversation. No "you should"; prefer "most families we see…".

5. **Compliance flag — methodology and disclosures.** If the edit touches numbers, sources, or the regulatory disclosures (Section 5 of methodology), flag explicitly:
   > This change touches compliance-sensitive copy. The block's `compliance_status` should reset to `draft` and re-route through CFP + Compliance review before shipping.
   Do not reset the status automatically — surface the question.

6. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```

7. **Summarise.** File path, block id, sub-section edited, before → after. Flag any compliance implications.

## Files touched

- `master_template/content/report/<path>.md` — one file, one body sub-section.

## Invariants — never break these

- **Never change `id`, `kind`, or `title` here.** Those are structural.
- **Never touch frontmatter extras** (`source_id`, `image_slug`, etc.) without confirming with the user — they bind the block to other parts of the system.
- **Never advance `compliance_status` as a side-effect.** Use `change-block-compliance-status`.
- **Methodology numbers must be traceable.** If you change a tax-rate value, update the corresponding source citation in the same row. If you can't trace it, stop and ask.
- **Round-trip fidelity.** Use the admin's save path or `parseMd` / `serializeMd` from `@shared/markdown`.

## Examples

### Example 1 — soften an expanded awareness check intro paragraph

**User:** "The LPA expanded copy opens too clinically — soften the first paragraph."

**Target:** `content/report/awareness-checks-expanded/lpa.md`.

Body structure: one H1 topic title, then 3 paragraphs separated by blank lines. Edit the first paragraph only. Match the register of paragraphs 2 and 3. Leave the rich-block frontmatter (`image_slug`, `key_facts`, `pull_quote`, etc.) untouched unless the user asked for it.

### Example 1b — add rich blocks to a flat expanded page

**User:** "The carry-forward expanded page is just three paragraphs of text. Add a key-facts strip and a worth-a-conversation callout."

**Target:** `content/report/awareness-checks-expanded/carry-forward.md`.

Add to frontmatter:
```yaml
key_facts:
  - label: Annual allowance
    value: "£60,000"
  - label: Look-back window
    value: "3 tax years"
  - label: Higher-rate tax saving
    value: "~£80–90k on £200k"
worth_a_conversation: "Best run in the autumn of a good year — by April, the oldest year of unused allowance has dropped off and can't be recovered."
```

Numbers must trace to the source-of-truth tax-year file. If you can't trace `£60,000`, stop and ask. Don't add `risk_band` or `at_a_glance` unless the user asks — pick the 1–2 blocks that genuinely earn their slot.

### Example 2 — update the inflation assumption in the methodology table

**User:** "Update the inflation assumption to 2.7% — the BoE target moved."

**Target:** `content/report/methodology.md`, Section 2 — Growth and inflation assumptions, "Inflation" row.

Edit the value cell. Update the source citation in the same row if the basis changed. **Flag compliance:** every change to a methodology number is compliance-sensitive — recommend resetting `compliance_status` to `draft`.

### Example 3 — don't do this: rewrite the regulatory disclosures paragraph

**User:** "The 'Not financial advice' paragraph is too wordy — trim it."

That's compliance-locked text. Refuse to edit without explicit confirmation that CFP + Compliance have signed off on the new wording. The Phase 5 plan will likely move this paragraph to a separate file with a stronger sign-off gate; until then, this skill must hand back without writing.

### Example 4 — don't do this: edit a per-segment block

**User:** "Update the S3 tile note for retirement readiness."

That's a per-segment edit. Use `edit-report-block-segment`.

## When NOT to use this skill

- **Edit a per-segment block** → `edit-report-block-segment`.
- **Edit the regulatory disclosures section without confirmation** — refuse and surface the compliance gate.
- **Add a new global block** → `add-report-block`.
- **Advance compliance status** → `change-block-compliance-status`.

## Related skills

- `edit-report-block-segment` — per-segment edit sibling.
- `change-block-compliance-status` — workflow advancement.
- `add-report-block` — create a new file.

## Gotchas

- **Methodology has H1 `# Body` then H2 section headings.** When editing, find the right H2 / H3 sub-section — the loader walks H2 sections under `# Body`, then matches "Page heading", "Opening paragraph", "Section 1 …" etc. by heading text.
- **Expanded awareness checks render the H1 as a page title.** The first H1 in the body becomes the page heading in the rendered PDF — it is part of the displayed content. Wording change here changes the page header visible to the reader.
- **Source citations matter.** A methodology row like "ISA annual allowance | £20,000 | HMRC, 2025/26 tax year" is traceable. If you edit the number, also confirm and update the source citation. Numbers with stale citations fail compliance review.
- **`image_slug` must resolve to an SVG file.** The slug binds to `public/report-preview/assets/illustrations/<slug>.svg`. If the file isn't there, the box renders empty. Adding a new illustration is the `add-image` skill (note: that skill currently targets the general `content/images/` library — for the report illustrations sub-library, drop the SVG straight into `public/report-preview/assets/illustrations/` and reference its slug from frontmatter).
- **Rich-block fields ride along via `.passthrough()`.** The schema doesn't strictly validate `key_facts`/`pull_quote`/etc shape — the loader does. A malformed field (e.g. `key_facts:` as a string instead of a list) silently disappears rather than throwing. Always preview the rendered page after authoring.
- **Page overflow is silent.** The page-frame is `overflow: hidden` and pages don't paginate. If you cram too much in, the bottom gets clipped without warning. Preview every authored page in the browser before declaring done.
