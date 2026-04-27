<!-- _AUDIT.md entry: 4.4 -->
---
name: add-provocation
description: Create a brand-new provocation file under `content/provocations/` with valid frontmatter, body sections, and `compliance_status: draft`. Use this skill whenever the user asks to add a new provocation, write a new compliance callout, introduce a commercial nudge for a specific answer pattern, or create a "something worth noticing" prose block for a new trigger condition. Triggers on phrasings like "new provocation about the £100k tax trap", "add a callout when someone has ≥3 pension pots", or "I want to write a provocation for self-employed business owners".
---

# Add a new provocation

## What this skill does

Creates a new `.md` file at `master_template/content/provocations/<slug>.md` with every required frontmatter field, the three body sections (`# Headline`, `# Body`, `# Cta`), and `compliance_status: draft` so it doesn't ship to production until reviewed.

## Background

Provocations are compliance-gated commercial callouts. See `edit-provocation-body` for the schema and the workflow context.

## Inputs you need from the user

1. **Topic / slug.** Kebab-case short slug — `hundred-k-tax-trap`, `director-single-pot`. The filename will be `<slug>.md` and the `id` will be `prov.<slug_snake>`.
2. **Trigger DSL.** When does it fire? See `change-provocation-trigger` for the DSL.
3. **Segments.** Which of S1–S9 (or `all`). Target audience.
4. **Body copy.** Headline, body, cta — or intent to write. Budgets: headline 40/60, body 180/320, cta 30/50.
5. **Source refs.** At least one citation (HMRC rule, Finance Act section, Autumn Budget, etc.) — provocations need sources for the compliance review.

## Workflow

1. **Pick the filename.** Check for collision — `grep "<slug>" content/provocations/` or Glob.

2. **Compose frontmatter.** Template:
   ```yaml
   ---
   id: prov.<slug_snake>
   trigger: "<DSL expression>"
   segments: [S4, S6]
   compliance_status: draft
   cfp_signoff_date: null
   compliance_signoff_date: null
   version: "0.1.0"
   source_refs:
     - "HMRC <rule>"
     - "<Act section>"
   ---
   ```

3. **Compose body — all three sections required.**
   ```markdown
   # Headline
   <short, sharp, specific. 40 chars ideal.>

   # Body
   <concrete mechanism, concrete numbers, real impact. 180 chars ideal.>

   # Cta
   <one-line invitation / observation. 30 chars ideal.>
   ```

4. **Voice.** Specific, numerate, adult. See `edit-provocation-body` for the register. No hype, no "unlock", no exclamation marks.

5. **`compliance_status` starts draft.** Never ship at `approved_to_ship` out of the gate. The CFP + Compliance review is what moves it through — see `advance-compliance-status`.

6. **Validate trigger parses.** Use the parser's atom list — see `change-provocation-trigger`. If unsure, write a plain trigger first and tighten later.

7. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   Plus admin integrity checks `provocations:trigger-parses` and `provocations:compliance-signoff-date-present` (which expects both dates to be `null` at draft — already so).

8. **Summarise.** New file path, id, trigger, segments, compliance_status (always draft).

## Files touched

- `master_template/content/provocations/<slug>.md` (new) — one file.

## Invariants — never break these

- **Always start at `compliance_status: draft`.** Never author a new provocation at any other status.
- **Both signoff_date fields must be `null`** at creation. They get set only via `advance-compliance-status`.
- **All three body sections must be present.** `# Headline`, `# Body`, `# Cta`. None can be empty.
- **`id` format:** `prov.<slug_snake>`. Match the filename slug with underscores.
- **At least one `source_refs` entry.** The compliance reviewer needs something to check against.
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — new £100k tax trap provocation

**User:** "Add a provocation about the £100k personal allowance tapering — fire for employed users in that band."

File: `content/provocations/income-100k-trap.md`.

```yaml
---
id: prov.income_100k_trap
trigger: "income_band in ['100to125k'] AND work_status == 'employed'"
segments: [S3, S4]
compliance_status: draft
cfp_signoff_date: null
compliance_signoff_date: null
version: "0.1.0"
source_refs:
  - "HMRC Personal Allowance tapering rules"
  - "Income Tax Act 2007, s35"
---

# Headline
The £100k marginal trap.

# Body
Between £100,000 and £125,140 of income, the personal allowance tapers away — £1 lost for every £2 over £100k. Effective marginal rate: 60%. A pension contribution at this band often yields 60p in the £1 of tax relief, before employer matching.

# Cta
Most people we meet at this band are leaving the relief on the table.
```

Validation: headline 21 chars, body 285 chars, cta 47 chars — all under budgets. Clean.

### Example 2 — don't do this: ship at approved_to_ship

**User:** "Add this and mark it approved_to_ship so it goes live."

Refuse. New provocations start at draft, full stop. The user can advance it via `advance-compliance-status` after review.

### Example 3 — don't do this: omit sources

**User:** "Add a quick provocation — no sources needed, it's obvious."

Ask for at least one source. If truly none exist, flag to the user that compliance won't be able to sign off without them.

## When NOT to use this skill

- **Edit an existing provocation's body** → `edit-provocation-body`.
- **Change trigger / segments on existing** → `change-provocation-trigger` / `change-provocation-segments`.
- **Advance compliance status** → `advance-compliance-status`.
- **Add an awareness check** (similar but different voice + schema) → `add-awareness-check`.

## Related skills

- `edit-provocation-body`, `change-provocation-trigger`, `change-provocation-segments`, `advance-compliance-status`, `add-awareness-check`.

## Gotchas

- **Voice is tightly constrained.** Read 3–4 existing provocations before writing — calibrate register against `iht-2m-cliff.md`, `self-employed-pension.md`, `close-to-line.md`.
- **The trigger is the gate.** If the trigger is too narrow, the provocation never fires. If too broad, it fires for the wrong cohort. Walk sample sessions before committing.
- **Draft is safe.** A provocation at draft never renders in production. Ship new ones freely — review gates the visibility.
- **Filename convention.** Lowercase kebab-case slug. Avoid numbers unless they're part of the topic (`iht-2m-cliff`, `hundred-k-tax-trap`). `id` uses snake_case (`prov.iht_2m_cliff`).
