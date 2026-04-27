<!-- _AUDIT.md entry: 8.5 -->
---
name: add-report-block
description: Create a new file under `content/report/` in the canonical Phase 2 / S4 shape — a fresh per-segment or global report block ready for the renderer + admin editor to pick up. Use this skill whenever the user asks to add a new report tile, introduce a new expanded awareness-check page, scaffold a new methodology section as its own file, add a new takeaway or gauge variant block, or otherwise create a brand-new report-content file. Triggers on phrasings like "add a new report tile for X", "we need a new expanded awareness check on Y", "scaffold an assumptions footer block", or "create a new global report block".
---

# Add a new report block

## What this skill does

Creates one new markdown file under `content/report/` (or its existing sub-folders) in the canonical shape:

```yaml
---
id: report.<slug>
kind: per_segment | global
title: <short label>
description: <optional one-line note>
compliance_status: draft
# kind-specific extras (tile thresholds, source_id, etc.) here
---

# S1 ... # S9        # for per_segment
# Body               # for global
```

Picks an `id` from the right namespace, stubs the body with the canonical heading layout, and seeds `compliance_status: draft`. The renderer + admin editor pick up the new file automatically once the project tree is reloaded.

## Background

The canonical shape was introduced in Phase 2 / S4. Every file under `content/report/` validates against `reportBlockFrontmatter` in `master_template/content/schema.ts`. There is no separate per-shape schema any more — kind-specific extras (tile thresholds, gauge zones, awareness `source_id`, image_slug) ride along in the same frontmatter block and are preserved verbatim.

`id` namespaces in current use:
- `report.health_gauge` — per-segment gauge interpretation.
- `report.takeaway_banners` — per-segment headline banner.
- `report.tile.<slug>` — one of 12 planning-grid tiles.
- `report.goals.S<n>` — one segment's goals.
- `report.expanded.<slug>` — one expanded awareness-check page.
- `report.methodology` — the methodology page.

A new block should pick an id that fits an existing namespace, or — if it needs a new namespace — discuss the naming with the user first.

## Inputs you need from the user

1. **Block kind.** `per_segment` or `global`. If unclear, clarify: "Is this content the same for every reader, or does it vary by segment?"
2. **Topic / slug.** Short kebab- or snake-case slug for both filename and id (e.g. `iht-2027`, `state_pension_age`).
3. **Where to file it.** Top-level `content/report/`, or one of the sub-folders (`planning-grid/`, `goals/`, `awareness-checks-expanded/`)?
4. **Title** (the short editor-facing label).
5. **Initial body content**, OR a clear "leave the body empty for now — just scaffold the file" instruction.
6. **Any kind-specific extras.** For tiles: `tile_number`, `label`, `what_it_checks`, `thresholds`. For expanded awareness: `source_id` linking to a `content/awareness-checks/` file.

## Workflow

1. **Pick a path.** Most common:
   - Tile → `content/report/planning-grid/tile-NN-<slug>.md` (use the next free `tile_number`).
   - Goals (per segment) → `content/report/goals/S<n>-<slug>.md`.
   - Expanded awareness → `content/report/awareness-checks-expanded/<slug>.md`.
   - Top-level (gauge, banners, methodology, assumptions) → `content/report/<slug>.md`.

2. **Confirm the id.** Mint one in the right namespace (table above). If the user named the slug, use it; if not, derive from the title.

3. **Build the frontmatter.** Required: `id`, `kind`, `title`, `compliance_status: draft`. Optional: `description`. Then any kind-specific extras the user provided.

4. **Stub the body.**
   - For `kind: per_segment`: scaffold all nine `# S1` … `# S9` H1 headings with placeholder text under each so reviewers see the gaps. Acceptable placeholder: `_TODO: write copy for S<n>._`.
   - For `kind: global`: a single `# Body` heading with the user's initial content (or a `_TODO_` placeholder).

5. **Save the file.**

6. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   The Zod check parses the new frontmatter against `reportBlockFrontmatter` and fails if a required field is missing. Fix anything it flags.

7. **Render check (recommended).** Spin up `npm run dev` and visit `/report/master/S1` (or whichever segment makes sense). Confirm the new block displays — for tiles, look at the planning grid; for expanded awareness, scroll to the "Five things" section.

8. **Compliance reminder.** New blocks always start at `draft`. The block is invisible in production until `compliance_status` advances to `approved_to_ship` (CFP + Compliance signed). Use `change-block-compliance-status` to move it through the workflow.

9. **Summarise.** File path, id, kind, title, body sections seeded.

## Files touched

- `master_template/content/report/<path>.md` — one new file.

## Invariants — never break these

- **`id` is forever.** Pick it carefully; renaming cascades through the renderer and any sister content files (e.g. expanded awareness `source_id` linking).
- **`kind` defines the body shape.** Don't author a per-segment body under `kind: global` (or vice versa) — the loader will pick up zero usable content.
- **`compliance_status` starts at draft.** No exceptions.
- **One file = one block.** Don't combine two blocks into one file to "save space" — the editor and the loader both assume one canonical block per file.
- **Round-trip fidelity.** The new file should re-parse to byte-identical bytes — use the canonical layout (no extra blank lines, no trailing whitespace inside frontmatter values).

## Examples

### Example 1 — add a new tile

**User:** "We want a new tile for state pension age awareness — number 13."

Tiles top out at 12. Either renumber, push back ("the planning grid is fixed at 12 — extending it is a renderer change, scoped separately"), or add it elsewhere. Confirm before writing. If the user agrees to a new top-level block instead:

Path: `content/report/state-pension-age-awareness.md`. Kind: per_segment. Body: 9 H1 sections. Compliance: draft.

### Example 2 — add a new expanded awareness check

**User:** "We need an expanded page on the £100k tax trap to mirror the new awareness check."

Confirm: `content/awareness-checks/income-100k-trap.md` exists with `id: pitfall.income_100k_trap`. Then:

Path: `content/report/awareness-checks-expanded/income-100k-trap.md`.

```yaml
---
id: report.expanded.income_100k_trap
kind: global
title: "£100k income tax trap — expanded copy"
source_id: pitfall.income_100k_trap
compliance_status: draft
---

# Body

# The £100k income tax trap

_TODO: write the three-paragraph expanded copy._
```

(Note: expanded awareness files use the H1 inside `# Body` as the rendered page heading.)

### Example 3 — don't do this: skip the kind decision

**User:** "Just add a new report block called 'observations'."

Stop and clarify: per-segment or global? Topic / slug? Where? Without those answers the file is unusable.

### Example 4 — don't do this: ship at approved_to_ship

**User:** "Add the new block, set it to approved_to_ship — we'll come back later."

Refuse. New blocks ship at `draft` and only advance through the compliance workflow with explicit reviewer sign-off. The `change-block-compliance-status` skill handles those transitions.

## When NOT to use this skill

- **Edit existing blocks** → `edit-report-block-segment` / `edit-report-block-global`.
- **Add a screen, segment, provocation, or awareness check** — those have their own skills.
- **Rename an id** — separate, high-risk skill (not yet scoped).
- **Restructure the report layout** — template / renderer change, scoped separately.

## Related skills

- `edit-report-block-segment` — per-segment body edits.
- `edit-report-block-global` — global body edits.
- `change-block-compliance-status` — advance the new block through review.

## Gotchas

- **The renderer caches.** After adding a new file in dev, restart `npm run dev:next` (or wait for the file watcher) so the loader picks it up.
- **`source_id` must match.** Expanded awareness blocks bind to `content/awareness-checks/<slug>.md` via `source_id`. A typo here means the renderer falls back to the unaware-body in the source file.
- **Tile numbering is positional.** Tile slot 1 always renders top-left; tile 12 always renders bottom-right (with the dual-variant flip for owners vs others). Adding a tile means picking a free slot or having a renderer conversation.
- **The admin editor surfaces new blocks automatically.** No code change needed — the tree walks the folder.
