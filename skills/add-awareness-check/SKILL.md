<!-- _AUDIT.md entry: 5.4 -->
---
name: add-awareness-check
description: Create a brand-new awareness check markdown file under `content/awareness-checks/` with valid frontmatter, all four body sections (headline + three awareness-level bodies), and `compliance_status: draft`. Use this skill whenever the user asks to add a new awareness check, write a new "did you know" prompt, introduce a pitfall callout, or create a new educational nudge tied to a trigger. Triggers on phrasings like "add an awareness check about X", "new pitfall callout for business-owner consolidation", or "I want to write an awareness prompt for LPAs".
---

# Add a new awareness check

## What this skill does

Creates a new `.md` file at `master_template/content/awareness-checks/<slug>.md` with required frontmatter and all four body sections (`# Headline`, `# Body Aware`, `# Body Partial`, `# Body Unaware`), starting at `compliance_status: draft`.

## Background

Awareness checks are compliance-gated educational callouts. See `edit-awareness-check` for the schema and register.

## Inputs you need from the user

1. **Topic / slug.** Kebab-case — `lpa-urgency`, `pension-consolidation`. Filename: `<slug>.md`. Id: `awareness.<slug_snake>` or `pitfall.<slug_snake>` (the existing file tree uses both `awareness.` and `pitfall.` prefixes — match the prefix convention by topic; `pitfall.` for cautionary content, `awareness.` for informational).
2. **Trigger DSL.** See `change-provocation-trigger` for atoms.
3. **Rank, core flag, tier_limit.** Rank = ordering priority (lower = higher priority). `core: true` means always-show regardless of trigger (most checks are not core). `tier_limit: [A, B, C]` or subset.
4. **Placement note.** Human-readable — "after iht_mitigation if triggered", "page 6 silent-gaps", etc.
5. **Source.** One or more citations.
6. **Body copy.** Headline + three bodies (body aware, body partial, body unaware).

## Workflow

1. **Pick the filename.** Check collision.

2. **Compose frontmatter:**
   ```yaml
   ---
   id: awareness.<slug_snake>      # or pitfall.<slug_snake>
   core: false
   rank: 7
   trigger: "<DSL>"
   placement: "<human-readable placement note>"
   source: "<citation>"
   compliance_status: draft
   tier_limit: [A, B, C]
   ---
   ```

3. **Compose body — all four required:**
   ```markdown
   # Headline
   <question-style prompt, 90 chars ideal, ends with a question mark>

   # Body Aware
   <short — confirms awareness, offers adviser angle. 200 chars ideal.>

   # Body Partial
   <medium — fills numerical gaps. 250 chars ideal.>

   # Body Unaware
   <longest — explains fresh, why it matters, typical impact. 280 chars ideal.>
   ```

4. **Voice.** See `edit-awareness-check` for calibration. Compare against `rnrb-taper.md`, `carry-forward.md`, `pension-iht-2027.md`.

5. **`compliance_status` starts draft.** Never ship out of the gate.

6. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```

7. **Summarise.** New file, id, trigger, rank, compliance_status (draft).

## Files touched

- `master_template/content/awareness-checks/<slug>.md` — new file.

## Invariants — never break these

- **Start at `compliance_status: draft`.**
- **All four body sections present.**
- **`id` prefix must be `awareness.` or `pitfall.`** to match existing file tree.
- **At least one `source` citation.**
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — new pension-consolidation check

**User:** "Add an awareness check about pension consolidation for anyone with ≥4 pots."

File: `content/awareness-checks/pension-consolidation.md` (already exists — check first). If fresh, compose:

```yaml
---
id: awareness.pension_consolidation
core: false
rank: 8
trigger: "pension_pots >= 4"
placement: "page 6 silent-gaps if triggered"
source: "The Pensions Advisory Service consolidation guidance; FCA on pension switching"
compliance_status: draft
tier_limit: [A, B, C]
---

# Headline
Several small pots across previous employers can be quietly eroding your outcome — were you aware of the consolidation question?

# Body Aware
You already know. The practical question is usually timing and transfer costs — specifically whether any of the pots have protections (GARs, enhanced allowances) that would be lost on transfer.

# Body Partial
Small pots pay flat-fee admin that eats a higher percentage of the pot at lower balances. The FCA flagged this in 2023. Consolidation often cuts total fees meaningfully, though transfer costs and any safeguarded benefits need checking first.

# Body Unaware
Each pot carries its own admin, its own fund costs, and often its own annual statement. At lower balances (under £30k per pot), flat fees can eat 1–2% a year before investment returns. Consolidating into one SIPP or workplace scheme often cuts total cost — but some pots have protections (guaranteed annuity rates, enhanced protection) that would be lost on transfer, so the consolidation conversation is never all-or-nothing.
```

Validate: all four sections present, char counts within budgets. Clean.

### Example 2 — don't do this: ship at approved_to_ship

Refuse. Starts at draft.

## When NOT to use this skill

- **Edit existing check** → `edit-awareness-check`.
- **Change trigger / rank** → `change-awareness-trigger` / not-in-batch.
- **Add a provocation** → `add-provocation`.
- **Advance compliance** → `advance-compliance-status`.

## Related skills

- `edit-awareness-check`, `change-awareness-trigger`, `advance-compliance-status`, `add-provocation`.

## Gotchas

- **`awareness.` vs `pitfall.` prefix.** The existing tree uses both. `pitfall.` leans cautionary (rnrb_taper, tapered_annual_allowance, mpaa). `awareness.` leans educational. When in doubt, grep similar topics and match.
- **Core flag is rare.** Only a handful of checks are `core: true` — they always show. Most are conditional on trigger + rank.
- **Rank affects ordering.** Lower number = shown first. When adding, pick a rank that fits the priority (nearby existing checks give the scale).
- **Voice is tightly calibrated.** Read 3–4 existing checks before writing.
