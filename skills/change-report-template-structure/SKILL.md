<!-- _AUDIT.md entry: 8.12 -->
---
name: change-report-template-structure
description: Restructure `templates/report/real-wealth-report.html` — add a new page, rearrange panels, change a layout, or adjust print-CSS pagination. Use this skill whenever the user asks to restructure the PDF report, insert a new page between existing ones, rearrange report panels, or change the report's HTML/CSS layout. This is Tier 3 — every `{{mustache}}` token in the template must exist in the registry, print pagination breakpoints must survive, and regression across all 9 segments is required. Triggers on phrasings like "add a new page between cover and snapshot", "rearrange the planning grid", or "the protection page layout needs a rework".
---

# Change the report template structure

## What this skill does

Edits `templates/report/real-wealth-report.html` (and optionally `templates/report/tokens.css`) to change the report's structural layout — adding pages, rearranging blocks, changing print-CSS pagination, or restyling sections.

## Human confirm gate (Tier 3)

Before making any edit:

1. **Summarise the structural change in plain English.** What pages / panels / blocks move. What stays.
2. **Flag token continuity.** Every `{{mustache}}` in the new template must exist in the `admin_app/shared/placeholders.ts` registry. Moving a token from page A to page B doesn't require registry changes, but adding a new one does.
3. **Flag pagination.** The report is print-CSS driven. Breakpoints (`page-break-before`, `page-break-after`, `break-inside: avoid`) govern page flow. A restructure that moves content across page boundaries can push blocks in unexpected ways.
4. **Flag per-segment regression.** The report renders differently per segment (per-segment tiles, tailored CTAs, per-band insights). A template change needs sample-render across 3–9 representative segments.
5. **Flag compliance.** Structural changes that move regulatory ribbons (disclaimer, methodology) may require re-review. A template change is a render-surface change — the reviewer's approval on prior copy was in the old structure.
6. Wait for explicit "yes" / "proceed".

## Background

The report is a single HTML template consumed by a PDF renderer. Per-session data is interpolated via mustache tokens. Print CSS (`templates/report/tokens.css` + inline) controls pagination.

## Inputs you need from the user

1. **Which page(s) / block(s).** Cover, snapshot, planning grid, projection, where-you-are, worth-a-conversation, silent-gaps, next-step, methodology.
2. **The change.** Insert / remove / rearrange / restyle.
3. **Visual intent.** A description or a reference (mockup, sketch).

## Workflow

1. **Human confirm gate (above).**

2. **Read the current template.** Understand the structure — page breaks, section ordering, mustache tokens used.

3. **Plan the edit.** Mark up where you'll cut and where you'll paste. Identify tokens moving with the content.

4. **Execute the HTML edit.** Preserve indentation style. Match the existing HTML's quoting, attribute ordering, class naming conventions (likely BEM or utility-classes).

5. **Update CSS.** If the change needs new layout styles, add to `templates/report/tokens.css` (or inline, matching existing pattern).

6. **Check every token.** Grep for `{{.*}}` in the changed sections. Each token must exist in `admin_app/shared/placeholders.ts`.

7. **Validate pagination.** Verify print CSS breakpoints are sensible — no block cut in half across pages, no orphan lines.

8. **Render across segments.** Sample-render the report for users in at least 3 representative segments (e.g. S1, S5, S9). Check that the new structure renders cleanly for each.

9. **Validate.**
   ```bash
   cd master_template
   npm run build
   # manual render of a real session — admin preview or export script
   ```

10. **Summarise.** Files touched, which pages changed, tokens moved, pagination checkpoints, per-segment sample-render results.

## Files touched

- `master_template/templates/report/real-wealth-report.html`.
- `master_template/templates/report/tokens.css` (possibly).
- No content edits for a pure structural change — though the template change may surface a need for new or moved content (flag as follow-up).

## Invariants — never break these

- **Human-confirm gate first.**
- **Every token in the template must exist in the registry.** `report:placeholder-known` catches this at admin save, but the template isn't content — you need to grep manually.
- **Pagination preserved.** Print CSS breakpoints survive the restructure.
- **Per-segment rendering regression-tested.** A new layout that breaks S6's chart placement is a visible regression.
- **Regulatory content placement preserved** unless explicitly changed. Disclaimer, methodology, FCA footer — the reviewer placed them deliberately.

## Examples

### Example 1 — insert a page between cover and snapshot

**User:** "Add a 'Your brief' page between the cover and the snapshot — a half-page summary the client can skim at a glance."

**Confirm:**

> Insert new page between cover (page 01) and snapshot (page 02). Content will need:
> - A heading and a 3-4 line body.
> - Possibly one or two tokens (name, segment label, top concern).
> - Print CSS: `page-break-after: always` on the new page.
>
> Pagination shifts: every subsequent page bumps +1. The methodology page (page 09) becomes page 10. If any link or TOC references page numbers by literal, they drift.
>
> Per-segment check: I'll sample-render S1, S5, S9 after the change.
>
> Confirm.

On confirmation, execute.

### Example 2 — don't do this: "just move the section"

User: "Move the methodology page before the next-step CTA. I don't think it matters."

Refuse without review. Methodology is regulatory — the reviewer approved its placement. Moving it requires re-review. Surface.

### Example 3 — don't do this: restructure without rendering

Always sample-render. A structural change without visual verification is shipping blind.

## When NOT to use this skill

- **Edit content inside the existing structure** → content skills (`edit-banded-insight`, `edit-static-report-block`).
- **Rename a token** → `rename-placeholder-token`.
- **Add a new section** → `add-report-section`.
- **Change per-segment variant logic** → audit 8.14 (not in this batch).

## Related skills

- `add-report-section`, `rename-placeholder-token`, `edit-disclaimer-or-methodology`.

## Gotchas

- **Print CSS is finicky.** Breakpoints that work in one browser's print preview may misfire in the PDF renderer (Puppeteer / wkhtmltopdf / Prince vary). Always render with the production renderer, not just the admin preview.
- **Media queries.** The template may serve both screen and print. Changes to the print side need `@media print` scoping.
- **Section widths and margin model.** The PDF page size is fixed; overflow causes cropping. New content must fit within the established margin.
- **Image and chart placement.** Images at fixed widths can push content over a page boundary after a restructure. Adjust widths or add `break-inside: avoid`.
