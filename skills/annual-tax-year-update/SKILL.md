<!-- _AUDIT.md entry: 10.3 -->
---
name: annual-tax-year-update
description: Perform the annual tax-year update — new state pension figures, allowances, tax bands, NIC thresholds. Touches tax-rules yaml (if present), projection assumptions, and methodology copy. Use this skill ONLY during the annual rollover (typically April) when the firm has the new year's figures confirmed. This is Tier 3 — the immutable snapshot principle means historical rates must be preserved, not overwritten. Triggers on phrasings like "update to the 2027/28 tax rules", "annual rates refresh", or "bump everything for the new tax year".
---

# Annual tax-year update

## What this skill does

Rolls the app forward to a new UK tax year by adding new rates / figures / assumptions while preserving the historical ones. Touches:
- `tax-rules-<year>.yaml` (if the project uses per-year yaml files) — add a new one; never overwrite.
- `src/lib/compass/assumptions.ts` — extend, not replace, any year-keyed constants.
- `templates/report/real-wealth-report.html` — methodology page, any year-specific disclosure.
- `content/pages/*.md` — any year-keyed prose (consumer-duty page, FAQ).
- Fixture tests keyed on specific years.

## Human confirm gate (Tier 3)

Before making any edit:

1. **Confirm the firm has signed off on the new year's figures.** "Has the CFP / Compliance lead confirmed the 2027/28 figures you want applied?" The figures come from HMRC budget announcements — confirm the source is authoritative.
2. **Confirm the effective date.** Usually 6 April for personal tax year, 1 April for NICs / Corporation Tax. Clarify which rates are being updated when.
3. **Summarise the cascade.** Every file touched.
4. **Flag the immutable-snapshot principle.** Old rates stay. New rates add alongside. This allows replaying old sessions under their historical rates — a consumer duty consideration if clients query a report rendered in the previous year.
5. **Flag regression.** Fixture sessions may be year-keyed. Post-update, old sessions render with old rates; new sessions render with new rates. Tests must confirm both paths.
6. Wait for explicit "proceed, figures confirmed".

## Background

UK tax-year rollover affects:
- Personal allowance, basic / higher / additional rate bands.
- National Insurance thresholds (LPL, UEL, UST, etc.).
- Capital Gains Tax annual exempt amount.
- Inheritance Tax nil-rate band, residence nil-rate band, taper thresholds.
- Pension annual allowance (including tapered + MPAA).
- ISA / LISA / JISA limits.
- State pension figures (new + basic).

The firm's CFP signs off which figures land.

## Inputs you need from the user

1. **New tax year label.** e.g. `2027/28`.
2. **Figures.** The full list of updated numbers, with sources (HMRC publication).
3. **Effective date.** Usually 6 April of the new year.
4. **Compliance approver.** Named, for the commit message.

## Workflow

1. **Human confirm gate (above).**

2. **Plan the update.**
   - If the project has `tax-rules-<year>.yaml`, create a new file `tax-rules-2027-28.yaml`. Don't overwrite `tax-rules-2026-27.yaml`.
   - If assumptions are inlined in `src/lib/compass/assumptions.ts`, the pattern may be year-keyed maps or a single "current" constant. Prefer year-keyed maps for snapshot fidelity; extend rather than replace.
   - If assumptions are "current-only" (no year-keying), flag to the user: the snapshot principle would require adding year-keying as a pre-step.

3. **Add the new rates.** Year-keyed where possible:
   ```typescript
   // src/lib/compass/assumptions.ts (example pattern)
   export const PERSONAL_ALLOWANCE_BY_YEAR: Record<string, number> = {
     '2025/26': 12_570,
     '2026/27': 12_570,
     '2027/28': 12_570, // unchanged per Autumn Budget 2024 freeze
   };
   ```

4. **Update the "default" / "current" selector.** The engine typically picks the current tax year. Point it at the new year.

5. **Methodology page.** The report's methodology page usually lists the key assumptions with their source. Update the figures + footnote.

6. **Run fixture regressions.**
   ```bash
   cd master_template
   npm run test
   ```
   Year-keyed fixtures continue passing. "Current-year" fixtures now reflect new rates — expect updates.

7. **Walk sample sessions.** Render a session today (pre-update) and post-update. Confirm:
   - Pre-update session replayed post-update: numbers unchanged (historical rate preserved).
   - Fresh session: uses new rates.

8. **Summarise.** Every file touched, every constant updated, which sessions pre/post behave how, compliance approver named in the commit message.

## Files touched

- `master_template/tax-rules-<new-year>.yaml` (new; if this file pattern exists).
- `master_template/src/lib/compass/assumptions.ts` (extend year-keyed maps).
- `master_template/templates/report/real-wealth-report.html` (methodology page).
- `master_template/content/pages/*.md` (year-keyed prose if any).
- Fixture test files (year-keyed updates).

## Invariants — never break these

- **Human-confirm gate first, figures confirmed by compliance.**
- **Immutable snapshot principle.** Historical rates stay — they're needed to replay old sessions faithfully.
- **Single authoritative "current" selector.** One constant or function that determines which year's rates apply to a new session.
- **Methodology copy matches assumption figures.** Don't update one without the other.
- **Commit message captures approver + date + sources.**

## Examples

### Example 1 — 2026/27 → 2027/28 rollover

**User:** "Annual update: 2027/28 rates. Personal allowance frozen at £12,570, basic rate band to £37,700, state pension new to £11,975/yr, flat-rate £11,502/yr, IHT nil-rate band frozen at £325,000, RNRB frozen at £175,000, LISA limit £4,000, ISA limit £20,000. Approver: Sarah Patel, 2026-04-15."

**Confirm:**

> Scope of the update: ~8 constants to extend year-keyed, methodology page figures to update, fixture regressions to walk. Historical rates preserved.
>
> Confirm to proceed — you've got sign-off from Sarah Patel dated 2026-04-15, I'll include that in the commit.

On confirmation, execute the cascade.

### Example 2 — don't do this: overwrite historical

Bad: edit `PERSONAL_ALLOWANCE = 12_570` (unkeyed) → same value different reference. If a client asks "what was my 2025/26 report computed on?" and the only source is a single constant, you can't answer. Always prefer year-keying.

### Example 3 — don't do this: partial rollover

Bad: update some rates, forget others. The projection uses mixed years and gives inconsistent results. Do the update in one commit with a comprehensive list.

## When NOT to use this skill

- **Mid-year rate correction** (rare — a post-Budget fix) → `change-projection-math` with care; still capture compliance sign-off.
- **Adding a brand-new tax concept** (e.g. a new levy) → treat as a code feature, not a rollover.

## Related skills

- `change-projection-math` — non-annual math changes.
- `edit-disclaimer-or-methodology` — methodology prose.

## Gotchas

- **6 April vs 1 April.** Income tax / NIC for employees rolls on 6 April. Some business-oriented rates roll on 1 April. Get the effective date right per figure.
- **Frozen vs changing.** A "freeze" (e.g. the IHT threshold frozen through to 2030) is still a value that exists for the new year — extend the year-keyed map with the same number. Don't assume unchanged rates can skip the update.
- **Source links matter.** The commit message / methodology footnote should cite the HMRC publication. "Autumn Statement 2024" is a real source; "internal note" is not.
- **Client-facing communication.** If historical reports will be re-rendered (e.g. for a client revisiting their summary), they should appear unchanged under their historical rates. Verify the snapshot principle holds end-to-end.
