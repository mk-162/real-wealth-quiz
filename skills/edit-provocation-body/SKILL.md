<!-- _AUDIT.md entry: 4.1 -->
---
name: edit-provocation-body
description: Rewrite the headline, body, or cta of an existing Real Wealth provocation — the short compliance-gated callouts fired on specific answer patterns like the £2m IHT cliff or the £100k tax trap. Use this skill whenever the user asks to soften a provocation, tighten its body, change the cta line, reword the hook, polish the prose, or fix tone on a compliance callout. Triggers on phrasings like "soften the £2m cliff provocation", "rewrite the retired-short body", "the cta on the pension-pots-tease provocation feels flat", or just "the provocation about inheritance tax".
---

# Edit a provocation body

## What this skill does

Updates one or more of the `# Headline`, `# Body`, or `# Cta` body sections on a single `content/provocations/<slug>.md` file. Preserves all frontmatter — trigger, segments, compliance_status, signoff dates — every structural field stays put.

## Background — what a provocation is

Provocations are the short, commercial callouts fired on specific answer patterns (e.g. "The £2m cliff" when estate ≥ £2m and rnrb_taper_awareness did not fire). They're compliance-gated: the `compliance_status` field gates whether a provocation renders in production — `draft` never ships, `approved_to_ship` does.

Schema (from `content/schema.ts`):
```typescript
// Frontmatter
{ id, trigger, segments, placement?, compliance_status, cfp_signoff_date, compliance_signoff_date, version, source_refs }
// Body (extracted into the schema at load time)
{ headline, body, cta }
```

Filenames use a kebab slug: `iht-2m-cliff.md`, `self-employed-pension.md`, `pension-pots-tease.md`. The `id` inside is `prov.<slug_snake>`.

## Inputs you need from the user

1. **Which provocation.** File path (`content/provocations/iht-2m-cliff.md`), slug (`iht-2m-cliff`), or concept ("the £2m IHT one", "the one about pension pots"). Glob `content/provocations/*.md` and scan if the user named the topic.
2. **Which section.** Headline, body, or cta. If not specified, infer from the length/shape of the intended rewrite — short punchy line → headline; paragraph → body; wrap-up line → cta.
3. **The new text** or a description of the intent ("soften", "make more specific", "less alarming").

## Workflow

1. **Locate the file.** `master_template/content/provocations/`. If given a topic, grep for keywords in headlines/bodies:
   ```bash
   grep -l -r "2m" master_template/content/provocations/
   ```

2. **Read the file whole.** Check `compliance_status`. A change to body copy on an `approved_to_ship` provocation effectively makes it a new piece of copy — the reviewer will want to see it go back through draft → cfp_signed → compliance_signed → approved_to_ship again. Flag this to the user before editing: **a copy change on an approved provocation is not a trivial edit**.

3. **Edit only the named section.** Never touch frontmatter for a wording-only change. Other skills cover trigger edits, segments lists, and compliance advancement.

4. **If this is an `approved_to_ship` provocation being edited:** after saving, reset `compliance_status: draft` and clear both signoff date fields. Flag clearly in the summary that the provocation has fallen out of approved state and needs re-review. Never advance it back up — that's the reviewer's call, handled by `advance-compliance-status`.

5. **Respect character budgets** (`admin_app/shared/character-budgets.ts`):
   - `provocation.headline` — ideal 40, hard 60.
   - `provocation.body` — ideal 180, hard 320.
   - `provocation.cta` — ideal 30, hard 50.

6. **Voice.** Provocations are the most tonally-tuned copy in the app. Specific, adult, a little sharp. Real Wealth uses concrete numbers ("£200,000–£500,000 more inheritance tax than necessary") and named mechanisms ("residence nil-rate band tapers £1 for every £2 over £2m"). Never: "unlock", "maximise", "hack", exclamation marks, generic "you should" / "you must". Advice-verbs are banned in buttons but allowed in provocation body prose; preserve the existing file's register.

7. **If body changes use placeholder tokens** (`{{estate_band}}`, `{{rnrb_remaining}}`) — not typical for provocations, but possible — confirm each token exists in the registry. Currently provocations use plain prose; the token surface is for report insights.

8. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   `content:check` enforces all three body sections present and the frontmatter shape. `voice:check` catches banned phrases.

9. **Summarise.** File path, section(s) edited, before → after, and the compliance-status situation (unchanged / reset to draft).

## Files touched

- `master_template/content/provocations/<slug>.md` — one file, one or more body sections. Possibly `compliance_status` + signoff dates if the provocation was approved.

## Invariants — never break these

- **Never change `id`.** It's the runtime foreign key — `prov.<slug_snake>`.
- **Never advance `compliance_status` as part of a body edit.** That's `advance-compliance-status` and must be human-authored. A body edit on an approved provocation *resets* status; it never advances it.
- **All three body sections must exist.** `# Headline`, `# Body`, `# Cta`. Don't delete any of them.
- **Never silently modify an approved provocation without flagging.** Production cares about what `approved_to_ship` means. Edits must be visible to the reviewer.
- **Never change `trigger`, `segments`, or `placement`** in this skill — those are structural. Use `change-provocation-trigger` / `change-provocation-segments`.
- **Round-trip fidelity.** Use YAML AST editing.

## Examples

### Example 1 — soften a headline on a draft provocation

**User:** "Soften the £2m cliff headline — 'The £2m cliff.' feels almost gleeful."

**Target:** `content/provocations/iht-2m-cliff.md`. `compliance_status: draft` currently.

**Before:**
```markdown
# Headline
The £2m cliff.
```

**After:**
```markdown
# Headline
The £2m threshold most families miss.
```

Validation: 37 chars — under ideal 40. `voice:check` clean. No compliance-status change because it was already draft.

### Example 2 — edit a body paragraph on an approved provocation

**User:** "Tighten the body on the retired-short provocation — the second sentence is wordy."

**Target:** `content/provocations/retired-short.md`. Status currently `approved_to_ship`.

Flag first:

> This provocation is currently `approved_to_ship`. Editing the body means it's effectively new copy — the change will reset `compliance_status` to `draft` and clear both signoff dates. It'll need to pass CFP review and Compliance review again before it can ship.
>
> Proceed?

On confirmation: edit the body, then set `compliance_status: draft`, `cfp_signoff_date: null`, `compliance_signoff_date: null`.

Summary: "Body updated. Compliance status reset from `approved_to_ship` to `draft`. Needs re-review before it'll fire in production."

### Example 3 — cta line rewrite

**User:** "The cta on the pension-pots-tease provocation should feel like an invitation, not a warning."

**Target:** `content/provocations/pension-pots-tease.md`. Edit only `# Cta`. Preserve the rest.

### Example 4 — don't do this: a trigger change

**User:** "Change the IHT provocation to also fire at £1.5m estates."

That's not a body edit. Redirect to `change-provocation-trigger`.

## When NOT to use this skill

- **Changing when the provocation fires** → `change-provocation-trigger`.
- **Changing which segments see it** → `change-provocation-segments`.
- **Adding a brand-new provocation** → `add-provocation`.
- **Advancing compliance_status after sign-off** → `advance-compliance-status`.
- **Editing an awareness check's body** → `edit-awareness-check` (different file tree and section names).

## Related skills

- `change-provocation-trigger` — trigger DSL edits.
- `change-provocation-segments` — segments list.
- `add-provocation` — brand-new file.
- `advance-compliance-status` — workflow advancement (human-gated).
- `edit-awareness-check` — the parallel skill for awareness checks.

## Gotchas

- **`approved_to_ship` is the ship flag.** A body edit on an approved provocation is meaningful: it moves copy out of production-ready state. Always surface this in the change summary; never do it quietly.
- **Don't invent numbers.** Provocation bodies often cite specifics (£200,000–£500,000 extra IHT, 18–24-month sale timeline). If the user asks to change a number, confirm it's backed by the `source_refs` in the frontmatter. If not, flag to source it properly.
- **Voice is tightly constrained.** Quiet, specific, adult. Compare against `content/microcopy/voice-rules.md` and the existing high-bar provocations (`iht-2m-cliff.md`, `self-employed-pension.md`) for calibration.
- **The cta line does real emotional work.** Provocations land with a concrete hook (headline), an explanation (body), and a single-line invitation (cta). Keep the cta functional — "One of the conversations most families come to us for." not "Book a call today!"
