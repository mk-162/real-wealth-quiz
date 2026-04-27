<!-- _AUDIT.md entry: 5.1 (bundled headline/body-aware/body-partial/body-unaware edits) -->
---
name: edit-awareness-check
description: Rewrite the headline, body aware, body partial, or body unaware on an existing Real Wealth awareness check. Use this skill whenever the user asks to update an awareness check's prompt, soften the "aware" variant, rewrite the unaware body, tweak the partial-awareness wording, or otherwise modify the copy on one of the `content/awareness-checks/*.md` files. Triggers on phrasings like "rewrite the unaware body on will-currency", "soften the RNRB taper headline", "update all three bodies on emergency-fund-sizing", or just "the awareness check about NI gaps".
---

# Edit an awareness check

## What this skill does

Updates one or more of the four body sections — `# Headline`, `# Body Aware`, `# Body Partial`, `# Body Unaware` — on a `content/awareness-checks/<slug>.md` file. This skill bundles all four body edits under one skill because in practice they're edited together: a voice pass on the headline usually prompts refinements to the three variants.

## Background — what an awareness check is

Awareness checks are the "did you know this?" prompts that fire after relevant questions. Each has a headline (the question-style prompt) and three body variants tuned to the user's self-declared awareness level. Schema (from `content/schema.ts`):

**Frontmatter:**
- `id: awareness.<slug_snake>` or `pitfall.<slug_snake>`
- `core: boolean`
- `trigger: <DSL>` (same DSL as provocations — see `change-awareness-trigger`)
- `placement: string` (human-readable note for where it renders)
- `source: string`
- `rank: number | null`
- `tier_limit: [A, B, C]` subset
- `compliance_status: draft | cfp_signed | compliance_signed | approved_to_ship`

**Body (all four required):**
- `# Headline` — the question-style prompt.
- `# Body Aware` — shown if the user self-declares aware.
- `# Body Partial` — shown if partial.
- `# Body Unaware` — shown if unaware.

All four must be present — the admin integrity check enforces it.

## Inputs you need from the user

1. **Which awareness check.** Path / slug / topic. If they named the topic ("NI gaps", "RNRB taper"), glob.
2. **Which section(s).** Headline, body aware, body partial, body unaware, or some combination.
3. **New text** or intent.

## Workflow

1. **Locate the file.** `master_template/content/awareness-checks/<slug>.md`.

2. **Read the file whole.** Check `compliance_status`. Same rule as provocations — editing body copy on an `approved_to_ship` awareness check effectively creates new copy; flag that status should likely reset to `draft` (surface the question, don't auto-reset).

3. **Edit the named section(s).** Body-only. Preserve every other section.

4. **Character budgets** (from `admin_app/shared/character-budgets.ts`):
   - `awareness.headline` — ideal 90, hard 140.
   - `awareness.body` (per variant) — ideal 200, hard 320.

5. **Voice — headline is a question, bodies are explanations.** The headline asks "were you aware of X?" — polite, direct, no leading. The three bodies tune depth:
   - **Body Aware** — confirms and offers the adviser angle. "You already know this; here's what we'd do about it."
   - **Body Partial** — fills gaps. "You have the outline; here's the numeric detail."
   - **Body Unaware** — explains fresh. "This matters because…; typical impact is…"
   Compare against `content/awareness-checks/rnrb-taper.md` for calibration — it's the canonical example.

6. **If this check is approved_to_ship:** surface the compliance question. Same treatment as provocations (see `edit-provocation-body`).

7. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   All four body sections must remain present.

8. **Summarise.** File, section(s) edited, before → after, compliance implications.

## Files touched

- `master_template/content/awareness-checks/<slug>.md` — body only.

## Invariants — never break these

- **All four body sections must remain present.** `# Headline`, `# Body Aware`, `# Body Partial`, `# Body Unaware`. None can be deleted.
- **Never change `id`.** Runtime foreign key.
- **Never advance `compliance_status` as a side-effect.** Body edits may *reset*; they don't advance.
- **Never touch `trigger`, `placement`, `source`, `rank`, `core`, `tier_limit` here.** Those are structural — see related skills.
- **Round-trip fidelity.** YAML AST editing, preserved section headings.

## Examples

### Example 1 — soften the unaware body

**User:** "The unaware body on rnrb-taper leans a bit heavy on the scary-numbers angle. Soften it but keep the specifics."

**Target:** `content/awareness-checks/rnrb-taper.md`. Currently `compliance_status: draft` (safe to edit freely).

**Before (`# Body Unaware`):**
> A typical £2.5m family estate (house plus investments) can easily pay £200,000–£500,000 more IHT than necessary because of this taper alone. In our experience the conversation is rarely "spend more" — it's usually about timing gifts, or using Business Relief-qualifying investments to move the estate below the cliff.

**After:**
> A typical £2.5m family estate — house plus investments — can easily see £200,000–£500,000 more inheritance tax than the households who plan for this. The conversation is almost never about spending more; it's usually about timing of gifts, and Business Relief-qualifying investments that can move the estate below the cliff while remaining invested.

Char count: 365 — within hard 500. Voice: specific, numerate, not preachy. Clean.

### Example 2 — rewrite all three bodies for consistency

**User:** "Do a pass over emergency-fund-sizing — the three bodies don't feel like they're in the same voice."

Read all three, identify drift, rewrite for consistency. Same voice register — adult, specific. Flag which sections changed in the summary.

### Example 3 — headline tweak

**User:** "The headline on the NI gaps check is a bit wordy."

Target: `content/awareness-checks/ni-gaps.md`. Edit `# Headline` only. Keep under ideal 90 chars.

### Example 4 — don't do this: delete a body

**User:** "Drop the 'aware' body — we never see users declare aware."

Refuse. All four sections are required by schema. Every awareness-check renderer path assumes the section exists. Editing the aware body to be shorter is fine; removing it breaks the shape.

## When NOT to use this skill

- **Change the trigger** → `change-awareness-trigger`.
- **Change rank / core / tier_limit** → `change-awareness-rank` (audit 5.3, not in this batch; manual for now).
- **Add a brand-new awareness check** → `add-awareness-check`.
- **Advance compliance** → `advance-compliance-status`.
- **Remove an awareness check** → separate, not in this batch.

## Related skills

- `change-awareness-trigger`, `add-awareness-check`, `advance-compliance-status`, `edit-provocation-body` (parallel skill for the other compliance surface).

## Gotchas

- **Section headings matter exactly.** The loader reads `# Headline`, `# Body Aware`, `# Body Partial`, `# Body Unaware`. Case-sensitive on the word, case-insensitive on the whitespace. Don't rename.
- **Voice drifts across three variants.** Write the three bodies as if the same advisor is calibrating depth for the reader's awareness level — same register, different information density.
- **Headlines are questions, not imperatives.** End with "were you aware of that?" or "did you know…" — not "Consider whether…" or "You should think about…"
- **Compliance reset not automatic.** Unlike body edits auto-resetting approved provocations, this skill surfaces the question but doesn't edit the status. Pair with `advance-compliance-status` if the user wants to reset.
