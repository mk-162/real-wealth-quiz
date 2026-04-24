<!-- _AUDIT.md entry: 8.11 -->
---
name: rename-placeholder-token
description: Rename, add, or remove a `{{mustache}}` placeholder token used in the Real Wealth report template and insight bodies. Use this skill whenever the user asks to rename a token like `{{snapshot_stat_1_val}}` to something clearer, add a new token to the registry, or retire a token. This is Tier 3 — the rename cascades through the template HTML, the placeholder registry, AND every insight body that uses the token. Triggers on phrasings like "rename {{snapshot_stat_1_val}} to {{net_worth}}", "add a new token for {{iht_bill_estimate}}", or "clean up the placeholder names".
---

# Rename a placeholder token

## What this skill does

Performs a transactional rename of a `{{mustache}}` token across every file that references it. The full surface:
- `templates/report/real-wealth-report.html` — the template where tokens are substituted.
- `admin_app/shared/placeholders.ts` — the registry that defines known tokens and (often) maps them to substitutor functions.
- Every `content/report/insights/*.md` whose body uses the old token.
- Every `content/report/context/*.md`, `content/report/tip/*.md`, `content/report/think/*.md` whose body uses the old token.
- Every `content/report/charts/*.md` `inputs` binding that resolves via tokens.

## Human confirm gate (Tier 3)

Before making any edit:

1. **Summarise the rename and its scope.** Old token → new token. Count of referring files.
2. **Flag the template side.** The HTML template may hardcode the token in multiple places; HTML encoding variations (`{{name}}` vs `{{ name }}` — both are valid mustache) need both patterns grepped.
3. **Flag the substitutor.** The registry pairs each token with a function (or value source) that produces its runtime value. Renaming requires updating that mapping too.
4. **Flag the regression surface.** A missed reference renders literal `{{old_token}}` text in shipped reports. Subtle but visible.
5. Wait for explicit "yes" / "proceed".

## Background

Tokens are substituted at report-render time. The substitutor reads `admin_app/shared/placeholders.ts` to know which tokens are valid and how to resolve them. An unknown token in a body = `{{unknown_token}}` printed verbatim in the PDF. Admin integrity check `report:placeholder-known` catches unknown tokens at save time.

## Inputs you need from the user

1. **Old token name.** Without braces — `snapshot_stat_1_val`.
2. **New token name.** Snake_case.
3. **Substitutor behaviour.** Is the renamer only changing the name, or also changing what value it resolves to?

## Workflow

1. **Human confirm gate (above).**

2. **Grep for the token.**
   ```bash
   cd master_template
   grep -rn "{{ *<old_name> *}}" content/ templates/ admin_app/
   grep -rn "<old_name>" admin_app/shared/placeholders.ts
   ```
   Handle both `{{name}}` and `{{ name }}` spacing variants.

3. **Plan the atomic rename.** One commit containing:
   - `admin_app/shared/placeholders.ts` — rename the registry entry.
   - `templates/report/real-wealth-report.html` — flip every occurrence.
   - Every insight / context / tip / think / chart binding — flip every body / inputs occurrence.

4. **Execute.** All edits, one pass.

5. **Validate.**
   ```bash
   npm run content:check
   npm run typecheck
   cd admin_app
   npm run test
   ```
   Admin integrity scan `report:placeholder-known` is the key check.

6. **Post-rename grep.** Zero hits on old token name.

7. **Render a sample report.** Confirm no literal `{{old}}` or `{{new}}` leaks through — tokens resolve cleanly.

8. **Summarise.** Old → new, every file touched, post-grep count, sample render result.

## Files touched

- `master_template/admin_app/shared/placeholders.ts`.
- `master_template/templates/report/real-wealth-report.html`.
- Every `content/report/**/*.md` that used the token.

## Invariants — never break these

- **Atomic commit.** Partial rename = literal `{{old}}` in production.
- **Post-rename, zero hits on old name.**
- **Registry and template stay in sync.** Template references must exist in registry.
- **Substitutor logic preserved** unless explicitly changing value behaviour.

## Examples

### Example 1 — rename snapshot_stat_1_val → net_worth

**User:** "Rename `{{snapshot_stat_1_val}}` to `{{net_worth}}` — the old name is cryptic."

**Confirm:**

> Grep turned up: `templates/report/real-wealth-report.html` (3 hits), `admin_app/shared/placeholders.ts` (1 registry entry), `content/report/insights/snapshot.md` (2 hits), `content/report/context/snapshot-context.md` (1 hit). Total 7 references across 4 files.
>
> All edits in one commit. Post-rename I'll grep for residual `snapshot_stat_1_val` — expect zero.
>
> Substitutor: the registry function that computes this value stays the same (still `report.balance_sheet.net_worth`), just the key renames.
>
> Confirm.

Execute, validate, grep.

### Example 2 — add a new token

**User:** "Add `{{iht_bill_estimate}}` — I want to reference it in the IHT insight body."

Check the substitutor: does the code have a value source for this? If yes, register the token in `placeholders.ts` with the mapping. If no, this is a bigger change — adding a new token requires code to compute it at render time, which means a projection engine or scorer addition (Tier 3 territory).

Surface:

> Adding a new token requires registering it in `admin_app/shared/placeholders.ts` AND writing a substitutor function that computes the value from the session + projection report. Do you have the substitutor logic, or is this the beginning of a bigger change?

### Example 3 — don't do this: rename in the registry only

Bad: rename only the registry entry. The template still has the old token. Report renders `{{old_name}}` verbatim. Always atomic.

## When NOT to use this skill

- **Add a token mapped to an already-computed value** — still this skill, but simpler.
- **Remove a token entirely** — same cascade in reverse; grep, remove everywhere, remove registry entry.
- **Edit a token's substitutor logic without renaming** → code change; out of this skill's scope but same discipline.

## Related skills

- `edit-banded-insight` (uses tokens), `edit-static-report-block`, `change-chart-binding`.

## Gotchas

- **Mustache whitespace.** `{{name}}` and `{{ name }}` both work. Grep with `{{ *<name> *}}` to catch both.
- **Case sensitivity.** `{{netWorth}}` ≠ `{{net_worth}}`. Use snake_case consistently.
- **Reports in production don't re-render.** Historical PDFs shipped with the old token are frozen. Renaming only affects new renders.
- **Substitutor doesn't silently fall back.** An unknown token renders its literal text. Always sample-render after a rename.
