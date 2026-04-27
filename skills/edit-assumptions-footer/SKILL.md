<!-- _AUDIT.md entry: 8.2 (sub-case) -->
---
name: edit-assumptions-footer
description: Rewrite the assumptions / disclaimer footer that prints at the bottom of the PDF report. Use this skill whenever the user asks to update the assumptions text, soften the "not modelled" line, change which assumptions are listed in the footer, tweak the disclaimer wording, or otherwise modify the prose published as the report's assumptions block. Triggers on phrasings like "update the assumptions footer", "the 'not modelled' line is too long", "add a note about adviser fees to the footer", or "the assumptions block needs softening".
---

# Edit the assumptions footer

## What this skill does

Updates the body prose in `master_template/content/report/assumptions.md` — the canonical-shape `kind: global` block that the `<Assumptions>` component renders at the bottom of every chart page. Preserves frontmatter and round-trip fidelity.

## Background

The assumptions footer used to live as hardcoded JSX strings inside `src/components/compass/Assumptions/Assumptions.tsx`. During simplification phase 5 it was lifted out into `content/report/assumptions.md` so editors can change the wording without touching code.

Shape (canonical post-S4):
```yaml
---
id: report.assumptions
kind: global
title: Assumptions footer
description: Published assumptions and "not modelled" disclaimer printed at the bottom of every chart page.
compliance_status: draft | cfp_signed | compliance_signed | approved_to_ship
---

# Body

<assumptions prose, with engine-substituted tokens like {risk_profile}, {state_pension_age>}, etc.>
```

The component reads the body via `src/lib/content/catalogue.ts` and substitutes engine tokens (risk profile, real income growth, tax residence, salary sacrifice, NI years assumed, personalised SPA, etc.) at render time.

## Inputs you need from the user

1. **The new text** or the intent ("soften", "shorten", "add a note about X").
2. **Which sub-section** if the user is editing only part of the footer. The body is typically two paragraphs: the published assumptions list + the "not modelled" disclaimer trailing clause.

## Workflow

1. **Locate the file.** `master_template/content/report/assumptions.md`. Confirm `kind: global` in frontmatter.

2. **Read it whole.** Identify the `# Body` H1. Note any `{token}` placeholders the engine fills (e.g. `{risk_profile}`, `{tax_residence}`, `{state_pension_age}`).

3. **Edit the prose** under `# Body`. Body-only; leave frontmatter untouched.

4. **Preserve every `{token}`** unless the user explicitly removes one with engine-side support. Removing a token in copy without removing it on the engine side leaves the token literal in the rendered output.

5. **Voice.** Match the existing register: matter-of-fact, neutral, lists facts not opinions. The footer is regulatory-adjacent; avoid hype ("transformative", "powerful", exclamations) and avoid hedging that softens regulatory clarity ("might", "perhaps", "we think").

6. **Char budget.** No hard limit, but keep total under ~600 chars — the footer prints in 9pt and runs across the page width once. Long footers wrap into a multi-line block that disrupts the chart layout.

7. **Compliance flag — published assumptions.** If the edit changes what's listed (adding/removing an assumption) or changes how a number is described, the change is compliance-sensitive. Flag in the summary:
   > This change touches the published assumptions footer. The block's `compliance_status` should reset to `draft` and re-route through CFP + Compliance review before shipping.
   Do not reset the status automatically — surface the question.

8. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```

9. **Render check (recommended).** `npm run dev` and visit `/report/master/S2`. Confirm the new footer text renders with all tokens substituted; look for any `{token}` that didn't substitute (means it's spelled wrong or the engine doesn't expose it).

10. **Summarise.** File path, sub-section edited, before → after, compliance implications, token list verified.

## Files touched

- `master_template/content/report/assumptions.md` — body only.

## Invariants — never break these

- **Never change `id`, `kind`, or `title`.** Structural.
- **Never change frontmatter extras** without confirming.
- **Never advance `compliance_status` as a side effect.** Use `change-block-compliance-status`.
- **Preserve every `{token}`** unless the engine-side substitution is being removed in the same change.
- **Round-trip fidelity.** Use the admin's save path or `parseMd` / `serializeMd`.

## Examples

### Example 1 — soften the "not modelled" trailing clause

**User:** "The 'not modelled' line ends with a long list — soften it without losing the items."

**Target:** `content/report/assumptions.md`, `# Body`, trailing clause.

**Before:**
> Not modelled: long-term care costs, sequence-of-return variations, lifetime gifts, business relief, divorce, future tax-rule changes.

**After:**
> A handful of things sit outside this projection — long-term care costs, sequence-of-return variations, lifetime gifts, business relief, divorce, and future tax-rule changes. Your planner walks through them on the first call.

Char count check: 235 — under target. Voice: warm but not hyped. Tokens: none used in this clause. Validation clean.

### Example 2 — add a note about adviser fees

**User:** "Add a note that the projection doesn't deduct adviser fees."

Body addition under `# Body`, before the "not modelled" clause:

> Adviser fees, platform charges and fund management costs are not deducted from the projection — your all-in annual cost (typically 0.7%–2.0%) reduces the terminal value.

Compliance flag: this is a new published assumption — recommend resetting `compliance_status` to `draft` and routing through CFP review.

### Example 3 — don't do this: rewrite the regulatory disclaimer

**User:** "The 'not financial advice' line should be friendlier."

This isn't here — the FCA-required disclosures live on the methodology page (`content/report/methodology.md`, Section 5). Redirect to `edit-report-block-global` with the additional caveat that regulatory text is compliance-locked and needs explicit CFP/Compliance sign-off on the new wording.

## When NOT to use this skill

- **Edit the methodology page** (the long-form 9th-page methodology) → `edit-report-block-global` on `methodology.md`.
- **Add a new tax-year constant** → `edit-tax-year-constants`.
- **Edit the regulatory disclosures** → refuse without explicit compliance sign-off; defer to `edit-report-block-global` with extra confirmation.
- **Change which engine values are exposed as tokens** → that's a code change in `Assumptions.tsx` + the engine, not a content edit.

## Related skills

- `edit-report-block-global` — methodology + other global blocks.
- `edit-tax-year-constants` — the engine constants that flow into the footer via `{tokens}`.
- `change-block-compliance-status` — workflow advancement.

## Gotchas

- **Token substitution happens at render time, not at content-build.** The body in `assumptions.md` is the template; tokens are filled per-session. A typo in `{state_pensoin_age}` (sic) won't fail validation — it'll print literally in the rendered PDF. Spell-check tokens.
- **The engine token surface comes from `Assumptions.tsx`.** If you want a new token, the component must expose it. Coordinate with engineering.
- **The integrity tray flags missing tokens.** When the admin opens the file it shows any tokens referenced in the body that aren't on the known-tokens list, and any known tokens not used in the body (the latter is a soft warning).
- **The footer prints on every chart page.** A wording change ripples to pages 2, 3, 4, 7. Visual check at least one page after edit.
