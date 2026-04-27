# Compass Engine + Form Overhaul — Handoff

**Date:** 2026-04-27
**Audience:** Editor-only v1 desktop admin app agent (operating on `Real Wealth\Real Wealth\admin_app\`).
**Scope:** Engine, projection model, form screens, and report visualisations in `master_template/`.

This document is self-contained. The receiving agent does not need any prior conversation context.

> **Post-simplification footnote (2026-04-27).** This handoff was written against the engine state immediately after the overhaul. Several authoring surfaces it references have since been simplified — see `docs/SIMPLIFICATION_PLAN_2026-04-27.md` for the full sequence. Most-relevant deltas for anyone reading this doc cold:
>
> - **Audience now lives on the screen file** — `content/generated/matrix.json` is gone. Each screen frontmatter carries an `audience` block keyed by `questionId`. The matrix the engine consumes is built at module load by walking every screen (`src/lib/questions/matrix.ts`).
> - **Report content unified** — `content/pdf-report/` was renamed to `content/report/`, and per-segment report blocks now use a canonical `kind: per_segment` shape with `# S1 … # S9` body sections (or `kind: global` with `# Body`).
> - **Body sections unified** — every content type uses a small canonical vocabulary (`# Headline / # Body / # Cta / # Notes`, with awareness using `# Body Aware|Partial|Unaware`).
> - **Tax-year constants** stay where this doc puts them — `src/lib/compass/tax-year-2025-26.ts`. The admin now ships a structured-form editor for that file at `/tax-year`.
> - **Assumptions footer copy** has been lifted out of `src/components/compass/Assumptions/Assumptions.tsx` into `content/report/assumptions.md` (canonical `kind: global` shape).

---

## 1. What changed in one paragraph

The Compass projection engine was rewritten to (a) preserve raw slider values instead of bucketing them into bands, (b) apply realistic UK tax/NI/pension-allowance rules including Scottish bands and the £100k–£125k personal-allowance taper, (c) personalise state-pension age and DC pension access age by birth year, (d) draw down retirement income in tax-optimised order, (e) compound salary growth year-on-year, and (f) subtract guaranteed retirement income (state pension + DB pension) from the gauge's required-pot target. The form gained 8 questions across 5 screens (1 net new screen). The Net Worth Donut now splits ISA / GIA / Other and renders a "less liabilities" line. The Lifetime Wealth Chart stacks ISA and GIA as separate areas. All UK tax-year constants have been centralised in a single file. The `/conversation/summary` page now leads with the 9-page report rather than burying it under marketing chrome.

---

## 2. Files changed (master list)

### New files

| Path | Purpose |
|---|---|
| `src/lib/compass/tax-year-2025-26.ts` | Single source of truth for every UK tax/regulatory constant. Annual update file. |
| `content/screens/4.E.5-risk-profile.md` | Risk-profile question screen (cautious/balanced/adventurous). |
| `docs/compass-engine-overhaul-2026-04-27.md` | This file. |

### Modified files (engine)

| Path | What changed |
|---|---|
| `src/lib/compass/types.ts` | `CompassInputs` extended with raw-value (`*Raw`) fields, partner block, DB-pension fields, salary-sacrifice flag. `BalanceSheet.assets` now exposes `isa`, `gia`, `otherAssets` separately. |
| `src/lib/compass/inputs.ts` | New `INPUT_QUESTION_IDS` entries for every new field; new helpers `numericIfPresent`, `numericToWealthBand`, `lookupRiskProfile`, `getBool`. Raw slider values now flow through alongside the legacy banded labels. |
| `src/lib/compass/projection.ts` | Rewrites: tax engine (Scottish bands, taper), NI excluded in retirement, DOB-based SPA + pension access age, real income growth, Annual Allowance + tapered AA, tax-optimised drawdown order, gauge formula subtracts guaranteed income. New helpers: `resolveAmount`, `resolveMonthlySpend`, `resolveContribPct`, `resolveNiYears`, `taperedAnnualAllowance`, `applyAnnualAllowanceCap`. |
| `src/lib/compass/tile-scoring.ts` | Imports tax constants from `tax-year-2025-26.ts` rather than re-declaring locally. |

### Modified files (visualisations)

| Path | What changed |
|---|---|
| `src/components/compass/NetWorthDonut/NetWorthDonut.tsx` | ISA, GIA and "Other" are now separate slices. Liabilities surface as a "less liabilities" legend row when non-zero. |
| `src/components/compass/LifetimeWealthChart/LifetimeWealthChart.tsx` | Two separate stacked areas for ISA and GIA (was a single "investments" sum). Tooltip rows split accordingly. |
| `src/components/compass/BalanceStrip/BalanceStrip.tsx` | Liabilities cell shows a one-line breakdown (mortgages · loans · cards) when material. |
| `src/components/compass/Assumptions/Assumptions.tsx` | Footer now publishes risk profile, real income growth, tax residence, salary sacrifice, NI years assumed, personalised SPA. |

### Modified files (form screens)

| Path | What changed |
|---|---|
| `content/screens/3.3-about-you.md` | Added `scottish_taxpayer` (radio), `partner_age`, `partner_gross_income`, `partner_pension_value` (sliders, conditional on `household` including `partner`). |
| `content/screens/4.A.3-assets-at-a-glance.md` | Added `main_home_value` slider (replaces estate-band heuristic), `mortgage_balance_amount` slider (replaces banded `mortgage_balance`), `has_non_mortgage_debt` toggle revealing `personal_loans_amount` and `credit_card_amount` sliders. |
| `content/screens/4.A.4-other-property.md` | Added `other_property_value`, `other_property_mortgage_balance`, `other_property_monthly_rent` sliders, conditional on having other property. |
| `content/screens/4.E.1-pension-pot.md` | Added `has_db_pension` toggle revealing `db_pension_annual_income` and `db_pension_start_age` sliders. |
| `content/screens/4.E.3-contributions.md` | Added `salary_sacrifice` radio (yes/no/not_sure). |

### Modified files (summary page)

| Path | What changed |
|---|---|
| `src/app/conversation/summary/CompassReportSection.tsx` | Imports `compass-theme.css` so the embedded report's `.rw-doc` / `.rw-eyebrow` / `.rw-h-section` classes are styled (the conversation layout doesn't share `/report/layout.tsx`'s import). |
| `src/app/conversation/summary/SummaryClient.tsx` | The 9-page report is now the first thing rendered post-unlock. The placeholder GraphSlot is shown only pre-unlock. The considered list, silent gaps and action ladder all render below the report. |

### Auto-regenerated

| Path | Trigger |
|---|---|
| `src/lib/content/catalogue.ts` | Auto-rebuilt by `npm run content:build` after editing any `content/screens/*.md`. Edit the markdown, run the script. |

---

## 3. Engine changes — itemised

Every numbered item below corresponds to an "A1, A4, …" sprint identifier from the upstream design document. References follow the form `path/file.ts:LINE`.

### A1. Stop re-banding sliders

**Files:** `src/lib/compass/types.ts`, `src/lib/compass/inputs.ts`, `src/lib/compass/projection.ts`

Sliders on the form already collect £-precision numbers. The previous engine collapsed them into 5–8 bucket bands and used midpoints. We now keep both:

- The legacy band field (`isaBalance: WealthBand | 0`) is still computed for tile-scoring backwards compatibility.
- A new raw field (`isaBalanceRaw?: number`) holds the slider value verbatim.
- The projection prefers raw over band via `resolveAmount(raw, banded)`.

Pattern applied to: `mainHomeValue`, `otherPropertyValue`, `totalPensionValue`, `cashSavings`, `isaBalance`, `giaBalance`, `businessValue`, `mainHomeMortgageBalance`, `otherPropertyMortgageBalance`, `personalLoans`, `creditCardDebt`, `householdGrossIncome`, `monthlySavingAmount`, `employerPensionContribPct`, `ownPensionContribPct`, `essentialMonthlySpend`, `nonEssentialMonthlySpend`, `mortgageMonthlyPayment`, `mortgageEndAge`, `niQualifyingYears`.

### A2. Mortgage payment as time-bound expense

**File:** `src/lib/compass/projection.ts`

Before retirement and before `mortgageEndAge`, the annual mortgage payment is added to housing expense. After `mortgageEndAge` it drops to £0. The end age is now resolved from the slider when present (`mortgageEndAgeRaw`) rather than the 4-bucket band. See `resolveMortgageEndAge`.

### A4. Subtract guaranteed retirement income from target wealth

**File:** `src/lib/compass/projection.ts` — `targetCoverage` function

The accumulator gauge formula was:
```
target_wealth = retirement_spend × 25 × horizon_factor
```
It now subtracts state pension + DB pension first:
```
self_funded_spend = max(0, retirement_spend − state_pension − db_pension)
target_wealth = self_funded_spend × 25 × horizon_factor
```
Edge case: if guaranteed income covers retirement spend entirely, the gauge returns 110–130% (user is comfortably ahead).

### A6. Tax-optimised drawdown order

**File:** `src/lib/compass/projection.ts` — `drawFrom` function

Old order: cash → ISA → GIA → pension.
New order: cash → GIA → pension → ISA.

Rationale: GIA carries CGT + dividend allowances that absorb most tax for typical drawdowns. Pension is drawn before ISA because (a) 25% is tax-free; (b) ISA is preserved for late-life flexibility and post-2027 IHT efficiency.

### A7. Real income growth

**File:** `src/lib/compass/projection.ts`

Income now compounds at `INCOME_GROWTH = 2.5%` real per year while the user is still working:
```
yearGrossIncome = initialGross × (1 + INCOME_GROWTH)^yearsWorked
```
Constant lives in `tax-year-2025-26.ts`. Surfaced in the Assumptions footer as "Real income growth 2.5%".

### A8. Personalised State Pension Age + DC pension access age

**File:** `src/lib/compass/tax-year-2025-26.ts` — `statePensionAgeForBirthYear`, `pensionAccessAgeForUser`

State Pension Age now varies by birth year:
- Born before 1960 → SPA 66
- Born 1960–1977 → SPA 67
- Born 1978+ → SPA 68

DC pension access age:
- Reaches 55 before 6 April 2028 → 55
- Reaches 55 from 6 April 2028 → 57

Birth year is approximated from `currentAge` and the live calendar year (the form collects age, not DOB).

### A9. Annual Allowance + tapered AA + Lump Sum Allowance

**File:** `src/lib/compass/projection.ts` — `taperedAnnualAllowance`, `applyAnnualAllowanceCap`

Pension contributions are capped at the (tapered) AA. For users with adjusted income above £260,000, AA tapers down £1 for every £2 over the threshold, floored at £10k.

```
AA = 60_000 (default)
if adjustedIncome > 260_000:
  AA = max(10_000, 60_000 − floor((adjustedIncome − 260_000) / 2))
```

LSA (£268,275 — replaces 25% of LTA cap from April 2024) is exposed in the Assumptions footer for transparency. Currently informational; the engine doesn't yet enforce LSA on tax-free cash.

### A10. NI not levied in retirement

**File:** `src/lib/compass/projection.ts`

NI is only deducted in working years (`!isRetired`). Previously, the working-year `netAnnual` was computed once at start of projection and reused; now it's recomputed each year (since income grows annually) and gated on retirement status.

### A11. Centralised tax-year constants

**File:** `src/lib/compass/tax-year-2025-26.ts` — new file

Every UK regulatory number lives here:

```
PERSONAL_ALLOWANCE = £12,570
BASIC_RATE_LIMIT = £50,270
HIGHER_RATE_LIMIT = £125,140
PA_TAPER_START = £100,000
SCOTTISH_BANDS = [...]   // 6 bands, starter through top
NI_PRIMARY_THRESHOLD = £12,570
NI_UPPER_EARNINGS_LIMIT = £50,270
NI_MAIN_RATE = 8%, NI_HIGHER_RATE = 2%
STATE_PENSION_FULL = £11,502
STATE_PENSION_FULL_QUALIFYING_YEARS = 35
PENSION_ACCESS_AGE_BEFORE_2028 = 55
PENSION_ACCESS_AGE_FROM_2028 = 57
ANNUAL_ALLOWANCE = £60,000
ANNUAL_ALLOWANCE_TAPER_THRESHOLD = £200,000
ANNUAL_ALLOWANCE_TAPER_ADJUSTED_INCOME = £260,000
ANNUAL_ALLOWANCE_TAPERED_FLOOR = £10,000
LUMP_SUM_ALLOWANCE = £268,275
ISA_ANNUAL_ALLOWANCE = £20,000
DIVIDEND_ALLOWANCE = £500
CAPITAL_GAINS_ALLOWANCE = £3,000
SAVINGS_ALLOWANCE_BASIC = £1,000
IHT_NRB = £325,000
IHT_RNRB_PER_PERSON = £175,000
IHT_RNRB_TAPER_START = £2,000,000
IHT_RATE = 40%
HICBC_LOWER = £60,000, HICBC_UPPER = £80,000
INFLATION = 2.5%
CASH_GROWTH = 2.5%
INCOME_GROWTH = 2.5% real
GROWTH_BY_RISK = { cautious: 4%, balanced: 6%, adventurous: 8% }
LIFE_EXPECTANCY = 95
TAX_YEAR = '2025/26'
```

When April 2026 lands, this is the only file to update.

### B3. Scottish bands replace `× 1.03` hack

**File:** `src/lib/compass/projection.ts` — `incomeTaxScottish`

Old code was:
```
if (scottish) tax *= 1.03;
```
Now:
```
SCOTTISH_BANDS = [
  { upperBound: 14_876, rate: 0.19 },   // starter
  { upperBound: 26_561, rate: 0.20 },   // basic
  { upperBound: 43_662, rate: 0.21 },   // intermediate
  { upperBound: 75_000, rate: 0.42 },   // higher
  { upperBound: 125_140, rate: 0.45 },  // advanced
  { upperBound: Infinity, rate: 0.48 }, // top
]
```
Walked band-by-band with the rUK Personal Allowance + taper still applied (PA is reserved by Westminster).

### B5. Salary sacrifice

**File:** `src/lib/compass/projection.ts`

When `salarySacrificeInUse === true`, the user's own pension contribution is deducted from taxable + NI'able income before tax is calculated:
```
sacrificed = useSalarySacrifice ? min(ownContrib, AAcap) : 0
taxableIncome = grossIncome − sacrificed
tax = incomeTax(taxableIncome, scottish)
ni = nationalInsurance(taxableIncome)
```
For higher-rate earners this saves ~14% NI on top of basic-rate tax relief.

---

## 4. Form changes — itemised by screen

### `content/screens/3.3-about-you.md`

New fields (in render order, conditional on `household` selection where noted):

| Field id | Type | Range | Conditional reveal |
|---|---|---|---|
| `scottish_taxpayer` | radio | yes/no | Always |
| `partner_age` | slider | 25–90, default 45 | when `household` includes `partner` |
| `partner_gross_income` | slider | 0–300k, step 5k | when `household` includes `partner` |
| `partner_pension_value` | slider | 0–2m, step 25k | when `household` includes `partner` |

### `content/screens/4.A.3-assets-at-a-glance.md`

| Field id | Type | Range | Conditional reveal |
|---|---|---|---|
| `main_home_value` | slider | £100k–£3m, default £400k | when `main_home` ∈ [own_outright, own_mortgage] |
| `mortgage_balance_amount` | slider | £0–£1.5m, default £150k | when `main_home == own_mortgage` |
| `has_non_mortgage_debt` | radio | yes/no | Always |
| `personal_loans_amount` | slider | £0–£200k | when `has_non_mortgage_debt == yes` |
| `credit_card_amount` | slider | £0–£50k | when `has_non_mortgage_debt == yes` |

The legacy `mortgage_balance` (banded radio) remains in the file but is superseded by the slider when the slider is answered.

### `content/screens/4.A.4-other-property.md`

| Field id | Type | Range | Conditional reveal |
|---|---|---|---|
| `other_property_value` | slider | £0–£5m, default £350k | when `other_property` ∈ [one_other, two_or_more, portfolio] |
| `other_property_mortgage_balance` | slider | £0–£3m | as above |
| `other_property_monthly_rent` | slider | £0–£20k/mo | as above |

### `content/screens/4.E.1-pension-pot.md`

| Field id | Type | Range | Conditional reveal |
|---|---|---|---|
| `has_db_pension` | radio | yes/no/not_sure | Always (when screen fires) |
| `db_pension_annual_income` | slider | £0–£100k/yr | when `has_db_pension == yes` |
| `db_pension_start_age` | slider | 55–70, default 65 | when `has_db_pension == yes` |

### `content/screens/4.E.3-contributions.md`

| Field id | Type | Options |
|---|---|---|
| `salary_sacrifice` | radio | yes / no / not_sure |

### `content/screens/4.E.5-risk-profile.md` (new screen)

| Field id | Type | Options |
|---|---|---|
| `risk_profile` | radio | cautious / balanced / adventurous / no_idea |

The screen has `segments_served: [all]` and no `conditional_logic`, so it fires for everyone.

---

## 5. Visualisation changes

### Net Worth Donut — `NetWorthDonut.tsx`

Slices (in order): Property · Pension · Savings · **ISA · GIA · Other** · Business. The single "Investments" slice was split into ISA / GIA / Other. Slice colours added: `isa = #f97316`, `gia = #fb923c`, `otherAssets = #fbbf24`.

A "less liabilities" row is appended to the legend when liabilities are non-zero. It's outlined in red (`#b91c1c`) and shows the negative total.

### Lifetime Wealth Chart — `LifetimeWealthChart.tsx`

Stack order, bottom to top: ISA → GIA → Savings → Pension Accessible → Pension Inaccessible. ISA gets the orange gradient (`#f97316`); GIA gets the lighter orange (`#fb923c`). Tooltip rows split accordingly, hiding any layer that's zero at that age.

### Balance Strip — `BalanceStrip.tsx`

The Total Liabilities cell now carries a one-line breakdown beneath the headline number when material:
> mortgages £350,000 · loans £8,000 · cards £1,200

### Assumptions footer — `Assumptions.tsx`

Now publishes:
- Risk profile name + matching growth rate
- Cash growth rate
- Inflation
- Real income growth
- State pension full rate + personalised SPA
- DC pension access age
- NI years assumed
- Tax residence (Scotland vs rUK)
- Salary-sacrifice flag (when `yes`)
- Life expectancy
- Tax year

---

## 6. Summary page — `/conversation/summary`

Two changes to address two issues:

**Issue 1: Embedded report rendered unstyled.** Root cause: `compass-theme.css` is imported in `src/app/report/layout.tsx`, so the theme loads on `/report/master/<segment>` but not on `/conversation/summary` (different layout tree). The `.rw-doc` wrapper appeared in the DOM as `className="rw-doc undefined"` with no global styles applied.

**Fix:** `src/app/conversation/summary/CompassReportSection.tsx` now imports `compass-theme.css` directly. The component is self-contained — wherever it's mounted, the theme follows.

**Issue 2: Report buried below marketing chrome.** The 9-page report sat below the teal hero, a "Chart coming soon" placeholder (`GraphSlot`), and the considered list. Users expected the report to lead the page.

**Fix:** `src/app/conversation/summary/SummaryClient.tsx` reorder. After unlock, the order is now:
1. Page header
2. Teal hero ("Your Wealth Report is ready")
3. Save-as-PDF toolbar
4. **Embedded 9-page Compass report** ← leads
5. Considered list (now supporting context, not the lede)
6. Silent gaps
7. Action ladder

`GraphSlot` is rendered only pre-unlock (it's a placeholder; once the user has the real report it would be misleading).

---

## 7. New helper functions (engine API surface)

These are exported from `src/lib/compass/inputs.ts` and `src/lib/compass/projection.ts`. The admin app's content-editing flows will not normally call these directly — they're listed so an agent reading code can understand the value resolution chain.

### From `inputs.ts`

```ts
numericIfPresent(v: unknown): number | undefined
numericToWealthBand(amount: number): WealthBand | 0
lookupRiskProfile(raw: string | undefined): RiskProfile
```

### From `projection.ts`

```ts
resolveAmount(raw: number | undefined, banded: WealthBand | 0 | undefined): number
resolveMonthlySpend(raw: number | undefined, banded: SpendBand | undefined, fallback?: number): number
resolveContribPct(raw: number | undefined, banded: ContribPctBand): number
resolveNiYears(raw: number | undefined, banded: NIYearsBand): number
taperedAnnualAllowance(adjustedIncome: number, thresholdIncome: number): number
applyAnnualAllowanceCap(desired: number, gross: number, employer: number): { permitted, excess, cap }
```

### From `tax-year-2025-26.ts`

```ts
statePensionAgeForBirthYear(birthYear: number): number   // 66 | 67 | 68
pensionAccessAgeForUser(birthYear: number, currentYear?: number): number  // 55 | 57
birthYearFromAge(currentAge: number, currentYear?: number): number
```

---

## 8. Field reference (alphabetical, all live form ids)

This is the runtime `session.answers` key set the engine consumes via `buildCompassInputs`. Sourced from `INPUT_QUESTION_IDS` in `src/lib/compass/inputs.ts`. Use this as the canonical list when authoring screen markdown — the `id:` in your frontmatter must match one of these exactly to be picked up.

| Form id | Engine field | Notes |
|---|---|---|
| `age` | `currentAge` | Slider 25–80 |
| `business_value_band` | `businessValue` | Banded; conditional on business owner |
| `cash_savings_band` | `cashSavings` + `cashSavingsRaw` | Slider, raw value preferred |
| `credit_card_amount` | `creditCardDebtRaw` | Slider, raw only |
| `db_pension_annual_income` | `dbPensionAnnualIncome` | Slider |
| `db_pension_start_age` | `dbPensionStartAge` | Slider |
| `dependency_horizon` | (informational) | |
| `earners_one_or_two` | (informational) | |
| `earnings_protection_scale` | `earningsProtectionConfidence` | 1–5 Likert |
| `employer_pension_pct_band` | `employerPensionContribPct` + `…Raw` | Slider 0–25 |
| `essential_monthly_spend` | `essentialMonthlySpend` | Banded radio |
| `essential_monthly_spend_amount` | `essentialMonthlySpendRaw` | Reserved (slider companion, not yet on form) |
| `estate_band` | `totalEstate` | Banded radio |
| `gia_balance_band` | `giaBalance` + `giaBalanceRaw` | Slider |
| `happy_place` | (informational) | Free text |
| `has_db_pension` | `hasDbPension` | yes/no/not_sure |
| `has_non_mortgage_debt` | (gate only) | yes/no — gates personal_loans + credit_card |
| `held_in_limited_company` | (informational) | |
| `household` | sets `partnerPresent`, `hasDependentChildren`, `hasElderlyParents` | Multi-select |
| `income_amount` | `householdGrossIncomeRaw` | Reserved (slider companion, not yet on form) |
| `income_band` | `householdGrossIncome` | Banded radio |
| `investments_band` | (legacy fallback for `isaBalance` when 4.E.2 didn't fire) | |
| `isa_balance_band` | `isaBalance` + `isaBalanceRaw` | Slider |
| `life_cover_status` | `lifeCoverStatus` | |
| `main_home` | gates `isHomeOwner`, `hasMortgage`, `isRenting` | Radio |
| `main_home_value` | `mainHomeValueRaw` | Slider; replaces estate-band heuristic |
| `monthly_saving_band` | `monthlySavingAmount` + `…Raw` | Slider 0–10k/mo |
| `mortgage_balance` | `mainHomeMortgageBalance` (banded fallback) | Banded radio |
| `mortgage_balance_amount` | `mainHomeMortgageBalanceRaw` | Slider |
| `mortgage_end_age_band` | `mortgageEndAge` + `mortgageEndAgeRaw` | Slider 40–85 |
| `mortgage_monthly_payment_band` | `mortgageMonthlyPayment` + `…Raw` | Slider 0–6k/mo |
| `ni_qualifying_years_band` | `niQualifyingYears` + `niQualifyingYearsRaw` | Slider 0–45 |
| `non_essential_monthly_spend` | `nonEssentialMonthlySpend` | Banded radio |
| `non_essential_monthly_spend_amount` | `nonEssentialMonthlySpendRaw` | Reserved |
| `other_property` | gates `otherPropertyValue` band | Radio |
| `other_property_mortgage_balance` | `otherPropertyMortgageBalanceRaw` | Slider |
| `other_property_monthly_rent` | `otherPropertyMonthlyRentRaw` | Slider |
| `other_property_value` | `otherPropertyValueRaw` | Slider |
| `own_pension_pct_band` | `ownPensionContribPct` + `…Raw` | Slider 0–25 |
| `partner_age` | `partnerAge` | Slider |
| `partner_gross_income` | `partnerGrossIncome` | Slider |
| `partner_pension_value` | `partnerPensionValue` | Slider |
| `passing_on_intent` | sets `homeLeftToDescendants` | |
| `pension_pots` | gates pension-band lookup | Radio |
| `pension_total_band` | `totalPensionValue` (legacy) | Banded radio |
| `pension_total_value` | `totalPensionValue` + `totalPensionValueRaw` | Slider 0–2m |
| `personal_loans_amount` | `personalLoansRaw` | Slider |
| `retirement_feel` | (informational) | |
| `retirement_spend_ratio` | `retirementSpendRatio` | less / same / more |
| `risk_profile` | `riskProfile` | cautious / balanced / adventurous / no_idea |
| `role` | (informational, business owner branch) | |
| `salary_sacrifice` | `salarySacrificeInUse` | yes/no/not_sure |
| `scottish_taxpayer` | `isScottishTaxpayer` | yes/no |
| `state_pension_amount_band` | `statePensionExpectedAmount` | full_rate / partial / none / no_idea |
| `state_pension_awareness` | `statePensionKnown` | |
| `succession` | (informational) | |
| `target_retirement_age` | `targetRetirementAge` | Slider |
| `will_and_lpa_status` | sets `willInPlace`, `lpaInPlace` | Multi-select |
| `work_status` | gates business-owner branch | |
| `youngest_child_band` | (drives child-cost ramp-down — partial) | |

---

## 9. What was deliberately NOT done (Sprint 5 / 6 — skipped)

The following items were considered and rejected because the report is a PDF lead-gen artefact, not a website. The desktop app should not pursue them without a fresh design conversation.

| Item | Why skipped |
|---|---|
| Stochastic / Monte Carlo bands on the projection | A clean deterministic line tells a stronger story for a lead-gen PDF; percentile bands add visual noise and require interpretation. |
| In-report sliders (inflation, retirement age, care toggle, risk override) | Interactive controls are incompatible with a static PDF. |
| One-off events (downsize, inheritance, business sale, university fees) | Adds significant form length for a small fraction of users; better discovered on the planner call. |
| Sustainable-withdrawal upgrade (replace 25× rule with wrapper-aware model) | Real-advice territory; the planner owns this conversation in person. |
| Lump Sum Allowance enforcement on tax-free cash | Currently informational; full enforcement crosses into formal advice. |

---

## 10. Known issues + outstanding items

1. **`/conversation/summary` page is large.** With 9 fixtures pre-rendered server-side, the embedded `.rw-doc` is ~40k px tall, which makes browser screenshots / Save-as-PDF slow. Consider rendering only the resolved segment in `page.tsx` rather than every fixture. Trade-off: loses the demo/dev-mode fallback that walks all 9 segments.
2. **`ReportView.tsx` ESLint warnings.** Pre-existing `react-hooks/static-components` failures at lines 104 / 160 / 180 (component declared during render). Three errors, three warnings. Not introduced by this work but would block CI if strict.
3. **`mainHomeValueRaw` only populated when `main_home` indicates ownership.** `inputs.ts` line ~563. Same gating for `mortgageBalanceRaw`. Renting / with-family users get `undefined`, and the donut shows no property slice — correct behaviour but means the engine has no fallback.
4. **State pension scaling is conservative.** The user's stated `state_pension_amount_band` is multiplied by `min(1, niYearsHeld / 35)`. If a user reports `full_rate` but has fewer than 35 NI years, the pension is scaled down. This is intentional but can surprise users — flag in copy if the planner agent finds users confused.
5. **Salary sacrifice doesn't yet model NI relief on the employer side.** Only the employee NI saving is captured. Employer NI saving (typically passed back to employee in many corporate schemes) is not modelled. Conservative direction.
6. **Birth year approximation drifts ±1 year.** Form collects age, not DOB. SPA lookup is usually fine but edge cases at year boundaries (e.g. 1960 / 1977 / 1978) may resolve to the wrong SPA.

---

## 11. How to verify changes

### Type-check
```
cd master_template
npx tsc --noEmit   # exits 0 with no output
```

### Content build (regenerate catalogue from screen markdown)
```
npm run content:build   # 33 screens, 0 voice warnings expected
```

### Dev server smoke test
```
npm run dev   # serves :5000
```
Then visit:
- `/conversation/summary?segment=S2` — confirm the report leads the page, cover page has the teal gradient, donut splits ISA/GIA, chart shows separate orange layers.
- `/report/master/S2` — confirm the standalone report (canonical "neat PDF" view).

### What to re-test after touching engine code
- Each of 9 fixture personas (`S1`–`S9`) should produce a non-zero gauge score and a non-empty donut.
- `npm run content:build` after any screen markdown edit.
- `npx tsc --noEmit` after any code edit.

---

## 12. Where to look first (orientation for an editor agent)

| Need to … | Look at |
|---|---|
| Add a new question to an existing screen | `content/screens/<screen>.md` frontmatter `inputs:` array. Then `npm run content:build`. |
| Wire a new field through the engine | `src/lib/compass/inputs.ts` (add to `INPUT_QUESTION_IDS`, populate in `buildCompassInputs`); `src/lib/compass/types.ts` (add to `CompassInputs`); `src/lib/compass/projection.ts` (consume in projection or balance sheet). |
| Adjust a tax constant for April 2026 | `src/lib/compass/tax-year-2025-26.ts` — single file. |
| Change a chart's colour / layer order | `src/components/compass/LifetimeWealthChart/LifetimeWealthChart.tsx` (areas) or `src/components/compass/NetWorthDonut/NetWorthDonut.tsx` (slices). |
| Change what's published in the methodology footer | `src/lib/compass/projection.ts` — `buildAssumptions` function. Then `src/components/compass/Assumptions/Assumptions.tsx` for the rendered text. |
| Reorder the summary page | `src/app/conversation/summary/SummaryClient.tsx` — JSX after `unlocked ? (` (line ~489). |
| Update tile-scoring thresholds | `src/lib/compass/tile-scoring.ts` lines 41–86 (local constants). Tax-related thresholds come from `tax-year-2025-26.ts`. |

---

End of handoff.
