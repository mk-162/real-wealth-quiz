---
id: report.methodology
kind: global
title: Methodology page — PDF report last page
description: >
  Every assumption used in generating this report, the source for each,
  and the regulatory disclaimers. Renders as the final page of the PDF.
  Plain English throughout. Every number is bracketed with its assumption.
  CFP and compliance sign-off required before shipping.
compliance_status: draft
---

# Body

## Page heading

How this report was built — and what it doesn't tell you.

## Opening paragraph

This report was generated from the answers you gave in the conversation. Every number you see is an estimate built on the assumptions listed below. None of it is a projection of your personal finances. None of it constitutes financial advice. It is a starting point — the kind of picture a planner would sketch on a first call to make sure they're asking the right questions.

## Section 1 — The Financial Health Score

### What it measures
The score compares your projected liquid wealth at your target retirement age against the wealth you would need to fund your retirement spending — net of your guaranteed retirement income — for every year between retirement and our planning horizon of age 95.

**Score = projected liquid wealth at retirement ÷ wealth needed × 100**

A score of 100 means you are exactly on track, on the assumptions below. Above 100 means a buffer. Below 100 means a gap.

### How we calculate "wealth needed"

We work it out in three steps:

1. **Modelled retirement spend** = your stated current spending × a multiplier based on the retirement-spend question you answered:
   - "I'll need a bit less than today" → **70%** of your current spending
   - "Roughly the same as now" → **85%** of your current spending. We use 85% rather than 100% because real-world retirees almost always spend less than they expect: mortgage typically gone, no commute, no work-related costs, lower discretionary spending. Choosing "the same as today" therefore models a moderate reduction by default; if you genuinely expect to spend the same, choose "a bit more".
   - "I'll need a bit more than today" → **110%** of your current spending.
2. **Self-funded shortfall** = modelled retirement spend − your guaranteed retirement income (the full new state pension pro-rated to your NI qualifying years, plus any defined-benefit pension you have).
3. **Wealth needed** = self-funded shortfall × number of years from your target retirement age to age 95.

In other words, the model asks: "what pot would you need to bridge the gap between your retirement spending and your guaranteed income, every year for the rest of your planning horizon?" If your guaranteed income covers your spend, the wealth needed is zero — the gauge shows you as comfortably funded.

### What "projected liquid wealth at retirement" means
We model your current liquid assets — pensions, ISAs, investments, and cash savings — growing at your stated risk profile's growth rate (see Section 3), with your stated monthly saving contribution added each year until retirement. Illiquid assets (the family home, a business, inherited property) are excluded from the projection unless you told us they are part of the retirement plan.

## Section 2 — How tax is applied to your projection

This section explains exactly which UK taxes the model applies, in which year, and to which income source. It is the longest section in this methodology because tax is the single biggest driver of how much spendable cash a retired client actually has — and historically the area planning illustrations have under-modelled.

For each rule below: the **what** (one-line statement), the **why** (the regulatory or industry rationale), and a **how it shows up** note explaining how it changes the projected wealth on the chart.

### 2.1 Income tax and National Insurance during your working years

**What.** While you are working, your gross income is subject to UK income tax (under either the rest-of-UK or Scottish bands, depending on your tax residence) and Class 1 National Insurance. The Personal Allowance of £12,570 tapers down £1 for every £2 of income above £100,000, and is fully withdrawn at £125,140.

**Why.** These are the live HMRC 2025/26 rates. The PA taper is the rule that makes income between £100k and £125,140 effectively taxed at a 60% marginal rate.

**How it shows up.** The model uses your *net* take-home income (after tax and NI) to compare against your stated spending and decide how much surplus you save each year.

### 2.2 Salary sacrifice on pension contributions

**What.** If you indicated salary sacrifice, your own pension contribution is deducted from your gross salary before income tax and NI are calculated.

**Why.** Salary sacrifice is the most tax-efficient way to fund pensions in the UK because it reduces both income tax and the NI base. We model it where you've told us it applies.

**How it shows up.** Your taxable salary appears slightly lower in the model than your headline gross figure — and your net take-home is slightly higher than it would be if the same contribution were paid from net.

### 2.3 Pension Annual Allowance and the high-earner taper

**What.** Your gross pension contributions (yours plus your employer's) are capped at £60,000 per year. For users with adjusted income above £260,000, that £60k cap tapers down £1 for every £2 over the threshold, with a floor of £10,000.

**Why.** This is HMRC's Annual Allowance and the tapered AA introduced for high earners. The engine prevents users from over-contributing in a way the tax system would not actually permit.

**How it shows up.** A high earner attempting to contribute beyond their tapered limit sees their pension growth reduced to the permitted figure, with the excess effectively becoming taxable income.

### 2.4 ISA contribution cap

**What.** ISA contributions are capped at £20,000 per year, with anything you intend to save above that amount routed to your General Investment Account (GIA) instead.

**Why.** £20,000 is the statutory Adult ISA limit. Excess money cannot legally enter an ISA wrapper — in the real world it would land in a taxable account.

**How it shows up.** A heavy saver's projected ISA balance is lower than a naïve "monthly saving × 12" calculation would suggest, and their projected GIA balance is higher.

### 2.5 Money Purchase Annual Allowance (MPAA)

**What.** If you have flexibly accessed your pension (taken income drawdown or UFPLS) *and* are still working, your pension Annual Allowance drops to £10,000 for the rest of your career.

**Why.** This is HMRC's MPAA — designed to prevent recycling of pension income into fresh tax-relieved contributions. We apply it when you flag it on the form.

**How it shows up.** An advice-led client who has triggered MPAA sees materially lower pension growth in their final working years compared with someone who has not.

### 2.6 Income tax on state pension and defined-benefit pension

**What.** Your full new state pension (£11,502 in 2025/26, pro-rated to your NI qualifying years) and any defined-benefit pension you receive are added to your taxable income each year and taxed at your marginal income tax rate. National Insurance is not applied — neither source is NI'able under UK rules.

**Why.** State pension and DB pension are both taxable income under UK law. Treating them as net cash without tax (as some illustration tools do) materially overstates your spendable income in retirement.

**How it shows up.** A retired client with a £20,000 DB pension and the full state pension sees their guaranteed retirement income come in at around £27,700 net per year (2025/26 rUK rates), not £31,500 gross.

### 2.7 The 25% pension tax-free portion and the Lump Sum Allowance

**What.** Each pension drawdown is split: 25% is tax-free, 75% is taxable income at your marginal rate. The 25% tax-free portion is capped, *across your lifetime*, at £268,275 — HMRC's Lump Sum Allowance (LSA). Once you have taken £268,275 in cumulative tax-free cash, every further pension withdrawal is taxed in full.

**Why.** The 25% rule is the live UK regime introduced when the Lifetime Allowance was abolished in April 2024. The LSA cap is the explicit numerical replacement. It bites materially for clients with pension pots above approximately £1.073 million (where 25% of the pot would otherwise exceed the cap).

**How it shows up on the chart.**
- A client with a £900,000 pension pot enjoys the full 25% tax-free benefit on every withdrawal — they never hit the cap.
- A client with a £2,000,000 pension pot effectively gets only 13.4% of their withdrawals tax-free (£268,275 ÷ £2,000,000), because the cap binds. Their drawdown phase is more heavily taxed than a "naïve 25%" model would suggest.

This is the single biggest tax effect for high-net-worth clients.

### 2.8 Pension drawdown pattern — flexi-access, pro-rata

**What.** The model assumes you draw your pension via flexi-access drawdown, with the 25% tax-free portion taken pro-rata across years (rather than as a single front-loaded lump sum).

**Why.** Flexi-access is the default behaviour of every modern SIPP and personal pension product, and matches how the great majority of HNW clients actually take their pensions in practice. UFPLS-front-loaded patterns are less common; we have not modelled them in this version.

**How it shows up.** Your projection shows tax growing gradually as you draw down, rather than a single large tax-free year followed by 100%-taxed years.

### 2.9 Capital Gains Tax on GIA withdrawals

**What.** Withdrawals from your General Investment Account are taxed under CGT. The annual exempt amount of £3,000 is applied first; gains above that are taxed at 18% if your other income that year falls in the basic-rate band, or 24% if it falls in the higher-rate band. CGT is split correctly when a single year's gain straddles the basic-to-higher boundary.

**Why.** These are HMRC's 2025/26 CGT rates. CGT is a real cost for retirees drawing from GIA — historically illustration tools have ignored it, which overstates the spendable wealth from this pot.

**Cost-basis assumption.** Real CGT depends on what you originally paid for your investments (the "cost basis"). We do not collect cost basis on the form — the question would add length without meaningfully improving accuracy for typical buy-and-hold portfolios. Instead, we assume **50% of every GIA withdrawal is taxable gain and 50% is return of capital**. This is the industry-standard simplification used by leading planning tools, and is mid-range for a long-held diversified portfolio. Recently purchased holdings would have a lower gain proportion in reality; very long-held holdings a higher one.

**How it shows up.** Each GIA drawdown is "grossed up" so that the *net* cash you receive after CGT matches the net spend you need. The CGT cost shows in the per-year tax figure on the projection.

### 2.10 Cash and ISA — tax-free at the point of withdrawal

**What.** Withdrawals from your cash savings and ISA are not subject to any tax in the model.

**Why.** ISA wrappers are tax-free under UK law. Interest on cash savings is in principle taxable, but the Personal Savings Allowance (£1,000 for basic-rate taxpayers, £500 for higher-rate) covers the great majority of typical-balance savers; we have absorbed any residual PSA-leakage into the cash growth rate (2.5%) rather than modelling it as a separate line.

**How it shows up.** Cash and ISA pots are drawn down at face value — every £1 withdrawn is £1 of spendable income.

### 2.11 What this section does not model

We have deliberately left the following out of the projection because modelling them would either (a) demand inputs the form does not collect, (b) require speculative assumptions that would not improve accuracy, or (c) be redundant given the abstracted growth rates:

- **Dividend tax on GIA holdings** — partially absorbed into the growth rate; the £500 dividend allowance is not separately tracked.
- **Personal Savings Allowance on cash interest** — absorbed into the cash growth rate.
- **Triple-lock on state pension** — state pension is held constant in real terms across the horizon. Real-world increases roughly track inflation, so the real-terms approach is already close to right.
- **Sequence-of-returns risk** — the model uses a constant real growth rate, not a stochastic one. A bad sequence of returns in the early years of drawdown would damage real outcomes more than the model shows.
- **Portfolio glide path** — the same growth rate applies in every year of the projection. Real portfolios typically de-risk into bonds during retirement, lowering expected returns.
- **Care costs and inheritance gifts** — flagged separately on the protection and IHT tiles; not part of the cash-flow projection.

### 2.12 Worked example — how the rules interact in a typical retirement year

For transparency, here is how a single retirement year is computed for a client who has reached State Pension Age and is drawing from multiple pots.

**Inputs (2025/26 rUK):**
- State pension: £11,502 (gross)
- DB pension: £20,000 (gross)
- Pension pot: £1,800,000; LSA fully unused at start of year
- Living spend in retirement: £55,000 net for the year
- No work income

**Step-by-step calculation:**

1. **Guaranteed income tax** (Section 2.6). Total taxable from state + DB = £11,502 + £20,000 = £31,502. Income tax: PA covers £12,570; basic-rate slice on £18,932 × 20% = £3,786.40. Net guaranteed income: £27,715.60.
2. **Shortfall to fund from pots:** £55,000 − £27,716 = £27,284.
3. **Drawdown order** (Section 2.7–2.9). Pots are drawn in order: cash → GIA → pension → ISA. Assume here cash and GIA are exhausted; the entire shortfall is funded from pension.
4. **Pension gross-up** (Section 2.7). Need to deliver £27,284 net from the pension. Solve iteratively for gross *G* such that 25% of *G* is tax-free, 75% is taxed (stacked on the £31,502 already in the running tax bracket): the answer is approximately **£33,620**. Of that, £8,406 is tax-free (LSA usage) and £25,218 is taxed at the marginal rate, producing about £6,335 of additional income tax.
5. **Total tax for the year:** £3,786 (on guaranteed income) + £6,335 (on pension drawdown) = **£10,121**.
6. **LSA used so far:** £8,406. Cumulative LSA running total ratchets up year-on-year; once it reaches £268,275, all subsequent pension drawdowns are 100% taxable.
7. **Pension balance change:** −£33,620 (gross drawdown) before applying the year's investment growth. The pot then grows at the user's stated risk-profile rate.

This same logic runs every year of the projection. The complete decisions log and methodology rationale are documented in `PROJECTION_TAX_FIX_PLAN.md` (held internally for compliance audit).

## Section 3 — Growth and inflation assumptions

All projection numbers are presented in **today's pounds** (real terms). Income, expenses, and investment growth rates are all expressed net of inflation. The model does not separately compound inflation against expenses; instead, all growth rates published below are *real* (above-inflation) figures.

**Used by the projection engine** — every number on the chart and gauge depends on these:

| Assumption | Value used | Source / basis |
|---|---|---|
| Cautious growth rate | 4.0% per year, **real (after inflation)** | Long-run cautious multi-asset allocation |
| Balanced growth rate (default) | 6.0% per year, **real (after inflation)** | Long-run balanced multi-asset allocation |
| Adventurous growth rate | 8.0% per year, **real (after inflation)** | Long-run higher-equity allocation |
| Cash growth rate | 2.5% per year, **real** | See Section 5 caveats — this is currently set high relative to historical real cash returns, and is under review |
| Real income growth (working years) | 2.5% per year, real | Long-run UK private-sector earnings, above inflation |
| Inflation rate (disclosed; not directly applied to expenses) | 2.5% per year | Bank of England 2% target plus 0.5% buffer |
| Life expectancy (planning horizon) | 95 years | ONS 2022-based population projections, upper planning bound |
| State pension (full new rate, 2025/26) | £11,502 per year | DWP published rate, April 2025 uprating |
| State pension age | 67 (typical for clients born 1961–1977); 66 if born before 1960; 68 if born 1977 onwards | State Pension Act 2014 |
| Pension access age (NMPA) | 55 today; 57 from 6 April 2028 | Finance Act (Number 2) 2014 |
| Income tax — personal allowance | £12,570 | HMRC, 2025/26 tax year |
| Income tax — basic rate band width | £37,700 (band: £12,571–£50,270) at 20% | HMRC, 2025/26 tax year |
| Income tax — higher rate band width | £74,870 (band: £50,271–£125,140) at 40% | HMRC, 2025/26 tax year |
| Income tax — additional rate | 45% above £125,140 | HMRC, 2025/26 tax year |
| Personal allowance taper | Begins at £100,000; fully withdrawn at £125,140 | HMRC, 2025/26 |
| Scottish income tax bands | Six bands: starter (19%), basic (20%), intermediate (21%), higher (42%), advanced (45%), top (48%) | Scottish Government, 2025/26 |
| National Insurance — primary threshold | £12,570 | HMRC, 2025/26 |
| National Insurance — upper earnings limit | £50,270 | HMRC, 2025/26 |
| National Insurance — main rate (Class 1, employee) | 8% on earnings between PT and UEL | HMRC, 2025/26 |
| National Insurance — higher rate | 2% on earnings above UEL | HMRC, 2025/26 |
| ISA annual allowance | £20,000 | HMRC, 2025/26 |
| Pension annual allowance | £60,000 (standard) | HMRC, 2025/26 |
| Annual allowance taper threshold | Starts at £260,000 adjusted income; floor £10,000 | HMRC, 2025/26 |
| Money-purchase annual allowance (MPAA) | £10,000 (if triggered by flexibly accessing pension) | HMRC, 2025/26 |
| Lump Sum Allowance (LSA) | £268,275 lifetime cap on tax-free pension lump sums | Finance Act 2024 |
| Capital gains tax annual exempt amount | £3,000 | HMRC, 2025/26 |
| Capital gains tax rate (basic-rate band) | 18% on chargeable gains above the allowance | HMRC, 2025/26 (uplifted by Autumn Budget 2024 from 30 Oct 2024) |
| Capital gains tax rate (higher-rate band) | 24% on chargeable gains above the allowance | HMRC, 2025/26 (uplifted by Autumn Budget 2024 from 30 Oct 2024) |
| GIA cost-basis assumption | 50% of every withdrawal treated as taxable gain | Real Wealth methodology decision (§5.1 of `PROJECTION_TAX_FIX_PLAN.md`) |
| Inheritance tax nil-rate band | £325,000 per person | HMRC, frozen to April 2030 |
| Residence nil-rate band | £175,000 per person | HMRC, frozen to April 2030; tapers above £2m estate |
| RNRB taper | £1 of relief lost per £2 of estate above £2m; fully withdrawn at £2.35m per person | HMRC |
| Pensions and IHT from April 2027 | Defined-contribution pensions expected to fall inside the estate for IHT | Autumn 2024 Budget; draft legislation expected 2025 |

**For context only — not applied to this projection**:

| Assumption | Value | Why we list it |
|---|---|---|
| Dividend allowance | £500 | Dividend tax on GIA holdings is absorbed into the modelled growth rate, not separately tracked |
| Personal Savings Allowance | £1,000 (basic) / £500 (higher) / £0 (additional) | Tax on cash interest is absorbed into the cash growth rate |
| BADR rate (Business Asset Disposal Relief) | 14% to April 2026; 18% from April 2026 | The projection does not model business sales; this rate matters only when a planner is sketching a potential exit alongside the projection |
| Corporation tax | 25% main rate | The projection does not model business income; included for completeness when the planning conversation touches retained-earnings strategies |

## Section 4 — How we mapped your answers to numbers

Your answers used bands, not exact figures. We mapped each band to a midpoint for calculation purposes. Where the form offered a slider rather than a band (e.g. exact income), the engine uses the slider value directly and ignores the band midpoint. Where you skipped a question or chose "prefer not to say", we substitute a sensible default value so the report can still render — your planner will pick this up in the first conversation and rerun the projection with your actual figures. Defaults applied silently; if a critical figure is unknown, the planner will tell you.

The values below are the exact midpoints the engine uses, sourced from `master_template/src/lib/compass/projection.ts`.

**Household gross income**

| Band you selected | Midpoint used |
|---|---|
| Under £50,000 | £35,000 |
| £50,000–£100,000 | £75,000 |
| £100,000–£125,000 | £112,500 |
| £125,000–£200,000 | £160,000 |
| £200,000 or more | £275,000 |

**Essential / non-essential monthly spend** (each spend question maps to the same midpoints)

| Band you selected | Midpoint used (per month) |
|---|---|
| Under £1,500 | £1,000 |
| £1,500–£3,000 | £2,250 |
| £3,000–£5,000 | £4,000 |
| £5,000–£8,000 | £6,500 |
| £8,000 or more | £10,000 |

**Wealth bands** (used for pension total, ISA balance, GIA balance, cash savings, total estate, business value, other property, mortgage balances, personal loans, credit-card debt — every pound figure on the form that asked for a band rather than an exact number)

| Band you selected | Midpoint used |
|---|---|
| Under £25,000 | £12,500 |
| £25,000–£100,000 | £62,500 |
| £100,000–£250,000 | £175,000 |
| £250,000–£500,000 | £375,000 |
| £500,000–£1m | £750,000 |
| £1m–£2m | £1,500,000 |
| £2m–£3m | £2,500,000 |
| £3m or more | £4,000,000 |

**Pension contribution percentage** (employer contribution and own contribution use the same midpoints)

| Band you selected | Midpoint used |
|---|---|
| 0–3% | 1.5% |
| 3–5% | 4% |
| 5–10% | 7% |
| 10% or more | 12% |
| "I'm not sure" | 3% |

**National Insurance qualifying years**

| Band you selected | Midpoint used |
|---|---|
| Fewer than 10 years | 5 years |
| 10–20 years | 15 years |
| 20–30 years | 25 years |
| 30–35 years | 33 years |
| 35 or more years | 35 years (full state pension) |

## Section 5 — What this report cannot show

**Your exact numbers.** We worked from bands. The real figures — your pension values, mortgage balance, investment portfolio costs, protection policy terms — will shift every number on this page. That is what the first planning conversation is for.

**Future changes in your circumstances.** Inheritance, divorce, a new dependent, a business sale, a health event — none of these are in the model. Life changes the plan.

**Tax law changes.** We have used 2025/26 rates and the best available information on forthcoming changes (BADR rates, pensions IHT). Tax law changes every Budget. The plan needs to change with it.

**Investment returns.** We used a balanced-growth assumption of 6% **real** (after inflation), which is roughly 8.5% nominal at our 2.5% inflation assumption. Markets do not grow smoothly at 6% every year. In the real world, sequence of returns — particularly in the early years of drawdown — matters significantly more than the average return. A bad sequence of returns in the first few years of retirement can damage long-run outcomes far more than a slightly lower average return would suggest.

**Cash returns.** The model currently assumes cash grows at 2.5% real (≈ 5% nominal). This is high relative to the long-run real return on instant-access cash, which is typically near 0% real over decades. The figure is under internal review and may be lowered in a future version. If you have a large cash position, the modelled cash trajectory is more optimistic than reality.

**Costs.** We have not deducted adviser fees, platform charges, or fund management costs from the projection. Your all-in annual cost (typically 0.7%–2.0%) will reduce the terminal value. We flagged this where it is material; ask your planner to show you the all-in figure as a single number.

**Lump Sum Allowance history.** The model assumes your full £268,275 Lump Sum Allowance is available at the start of the projection. If you have previously taken any tax-free lump sum from a pension (for example, on retiring from a previous employer), the actual tax cost of your future drawdowns will be higher than shown here. Tell your planner if this applies to you.

**GIA cost basis.** Our Capital Gains Tax calculation assumes 50% of every withdrawal from your General Investment Account is taxable gain. Real CGT depends on what you originally paid for your holdings — for very recently purchased investments the gain proportion is lower (overstating CGT here), and for very long-held investments it is higher (understating CGT here). On a typical buy-and-hold portfolio over 10–20 years, 50% is close to the truth.

**Front-loaded tax-free lump sums.** The model assumes you take your 25% tax-free pension portion in even slices across your retirement (the standard flexi-access drawdown pattern). If your planner advises you to take the entire £268,275 tax-free in year one — sometimes done to fund a known large early-retirement cost — your actual cash position would differ from the chart. Discuss this with your planner before acting on the projection.

**State pension growth.** The state pension is held constant in real terms across the projection. In practice the triple-lock guarantees state pension increases by the highest of inflation, earnings growth, or 2.5% each year — meaning the state pension genuinely grows in *real* terms in any year where earnings growth or 2.5% beats inflation. Holding it flat in real terms is conservative on average but slightly understates state-pension income for clients with long retirements ahead.

**Fiscal drag — frozen tax thresholds.** The model treats every UK tax threshold as constant in real terms. In current legislation, these are **frozen in nominal terms** until various dates: the Personal Allowance (£12,570), basic-rate limit (£50,270) and additional-rate threshold (£125,140) are frozen until April 2028; the IHT nil-rate band (£325,000) and residence nil-rate band (£175,000) are frozen until April 2030; and the Lump Sum Allowance (£268,275), CGT annual allowance (£3,000), ISA allowance (£20,000), Annual Allowance (£60,000) and MPAA (£10,000) have no published inflation-linking. As inflation runs through the freeze period, these thresholds shrink in real terms — a phenomenon known as fiscal drag. The model implicitly assumes future governments will inflation-link the thresholds once current freezes end, which is optimistic. The practical effect is that the projection **understates retirement-phase tax** by roughly £1,000–£3,000 per year for HNW clients in the years where bands are still frozen, compounding over time. Discuss with your planner if you have significant pension income across the freeze period.

**Mortgage payments held flat in real terms.** Your mortgage payment is treated as a constant cost in today's pounds for the whole mortgage term. In reality a fixed-rate mortgage is fixed in *nominal* pounds, so its real cost falls each year with inflation. The model therefore **overstates** housing costs in the later years of your mortgage — by the time the term ends, today's £2,000/month payment would be worth roughly £1,560/month in today's purchasing power, but the model still books it at £2,000.

**Cost of living held flat in real terms.** Your essential and non-essential spending is treated as a single annual figure that doesn't change across the projection (other than a one-off adjustment at retirement based on your "less / same / more" answer). Real-world spending is rarely flat: many clients see a U-shaped curve (busier and more expensive in early retirement, quieter mid-retirement, then a sharp rise in late life if care is needed). In particular, **late-life care costs are not modelled** — UK domiciliary care averages around £25,000–£40,000 a year, residential care £40,000–£60,000, and specialist dementia care £80,000+ a year, typically incurred in the last 2–5 years of life. None of this is in the chart. If care funding is a concern for you or a partner, treat it as a separate planning conversation, not something this projection covers.

## Section 6 — Regulatory disclosures

### Not financial advice

This report is for general information purposes only. It does not constitute a personal recommendation, financial advice, or a regulated investment recommendation within the meaning of the Financial Services and Markets Act 2000. The information presented is illustrative. No action should be taken on the basis of this report without first taking regulated advice from a qualified financial planner.

### About Real Wealth Partners Ltd

Real Wealth Partners Ltd is authorised and regulated by the Financial Conduct Authority (FRN 1037186). Registered in England and Wales, company number 16498380. Registered office: Office 1, First Floor, 14–18 Tib Lane, Manchester, M2 4JB. A wholly owned subsidiary of Real Wealth Group Ltd.

### Data

The answers you provided are held by Real Wealth Partners Ltd in accordance with our Privacy Notice (available at realwealth.co.uk/privacy). We do not share your personal data with third parties outside the Real Wealth Group without your consent.

### Tax year

All rates, allowances, and thresholds in this report are for the 2025/26 tax year unless otherwise stated. This report does not automatically update when rates change.

### Scottish taxpayers

If you pay income tax under Scottish rates, the model applies all six Scottish income tax bands explicitly: starter (19%), basic (20%), intermediate (21%), higher (42%), advanced (45%) and top (48%). The Personal Allowance is reserved by Westminster and tapers from £100,000 in line with the rest-of-UK rules; the £125,140 cliff applies. The same band structure is applied to retirement-phase income, including state pension, defined-benefit pension, and the taxable 75% portion of pension drawdowns.
