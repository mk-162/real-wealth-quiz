<!-- _AUDIT.md entry: 8.11 -->
---
name: rename-placeholder-token
description: RETIRED post-Phase 2 / S4. The `{{mustache}}` placeholder system is gone — the report no longer renders from a mustache HTML template. Per-segment report blocks now use `{single_curly}` engine-fillable tokens that the React renderer fills directly from `CompassInputs` + `CompassReport`. Use `edit-report-block-segment` to edit a tile note that uses tokens. Token rename across components is an engineering change, not an authoring skill.
---

# Rename a placeholder token — RETIRED

## What changed

Phase 2 / S2 archived the mustache HTML report template. Phase 2 / S4
unified report content into `kind: per_segment | global` blocks. As a
result:

- The `{{mustache}}` token registry (`admin_app/shared/placeholders.ts` was
  a registry for mustache tokens) is no longer the substitution path for
  the production report.
- The pre-S4 folders `content/report/insights/`, `context/`, `tip/`,
  `think/`, and `charts/` are gone. Their content moved into the canonical
  per-segment / global block shape.
- Per-segment blocks now use `{single_curly}` tokens (`{coverage_pct}`,
  `{cash_months}`, `{retire_age}`, etc.) filled by the React renderer from
  the engine output.

## What to do instead

- **Edit a token used in a per-segment tile note** → use
  `edit-report-block-segment`. Token names are documented in
  `src/lib/compass/tile-scoring-types.ts`.

- **Add a brand-new token to a tile note** → coordinate with engineering.
  The renderer must expose the token from `CompassReport` or `TileScore`
  before content can use it. Adding a token without engine support leaves
  it literal in the rendered output.

- **Rename a token in the engine output** → engineering change in
  `src/lib/compass/`. Cascades to every per-segment block body that uses
  the old token. Use a transactional grep + multi-file edit.

## Why this skill is gone

The skill was scoped to mustache `{{double_curly}}` tokens substituted by
the legacy HTML report. That code path is archived. Renaming a mustache
token in the registry has no runtime effect on the production report.

If a user invokes this skill, redirect them to `edit-report-block-segment`
or to engineering for engine-side rename.
