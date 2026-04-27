# Simplification Plan — 2026-04-27

**Goal.** Reduce the system's conceptual surface area so a non-technical client handed the repo + admin app can comprehend it. Five simplifications + one gap closure, sequenced over five phases (~9 days agent-time, gated by validation between phases).

**Audience.** The orchestrating agent fires sub-agents per phase and gates progression on green tests. Each phase's brief is self-contained.

**Branch.** All work on `feature/compass-phase-1a` (current). Each phase ends in a committed checkpoint so any phase can be rolled back via `git revert`.

**Scope.** Both repos: `master_template/` (public tool) and `admin_app/` (desktop CMS). Plus the 40-file `master_template/skills/` library.

---

## What changes in plain English

| Today | After |
|---|---|
| 3 folders for "the report": `content/report/` (empty stubs), `content/pdf-report/` (live), `templates/report/` (dead) | 1 folder: `content/report/` |
| Matrix lives in `content/generated/matrix.json` referenced from screens via `q_refs` | Each screen file declares its own audience in frontmatter; matrix file deleted |
| 5 body-section conventions (`# Headline / # Sub`, `# Stem / # Aware body`, etc.) | 1 convention: `# Headline / # Body / # Cta / # Notes` |
| 6+ bespoke pdf-report file shapes (gauge, tile, goal, takeaway, methodology, awareness-expanded) | 1 shape: `kind: per_segment` with `# S1 … # S9` body sections |
| Schema mirrored across `master_template/content/schema.ts` + `admin_app/shared/master-schema.generated.ts` + drift test | Direct workspace import; drift test deleted |
| Admin's `/report` route authors a Compass-style schema nothing renders | Admin's `/report` route authors the simplified `kind: per_segment` shape that drives the live PDF |

Net result for someone reading the repo cold: ~40% fewer concepts to absorb.

---

## Constraints

1. **The public tool keeps working throughout.** `npm run content:build`, `npm run content:check`, `npm run typecheck`, and any production session-render path stay green at every phase boundary.
2. **The admin app's 629-test suite stays green.** Tests are rewritten as schemas change but never lose coverage on the same concerns.
3. **Round-trip fidelity preserved.** Every existing content file survives parse → reserialize as bytes-identical (within the new schema).
4. **Git history stays linear.** One commit per phase; phase commit message names the simplification + lists files touched.
5. **No silent deletions.** Every dead file gets explicitly archived/deleted in a commit that names what's leaving.
6. **Skills stay in lockstep.** When a phase changes a content shape, the relevant SKILL.md files are rewritten in the same commit so AI agents don't pick up stale instructions.

---

## Phase 0 — Pre-flight (no agent; orchestrator only)

Before Phase 1 starts:

1. Confirm `feature/compass-phase-1a` is up-to-date with `origin/feature/compass-phase-1a` (we pushed earlier; `git fetch` to confirm 0/0).
2. Confirm 629 admin tests + content:check both green on the current commit.
3. Snapshot the current state by tagging: `git tag pre-simplification-2026-04-27`. If anything goes badly wrong, `git reset --hard pre-simplification-2026-04-27` puts us back.

---

## Phase 1 — Parallel quick wins (~1 day)

Two agents running concurrently. Zero file overlap.

### Agent S5 — Drop schema mirror

**Owns.** `admin_app/shared/master-schema.generated.ts`, `admin_app/scripts/sync-master-schema.cjs`, `admin_app/tests/schema-drift.test.ts`, `admin_app/shared/schema.ts`, `admin_app/postinstall.cjs` script reference.

**What.** Replace the postinstall-generated mirror with a direct workspace import. Currently the mirror exists because Next.js / Turbopack refuses to bundle files outside its project root. Solve it differently:

- Option A: configure Turbopack `outputFileTracingRoot` correctly (`turbopack.root` parent) — try first.
- Option B: add a single-file build step that vendors the schema at `npm run build` time only, NOT at install time. Removes the postinstall wart.
- Option C: keep the mirror but delete the drift test + sync script; document as "regenerate manually if needed".

Choose A if it works; B if A is fiddly; C as last resort.

**Validation.** `npm run typecheck` clean, `npm run test` green minus the drift test (deleted).

**Commit.** `simplify: drop schema mirror in admin_app`

### Agent S2 — Folder rename + dead-code archive

**Owns.** `master_template/content/pdf-report/` (rename), `master_template/content/report/` (delete stubs), `master_template/templates/report/` (archive), `Question Segment Master.xlsx` (archive), all skill files referencing the old paths, `docs/Guide.md` and `HOW_IT_IS_MANAGED.md` references.

**What.**

1. `git mv content/pdf-report content/report-temp` (intermediate to avoid case-sensitivity confusion).
2. Delete every file in `content/report/` (Agent 4's empty stubs). Confirm with `git ls-files content/report/` first that no live file references them.
3. `git mv content/report-temp content/report`.
4. Move `templates/report/` → `templates/_archive/report-legacy-mustache-2026-03/` with a README.md explaining "this template is dead — the live report is React components under `src/app/report/`."
5. Move `Question Segment Master.xlsx` → `_archive/Question Segment Master.xlsx` (or just delete — it's been replaced by `matrix.json`). Document in commit.
6. Search and replace every `content/pdf-report/` reference across:
   - All 40 skill files in `skills/`
   - `docs/Guide.md`, `HOW_IT_IS_MANAGED.md`, `docs/compass-engine-overhaul-2026-04-27.md`, `docs/Actions.md`, `docs/OutstandingItems.md`
   - `src/lib/` engine code that reads pdf-report markdown (any imports / glob patterns)
   - `admin_app/` (if anything points there — should be nothing)

**Validation.** `npm run content:build` + `npm run typecheck` + `npm run test` (admin) clean. Manual: open the public tool's summary page in dev and confirm the report still renders.

**Commit.** `simplify: consolidate report folders + archive dead template`

### Phase 1 gate

Both agents committed. Run:
```
cd master_template && npm run content:build && npm run typecheck
cd admin_app && npm run typecheck && npm run test
```
All green → proceed to Phase 2. Any red → roll back the offending phase commit.

---

## Phase 2 — Unified pdf-report shape (~2 days)

### Agent S4 — Per-segment block shape

**Depends on.** Phase 1 (folder is now `content/report/`).

**Owns.** `master_template/content/report/`, `master_template/src/app/report/master/[segment]/page.tsx` and its sibling components, `admin_app/features/report/` (the dormant Agent 4 editor — gets rewritten), the relevant skill files (`edit-banded-insight`, `edit-static-report-block`, `edit-banding-cases`, `add-report-section` — these get retired or rewritten).

**What.**

1. **Define the canonical shape.** A single content type — `report-block` — with frontmatter:
   ```yaml
   id: report.health_gauge | report.tile.retirement_readiness | report.goals | …
   kind: per_segment | global  # most are per_segment; methodology/takeaways may be global
   title: short label
   description: optional one-line note
   compliance_status: draft | cfp_signed | compliance_signed | approved_to_ship
   # any kind-specific structured config (e.g. tile thresholds) goes here
   ```
   Body sections: `# S1` through `# S9` for `per_segment` blocks; `# Body` for `global`.

2. **Migrate** every file under `content/report/` (formerly `pdf-report/`) into the canonical shape:
   - `health-gauge.md` → `kind: per_segment`, the existing per-segment headings rename consistently.
   - `planning-grid/tile-XX.md` → `kind: per_segment`, frontmatter retains `tile_number` + `thresholds`.
   - `goals/SX-*.md` → consolidate the 9 files into one `goals.md` with `kind: per_segment` (each segment is a body section).
   - `takeaway-banners.md` → `kind: per_segment`.
   - `methodology.md` → `kind: global`.
   - `awareness-checks-expanded/*.md` → keep one-file-per-check (they're independent), but bring frontmatter into the canonical shape.

3. **Update the public-tool renderer** (`src/app/report/master/[segment]/page.tsx`) to read the unified shape: walk the folder, route each file by `kind`, render the right component. The existing Compass renderer logic largely keeps working — just the file-to-component mapping changes.

4. **Rewrite the admin's `/report` editor.** Replace Agent 4's banded-insight UI with one generic `<PerSegmentBlockEditor>`:
   - Top: frontmatter form (id, title, kind, compliance_status, kind-specific config).
   - Below: 9 body-section editors (one per segment) for `per_segment` blocks; one body editor for `global`.
   - Existing `<MarkdownEditor>` (Agent B's WYSIWYG) plugs in for each body section.
   - Compliance gate UI reused from existing components.

5. **Add a Zod schema** for the canonical block in `master_template/content/schema.ts` (`reportBlockFrontmatter`) and mirror it (or import directly post-S5).

6. **Skills.** Retire `edit-banded-insight`, `edit-static-report-block`, `edit-banding-cases`, `add-report-section`. Replace with: `edit-report-block-segment`, `edit-report-block-global`, `add-report-block`, `change-block-compliance-status`. These mirror the simpler shape.

**Validation.**
- `npm run content:check` clean (Zod validates every migrated file).
- `npm run typecheck` clean (renderer consumes new shape correctly).
- `npm run test` (admin) green (≥ same count; rewrite tests as needed).
- **Manual:** spin up dev, hit `/report/master/S1`, eyeball the rendered report against the pre-migration version. Visual diff should be minimal — content unchanged, structure unchanged, only authoring shape changed.

**Commit.** `simplify: unify pdf-report content as per-segment blocks`

### Phase 2 gate

Same as Phase 1 plus the manual visual check.

---

## Phase 3 — Body-section unification (~1 day)

### Agent S3 — One body-section vocabulary

**Depends on.** Phase 2 (pdf-report files already on the new shape; this phase only touches the OTHER content types).

**Owns.** `master_template/content/screens/`, `content/segments/`, `content/provocations/`, `content/awareness-checks/`, `content/microcopy/`, `content/pages/`. The `content/schema.ts` body-section validators. The admin's per-editor body-section parsing code.

**What.**

Pick a small canonical set:
- `# Headline` — always the lead.
- `# Body` — the main prose.
- `# Cta` — call-to-action text where there is one (segments have button + helper, can be split or merged).
- `# Notes` — editorial commentary; never user-facing.

Map current sections onto these:

| Current | After |
|---|---|
| Screens: `# Headline / # Sub / # Body / # Pullquote` | `# Headline / # Body / # Pullquote` (Sub merges into Body's first paragraph; Pullquote stays — it's a real distinct concept) |
| Provocations: `# Headline / # Body / # Close` | `# Headline / # Body / # Cta` (Close becomes Cta) |
| Awareness: `# Stem / # Aware body / # Partial body / # Unaware body` | `# Headline` (the stem) + frontmatter array `bodies: [{ awareness: aware\|partial\|unaware, body: '…' }]` (the three variants are conceptually one field with three modes) |
| Segments: `# Headline / # Body / # Button / # Helper` | `# Headline / # Body / # Cta` (Button + Helper merge into Cta — one labelled link) |
| Pages: structured frontmatter only | unchanged — pages are different (config, not prose) |
| Microcopy: structured frontmatter only | unchanged |

If any of these mappings lose information meaningfully, document the trade-off in the commit message. Awareness's three-bodies → frontmatter array is the boldest move; if it makes the YAML painful, fall back to retaining body sections but rename to `# Body / # Body Partial / # Body Unaware` for consistency.

**Validation.**
- `npm run content:build` + `content:check` clean.
- Round-trip test still passes byte-identical for any unchanged file.
- Admin's body-section editors render correctly for each migrated content type.

**Commit.** `simplify: unify body sections to Headline / Body / Cta / Notes`

### Phase 3 gate

Tests + manual review of one file from each content type.

---

## Phase 4 — Matrix collapse (~2 days)

### Agent S1 — Audience moves into screens

**Depends on.** Phase 3 (screens have stable body-section conventions, so frontmatter mutation is the only shape change in this phase).

**Owns.** `master_template/content/screens/*.md` (frontmatter), `master_template/content/generated/matrix.json` (deleted), `master_template/src/lib/segmentation/engine.ts`, `master_template/content/schema.ts` (extend `screenFrontmatter`), `admin_app/features/matrix/*` (rewrite to walk screens), `admin_app/features/screens/*` (display the new audience field), the two skill files `change-matrix-cell` + `add-matrix-row` (rewrite).

**What.**

1. **Extend `screenFrontmatter`** with an `audience` block:
   ```yaml
   audience:
     S1: shown        # was Y
     S2: shown
     S3: conditional  # was C; predicate keyed by screen id
     S4: hidden       # was N
     # ... S5-S9
   ```
   Drop `q_refs` (it's now self-referential and redundant — the screen's id IS the matrix row).

2. **Migrate** `matrix.json`'s rows into the corresponding screens' `audience` blocks. Several screens may have referenced the same matrix row via `q_refs` — the audience flows into ALL referencing screens. (Confirm: in current data, every matrix row is referenced by at most one screen — if so, migration is 1:1.)

3. **Delete** `content/generated/matrix.json` (and `content/generated/` if it's now empty).

4. **Rewrite the engine** (`src/lib/segmentation/engine.ts`):
   ```ts
   export function buildQuestionList(a: GatingAnswers, segmentId: SegmentId): QuestionId[] {
     const screens = loadScreens(); // already done at content:build time
     return screens
       .filter((s) => {
         const cell = s.audience?.[segmentId] ?? 'hidden';
         if (cell === 'hidden') return false;
         if (cell === 'shown') return true;
         const predicate = conditionals[s.id];
         return predicate ? predicate(a) : false;
       })
       .map((s) => s.id);
   }
   ```
   Predicates in `conditionals` get keyed by screen `id` instead of `questionId`.

5. **Rewrite the admin matrix editor.** It still renders a 30 × 9 grid — but the data source is now "walk every screen file." Save still writes JSON, but writes back into each screen's frontmatter via the existing screen-save path. Bulk grid edits become a transaction across many files (handle this carefully — open all dirty screens, apply edits, save in one pass, snapshot before).

6. **Rewrite skills.** `change-matrix-cell` becomes "edit the audience field in a screen file." `add-matrix-row` retires (matrix rows don't exist; new screens declare their own audience as part of the `add-question-screen` skill). Update the audit doc.

**Risk.** This is the biggest single change. The engine is production-critical. Validate aggressively:
- Snapshot a session's question list BEFORE the migration (run a fixture through the engine, capture the question id sequence).
- Apply migration.
- Run the same fixture. Sequence MUST match exactly.

**Validation.**
- `npm run typecheck` clean.
- `npm run test` (admin) green.
- Public-tool fixture tests (`src/lib/compass/`) green.
- Manual: pick three real segment fixtures, walk through the questionnaire in dev, confirm question order unchanged.

**Commit.** `simplify: collapse matrix into per-screen audience field`

### Phase 4 gate

Comprehensive — this is the highest-risk phase. Both repos green + manual verification of three full questionnaire walk-throughs (S1, S5, S9 cover the spread).

---

## Phase 5 — Admin app catches up + cleanup (~2 days)

### Agent S6 — Admin coverage closure + skill rewrites + doc sweep

**Depends on.** Phases 1–4 all green.

**Owns.** `admin_app/` (final retrofit pass), `master_template/skills/_AUDIT.md`, `docs/Guide.md`, `docs/HOW_IT_IS_MANAGED.md`, FOLLOW_UPS.md.

**What.**

1. **Confirm admin coverage** for every editable surface in the simplified system:
   - Screens (with new audience + body sections) ✓ (already shipped — verify the Agent S3 + S1 changes integrate)
   - Segments, provocations, awareness, pages, microcopy ✓ (verify post-S3 body sections work)
   - **Report blocks** (per-segment + global) ✓ (S4 added the editor)
   - **Tax-year constants** — NEW. Add a structured-form editor at `/settings/tax-year` (or under Profiles/Settings) that reads/writes `src/lib/compass/tax-year-2025-26.ts`. Validation: typecheck must pass after a save (the file is TypeScript). Probably easiest via a structured form that regenerates the constants block.
   - **Assumptions footer copy** — NEW. Lift the hardcoded strings from `src/components/compass/Assumptions/Assumptions.tsx` into a new `content/report/assumptions.md` (canonical block shape from S4) and update the component to read from it.

2. **Skill library final pass.**
   - Walk all 40 skills. Any skill referencing pre-simplification concepts (matrix.json, body section names that changed, banded insights) gets rewritten or retired.
   - Update `_AUDIT.md` to reflect the new architecture.
   - Update `_FORMAT.md` if any conventions changed.
   - Total expected: ~12 skill rewrites, ~5 retirements, ~3 new (tax-year edit, assumptions edit, report-block edit).

3. **Documentation sweep.**
   - Update `docs/Guide.md` — the "two sources of truth" section is now actually two (markdown + audience-in-frontmatter; matrix.json is gone).
   - Update `HOW_IT_IS_MANAGED.md` — Section 5 (matrix change) gets rewritten as "edit the audience block in the screen file."
   - Update `compass-engine-overhaul-2026-04-27.md` with a footnote pointing at this plan + post-simplification field reference.
   - Add a new `docs/EDITING_FLOWS.md` — for each kind of change, exactly which file(s) to touch + which validator to run + which skill applies. Single-page reference for humans handed the repo.

**Validation.**
- Full regression: typecheck + tests + content:check + admin tests + npm run build for both repos.
- Manual: install the rebuilt admin installer, click through every editor, confirm every surface listed in `EDITING_FLOWS.md` actually works.

**Commit.** `simplify: admin coverage + skills + docs catch up`

### Phase 5 gate

Final. After this commit, push to origin.

---

## Risk register

| Risk | Phase | Mitigation |
|---|---|---|
| Matrix collapse breaks the production engine | 4 | Fixture-test BEFORE and AFTER; sequence must match |
| Body-section rename loses awareness's three-mode bodies | 3 | Document the trade-off; if too lossy, keep three sections with renamed headers |
| Folder rename misses an import | 1 | Grep across both repos + skills + docs; `npm run typecheck` catches TS imports |
| Admin matrix editor too slow when walking 30 screens for the grid view | 4 | Cache the audience walk in Zustand; recalculate on screen-save events |
| Pdf-report file consolidation (9 goals files → 1) loses git history | 2 | Use `git mv` then concatenate, NOT delete-then-create |
| Skills become stale faster than they're rewritten | 5 | Phase 5 dedicates time to this; don't skip |

---

## Final state — what someone new sees

After Phase 5, a content lead handed the repo + admin sees:

- **One folder per content type** under `content/`. No "generated" folder. No legacy xlsx. No dead templates.
- **Each screen file is self-contained** — its question, its options, its audience, its conditional logic (pointer to `engine.ts` predicate by id) all in one place.
- **One body-section vocabulary**: `# Headline / # Body / # Cta / # Notes`. Some types use a subset.
- **One report-block shape**: `kind: per_segment` with `# S1 … # S9` body sections, OR `kind: global` with `# Body`. The renderer routes by `kind`.
- **The admin app surfaces every edit** through purpose-built editors, with the integrity tray catching the same drift class the audit doc described.
- **A 1-page `EDITING_FLOWS.md`** in `docs/` that maps every kind of edit to its file, validator, and skill. No more "where do I look?" questions.

Total: ~9 days agent-time, 6 sub-agents, 5 phases gated by validation. Each phase commits cleanly so any can be reverted in isolation.

---

## Open questions before Phase 1 fires

1. **Goals consolidation (S4) — confirm.** Currently 9 separate `goals/SX-*.md` files. Plan proposes consolidating into one `goals.md` with `# S1 … # S9` body sections. Loses per-file git history but matches the canonical shape. OK to proceed, or keep 9 files?
2. **Awareness three-mode bodies (S3) — confirm.** Plan proposes moving aware/partial/unaware bodies into a frontmatter array. Bold call. Alternative: keep three body sections but rename them. Pick one before S3 fires.
3. **Schema mirror (S5) — preferred path.** Try Turbopack `outputFileTracingRoot` first (cleanest) or skip straight to "build-time vendor" (more reliable)?

If silent, the orchestrator picks the safer option for each: keep 9 goals files, rename to `# Body / # Body Partial / # Body Unaware`, build-time vendor.
