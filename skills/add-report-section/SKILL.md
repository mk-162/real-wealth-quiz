<!-- _AUDIT.md entry: 8.7 -->
---
name: add-report-section
description: Introduce a new `section` key to the Real Wealth report beyond the existing 10 (cash, expenditure, fin_life_planning, protection, investment, pension, property_mortgage, tax_optimisation, where_you_are, actions). Use this skill ONLY when the user has decided an entire new section is needed in the report. This is Tier 3 — it cascades through the report enum, HTML template, admin UI, and every downstream section enumeration. Triggers on phrasings like "add a Philanthropy section to the report", "introduce a Care-planning section", or "we need a new section for something the current 10 don't cover".
---

# Add a new report section

## What this skill does

Extends the report's `section` enum with a new key and wires it into the template, the admin, and the content surfaces that enumerate sections. This is not a content edit — it's a schema + template + admin change.

## Human confirm gate (Tier 3)

Before making any edit:

1. **Challenge the need.** Ask: "Which of the existing 10 sections nearly covers this? Can we extend an existing section instead?"
2. **Summarise the cascade:**
   - `admin_app/shared/schema.ts` — `reportSection` enum extension.
   - `templates/_archive/report-legacy-mustache-2026-03/real-wealth-report.html` — render the new section.
   - `templates/_archive/report-legacy-mustache-2026-03/tokens.css` (possibly) — section-specific styling.
   - `content/report/<kind>/<new-section>-*.md` — at least one initial block (context or insight).
   - `content/report/charts/<new-section>-*.md` (optional) — section chart binding.
   - `content/report/images/<new-section>-*.md` (optional) — section image binding.
   - Admin UI — every `SECTIONS` array or enum listing in admin components.
   - Regression: PDF render of a sample session to confirm the new section displays.
3. **Flag compliance.** New content in the section starts at draft — CFP + Compliance review before ship.
4. Wait for explicit "yes" / "proceed".

## Background

Current 10 sections (from `_AUDIT.md` §8.5):
`cash | expenditure | fin_life_planning | protection | investment | pension | property_mortgage | tax_optimisation | where_you_are | actions`

The report template renders sections in a fixed order. Adding a new section means the template needs to know where to place it.

## Inputs you need from the user

1. **Section key.** Snake_case — `philanthropy`, `care_planning`.
2. **Section label.** Human-readable — "Philanthropy", "Care planning".
3. **Placement.** Before / after which existing section? Maps to where the HTML template renders it.
4. **Initial content.** At least one block (context paragraph, or a banded insight) to populate the section — otherwise it renders empty.

## Workflow

1. **Human confirm gate (above).**

2. **Extend the enum.** `admin_app/shared/schema.ts` — add the new key to `reportSection`. If the master has a parallel enum (content/schema.ts extension), extend it too. Check for drift.

3. **Extend the HTML template.** `templates/_archive/report-legacy-mustache-2026-03/real-wealth-report.html` — add a section block for the new key. Match the existing section structure (heading, intro, insights, blocks, chart, image).

4. **Add section-specific styling** (if needed) in `templates/_archive/report-legacy-mustache-2026-03/tokens.css`.

5. **Seed content.** Create at least:
   - `content/report/context/<new-section>-context.md` — the section's orientation paragraph.
   - OR `content/report/insights/<new-section>-<topic>.md` — a first banded insight.
   All at `compliance_status: draft`.

6. **Update admin UI.** Every `SECTIONS` enumeration in admin components — grep `reportSection` + manual sweep of admin components.

7. **Comprehensive validation.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   npm run typecheck
   npm run build
   cd admin_app
   npm run test
   ```

8. **Render a sample report.** Admin preview or `npm run dev` → load a session → export to PDF. Confirm the new section displays in the right place.

9. **Summarise.** Every file touched, new content blocks created, template lines added, admin UI places updated, regression walkthrough done.

## Files touched

- `master_template/admin_app/shared/schema.ts` — enum extension.
- `master_template/templates/_archive/report-legacy-mustache-2026-03/real-wealth-report.html` — new section render.
- `master_template/templates/_archive/report-legacy-mustache-2026-03/tokens.css` (possibly).
- `master_template/content/report/context/<new-section>-*.md` (new).
- `master_template/content/report/<insights|tip|think>/<new-section>-*.md` (new, as needed).
- `master_template/content/report/charts/<new-section>-*.md` (optional).
- `master_template/content/report/images/<new-section>-*.md` (optional).
- Admin UI files that enumerate sections.

## Invariants — never break these

- **Human-confirm gate first.**
- **Template rendering must actually include the new section.** An enum extension without template wiring = dead section.
- **Existing sessions don't regenerate.** Historical reports aren't retroactively updated. The new section appears only for newly rendered reports.
- **Initial content starts at draft.**
- **Schema parity between master and admin.** `reportSection` enum must match on both sides.
- **Section ordering matters.** Place in the template where the report reads naturally — philanthropy near tax_optimisation, care_planning near protection, etc.

## Examples

### Example 1 — add a Philanthropy section

**User:** "We want a Philanthropy section in the report — for HNW clients thinking about legacy giving."

**Confirm:**

> Cascade for adding `philanthropy` section:
> - Enum in `admin_app/shared/schema.ts`.
> - HTML template — render a new Philanthropy page. Placement suggestion: after `tax_optimisation`, before `where_you_are`.
> - Seed content: at least one context paragraph, one tip. All at draft.
> - Admin UI extensions in section enumerations.
>
> Downstream: only shows for HNW sessions if we gate it on segment, or shows for all. Which?
>
> Compliance: new CTA / insight / tip copy needs CFP + Compliance review before ship.
>
> Confirm to proceed?

On confirmation, execute.

### Example 2 — don't do this: add without content

User: "Add a Legacy section. We'll write the content later."

Refuse (politely). An empty section renders as a heading with no body. Either hold off, or add a minimal context paragraph as placeholder at draft status.

### Example 3 — don't do this: "quick" enum add

User: "Just add the enum, we'll wire the template next week."

Split work is fine, but flag: until the template renders the section, the enum is dead code. Tests that assert enum → render mapping will fail. Usually better to land the full cascade in one commit.

## When NOT to use this skill

- **Edit content within existing sections** → `edit-banded-insight`, `edit-static-report-block`.
- **Add a block to an existing section** → audit 8.5 (not in this batch).
- **Rename a section** → not yet scoped; high-risk, would need a separate Tier 3 skill.
- **Per-segment report variants** → audit 8.14 (not in this batch).

## Related skills

- `edit-banded-insight`, `edit-static-report-block`, `change-report-template-structure` (Tier 3).

## Gotchas

- **Admin schema drift test.** Adding to `admin_app/shared/schema.ts` without the mirror in master-side (if it exists) fails the drift test.
- **PDF pagination.** A new section takes at least one page (usually). Template changes around page breaks can push surrounding content. Visual QA at PDF export time is load-bearing.
- **Compliance workflow scales.** One new section often = 3-5 new compliance-gated content files. Expect the review cycle to take a few passes before `approved_to_ship`.
- **Tokenised prose.** If the new section's content uses tokens, register them first in `admin_app/shared/placeholders.ts` — otherwise `report:placeholder-known` fails.
