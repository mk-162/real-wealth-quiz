<!-- _AUDIT.md entry: 8.4 -->
---
name: edit-static-report-block
description: Rewrite the body of a static `context`, `think`, or `tip` block in a Real Wealth report section. Use this skill whenever the user asks to update the cash context paragraph, rewrite a tip, soften a "things to think about" block, change a protection tip, or otherwise modify a static (non-banded) report block. Triggers on phrasings like "update the pension tip", "the cash context paragraph is dated", "rewrite the think block on protection", or just "the tip in the IHT section".
---

# Edit a static report block

## What this skill does

Updates the `body` prose on a single `content/report/<kind>/<slug>.md` file where `<kind>` is `context`, `think`, or `tip`. Preserves frontmatter (id, section, order, compliance_status) and every other field.

## Background — the three static block kinds

Report sections compose from a mix of **banded insights** (personalised per-input bands) and **static blocks** (the same prose for everyone in a section, regardless of their numbers). The three static kinds:

- **context** — the orientation paragraph for the section. "Here's how cash sits in the overall picture."
- **think** — the "things worth thinking about" prompts. Exploratory, questioning.
- **tip** — the actionable nudge. Specific, short, concrete.

Each lives under `content/report/<kind>/` — i.e. `content/report/context/`, `content/report/think/`, `content/report/tip/`. Filenames are kebab slugs: `cash-context.md`, `pension-tip.md`, `iht-think.md`.

Schema shape (from the admin's `reportStatic` schema):
```typescript
// Frontmatter
{ id, section, order?, compliance_status }
// Body (extracted)
{ body }
```

Currently the folders exist but are mostly empty placeholders (`README.md` only). That's expected — the report content layer is being populated. When editing, the file structure follows the shape above even if few examples exist yet.

## Inputs you need from the user

1. **Which block kind.** `context`, `think`, or `tip`. Inferred from phrasing ("tip", "think", "context paragraph") or by section + role.
2. **Which file / section.** Slug or section name ("cash", "pension", "iht"). Glob for the file.
3. **The new text** or the intent.

## Workflow

1. **Locate the file.** `master_template/content/report/<kind>/<slug>.md`. If the user named only the section, glob inside the kind folder for files whose filename or frontmatter mentions that section.

2. **Read the file whole.** Understand the section's overall tone. Static blocks set the baseline register for the section — a tip edit has to match the context paragraph above it.

3. **Edit the body prose.** Body-only; leave `id`, `section`, `order`, `compliance_status` alone.

4. **Placeholder tokens are rare in static blocks** (they're usually for banded insights) but not forbidden. If you use one, it must exist in `admin_app/shared/placeholders.ts`. Prefer plain prose here — static blocks are generic by design.

5. **Character budget.** `report.static.body` — ideal 260, hard 520. Generous because static blocks carry the orientation weight of the section.

6. **Voice, per block kind:**
   - **context** — calm, orienting, plain. "Cash is the cushion that lets the rest of the plan hold shape."
   - **think** — questioning, prompting. "A question worth sitting with: how much of your monthly spend is you, and how much is other people's standing orders?"
   - **tip** — specific, actionable, short. "The practical move most households benefit from: automate the top-up so emergency fund doesn't drain silently."
   Match the register of neighbours in the same kind folder.

7. **If the block is `approved_to_ship`:** flag to the user that a body edit resets compliance status (same treatment as provocations and awareness checks). Don't reset silently.

8. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   Admin integrity scan runs on open in the admin UI.

9. **Summarise.** File path, block kind + section, before → after. Flag compliance implications.

## Files touched

- `master_template/content/report/<kind>/<slug>.md` — one file, body only.

## Invariants — never break these

- **Never change `id`, `section`, or `order`.** Structural; drive render composition.
- **Never change `kind` by moving a file between folders.** A `tip` belongs in `content/report/tip/`. Moving it to `context/` reshapes which section role it plays — different skill.
- **Never advance `compliance_status` as a side-effect.** Body edit may *reset* to draft; never advance. See `advance-compliance-status`.
- **Preserve any placeholder tokens** exactly — and prefer plain prose.
- **Round-trip fidelity.** Use YAML AST editing.

## Examples

### Example 1 — soften a cash context paragraph

**User:** "Update the cash-context paragraph — 'cushion' is fine but the second sentence sounds preachy."

**Target:** `content/report/context/cash-context.md` (or similar — confirm filename).

**Before:**
```yaml
---
id: report.context.cash_context
section: cash
order: 1
compliance_status: draft
---
Cash is the cushion that lets the rest of the plan hold shape. You should keep enough of it to cover anything unexpected.
```

**After:**
```yaml
---
id: report.context.cash_context
section: cash
order: 1
compliance_status: draft
---
Cash is the cushion that lets the rest of the plan hold shape. Enough to cover the unexpected, not so much it sits idle while inflation eats at it.
```

Validation: 146 chars — under ideal 260. `voice:check`: "you should" removed. Clean.

### Example 2 — rewrite a pension tip

**User:** "The pension tip in the report is generic — can we make it about the annual allowance specifically?"

**Target:** `content/report/tip/pension-*.md`.

Edit the body with a specific tip about the £60,000 annual allowance (and the £10,000 MPAA if triggered). Register: short, concrete, specific.

### Example 3 — don't do this: edit a banded insight

**User:** "Update the cash-insight paragraph for households with 3-6 months of savings."

That's a banded case, not a static block. Use `edit-banded-insight`.

### Example 4 — don't do this: move a tip into a different section

**User:** "Can we use the cash tip in the investment section too?"

That's structural — either clone it into `content/report/tip/<new-slug>.md` with `section: investment`, or create an inline reference. Don't repurpose a single file to serve two sections; the `section` field is singular.

## When NOT to use this skill

- **Edit a banded insight body** → `edit-banded-insight`.
- **Add or remove a static block** → `add-report-block` / `remove-report-block` (audit 8.5 — not in this batch).
- **Change block ordering within a section** → `change-report-block-order` (audit 8.6 — not in this batch).
- **Change which section a block belongs to** → structural; create a new file, deprecate the old one.
- **Edit the static disclaimer / methodology copy** → `edit-disclaimer-or-methodology` (Tier 3).

## Related skills

- `edit-banded-insight` — per-band insight edits in the same report surface.
- `edit-banding-cases` — adding / removing banding cases on an insight.
- `advance-compliance-status` — workflow advancement.
- `edit-disclaimer-or-methodology` — Tier 3, compliance-sensitive static copy.

## Gotchas

- **The content/report/ folder is mostly placeholders right now.** As of the latest audit, context/, think/, and tip/ subfolders contain only README.md stubs. When your first real file lands, it sets the reference register for the kind — take extra care with voice.
- **Static blocks can't be personalised.** If the user wants "this should say 'your portfolio'" — that's a banded insight or a tokenised prose fragment, not a static block. Escalate.
- **Section enum is constrained.** Valid sections: `cash | expenditure | fin_life_planning | protection | investment | pension | property_mortgage | tax_optimisation | where_you_are | actions`. A block with `section: philanthropy` fails the schema — adding a new section is `add-report-section` (Tier 3).
- **Tips are short by convention, not by schema.** A tip that runs 400 chars passes validation but reads wrong on the page — cap around 150 chars in practice.
