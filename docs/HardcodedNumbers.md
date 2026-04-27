# Hardcoded Numbers — Problem, Audit, Solutions

A specific integrity problem in tile content: some numbers in tile notes are engine-computed (personalised per client), others are hardcoded in the prose (same for every client in that segment). Currently the reader can't tell which is which.

Reference doc. Read alongside `EDITING_FLOWS.md` and `OutstandingItems.md`.

Last updated: 2026-04-27 (Solution 2 — central constants file — has been implemented; see `src/lib/compass/tax-year-2025-26.ts` and the `edit-tax-year-constants` skill).

> **Status update.** Of the five solutions sketched below, **Solution 2 has shipped** — every UK regulatory constant lives in `src/lib/compass/tax-year-2025-26.ts` (single source of truth) with a methodology-page mirror at `content/report/methodology.md` Section 2. The published assumptions footer now also flows from `content/report/assumptions.md` (Solution 2-adjacent — content-driven). Solutions 1, 3, 4 remain open; Solution 5 (pragmatic combo) is still the recommended sequencing for the rest.

---

## The problem in one paragraph

The tile-scoring engine produces per-client metrics (`{cash_k}`, `{coverage_pct}`, etc.) and the tile markdown substitutes them into notes. But tile notes also contain numbers that **look** personal but are actually authored prose — "A 3% pension contribution increase", "over 12-18 months", "next 20 years". A reader has no way to tell which is which. For an MVP aiming at "real-client quality", this is a credibility risk: if any hardcoded number reads wrong for a specific client, they lose trust in every other number on the page.

---

## Full audit — every hardcoded number across 12 tiles × 9 segments

Columns: **Tile** / **Segment** / **Hardcoded number** / **Category** / **Could be dynamic?**

Categories:
- **A** — should be engine-computed, currently isn't (real problem)
- **B** — UK regulatory/tax law constant (acceptable; needs annual review)
- **C** — representative range or case-study figure (hard to personalise; MVP trade-off)

| Tile | Seg | Hardcoded | Cat | Fix |
|---|---|---|---|---|
| 01 Retirement | S2 | "A **3%** pension contribution increase" | A | Add `contrib_increase_needed_pct` metric |
| 01 Retirement | S5 | "adds **~30** points… subtracts **~20**" | C | Rough business-exit impact estimate |
| 02 Pension | S8 | "Reducing… by **10%** extends runway by **4 years**" | A | Add `drawdown_trim_pct` + `runway_extension_yr` metrics |
| 02 Pension | S9 | "before **April 2027**" | B | Pension IHT rule change — scheduled |
| 03 State pension | S2 | "A **90-second** check" | — | Descriptive, not a number |
| 03 State pension | S4 | "from age **67**" | A | `state_pension_age` (varies by DOB) |
| 03 State pension | S7 | "**4 years** away", "at **67**" | A | `years_to_state_pension`, `state_pension_age` |
| 04 Investment | S2 | "**20-year** accumulation horizon" | A | `years_to_retirement` metric |
| 04 Investment | S4 | "appropriate at **55** may not be at **60**" | A | Use client's `current_age` + fixed delta |
| 04 Investment | S7 | "different from the right answer at **50**" | A | Same |
| 04 Investment | S8 | "**30-year** horizon" | A | `years_to_95` metric |
| 05 Tax | S3 | "Effective rate around **60%**" | B | UK £100k trap math (factual) |
| 05 Tax | S4 | "above **£260k** adjusted income" | B | UK annual-allowance taper threshold |
| 05 Tax | S5 | "matters by **£10,000-£20,000** annually" | C | Representative tax-savings range |
| 05 Tax | S8 | "save **£5,000-£15,000** a year" | C | Representative drawdown-efficiency range |
| 06 Cash | S1 | "aim to build toward **6 months**" | B | Engine threshold — should reference the same constant |
| 06 Cash | S2 | "**6-month** ideal" | B | Same |
| 06 Cash | S2 | "over **12-18 months**" | C | Representative "how-long-to-close-gap" |
| 07 Debt | S2 | "next **20 years**" | A | `years_to_retirement` |
| 08 Mortgage | — | (all tokens) | — | Clean |
| 09 Estate | S2 | "at **18**" | B | UK intestacy law (children's age of majority) |
| 10 IHT | S2 | "next **15-20 years**" | A | `years_to_65` or similar |
| 10 IHT | S3 | "within **10-15 years**", "**£2m**" | A/B | A: horizon. B: RNRB taper threshold. |
| 10 IHT | S4 | "next **2-5 years**", "**£150,000-£400,000**" | C | Typical structured-planning reduction range |
| 10 IHT | S7 | "**7-year** clock" | B | UK IHT gifting rule |
| 10 IHT | S9 | "**7-year** clock" | B | Same |
| 11 Protection | S6 | "**18-24 months** before completion" | C | Could use fixture's `succession` answer |
| 12 Business | S3 | "Section **24**" | B | UK tax legislation name |

**Counts:** Category A = **11** cases (the real problem). Category B = **10** cases (acceptable but need review cadence). Category C = **8** cases (MVP trade-off).

---

## Why each category is different

### Category A — should be dynamic (11 cases)

These are numbers that the engine already has access to, or could compute trivially. A client at age 58 should see "5 years from retirement" not "20 years". Every one of these instances is a credibility risk.

### Category B — UK regulatory / tax constants (10 cases)

These are UK-law facts (intestacy rules, IHT 7-year clock, £100k tax trap, pension-IHT 2027 rule, RNRB taper £2m threshold). They are the same for every client and don't personalise. But:

- They **drift** — budget changes, rule changes, annual allowance shifts. The £100k trap hasn't moved since 2010 but the 2027 pension-IHT rule is a genuine future date that becomes "past" after April 2027.
- Currently scattered across prose — no central source of truth.
- Risk: a rule changes and we update it in one tile but forget three others.

### Category C — representative ranges (8 cases)

Case-study-style estimates. "Typical IHT planning reduces the bill by £150k-£400k." "Business sales take 18-24 months." "Mixing withdrawals efficiently saves £5k-£15k a year." These are:

- Real-world ballpark figures from the planner team's experience.
- Not personally derivable without a more sophisticated engine.
- The MVP trade-off we've accepted: prose that's directionally right but not specifically the client's number.

---

## Proposed solutions

### Solution 1 — Add missing engine metrics (fixes Category A)

Extend `TileMetrics` in `src/lib/compass/tile-scoring-types.ts` with:

- `contrib_increase_needed_pct` — `(target_pot - current_pot) / years_to_retirement / income → %`
- `years_to_retirement` — simple subtraction
- `years_to_state_pension` — based on state pension age lookup
- `state_pension_age` — from DOB → UK rule (66 → 67 → 68 depending on birth year)
- `current_age_plus_5` — for "today vs 5 years later" comparisons
- `years_to_95` — 95 minus current age
- `drawdown_trim_pct`, `runway_extension_yr` — simple engine math from projection

Effort: ~1-2 days. Every Category A instance collapses to a token.

### Solution 2 — Central constants file (supports Category B)

New `src/lib/compass/tax-year-constants.ts`:

```ts
export const UK_CONSTANTS = {
  NRB: 325_000,
  RNRB_PER_PERSON: 175_000,
  RNRB_TAPER_THRESHOLD: 2_000_000,
  STATE_PENSION_FULL_ANNUAL: 11_502,
  ANNUAL_ALLOWANCE: 60_000,
  ANNUAL_ALLOWANCE_TAPER_START: 260_000,
  INCOME_TRAP_LOWER: 100_000,
  INCOME_TRAP_UPPER: 125_140,
  INCOME_TRAP_EFFECTIVE_RATE_PCT: 60,
  IHT_GIFTING_CLOCK_YEARS: 7,
  INTESTACY_CHILDREN_AGE: 18,
  PENSION_IHT_EFFECTIVE_DATE: 'April 2027',
} as const;
```

Engine loads these once, exposes via metrics for substitution. Content authors use `{UK.NRB_k}` style tokens instead of typing "£325k" inline. Benefit: update the constant in one file per budget; all prose refreshes.

Effort: ~1 day.

### Solution 3 — Linter / validator (preventive)

New `scripts/check-hardcoded-numbers.ts` that scans every `note:` in tile markdown for numeric substrings not inside a `{token}`. Anything that matches triggers a warning — except for an allowlist of approved strings (e.g. "90-second", "Section 24", page numbers).

Run in `npm run content:check` pipeline. Stops new hardcoded numbers appearing in future content changes.

Effort: ~half a day. High-value preventive control.

### Solution 4 — Schema-enforced structure (heavier refactor)

Restructure tile notes from one prose string to a structured object:

```yaml
S2:
  status: amber
  fact: "At {coverage_pct}% of your target at age {retire_age}"
  advice: "A conversation about contribution timing is worth 20 minutes"
  evidence: "Most S2 clients close the gap with a 2-5% contribution increase"
```

Renderer joins them. `fact` must contain only tokens (validated). `advice` is pure prose. `evidence` is tagged as "representative statistic" with optional sourcing.

Benefit: structural separation between personal fact and general advice. Reader can always tell which is which.

Cost: rewrite all 108 tile blocks + new renderer. Meaningful refactor.

### Solution 5 — Accept Category C, fix A, formalise B

Pragmatic MVP path. Three things:

1. **Fix all Category A** via Solution 1 (1-2 days).
2. **Adopt Solution 2** for Category B (half-day to extract, ongoing maintenance).
3. **Acknowledge Category C** as documented MVP trade-off. Either: (a) soften the prose ("typically saves a meaningful amount" not "saves £5k-£15k"), or (b) accept the representative figures with a footnote on page 09 methodology ("Ranges cited are typical cases from our planner team; your situation may vary").
4. **Add Solution 3** as a preventive linter so we don't reintroduce Category A.

---

## My recommendation

**Go with Solution 5** — the pragmatic combination.

| Step | What | Effort | Why |
|---|---|---|---|
| 1 | Solution 1 — add 8 new engine metrics, update 11 Category A notes | 1-2 days | Removes the real credibility risk |
| 2 | Solution 2 — extract UK constants into one file | half a day | Prevents drift on tax-law numbers |
| 3 | Solution 3 — linter in `content:check` | half a day | Stops the problem reappearing |
| 4 | Methodology footnote for Category C | content-author hour | Makes MVP trade-off transparent |

**Total: ~3 days of focused engineering** to move from "some numbers are dynamic, some aren't, no way to tell" to "every client-specific number is dynamic, all UK constants centralised, any new hardcoded number triggers a build warning."

## What this does NOT solve

- **Prose tone mismatch when engine flips status.** Separate problem. Even with every number dynamic, a segment's note may be written in amber-voice while the engine scores the client green. See `docs/OutstandingItems.md` §"Tile prose may feel off".
- **Representative Category C ranges.** Still authored, not derived. The methodology footnote makes them honest; a more sophisticated engine could compute them later.

---

## Notes for Monday

- Decision needed: accept Solution 5, or pick a different path.
- If Solution 5 is accepted, we can fire it as a single agent brief (the engineering is well-bounded).
- Solution 3 (the linter) is the highest-leverage single piece of work — half a day, catches this class of problem forever. Worth doing even if we defer the other steps.
- Category B constants tend to drift with Budgets — March/April is the typical refresh window. A central constants file makes that refresh safe.
