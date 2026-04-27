<!-- _AUDIT.md entry: 8.1 -->
---
name: edit-report-block-segment
description: Rewrite the per-segment body section of a Real Wealth report block — the prose under one `# S1`..`# S9` heading inside any `content/report/` markdown file. Use this skill whenever the user asks to update a tile note for a specific segment, rewrite the gauge interpretation for S3, soften the S6 takeaway banner, change a goal's rationale for the early-accumulator segment, or otherwise edit the copy for ONE segment inside a per-segment block. Triggers on phrasings like "rewrite the S2 health-gauge line", "update the retirement tile note for S5", "soften the S9 takeaway banner", or just "change S1 on the cash tile".
---

# Edit a per-segment body in a report block

## What this skill does

Updates the body prose under one `# S<n>` H1 section inside a `content/report/<file>.md` block whose frontmatter declares `kind: per_segment`. Preserves frontmatter, the other 8 segment sections, and round-trip fidelity.

## Background — the canonical report-block shape

After Phase 2 / S4, every file under `content/report/` is one of two shapes:

- **`kind: per_segment`** — body has one `# S1` … `# S9` H1 section per segment. The renderer routes by segment id at SSG time. Tile files, gauge interpretations, takeaway banners, and the per-segment goals files all live here.
- **`kind: global`** — body has a single `# Body` H1. Methodology, expanded awareness checks, and assumptions live here.

Frontmatter always has: `id`, `kind`, `title`, optional `description`, `compliance_status`. Per-shape extras (tile thresholds, gauge zones, awareness `source_id`) ride along in the same frontmatter and are preserved verbatim.

This skill targets per-segment blocks ONLY. For global blocks, use `edit-report-block-global`.

## Inputs you need from the user

1. **Which file.** Path or id. If the user named the topic ("retirement tile", "gauge", "S6 takeaway"), glob `content/report/` and find the matching block.
2. **Which segment.** `S1` … `S9`. Phrases like "HNW", "retired", "early accumulator" map via:
   - S1 Early accumulator · S2 Mass affluent · S3 High earner · S4 Senior professional · S5 Business growth · S6 Business exit · S7 Pre-retiree · S8 Retired · S9 HNW.
3. **The new body** or the intent.

## Workflow

1. **Locate the file.** Common locations:
   - `content/report/health-gauge.md` (per-segment gauge copy + zones)
   - `content/report/takeaway-banners.md` (per-segment headline + supporting copy)
   - `content/report/planning-grid/tile-NN-*.md` (12 tile files)
   - `content/report/goals/SX-*.md` (9 goals files — each one is for ONE segment)

2. **Read the file whole.** Confirm `kind: per_segment` in the frontmatter. Note neighbouring segment sections to anchor voice.

3. **Identify the target H1 section.** Headings are typically `# S<n>` or `# S<n> — <segment label>`. Both forms work for the loader; prefer the existing form when editing so the diff stays minimal.

4. **Edit the body under that one H1.** Inside, the body is usually a small `key: value` block (status, note, capacity, rationale, tile_label, etc.). Do not invent new keys — only edit values, or rewrite the prose between key fields when the section is free-form (gauge, takeaway).

5. **Preserve any `{value_token}` placeholders.** Tiles use single-curly tokens like `{coverage_pct}`, `{retire_age}`, `{pension_k}` — these are filled by the engine at render time. Removing one breaks the personalisation; adding a new one needs a corresponding engine change (out of scope).

6. **Voice.** Real Wealth's voice is quiet, plain, grown-up. Avoid: "unlock", "supercharge", "transform your", "should", "must", "you need to", exclamation marks. The per-segment body is short — one to three sentences. Match the register of the other segments in the same file.

7. **If the file is `compliance_status: approved_to_ship`:** flag to the user that any body edit invalidates that approval. The reviewer may want to reset to `draft`. Do not reset automatically — surface the question.

8. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```

9. **Summarise.** File path, block id, segment edited, before → after. Flag compliance implications.

## Files touched

- `master_template/content/report/<path>.md` — one file, one `# S<n>` body section.

## Invariants — never break these

- **Never change `id`, `kind`, or `title` here.** Those are structural. Renaming `id` cascades through the renderer; flipping `kind` discards the per-segment shape entirely.
- **Never change another segment's section.** This skill is for ONE segment per invocation.
- **Never advance `compliance_status` as a side-effect.** Use `change-block-compliance-status` for that.
- **Preserve all `{token}` placeholders** unless the user is explicitly removing one with engine support.
- **Round-trip fidelity.** The admin's save path handles this; if writing a script, use `parseMd` / `serializeMd` from `@shared/markdown`, never naive string replace.

## Examples

### Example 1 — soften an S5 tile note

**User:** "The retirement tile note for S5 sounds judgemental. Soften it."

**Target:** `content/report/planning-grid/tile-01-retirement-readiness.md`, section `# S5 — Business Owner Growth`.

**Before:**
```markdown
# S5 — Business Owner Growth

status: amber
note: "At {coverage_pct}% excluding a business exit. A clean sale at fair value adds ~30 points to this score. No exit subtracts ~20."
```

**After:**
```markdown
# S5 — Business Owner Growth

status: amber
note: "At {coverage_pct}% before counting any business exit. A clean sale at fair value typically lifts this number by around 30 points; the absence of an exit plan typically subtracts around 20."
```

Tokens preserved: `{coverage_pct}`. Voice: "judgemental" softened; numbers kept. Validation: clean.

### Example 2 — rewrite an S3 gauge line for the green zone

**User:** "Rewrite the S3 health-gauge line for the green zone — make it less about tax."

**Target:** `content/report/health-gauge.md`, section `# S3 — High-Earner Mid-Career`, sub-section `## Zone: green`.

Edit the prose under that single H2 sub-section. Leave the other zone variants for S3 alone. The H1 + every other segment's H1 stays intact.

### Example 3 — don't do this: change the segment id

**User:** "Move the S5 tile content to S6 — the wording is more appropriate for the exit segment."

This is not an edit — it's a structural move. Stop and clarify: do they want to (a) duplicate S5's body into S6 (overwriting S6's existing copy, which is also a structural change), or (b) genuinely restructure the file? Either way, this skill isn't the right tool.

### Example 4 — don't do this: rewrite the goals file's frontmatter

**User:** "The S1 goals title is wrong — change it to 'Goals — Marcus'."

That's a frontmatter `title` edit, not a body edit. Frontmatter changes belong in a different surface (currently no dedicated skill — flag and ask the user to confirm).

## When NOT to use this skill

- **Edit a global block** (methodology, expanded awareness check) → `edit-report-block-global`.
- **Edit multiple segments at once** → run this skill once per segment for a clear audit trail. Bulk edits are fine in a single session, just narrate each one.
- **Add a new report block** → `add-report-block`.
- **Advance compliance status** → `change-block-compliance-status`.
- **Edit a screen / segment CTA / provocation / awareness check** — those have their own skills (`change-question-wording`, `change-segment-cta`, `edit-provocation-body`, `edit-awareness-check`).

## Related skills

- `edit-report-block-global` — sibling for global-shape blocks.
- `change-block-compliance-status` — workflow advancement.
- `add-report-block` — create a new file.

## Gotchas

- **`{single_curly}` vs `{{double_curly}}`.** Report-block bodies use SINGLE curly braces for engine-fillable tokens (`{coverage_pct}`). The pre-S4 banded-insight skills used DOUBLE curly braces (`{{first_name}}`) for placeholders. Don't mix the two — the renderers are different code paths.
- **Tile 12's `tile_label:` per segment.** Tile 12 is dual-variant (Business exit vs Income mix). When editing an S5 or S6 section, preserve the `tile_label:` line — it overrides the frontmatter's `label_owners` / `label_others`.
- **S8's gauge reframe.** The S8 health-gauge section uses a different framing (% of expected remaining lifetime). Match that framing if the edit is for S8.
- **Goals files are per-segment files.** Each `goals/SX-*.md` file is FOR ONE SEGMENT. The body is wrapped in a single `# S<n>` H1 with goals as `## Goal N — …` H2 sub-sections. Edit the H2 you're targeting, not the H1.
