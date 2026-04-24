<!-- _AUDIT.md entry: 3.1 -->
---
name: change-segment-cta
description: Edit the headline, body, button label, helper text, or booking link on one of the 11 Real Wealth segment CTA files (9 segments S1–S9 plus 2 overlays). Use this skill whenever the user asks to update the retiree CTA, change the S6 headline, soften the HNW call-to-action, tweak the helper line under a button, update a Calendly link, or otherwise modify the summary-page CTA for a specific segment or overlay. Triggers on phrasings like "update S8's button", "change the retired CTA", "rewrite the urgency-this-week overlay", or just "the CTA for business-exit folks".
---

# Change a segment CTA

## What this skill does

Edits the `# Headline`, `# Body`, `# Button`, or `# Helper` body sections — or the `button_link` frontmatter field — on a single `content/segments/S<n>-*.md` or `content/segments/overlay-*.md` file. Preserves frontmatter and every other section.

## Background — the 11 CTA files

- **9 segment CTAs:** `S1-early-accumulator.md` through `S9-hnw.md`. Each maps 1:1 to a segment id.
- **2 overlays:** `overlay-advised-but-looking.md`, `overlay-urgency-this-week.md`. These fire on top of a segment CTA when the overlay's trigger condition hits — overlay takes precedence.

Each file has the same shape:

- Frontmatter: `id`, `kind` (`segment` or `overlay`), `segment` (S-id or null), `overlay` (overlay tag or null), `button_link`.
- Body: `# Headline`, `# Body`, `# Button`, `# Helper`.

Segment labels (for mapping user phrasing to files):
S1 Early accumulator · S2 Mass affluent · S3 High earner · S4 Senior professional · S5 Business growth · S6 Business exit · S7 Pre-retiree · S8 Retired · S9 HNW.

## Inputs you need from the user

1. **Which CTA.** One of the 9 segments (by id or label) or one of the 2 overlays. Map plain-English names via the list above. If ambiguous ("retirees"), clarify: S7 (pre-retiree) or S8 (retired)?
2. **Which field.** Headline, body, button, helper, or booking link. If the user named the text change without naming the field, infer:
   - One punchy line → `# Headline`.
   - 1–3 sentence paragraph → `# Body`.
   - Button verb phrase → `# Button`.
   - Small grey line under the button → `# Helper`.
   - URL or Calendly slug → `button_link`.
3. **The new content.** Verbatim or described.

## Workflow

1. **Locate the file.** `master_template/content/segments/`. Glob `S<n>-*.md` if given just an id. For an overlay, the filenames are `overlay-advised-but-looking.md` and `overlay-urgency-this-week.md`.

2. **Read the file whole.** Understand voice, existing phrasing, and what this segment is doing right now. Segment CTAs are the most commercially-sensitive text in the app — the reviewer will scrutinise tone carefully.

3. **Edit the named section or frontmatter field.** Body changes touch only the body section; `button_link` change touches only that one frontmatter value. Don't re-flow neighbouring sections.

4. **Respect character budgets** (from `admin_app/shared/character-budgets.ts`):
   - `segment.headline` — ideal 50, hard 75.
   - `segment.body` — ideal 160, hard 260.
   - `segment.button` — ideal 22, hard 32.
   - `segment.helper` — ideal 40, hard 60.
   Over-hard saves still work but flash the integrity tray.

5. **Voice.** Grown-up, specific, low-hype. Segment CTAs often name a specific pain (BADR timing, the £100k trap, 2027 pensions-in-estate change) — keep them concrete. No "unlock", "transform", "supercharge", "guaranteed" (unless a regulatory term), no exclamation marks. Full ruleset: `scripts/banned-phrases.json` and `content/microcopy/voice-rules.md`.

6. **`button_link` edits:** must be a non-empty string. Calendly-style slug (`calendly.com/real-wealth-succession-call-placeholder`) is the norm. If the user gives a full URL with a protocol, strip the `https://` only if the existing entries do; keep the shape consistent with siblings.

7. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```

8. **Summarise.** File path, segment / overlay id, field(s) edited, before → after.

## Files touched

- `master_template/content/segments/S<n>-<slug>.md` or `master_template/content/segments/overlay-<slug>.md` — one file, one or more body sections, possibly `button_link`.

## Invariants — never break these

- **Never change `id`, `kind`, `segment`, or `overlay`.** Immutable ids — these are the runtime keys the summary resolver uses to pick the right CTA.
- **Never swap `kind` between `segment` and `overlay`** (they belong to different precedence paths; overlays fire *on top of* segment CTAs).
- **Never delete a body section.** All four (`Headline`, `Body`, `Button`, `Helper`) must exist — the admin integrity check enforces it.
- **Never edit the segment → file mapping.** `S6` is always `S6-*.md` with `segment: S6` — the filename prefix, the id, and the `segment` frontmatter must stay aligned.
- **Round-trip fidelity.** Use YAML AST editing; preserve indentation and quoting.

## Examples

### Example 1 — soften a headline

**User:** "The S6 headline feels a bit cold — soften 'the succession conversation' a touch."

**Target:** `content/segments/S6-business-exit.md`.

**Before:**
```markdown
# Headline
The succession conversation.
```

**After:**
```markdown
# Headline
The conversation about what comes next.
```

Validation: `segment.headline` 40 chars — well under ideal 50. `voice:check` clean.

### Example 2 — change the button label

**User:** "S8 button should say 'Book a drawdown review' — current one is generic."

**Target:** `content/segments/S8-retired.md`.

**Before:**
```markdown
# Button
Book a call
```

**After:**
```markdown
# Button
Book a drawdown review
```

Validation: `segment.button` 22 chars — at ideal. Clean.

### Example 3 — update a Calendly link

**User:** "S9's booking link should point at the new HNW flow — calendly.com/real-wealth-hnw-private."

**Target:** `content/segments/S9-hnw.md`.

**Before (frontmatter):**
```yaml
button_link: "calendly.com/real-wealth-hnw-placeholder"
```

**After:**
```yaml
button_link: "calendly.com/real-wealth-hnw-private"
```

Validation: `content:check` clean.

### Example 4 — overlay edit

**User:** "Rewrite the urgency-this-week overlay body to lean less on deadlines, more on momentum."

**Target:** `content/segments/overlay-urgency-this-week.md`.

Edit only the `# Body` section. `kind: overlay`, `overlay: urgency_this_week` — neither touched.

## When NOT to use this skill

- **Adding a new segment (S10)** → `add-segment` (Tier 3, high fan-out).
- **Removing or renaming a segment** → dedicated skills, not this one.
- **Adding a new overlay** → `add-overlay` / `remove-overlay` (not yet scoped as a skill).
- **Changing segment-assignment rules** (who lands in which segment) → `change-segment-assignment-rules`.
- **Editing a provocation** → `edit-provocation-body`.

## Related skills

- `edit-provocation-body` — the other commercial-callout surface.
- `edit-microcopy` — toasts, errors, emails (different voice, same caution).
- `change-segment-assignment-rules` — who lands in the segment in the first place.

## Gotchas

- **Overlays override segment CTAs.** If the user wants to "always show X to S6", editing S6 is right. If they want "show X when someone mentions they're already advised", edit `overlay-advised-but-looking.md` instead.
- **Button text is button-shaped.** Imperative verb phrases — "Book a call", "Start your plan". Not "Book a call now!!!" (exclamation banned) and not "You should book a call" (advice-verb banned per `voice-rules.md`).
- **Calendly slugs end up in production.** The `_placeholder` suffix in most current links is a signal they haven't been swapped for the real URL yet. If the user gives a placeholder-looking URL, confirm it's the real destination before committing.
- **Helper text is not a tagline.** It's a small reassurance under the button — "A 30-minute call with a senior partner." It's not "The future of advice, delivered." Keep it literal.
