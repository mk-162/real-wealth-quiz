<!-- _AUDIT.md entry: 8.12 -->
---
name: change-report-template-structure
description: RETIRED post-Phase 2 / S2. The mustache HTML report template has been archived. Restructuring the report is now a code change against React components under `src/app/report/` and `src/components/compass/` — handled by an engineer, not by an authoring skill. If you want to add or rearrange a report page, see the engine overhaul doc (`docs/compass-engine-overhaul-2026-04-27.md`) for the React-component layout, or use `add-report-block` to add a new content block to an existing page.
---

# Change the report template structure — RETIRED

## What changed

Phase 2 / S2 of the simplification plan archived `templates/report/` and the
mustache-driven report HTML. The 9-page report now renders from React
components under `src/app/report/` and `src/components/compass/` — this is a
code-only surface. Authoring skills no longer touch the template structure.

## What to do instead

- **Add or rearrange a report page** → engineering change. See
  `src/app/report/master/[segment]/page.tsx` for the page composition and the
  `src/components/compass/` directory for the per-section components. No
  authoring skill applies.

- **Add a new content block to an existing report page** → use
  `add-report-block` to scaffold a `kind: per_segment` or `kind: global`
  markdown file. The component layer renders blocks by id.

- **Edit copy on an existing report block** → use `edit-report-block-segment`
  (per-segment) or `edit-report-block-global` (global).

- **Change print-CSS pagination** → engineering change in the React component
  styles. Not a content surface.

## Why this skill is gone

The mustache template (`templates/_archive/report-legacy-mustache-2026-03/real-wealth-report.html`)
is archived — kept on disk for reference, not consumed by the runtime.
Authoring against an archived template would silently no-op. Instead, every
content surface is owned by a markdown file under `content/report/` (managed
by the canonical-shape skills) or by a React component (managed by
engineering).

If a user invokes this skill, redirect them to one of the alternatives above.
