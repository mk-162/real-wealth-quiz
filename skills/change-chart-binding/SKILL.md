<!-- _AUDIT.md entry: 8.8 -->
---
name: change-chart-binding
description: Change which chart slug a report section uses, or rebind its input variables. Use this skill whenever the user asks to swap the chart on a report section, change the chart rendered in the cash block, update the chart's input bindings, or switch between two charts in the manifest. Triggers on phrasings like "swap the chart on the cash section", "use runway_years instead of compounding_line", or "rebind the IHT chart's inputs".
---

# Change a chart binding

## What this skill does

Edits `chart_slug` and/or `inputs` on a `content/report/charts/<section>-<slug>.md` file. Preserves the file's id, section, and surrounding context.

## Background

Report charts are defined by reference — each `content/report/charts/*.md` file pins a chart slug (from `content/charts/manifest.json`) to a section and binds input variables. The renderer reads the binding, looks up the chart in the manifest, and passes the bound inputs into the chart generator.

## Inputs you need from the user

1. **Which chart binding file.** Path or section + chart slug.
2. **New `chart_slug`** (optional).
3. **New `inputs` bindings** (optional).

## Workflow

1. **Locate the file.** `master_template/content/report/charts/<section>-<slug>.md`.

2. **Read the current binding.** Current `chart_slug`, current `inputs` map.

3. **For a `chart_slug` swap:**
   - Verify the new slug exists in `content/charts/manifest.json`.
   - Check the new chart's expected `inputs` schema (in the manifest). The binding's `inputs` must match.
   - If the schemas differ (e.g. old chart needed `{ rate, years }`, new chart needs `{ principal, duration }`), rebind or update inputs.

4. **For an `inputs` rebind:**
   - Match the chart's required input variable names exactly.
   - Values can be literals, session-answer references, or computed expressions (check the existing patterns in neighbouring files).

5. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Admin integrity check `report:chart-slug-exists` fails if the slug isn't in the manifest.

6. **Render preview.** In the admin app, preview the section to confirm the chart renders with the bound inputs.

7. **Summarise.** File, old slug → new slug, inputs delta.

## Files touched

- `master_template/content/report/charts/<section>-<slug>.md`.

## Invariants — never break these

- **`chart_slug` must exist in the manifest.** Unknown slug = broken render.
- **`inputs` must match the chart's schema.** Extra keys silently ignored; missing keys fail rendering.
- **Never touch `section` to "move" a chart.** Create a new binding file under the new section instead.
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — swap chart on cash section

**User:** "The cash section chart is 'compounding_line' — swap it for 'runway_years'."

Target: `content/report/charts/cash-compounding.md` (or similar).

Before:
```yaml
chart_slug: compounding_line
inputs:
  rate: 0.045
  years: 30
```

Check manifest: `runway_years` exists with `inputs: { cash_balance, monthly_expenditure }`.

After:
```yaml
chart_slug: runway_years
inputs:
  cash_balance: "{{cash_total}}"
  monthly_expenditure: "{{essential_monthly_spend}}"
```

Verify: the tokens `{{cash_total}}` and `{{essential_monthly_spend}}` exist in the placeholder registry.

### Example 2 — rebind inputs only

**User:** "Keep the chart, but change the rate assumption from 0.045 to 0.05 on the cash chart."

Edit only `inputs.rate`.

### Example 3 — don't do this: invent a slug

User: "Use the 'cash_waterfall' chart." If that slug isn't in `content/charts/manifest.json`, stop. Either add it via `9.x manifest add` (separate skill), or use an existing slug.

## When NOT to use this skill

- **Add or remove a chart entry in the manifest** → audit 8.9 (not in this batch).
- **Change the chart's inner rendering logic** → chart-generator codebase (out of scope).

## Related skills

- `change-image-binding` — the sibling skill for report images.
- `rename-placeholder-token` — Tier 3, affects tokens used as inputs.

## Gotchas

- **Placeholder tokens in `inputs`.** If the inputs reference tokens, the token resolution happens at render time — unknown tokens fall to the template substitutor's default (often empty string, which breaks charts).
- **Manifest is the source of truth for available slugs.** Read it — don't assume a slug exists by name.
- **Binding files are per-section.** One section can have multiple chart bindings if the page renders multiple charts — the filenames convention is `<section>-<chart-slug>.md` or similar. Match the existing pattern.
