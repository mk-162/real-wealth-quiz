# Content-change audit — Real Wealth Wealth Conversation + Report

**Purpose.** Every category of change an AI editor (or human) could make to the Real Wealth content + report. Each entry names the files touched, the validation steps, the invariants to protect, and the likely invocation phrase. The skills in this folder are generated from this audit — one skill per entry that's worth automating.

**Last updated:** 2026-04-24.

**Audience.** Primarily AI agents doing bulk edits. Also humans who need a single index of what can change where.

---

## How to read this document

Each change type has four parts:

- **What** — one sentence describing the change.
- **Files touched** — exhaustive list. Edit none, not all; edit only what's listed.
- **Invariants** — what must remain true after the edit (Zod shapes, round-trip fidelity, compliance gates).
- **Validation** — the commands that prove the edit is safe.
- **Likely trigger phrases** — how a user will ask for this. Used for skill triggers.

Change types are grouped by surface. Within each group they're ordered from safest (copy tweak) to highest risk (code change).

---

## 1. Questionnaire screens (`content/screens/*.md`)

### 1.1 Change question wording (headline, sub, body)
- **What:** rewrite the serif headline, supporting sub-copy, or free-form body of an existing screen.
- **Files touched:** `content/screens/<section>.<n>-<slug>.md` only. Body sections: `# Headline`, `# Sub`, `# Body`.
- **Invariants:** never change `id`, `screen_number`, or the frontmatter. The `# Headline` and `# Sub` sections must remain present on asymmetric/centred layouts; they're optional on transition/intro layouts.
- **Validation:** `npm run content:check` · `npm run voice:check` · character budgets (`screen.headline` ideal 50 / hard 80; `screen.sub` ideal 120 / hard 180).
- **Trigger phrases:** "soften Q1.1 headline", "rewrite the sub on 4.A.3", "reword the question about…"

### 1.2 Change an existing answer option's label, value, or hint
- **What:** edit the label text, machine value, icon, or reveal hint of an option under `inputs[].options[]`.
- **Files touched:** frontmatter `inputs[].options[]` in the relevant `content/screens/*.md`.
- **Invariants:** `value` must stay ASCII snake_case or the existing format; other content referencing this option's value (segmentation predicates, conditional reveals) will break if `value` changes — rename cascades through `src/lib/segmentation/engine.ts` and sibling input `conditional_reveal`s.
- **Validation:** `npm run content:check` + integrity scan in the admin (`screens:option-value-unique`, `screens:option-conditional-reveal-sibling`).
- **Trigger phrases:** "change the 'curious' label", "rename the 'on_track' option", "update the hint on the business-owner card".

### 1.3 Add a new answer option
- **What:** insert a new object into an input's `options[]` array.
- **Files touched:** frontmatter of the screen.
- **Invariants:** `value` must be unique within the input, ASCII snake_case. `label` under the character budget. If the option triggers a follow-up field, add a `conditional_reveal` value naming a sibling input's id.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "add a 'prefer not to say' option to Q3.1", "new answer choice on the life-change question".

### 1.4 Remove an answer option
- **What:** delete an option from an input's `options[]`.
- **Files touched:** the screen. Also any sibling input with a `conditional_reveal` pointing at this option.
- **Invariants:** removing an option whose `value` is referenced in a segmentation predicate is a code change — flag it rather than silently deleting.
- **Validation:** `npm run content:check` + grep `src/lib/segmentation/` for the removed value.
- **Trigger phrases:** "drop the 'other' option", "remove the 'prefer not to say' choice".

### 1.5 Add a conditional reveal
- **What:** wire a child input to appear only when a parent option is selected.
- **Files touched:** the screen. Target option gets `conditional_reveal: "<child_input_id>"`.
- **Invariants:** the named sibling must exist on the same screen.
- **Validation:** admin integrity check `screens:option-conditional-reveal-sibling`.
- **Trigger phrases:** "reveal the text box only when 'life change' is picked".

### 1.6 Change the pullquote on a screen
- **What:** add, edit, suppress, or remove the per-screen pullquote override.
- **Files touched:** the screen's body. Tri-state:
  - Section absent → renderer inherits the section default.
  - Section present but empty → renderer suppresses the default on this screen only.
  - Section with text → renderer shows the custom quote.
- **Invariants:** keep under 160 chars (`screen.pullquote` hard budget).
- **Validation:** `npm run content:check` + voice check.
- **Trigger phrases:** "add a pullquote to 3.4", "suppress the pullquote on…", "override the pullquote for…"

### 1.7 Add a new screen
- **What:** create a new questionnaire screen file under `content/screens/`.
- **Files touched:** new file; optionally `content/generated/matrix.json` to declare new q_refs; optionally `src/lib/segmentation/engine.ts` if the new question is a `C` cell.
- **Invariants:** filename format `<section>.<n>-<slug>.md`. Every field in `screenFrontmatter` (content/schema.ts). `id: screen.<section>.<n>.<slug-snake>`. `q_refs` either references existing matrix rows or requires new rows.
- **Validation:** `npm run content:check`. Integrity scan for `q_refs` existence.
- **Trigger phrases:** "add a new screen for X", "create a question about Y".

### 1.8 Remove a screen
- **What:** delete a screen file.
- **Files touched:** the screen. Also matrix rows whose `questionId`s are only referenced by this screen (orphan cleanup).
- **Invariants:** check other screens + provocation triggers for references to this screen's input ids.
- **Validation:** `npm run content:check`, grep across `content/` for the removed ids.
- **Trigger phrases:** "remove the 4.D.4 advice-today screen".

### 1.9 Reorder screens within a section
- **What:** change `screen_number` values or rename files to change display order.
- **Files touched:** screen files (rename + bump `screen_number`). `content/README.md` if it lists order.
- **Invariants:** `screen_number` unique within section. The runtime reads `generated-order.ts` — `content:build` regenerates it.
- **Validation:** `npm run content:build` produces the new order; run the app and confirm.
- **Trigger phrases:** "move X before Y", "reorder the money-today section".

### 1.10 Change the section a screen belongs to
- **What:** reassign `section` frontmatter from e.g. `money_today` to `transition_money`.
- **Files touched:** screen's frontmatter. `screen_number` usually needs to change too.
- **Invariants:** section must be one of the known sections. If the section is new, add it to the orchestrator comments.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "move 4.A.5 into the people section".

### 1.11 Change tier_limit (Advanced)
- **What:** restrict a screen to short (C), standard (B), or thorough (A) tier users.
- **Files touched:** frontmatter `tier_limit`.
- **Invariants:** must be a subset of `['A','B','C']`. Screens restricted from tier C must make the questionnaire still feel coherent for quick users.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "show X only on the thorough tier", "hide this question on the quick version".

### 1.12 Change image_family / image_direction
- **What:** swap the hero image family or update the art-direction prompt on a screen.
- **Files touched:** screen's frontmatter `image_family` + `image_direction`.
- **Invariants:** `image_family` must exist as a folder under `public/`/`content/images/`.
- **Validation:** admin integrity check `images:path-resolves`.
- **Trigger phrases:** "change the image on the happy-place screen".

---

## 2. Matrix (`content/generated/matrix.json`)

> Now authored, not generated. The xlsx pipeline is archived.

### 2.1 Change a Y/C/N cell
- **What:** flip a single question × segment cell between Y (shown), C (conditional), N (hidden).
- **Files touched:** `matrix.json` only. If flipping to C, a predicate for that question must exist in `src/lib/segmentation/engine.ts`.
- **Invariants:** every row must have exactly one value per segment S1–S9. JSON byte-identical with 2-space indent + trailing newline.
- **Validation:** `npm run content:check` runs the matrix integrity checks.
- **Trigger phrases:** "hide Q5.3 from S1", "show Q4.A.1 to everyone", "make Q3.2 conditional for S6".

### 2.2 Add a new matrix row
- **What:** register a new question id in the matrix with Y/C/N values.
- **Files touched:** `matrix.json`. Optionally `src/lib/segmentation/engine.ts` for a C predicate.
- **Invariants:** `questionId` format `Q<major>.<minor>` or `Q<major>.<sub>.<n>` (e.g. `Q4.A.1`). Row must have all 9 segment columns.
- **Validation:** `npm run content:check`. Integrity scan: every screen's `q_refs` entry must have a matrix row.
- **Trigger phrases:** "register Q4.A.1 in the matrix", "add a row for the new Compass question".

### 2.3 Remove a matrix row
- **What:** delete a question row.
- **Files touched:** `matrix.json`. Also any screen that still references it via `q_refs` (follow-up clean-up).
- **Invariants:** don't leave dangling q_refs. If removing the row leaves a segment with zero `Y` cells in its question column, that's a red flag.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "drop Q10.3 from the matrix".

### 2.4 Change a conditional predicate (C cell logic)
- **What:** edit the predicate function for a question's `C` cell.
- **Files touched:** `src/lib/segmentation/engine.ts`. This is a code change, not a content change.
- **Invariants:** predicate signature is `(a: GatingAnswers) => boolean`. If the predicate depends on a follow-up answer not in `GatingAnswers`, return `true` and let the screen's `conditional_reveal` handle runtime gating (pattern: Q4.3, Q4.C.2, Q4.1a, Q4.3a).
- **Validation:** `npm run typecheck` + `npm run test`.
- **Trigger phrases:** "change the Q5.2 predicate to also allow sole traders".

### 2.5 Add a new predicate for a C cell
- **What:** same as 2.4 but for a C cell that currently has no predicate (engine silently skips it).
- **Files touched:** `src/lib/segmentation/engine.ts` — new entry in `conditionals`.
- **Invariants:** key must match an existing `C` cell's question id. Predicate can only read `GatingAnswers` fields; otherwise stub to `true`.
- **Validation:** `npm run typecheck` + `npm run test`.
- **Trigger phrases:** "add a predicate for Q4.B.1 — skip it for retired users".

---

## 3. Segments (`content/segments/*.md`)

### 3.1 Change a segment's CTA copy
- **What:** edit one of the 9 segment CTAs or the 2 overlays — headline, body, button label, helper text, or booking link.
- **Files touched:** `content/segments/S<n>-<slug>.md` or `content/segments/overlay-<slug>.md`. Body sections: `# Headline`, `# Body`, `# Button`, `# Helper`.
- **Invariants:** `kind: segment` requires `segment: S<n>`; `kind: overlay` requires `overlay: advised_but_looking | urgency_this_week`.
- **Validation:** `npm run content:check`. Character budgets: `segment.headline` 50/75, `segment.body` 160/260, `segment.button` 22/32, `segment.helper` 40/60.
- **Trigger phrases:** "change S6's CTA", "update the retired CTA button label".

### 3.2 Change a segment's name / label
- **What:** rename a segment (e.g. "Early accumulator" → "Starting out").
- **Files touched:** `content/segments/S<n>-<slug>.md` (optional: rename filename too). Also `admin_app/app/page.tsx` + `admin_app/app/profiles/page.tsx` SEGMENT_LABELS constants (the admin's display name). Also any copy that names the segment by label.
- **Invariants:** the **id** `S1..S9` never changes; the **label** is display-only.
- **Validation:** grep for the old label. `npm run content:check`.
- **Trigger phrases:** "rename S6 to 'Exit window'".

### 3.3 Add a new segment (e.g. S10)
- **What:** introduce a tenth segment.
- **Files touched:** **major change.** `content/segments/S10-<slug>.md` (new). `matrix.json` (add S10 column to every row). `src/lib/segmentation/rules.ts` (new ranked predicate). `src/lib/segmentation/types.ts` (extend SegmentId union). `content/schema.ts` (extend segmentId enum). Every admin SEGMENT_LABELS + SEGMENTS array.
- **Invariants:** segmentation predicate must be ordered so the new one fires BEFORE an existing predicate it narrows; otherwise it's dead code.
- **Validation:** `npm run typecheck` + `npm run test` + full content:check. Add a test for the new predicate's hit conditions.
- **Trigger phrases:** "we need a new segment for X".

### 3.4 Remove a segment
- **What:** retire one of the 9 segments.
- **Files touched:** same fan-out as 3.3 but in reverse. Consider the migration story for existing sessions whose segmentId was the removed one.
- **Invariants:** do not just delete — deprecate first (mark in docs, redirect its matrix column to the nearest equivalent, remove after one release cycle).
- **Validation:** `npm run typecheck` + `npm run test`.
- **Trigger phrases:** "drop S9" — always clarify with the user before executing.

### 3.5 Change segment-assignment rules
- **What:** edit the ranked predicate list that decides which segment a respondent lands in.
- **Files touched:** `src/lib/segmentation/rules.ts`.
- **Invariants:** first-match-wins semantics preserved. Default fallback to S1. Stage-2 upgrade (S5 → S6 on Q5.3) preserved or explicitly changed.
- **Validation:** `npm run typecheck` + `npm run test`. Add fixture tests for the boundary cases the new rule affects.
- **Trigger phrases:** "someone under 40 with £1m shouldn't be S3, they should be S9".

### 3.6 Add / remove an overlay
- **What:** add or remove a conditional CTA overlay (e.g. `urgency_this_week`, `advised_but_looking`).
- **Files touched:** `content/segments/overlay-<slug>.md`. Also `content/schema.ts` extension of the overlay enum. Also `src/lib/summary/*` resolver that decides when the overlay fires.
- **Invariants:** overlay CTA takes precedence over the segment CTA when it fires — keep the summary resolver's priority list coherent.
- **Validation:** `npm run content:check` + `npm run typecheck`.
- **Trigger phrases:** "add a 'just got made redundant' overlay".

---

## 4. Provocations (`content/provocations/*.md`)

### 4.1 Edit a provocation's body copy
- **What:** change headline, body, or close of a provocation.
- **Files touched:** the provocation md. Body sections: `# Headline`, `# Body`, `# Close`.
- **Invariants:** keep under character budgets (`provocation.headline` 40/60, `provocation.body` 180/320, `provocation.close` 30/50). Don't change `id`.
- **Validation:** `npm run content:check` + voice check.
- **Trigger phrases:** "soften the £2m cliff provocation".

### 4.2 Change a provocation's trigger DSL
- **What:** edit the `trigger` expression (e.g. `estate >= 2_000_000 AND rnrb_taper_awareness_did_not_fire`).
- **Files touched:** frontmatter only.
- **Invariants:** must parse via `src/lib/questionnaire/triggers.ts` (`evaluateTrigger`). Admin's vendored `evaluateTriggerParseOnly` must also accept it.
- **Validation:** admin integrity check `provocations:trigger-parses`; `npm run content:check`.
- **Trigger phrases:** "change the IHT trigger to also include £1.5m estates".

### 4.3 Change a provocation's segments list
- **What:** expand or contract `segments: [S4, S6, …]` in frontmatter.
- **Files touched:** frontmatter.
- **Invariants:** values must be S1–S9 or `all`.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "also fire this provocation for S7".

### 4.4 Add a new provocation
- **What:** create a new provocation file.
- **Files touched:** `content/provocations/<slug>.md`. Placeholder registry if the body uses new tokens.
- **Invariants:** `id: prov.<slug_snake>`. `compliance_status` must start `draft`. Body must have all three sections.
- **Validation:** `npm run content:check`. Voice check. CFP + compliance review before `compliance_status` can advance.
- **Trigger phrases:** "new provocation about the £100k tax trap".

### 4.5 Remove a provocation
- **What:** delete a provocation file.
- **Files touched:** the provocation. Also any summary resolver that names it explicitly.
- **Invariants:** don't delete — mark `compliance_status: draft` and add a note about deprecation first.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "retire the old pension-pots-tease provocation".

### 4.6 Advance compliance_status
- **What:** move a provocation through the `draft → cfp_signed → compliance_signed → approved_to_ship` workflow. **This is the gate that lets it render in production.**
- **Files touched:** frontmatter — the status field plus `cfp_signoff_date` and/or `compliance_signoff_date`.
- **Invariants:** advancing to `cfp_signed` requires `cfp_signoff_date`. `compliance_signed` requires `compliance_signoff_date`. `approved_to_ship` requires both. Never advance on behalf of the human reviewer — only when they confirm.
- **Validation:** admin integrity check `provocations:compliance-signoff-date-present`, `provocations:approved-needs-both-signoffs`.
- **Trigger phrases:** "mark this provocation as CFP-signed".

---

## 5. Awareness checks (`content/awareness-checks/*.md`)

### 5.1 Edit an awareness check's body variants
- **What:** change the `# Stem`, `# Aware body`, `# Partial body`, or `# Unaware body` section.
- **Files touched:** the awareness md.
- **Invariants:** all four sections must be present (admin integrity check). Stem is the question-style prompt; the three "body" variants fire based on the user's awareness level.
- **Validation:** `npm run content:check` + voice check.
- **Trigger phrases:** "rewrite the unaware body on will-currency".

### 5.2 Change an awareness check's trigger
- **What:** edit the `trigger` frontmatter DSL.
- **Files touched:** frontmatter.
- **Invariants:** same as 4.2.
- **Validation:** admin integrity check `awareness:trigger-parses`.
- **Trigger phrases:** "change when the emergency-fund check fires".

### 5.3 Change rank / tier_limit / core flag
- **What:** adjust the awareness-check priority ordering, which tiers it shows on, or whether it's a "core" always-show check.
- **Files touched:** frontmatter.
- **Invariants:** `core: true` typically pairs with a non-null `rank`. `tier_limit` must subset `['A','B','C']`.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "bump this to core", "only show on thorough tier".

### 5.4 Add a new awareness check
- **What:** create a new awareness check file.
- **Files touched:** `content/awareness-checks/<slug>.md`.
- **Invariants:** `id: awareness.<slug_snake>`. Body must have all four sections. Compliance gate the same as provocations.
- **Validation:** `npm run content:check` + voice check.
- **Trigger phrases:** "add an awareness check about X".

### 5.5 Remove an awareness check
- **What:** delete the file.
- **Files touched:** the file.
- **Invariants:** check `ranking` downstream — removing a low-rank check is safe; removing a `core: true` check changes the summary surface.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "retire this awareness prompt".

---

## 6. Pages — structured frontmatter (`content/pages/*.md`)

Pages are heavier-frontmatter than screens — big nested objects (summary.md's `aspiration_echo`, `emotional_intros`, `silent_gaps.prompts`, `charts.titles`, `fca_footer.links`, etc.).

### 6.1 Edit a page's top-level copy
- **What:** change a scalar or a leaf string in the nested frontmatter.
- **Files touched:** the page md.
- **Invariants:** never delete a key without understanding where it's read (grep `src/` for the key name).
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "change the homepage hero", "update the FCA footer disclosure".

### 6.2 Edit nested frontmatter groups (summary.md)
- **What:** add/remove/edit entries in `silent_gaps.prompts`, `aspiration_echo.fallback_templates`, `emotional_intros`, etc.
- **Files touched:** the page md.
- **Invariants:** if removing a key, grep the summary resolver (`src/lib/summary/*`) to make sure it isn't referenced.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "add a silent gap for X", "update the high-earner emotional intro".

### 6.3 Add / remove a page
- **What:** create a new top-level page like `/faq` or `/team`.
- **Files touched:** `content/pages/<slug>.md`. Also `src/app/<slug>/page.tsx` (new Next.js route). Also navigation if applicable.
- **Invariants:** frontmatter must validate against `pageSchema`.
- **Validation:** `npm run content:check` + `npm run typecheck` + `npm run build`.
- **Trigger phrases:** "add a team page".

---

## 7. Microcopy (`content/microcopy/*.md`)

### 7.1 Edit an error / toast / email string
- **What:** change a single `entries[]` item (key/value/note).
- **Files touched:** the relevant microcopy file (errors.md, toasts.md, emails.md, aria.md, meta.md, loading-states.md, modals.md, progress.md, voice-rules.md).
- **Invariants:** `key` must remain stable — rename only if you also update every `src/` reference. Voice: quiet, specific, actionable — no "error", "invalid", "wrong", "failed", no exclamation marks.
- **Validation:** `npm run content:check` + voice check.
- **Trigger phrases:** "soften the email-invalid message".

### 7.2 Add a new microcopy entry
- **What:** register a new key/value pair.
- **Files touched:** the microcopy md. Often the `src/` side also needs a new reference.
- **Invariants:** `key` unique within file, snake_case, descriptive.
- **Validation:** `npm run content:check`.
- **Trigger phrases:** "add a toast for session-saved".

### 7.3 Change voice rules
- **What:** add / remove banned phrases, update the voice-rules markdown.
- **Files touched:** `scripts/banned-phrases.json` and/or `content/microcopy/voice-rules.md`. Also `admin_app/features/shared/voice.ts` (vendored copy — admin drift test will remind you).
- **Invariants:** any addition to `banned-phrases.json` must also land in the admin's vendored list, or the drift test fails.
- **Validation:** `npm run voice:check` + admin's `schema-drift.test.ts`.
- **Trigger phrases:** "add 'game-changer' to the banned list".

---

## 8. Report construction (`content/report/*` + `src/lib/compass/*`)

After Phase 2 / S4, every file under `content/report/` follows one canonical shape:

```yaml
---
id: report.<slug>
kind: per_segment | global
title: <short label>
description: <optional>
compliance_status: draft | cfp_signed | compliance_signed | approved_to_ship
# kind-specific extras (tile thresholds, source_id, etc.) ride along here
---

# S1 ... # S9   (per_segment)
# Body          (global)
```

The renderer (`src/app/report/master/[segment]/page.tsx`) reads via `src/lib/compass/pdf-content.ts`. The admin app's `/report` route exposes a generic editor (`admin_app/features/report/`) with one frontmatter form + one MarkdownEditor pane per body section.

The four pre-S4 banded-insight skills (`edit-banded-insight`, `edit-banding-cases`, `edit-static-report-block`, `add-report-section`) have been retired. The four canonical-block skills below replace them.

### 8.1 Edit a per-segment body section
- **What:** rewrite the body under one `# S<n>` H1 inside a `kind: per_segment` block (tile note for one segment, gauge interpretation, takeaway banner, goal entry).
- **Files touched:** `content/report/<path>.md` — one file, one segment section.
- **Invariants:** preserve `{value_token}` placeholders; never change `id`/`kind`/`title`; never advance `compliance_status` as a side effect (use 8.6).
- **Validation:** `npm run content:check` + `npm run voice:check`.
- **Trigger phrases:** "rewrite the S2 health-gauge line", "update the retirement tile note for S5", "soften the S9 takeaway banner".
- **Skill:** `edit-report-block-segment`.

### 8.2 Edit the body of a global block
- **What:** rewrite the body (or a sub-section under `# Body`) inside a `kind: global` block — methodology page, expanded awareness check, assumptions footer.
- **Files touched:** `content/report/<path>.md` — one file, one body sub-section.
- **Invariants:** methodology numbers must trace to a source citation; regulatory disclosures need explicit CFP+Compliance confirmation before edit.
- **Validation:** `npm run content:check` + `npm run voice:check`.
- **Trigger phrases:** "update the methodology", "rewrite the LPA expanded paragraph", "the BADR expanded copy is dated".
- **Skill:** `edit-report-block-global`.

### 8.3 Add a new report block
- **What:** create a new file under `content/report/` in the canonical shape.
- **Files touched:** new `.md` file. Optionally a tile-number slot allocation if it's a planning-grid tile.
- **Invariants:** new blocks start at `compliance_status: draft`; `id` mints in the right namespace; `kind` matches the body shape.
- **Validation:** `npm run content:check`. Render check on `/report/master/<segment>` recommended.
- **Trigger phrases:** "add a new report tile for X", "we need a new expanded awareness check", "scaffold an assumptions footer".
- **Skill:** `add-report-block`.

### 8.4 Advance compliance status on a report block
- **What:** walk the `compliance_status` field through the four-state ladder for one block.
- **Files touched:** one `content/report/<path>.md` — one frontmatter field.
- **Invariants:** human confirm gate is mandatory; no lateral skips by default; sign-off attribution captured in commit message (the canonical block has no signoff_date frontmatter).
- **Validation:** `npm run content:check`. For `approved_to_ship`, optionally `NODE_ENV=production npm run build` to verify the production gate.
- **Trigger phrases:** "mark the LPA expanded copy as CFP-signed", "the methodology is approved", "this tile is ready to ship".
- **Skill:** `change-block-compliance-status`.

### 8.5 Edit the projection engine (code change)
- **What:** change the math in `src/lib/compass/projection.ts` — assumptions, formulas, bands, tax-year rates.
- **Files touched:** `src/lib/compass/projection.ts` + `types.ts` + `assumptions.ts` if present.
- **Invariants:** keep the engine deterministic. Pure TypeScript, no side effects. Every output field must still be typed by `ProjectionYear`.
- **Validation:** `npm run typecheck` + `npm run test`. Fixture regression against a known input/output.
- **Trigger phrases:** "bump the balanced growth rate to 6.5%".

### 8.6 Change an image binding (still relevant where used)
- **What:** swap the image a global block (typically an expanded awareness check) uses.
- **Files touched:** the relevant `content/report/<path>.md` (frontmatter `image_slug` extra).
- **Invariants:** the slug must resolve to an asset under `public/report-preview/assets/illustrations/<slug>.svg`.
- **Validation:** manual render. (No dedicated admin integrity check after the Phase 2 simplification.)
- **Trigger phrases:** "change the image on the LPA expanded page".
- **Skill:** `change-image-binding`.

### 8.7 Retired surfaces (post-Phase 2)
The following pre-S4 surfaces no longer exist as authored content:
- Banded insights, static `context`/`think`/`tip` blocks, banding cases, fallbacks. **Replaced by:** the canonical `kind: per_segment | global` block (8.1–8.4 above).
- Mustache HTML template (`templates/_archive/report-legacy-mustache-2026-03/real-wealth-report.html`). **Replaced by:** React components under `src/app/report/` and `src/components/compass/`. Template-structure changes are now code edits (not in this audit).
- Chart-binding files (`content/report/charts/<slug>.md`). **Replaced by:** chart components in `src/components/compass/` consuming the projection engine directly. No content surface.
- `report:banding-exhaustiveness`, `report:placeholder-known`, `report:chart-slug-exists`, `report:insight-has-fallback` integrity checks. **Replaced by:** `report:frontmatter-valid` + `report:compliance-draft`.

---

## 9. Images (`content/images/*`)

### 9.1 Add a new image
- **What:** drop a new image into the media library.
- **Files touched:** `content/images/<filename>`. A `.meta.json` sidecar (alt, caption, width_px, image_family).
- **Invariants:** < 2MB. PNG, JPG, WEBP, or SVG. Alt text required.
- **Validation:** admin integrity checks `images:alt-required`, `images:size-cap`.
- **Trigger phrases:** "add this kitchen-table image".

### 9.2 Rename an image (with refactor)
- **What:** rename the file, cascading updates through every reference.
- **Files touched:** the image file. Every screen/report md that references it by name (the admin does this in a single transaction).
- **Invariants:** no dangling references after the rename.
- **Validation:** grep for the old name. Admin's reverse-index check.
- **Trigger phrases:** "rename kitchen-morning.png to kitchen-warm.png".

### 9.3 Delete an image
- **What:** remove an image from the library.
- **Files touched:** the image. Blocked by the admin if references exist; resolve via "remove references and delete" or first clear references manually.
- **Invariants:** no references remain.
- **Validation:** `images:path-resolves` clean.
- **Trigger phrases:** "delete the old hero image".

### 9.4 Edit image metadata (alt / caption / width_px)
- **What:** update the `.meta.json` sidecar.
- **Files touched:** the sidecar only.
- **Invariants:** alt non-empty; width_px positive integer.
- **Validation:** admin integrity scan.
- **Trigger phrases:** "update the alt on the hero image".

---

## 10. Cross-cutting changes

### 10.1 Bulk rename a question id (e.g. Q3.1 → Q3.1a)
- **What:** rename a question id across the matrix, every screen's `q_refs`, every provocation trigger, every `logged_as`, and any code reference.
- **Files touched:** many. The admin's "rename question id" action does this transactionally.
- **Invariants:** everything referring to the old id must flip to the new id in one commit.
- **Validation:** grep the old id — no matches after rename. `npm run content:check`.
- **Trigger phrases:** "rename Q3.1 to make room for a new subquestion".

### 10.2 Bulk find & replace
- **What:** replace a phrase across all content files.
- **Files touched:** admin's Find & Replace, scoped to body fields / option labels / frontmatter text.
- **Invariants:** always show a preview before committing.
- **Validation:** `npm run content:check` + voice check.
- **Trigger phrases:** "change 'wealth report' to 'financial snapshot' everywhere".

### 10.3 Tax-year update (annual)
- **What:** update tax-year constants, state pension figures, allowances, etc.
- **Files touched:** `tax-rules-<year>.yaml` (if present) + `src/lib/compass/assumptions.ts` + report methodology copy.
- **Invariants:** keep old tax-year files for replaying old sessions under their correct rates (immutable snapshot principle).
- **Validation:** `npm run test` with fixture sessions from the old year — outputs unchanged.
- **Trigger phrases:** "update to the 2027/28 tax rules".

### 10.4 Compliance ledger update
- **What:** after CFP/compliance review, flip multiple provocations + awareness checks through the compliance workflow in one pass.
- **Files touched:** many frontmatter status fields + signoff dates.
- **Invariants:** never advance on behalf of the reviewer — they must be the author of the commit.
- **Validation:** integrity scan surfaces incomplete signoff dates.
- **Trigger phrases:** "mark all of this week's reviewed provocations as cfp_signed".

### 10.5 Voice pass
- **What:** run a comprehensive voice-and-tone review across all content, flagging banned phrases and tone drift.
- **Files touched:** read-only scan; edits come out as a todo list or individual recommended rewrites.
- **Invariants:** report, don't silently rewrite, unless explicitly asked per file.
- **Validation:** `npm run voice:check` output.
- **Trigger phrases:** "do a voice pass on all segment CTAs".

---

## 11. What the admin app already surfaces

When an AI edit happens, these admin surfaces should still reflect the change without additional work:

- The integrity tray flags structural issues.
- The History drawer auto-snapshots every save (50-snapshot rolling cap + named checkpoints).
- Round-trip fidelity tests prove no drift on save.
- The admin's matrix editor + profiles view show the new shape once files are written.

AI edits that bypass the admin (direct file writes) still round-trip cleanly because the file format is stable markdown + YAML frontmatter + JSON. The admin just needs to be pointed at the folder and re-read.

---

## 12. Priority for skill creation

Based on frequency × risk:

**Tier 1 — daily / near-daily use (ship first):**
- 1.1 Change question wording
- 1.2 Change an option
- 1.6 Change pullquote
- 2.1 Change a matrix cell
- 3.1 Change a segment CTA
- 4.1 Edit a provocation body
- 4.6 Advance compliance_status
- 7.1 Edit microcopy
- 8.1 Edit a per-segment body section
- 8.2 Edit the body of a global block
- 8.4 Advance compliance status on a report block

**Tier 2 — weekly / monthly:**
- 1.3, 1.4 Add/remove options
- 1.5 Add conditional reveal
- 1.7 Add a new screen
- 2.2, 2.3 Add/remove matrix rows
- 2.4, 2.5 Predicate changes
- 4.2, 4.3 Provocation trigger / segments
- 4.4 Add new provocation
- 5.x Awareness checks
- 8.3 Add a new report block
- 8.6 Change an image binding
- 9.1–9.4 Image management
- 10.1 Rename id
- 10.2 Bulk find/replace

**Tier 3 — occasional / high-risk (human-review required):**
- 1.8 Remove a screen
- 2.4, 2.5 Engine predicates
- 3.3, 3.4 Add/remove a segment
- 3.5 Segment-assignment rules
- 6.3 Add/remove a page
- 8.5 Projection engine math
- 10.3 Tax-year update

Skills in `skills/` are generated from this audit, one per entry. Tier-3 skills include a mandatory human-confirm gate.
