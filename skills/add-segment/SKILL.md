<!-- _AUDIT.md entry: 3.3 -->
---
name: add-segment
description: Introduce a new segment (S10) to the Real Wealth segmentation system. Use this skill ONLY when the user has decided the existing 9 segments don't cover a real cohort and a new segment is genuinely needed. This is Tier 3 — it cascades through content schema, matrix JSON, engine rules, admin constants, and tests. Triggers on phrasings like "we need a new segment for X", "add S10 for young inheritors", or "introduce a tenth persona".
---

# Add a new segment

## What this skill does

Adds a new segment id (e.g. `S10`) across every file in the codebase that enumerates segments. This is not a content change — it's a schema + engine + content + admin change that cascades broadly.

## Human confirm gate (Tier 3)

Before making any edit:

1. **Challenge the need.** Ask: "What about this cohort isn't covered by any of S1–S9? Walk me through a concrete user whose answers would land them in the new segment."
2. **Summarise the cascade.** The new segment affects:
   - `content/schema.ts` — the `segmentId` enum.
   - `content/segments/S10-<slug>.md` — new CTA file.
   - `content/generated/matrix.json` — add `S10` column to every existing row.
   - `src/lib/segmentation/types.ts` — extend the `SegmentId` TypeScript union.
   - `src/lib/segmentation/rules.ts` — add a ranked predicate.
   - `content/generated/rules.json` — add the new rule metadata (if the admin reads from it).
   - `admin_app/app/page.tsx` + `admin_app/app/profiles/page.tsx` — `SEGMENT_LABELS` constants.
   - Every admin `SEGMENTS` array — display labels and orderings.
   - Every test fixture that enumerates segments.
3. **Flag the migration story.** Existing user sessions have `segmentId: S1..S9`. Sessions in flight won't automatically migrate — they stay at their old segment until a fresh questionnaire run.
4. **Flag the compliance implications.** New segment = new CTA (segment file). Starts at draft. Won't ship in production without CFP + Compliance review.
5. Wait for the user to reply "yes" / "proceed" / equivalent. Do not proceed on inferred consent.

## Background

See `docs/Guide.md` §End-to-end data flow and `src/lib/segmentation/` for the segmentation architecture. Segments are picked by ranked predicates — first-match wins.

## Inputs you need from the user

1. **New segment id.** `S10` (next in sequence).
2. **Slug and label.** Kebab-case for filename (`S10-<slug>.md`); display label (sentence case).
3. **Predicate — who lands here?** In terms of the 5 gating answers. Must be expressible in `GatingAnswers`.
4. **Rank insertion point.** Where in the first-match list? A new S10 must fire BEFORE any existing predicate it narrows — otherwise it's dead code.
5. **CTA body copy.** Headline, body, button, helper.

## Workflow

1. **Human confirm gate (above).**

2. **Extend the schema first.**
   - `content/schema.ts` — add `"S10"` to the `segmentId` z.enum.
   - `src/lib/segmentation/types.ts` — extend `SegmentId` union with `'S10'`.

3. **Add the segment CTA file.**
   - Create `content/segments/S10-<slug>.md` with `id: S10`, `kind: segment`, `segment: S10`, `button_link: "..."`, and all four body sections (`# Headline`, `# Body`, `# Button`, `# Helper`).
   - Same rules as `change-segment-cta` for budgets and voice.
   - Compliance-gate the CTA copy — this is new commercial copy, needs review.

4. **Add the S10 column to every matrix row.**
   - `content/generated/matrix.json` — open, add `"S10": "Y"` (or `N`/`C`) to every existing row. Default to the most conservative value (N or C) unless you're sure.
   - Row count × 1 new column = many small edits. Script-drive with `JSON.stringify(arr, null, 2) + '\n'`.

5. **Add the ranked predicate.**
   - `src/lib/segmentation/rules.ts` — add the new rule.
   - Insert at the correct rank position. A predicate narrowing existing S3 (say) must fire BEFORE S3.
   - If `content/generated/rules.json` exists and drives the metadata, add an entry there too — same rank.

6. **Admin constants.**
   - `admin_app/app/page.tsx` — extend `SEGMENT_LABELS`.
   - `admin_app/app/profiles/page.tsx` — extend `SEGMENT_LABELS`.
   - Every other admin location that enumerates S1..S9 — grep to find them.

7. **Tests.**
   - Add a fixture for the new segment — sample answers that should assign to S10.
   - Run `npm run test` (admin app). New test passes; existing tests still pass.

8. **Comprehensive validation.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   npm run typecheck
   npm run build
   cd ../admin_app
   npm run test
   ```

9. **Summarise.** Every file touched, new files created, S10 row count confirmed, rank position, tests added, compliance status on new CTA (draft).

## Files touched

Many:
- `master_template/content/schema.ts`.
- `master_template/content/segments/S10-<slug>.md` (new).
- `master_template/content/generated/matrix.json` (every row).
- `master_template/src/lib/segmentation/types.ts`.
- `master_template/src/lib/segmentation/rules.ts`.
- `master_template/content/generated/rules.json` (if authoritative).
- `master_template/admin_app/app/page.tsx`.
- `master_template/admin_app/app/profiles/page.tsx`.
- Any other admin constants / test fixtures that enumerate segments.

## Invariants — never break these

- **Human-confirm gate first.**
- **Rank order matters.** First-match wins. A new predicate that's too broad dead-codes a downstream predicate.
- **Every matrix row must have the S10 column.** Missing columns fail schema validation.
- **Content schema and TS union must agree.** Zod `segmentId` + TS `SegmentId` stay in lockstep.
- **New CTA starts at `compliance_status: draft`** (or whatever the segment CTA schema defaults to; segment CTAs currently don't have a compliance_status field, but the copy still needs CFP + Compliance review before ship).
- **Existing sessions are grandfathered** — they stay at their old segmentId until the next run.

## Examples

### Example 1 — add S10 for young inheritors

**User:** "We're seeing a cohort of 25–40 year-olds with £500k+ estates from inheritance. They don't fit S1 (too wealthy) or S9 (too young). Add S10 'young inheritor'."

**Confirm:**

> Cascade for adding S10:
> - Schema + TypeScript union extension.
> - New `content/segments/S10-young-inheritor.md` CTA file.
> - S10 column added to every matrix row (N currently — which Y/C/N defaults do you want?).
> - New predicate: `age <= 40 AND estate >= 500_000`. Ranked where?
> - Admin constants in 2+ files.
> - Tests: fixture for a 32-year-old with £800k estate.
>
> Rank: the current S9 predicate is "estate ≥ £3m OR income ≥ £200k". S10 must fire BEFORE S9 narrows on age — or AFTER S9 if we want S9's estate filter to win. Which?
>
> Compliance: the new S10 CTA copy will need CFP + Compliance sign-off before ship. OK?
>
> Proceed?

On confirmation, execute the cascade.

### Example 2 — don't do this: add "for now"

User: "Add S10, we'll figure out the predicate later."

Refuse. A predicate-less segment has no runtime trigger. Ask for the predicate before any file edit.

### Example 3 — don't do this: skip tests

Always add at least one fixture. The predicate is where behaviour lives; tests prove the predicate fires for the right pattern.

## When NOT to use this skill

- **Retire an existing segment** → audit 3.4 (not in this batch).
- **Add an overlay** → audit 3.6 (not in this batch).
- **Change assignment rules only (no new segment)** → `change-segment-assignment-rules`.

## Related skills

- `change-segment-assignment-rules` — predicate-only changes.
- `change-segment-cta` — edit an existing CTA.
- `advance-compliance-status` — advance the new CTA after review.
- `add-matrix-row` — pattern for adding JSON rows (here, we add columns — similar formatting discipline).

## Gotchas

- **Rank is where most bugs hide.** A new predicate placed after a broader existing one never fires. Walk through 3–4 concrete user patterns and confirm they route correctly.
- **The matrix is wide.** Adding a column to every row = touching potentially 50+ rows. Script it — don't hand-edit, or one row will get missed.
- **The admin has many places that enumerate segments.** Grep `"S1" "S2"` across `admin_app/` — find them all.
- **Fidelity tests may flag drift.** The admin has a schema-drift test that compares its vendored schemas against the master. Add S10 in one place, not the other = test fail.
