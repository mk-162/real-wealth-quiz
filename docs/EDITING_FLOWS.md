# EDITING_FLOWS.md

Single-page lookup reference: every kind of edit a content lead might make to the Wealth Conversation app, where it lives, what to validate, and which skill / admin surface handles it.

Last updated: 2026-04-27 (post-simplification S5/S2/S4/S3/S1).

If you can't find what you're looking for here, the deeper docs are:
- `HOW_IT_IS_MANAGED.md` — narrative editorial workflow.
- `docs/Guide.md` — architecture + recipes.
- `skills/_AUDIT.md` — exhaustive change-type catalogue.

---

## Conventions

- **Validate after every change** with `npm run content:check` from `master_template/`. Most rows below name additional validators when relevant.
- **Skill name** in the rightmost column is the file under `master_template/skills/<name>/SKILL.md` an AI agent should invoke for that change.
- **Admin surface** is the route in the desktop admin app. Empty if no editor exists yet (engineering-only change).

---

## Screens — questions, options, audience

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Reword a screen's headline / sub / body | `content/screens/<n>-<slug>.md` body | `npm run content:check` + `voice:check` | `change-question-wording` | `/content` → screen editor |
| Edit an answer option's label / value / hint | `content/screens/<n>-<slug>.md` `inputs[].options[]` | `content:check` | `change-answer-option` | `/content` → screen editor |
| Add an answer option | `content/screens/<n>-<slug>.md` `inputs[].options[]` | `content:check` | `add-answer-option` | `/content` → screen editor |
| Remove an answer option | screen file + grep `src/lib/segmentation/` | `content:check` | `remove-answer-option` | `/content` → screen editor |
| Wire a conditional reveal (option → sibling input) | screen file `options[].conditional_reveal` + sibling `inputs[].conditional_reveal` (doc) | `content:check` + admin integrity `screens:option-conditional-reveal-sibling` | `add-conditional-reveal` | `/content` → screen editor |
| Edit / suppress / restore the per-screen pullquote | screen file `# Pullquote` body section (tri-state) | `content:check` + `voice:check` | `change-pullquote` | `/content` → screen editor |
| Add a brand-new screen | New file under `content/screens/` (with audience block) + `src/lib/questions/matrix.ts#questionOrder` | `content:check` + `typecheck` | `add-question-screen` | `/content` → New screen |
| Reorder screens | rename file(s) + `screen_number` | `content:check` + `npm run content:build` | (no skill) | `/content` |
| Change a screen's section assignment | screen frontmatter `section` + likely `screen_number` | `content:check` | (no skill) | `/content` |
| Change tier_limit (A / B / C) | screen frontmatter `tier_limit` | `content:check` | (no skill) | `/content` |
| Change image_family / image_direction | screen frontmatter | admin `images:path-resolves` | `change-image-binding` | `/content` |

## Screen audience — who sees which question

Audience is per-question, on the owning screen, in the screen's frontmatter `audience:` block. Three values per cell: `shown | conditional | hidden`. There is no separate matrix file.

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Flip a question × segment cell (`shown` / `conditional` / `hidden`) | owning screen's `audience:` block | `content:check` | `change-matrix-cell` (alias: `edit-screen-audience`) | `/segments` → Matrix tab |
| Add a `conditional` predicate for a cell | `src/lib/segmentation/engine.ts` (`conditionals` map) | `typecheck` + `npm run test` | `add-engine-predicate` | (engineer) |
| Change an existing predicate's logic | `src/lib/segmentation/engine.ts` | `typecheck` + `npm run test` | `change-engine-predicate` | (engineer) |
| Register a new question (on an existing screen) | screen `q_refs` array + `audience:` entry | `content:check` | (hand-edit; same shape as `add-question-screen`) | `/content` → screen editor |
| Retire a question | owning screen `q_refs` + `audience` removal; possibly delete the screen | `content:check` + grep | (manual; see retired `remove-matrix-row` SKILL.md for checklist) | `/content` |
| Rename a question id (e.g. `Q3.1` → `Q3.1a`) | screens + engine + matrix.ts + tests, all atomic | `content:check` + `typecheck` + grep zero residual hits | `rename-question-id` | (engineer) |

## Segments — CTAs and overlays

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Edit a segment's CTA copy (headline / body / cta / cta helper / button link) | `content/segments/S<n>-<slug>.md` or `overlay-<slug>.md` | `content:check` + `voice:check` | `change-segment-cta` | `/segments` |
| Rename a segment label | `content/segments/S<n>-*.md` + admin SEGMENT_LABELS | grep + `content:check` | (no skill) | `/segments` |
| Add a new segment (e.g. S10) | schema + every screen audience block + every per-segment report block + rules.ts + admin labels | `typecheck` + `test` + `content:check` | `add-segment` (Tier 3) | (engineer) |
| Change segment-assignment rules | `src/lib/segmentation/rules.ts` + `content/generated/rules.json` | `typecheck` + `test` | `change-segment-assignment-rules` (Tier 3) | (engineer) |

## Provocations — compliance-gated commercial callouts

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Edit a provocation's body (headline / body / cta) | `content/provocations/<slug>.md` body | `content:check` + `voice:check` | `edit-provocation-body` | `/content/provocations` |
| Change a provocation's trigger DSL | `content/provocations/<slug>.md` frontmatter `trigger` | `content:check` + admin `provocations:trigger-parses` | `change-provocation-trigger` | `/content/provocations` |
| Change which segments a provocation fires for | `content/provocations/<slug>.md` frontmatter `segments` | `content:check` | `change-provocation-segments` | `/content/provocations` |
| Add a new provocation | New file under `content/provocations/` | `content:check` + `voice:check` (and CFP/Compliance review) | `add-provocation` | `/content/provocations` |
| Advance compliance status | `content/provocations/<slug>.md` frontmatter | admin `provocations:compliance-signoff-date-present` | `advance-compliance-status` | `/content/provocations` |

## Awareness checks — educational prompts (3-mode bodies)

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Edit headline / body aware / body partial / body unaware | `content/awareness-checks/<slug>.md` (sections `# Headline`, `# Body Aware`, `# Body Partial`, `# Body Unaware`) | `content:check` + `voice:check` | `edit-awareness-check` | `/content/awareness` |
| Change awareness trigger | frontmatter `trigger` | admin `awareness:trigger-parses` | `change-awareness-trigger` | `/content/awareness` |
| Add a new awareness check | New file under `content/awareness-checks/` | `content:check` + `voice:check` | `add-awareness-check` | `/content/awareness` |

## Microcopy — errors / toasts / emails / ARIA / etc.

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Edit a single entry (errors, toasts, emails, ARIA, meta, loading-states, modals, progress) | `content/microcopy/<file>.md` `entries[]` | `content:check` + `voice:check` | `edit-microcopy` | `/content/microcopy` |
| Update voice-and-tone rules | `scripts/banned-phrases.json` + `content/microcopy/voice-rules.md` (and admin's vendored copy) | `voice:check` + admin `schema-drift.test.ts` | `update-voice-rules` | (no editor) |

## Pages — homepage / summary / FAQ / etc.

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Edit a top-level scalar / leaf string | `content/pages/<slug>.md` frontmatter | `content:check` | (no dedicated skill — body-only edits are direct) | `/content/pages` |
| Edit nested frontmatter groups (silent-gaps prompts, emotional intros, fallbacks) | `content/pages/summary.md` (typically) | `content:check` | `edit-page-nested-frontmatter` | `/content/pages` |
| Add or remove a page | new `content/pages/<slug>.md` + new `src/app/<slug>/page.tsx` | `content:check` + `typecheck` + `build` | (no skill — engineering) | (engineer) |

## Report — the 9-page PDF report

Every file under `content/report/` follows the canonical post-S4 shape:
- `kind: per_segment` — body has `# S1` … `# S9` sections.
- `kind: global` — body has a single `# Body` section.

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Edit a per-segment body (one tile note for one segment, gauge interpretation, takeaway) | `content/report/<path>.md` per-segment body section | `content:check` + `voice:check` | `edit-report-block-segment` | `/report` |
| Edit a global body (methodology page, expanded awareness, assumptions footer) | `content/report/<path>.md` `# Body` section | `content:check` + `voice:check` | `edit-report-block-global` | `/report` |
| Edit the assumptions footer (printed on every chart page) | `content/report/assumptions.md` `# Body` | `content:check` + `voice:check` | `edit-assumptions-footer` | `/report` |
| Add a new report block (tile, expanded awareness, etc.) | New `content/report/<path>.md` | `content:check` | `add-report-block` | `/report` → New |
| Advance compliance status on a report block | `content/report/<path>.md` frontmatter `compliance_status` | `content:check` | `change-block-compliance-status` | `/report` |
| Edit regulatory disclosures (FCA footer, methodology Section 5) | `content/report/methodology.md` Section 5 OR `content/pages/summary.md` `fca_footer.disclosure` (with explicit Compliance sign-off) | `content:check` + `build` | `edit-disclaimer-or-methodology` (Tier 3) | `/report` (methodology) or `/content/pages` (summary footer) |
| Edit a tile's scoring threshold | `src/lib/compass/tile-scoring.ts` (named constants at top) | `npx tsx --test scripts/test-tile-scoring.ts` | (no skill — engineer; constants only) | (engineer) |
| Bind / change an image on a global block | `content/report/<path>.md` frontmatter `image_slug` | manual render | `change-image-binding` | `/report` |

## Tax-year constants — UK rates and allowances

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Update one constant (personal allowance, ISA limit, IHT band, state pension, etc.) | `src/lib/compass/tax-year-2025-26.ts` + `content/report/methodology.md` Section 2 row | `tsc --noEmit` + `content:check` + tile-scoring tests | `edit-tax-year-constants` | `/tax-year` (structured form) |
| Roll to a new tax year (annual rollover) | New `src/lib/compass/tax-year-<yr>.ts` + switch all imports + methodology + assumptions footer | `typecheck` + `test` + fixture regression | `annual-tax-year-update` (Tier 3) | (engineer) |
| Change projection-engine math / formulas / drawdown logic | `src/lib/compass/projection.ts` + `types.ts` + `tile-scoring.ts` | `typecheck` + `test` + fixture regression | `change-projection-math` (Tier 3) | (engineer) |

## Images — media library

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Add a new image | `content/images/<filename>` + `.meta.json` sidecar | admin `images:alt-required`, `images:size-cap` | `add-image` | `/media` |
| Rename an image (with refactor) | the image + every md that references it | grep + admin `images:path-resolves` | `rename-image-with-refactor` | `/media` |
| Edit image metadata (alt / caption / width_px) | `<filename>.meta.json` | admin scan | (no skill — direct edit) | `/media` |
| Change which image a screen / report block uses | screen or block frontmatter | admin `images:path-resolves` | `change-image-binding` | `/content` or `/report` |

## Charts — engine-driven visualisations

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Change a chart's data binding / inputs | React component under `src/components/compass/<ChartName>/` | `typecheck` + `test` | `change-chart-binding` | (engineer) |

## Cross-cutting — high-fan-out changes

| Edit | File(s) | Validator | Skill | Admin surface |
|---|---|---|---|---|
| Bulk find & replace a phrase | many | `content:check` + `voice:check` (+ preview before commit) | (no skill — admin's Find & Replace) | `/content` Find & Replace |
| Compliance ledger update (multi-file) | many provocations / awareness | admin `provocations:compliance-signoff-date-present` | `advance-compliance-status` (run per file) | (admin batch action) |
| Voice pass | read-only scan; recommended rewrites | `voice:check` | (no skill — manual review) | `/content` |

---

## Validators — the canonical set

Every command is run from `master_template/` unless specified.

| Command | What it covers |
|---|---|
| `npm run content:check` | Zod validates every content file, including audience cells, body sections, q_refs alignment. |
| `npm run voice:check` | Greps banned phrases (`scripts/banned-phrases.json`) across content. |
| `npx tsc --noEmit` | TypeScript compile. Catches any code drift after a constant rename or schema change. |
| `npm run build` | Full Next.js production build. Catches catalogue regen errors and runtime imports. |
| `npx tsx --test scripts/test-tile-scoring.ts` | 74 unit tests on tile scorers. |
| `npx tsx --test scripts/test-tile-scoring-full.ts` | 126 integration assertions across 9 fixtures × 12 tiles. |
| `npx tsx --test src/lib/content/__tests__/compliance.test.ts` | Compliance gate behaviour. |
| `npx tsx scripts/test-compass-inputs.ts` | 9-segment input coverage. |
| `npx playwright test tests/flows.spec.ts` | E2E user journeys (~30s, needs dev server on :5000). |

For admin app: `cd admin_app && npx tsc --noEmit && npx vitest run && npx eslint .`.

---

## Skill conventions (recap)

- **Tier 1** — daily / near-daily, low risk. Body / option / matrix-cell / microcopy. Run validator and ship.
- **Tier 2** — weekly / monthly, scoped risk. Add a screen / new provocation / new awareness check / image management. Validator + render check.
- **Tier 3** — occasional, high risk. Add or remove a segment, change engine math or predicates, change the projection, change segment-assignment rules, change regulatory disclosures, annual tax-year rollover. Mandatory human-confirm gate inside the skill.

If you're not sure which skill applies, look up the change in the table above; if no row matches, search `skills/_AUDIT.md` for the closest entry — it's the master catalogue.
