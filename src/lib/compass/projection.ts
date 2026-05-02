/**
 * Compass projection engine.
 *
 * Ported from C:/AI_Project/Compass-Report-Kit/engine/projection.ts (April 2026)
 * with the following additions for the Real Wealth app:
 *   - `targetCoverage` score driving the Page-1 gauge (replaces the legacy 0-100 ring)
 *   - drawdown-mode reinterpretation for already-retired clients
 *   - exports for each sub-step so the preview route can display intermediate values
 *
 * Philosophy: map each banded input to a disclosed midpoint, then run a simple
 * annual compounding model through to life expectancy. No drawdown strategies,
 * no tax optimisation, no second-order effects. This is NOT a financial plan;
 * it's a disclosure-framed illustration for a discovery form.
 */

import type {
  CompassInputs,
  BalanceSheet,
  ProjectionYear,
  CompassReport,
  WealthBand,
  IncomeBand,
  SpendBand,
  ContribPctBand,
  NIYearsBand,
  MortgageEndBand,
  RiskProfile,
} from './types';
import {
  PERSONAL_ALLOWANCE,
  BASIC_RATE_LIMIT,
  HIGHER_RATE_LIMIT,
  PA_TAPER_START,
  RUK_BASIC_RATE,
  RUK_HIGHER_RATE,
  RUK_ADDITIONAL_RATE,
  SCOTTISH_BANDS,
  NI_PRIMARY_THRESHOLD,
  NI_UPPER_EARNINGS_LIMIT,
  NI_MAIN_RATE,
  NI_HIGHER_RATE,
  STATE_PENSION_FULL,
  STATE_PENSION_FULL_QUALIFYING_YEARS,
  statePensionAgeForBirthYear,
  pensionAccessAgeForUser,
  birthYearFromAge,
  ANNUAL_ALLOWANCE,
  ANNUAL_ALLOWANCE_TAPER_THRESHOLD,
  ANNUAL_ALLOWANCE_TAPER_ADJUSTED_INCOME,
  ANNUAL_ALLOWANCE_TAPERED_FLOOR,
  MPAA_LIMIT,
  LUMP_SUM_ALLOWANCE,
  ISA_ANNUAL_ALLOWANCE,
  CAPITAL_GAINS_ALLOWANCE,
  CGT_BASIC_RATE,
  CGT_HIGHER_RATE,
  INFLATION,
  CASH_GROWTH,
  INCOME_GROWTH,
  GROWTH_BY_RISK,
  LIFE_EXPECTANCY,
  TAX_YEAR,
} from './tax-year-2025-26';

// -----------------------------------------------------------------------------
// Band → midpoint maps (disclosed in assumptions)
// -----------------------------------------------------------------------------

export const WEALTH_MID: Record<WealthBand | '0', number> = {
  '0': 0,
  '<25k': 12_500,
  '25-100k': 62_500,
  '100-250k': 175_000,
  '250-500k': 375_000,
  '500k-1m': 750_000,
  '1-2m': 1_500_000,
  '2-3m': 2_500_000,
  '3m+': 4_000_000,
};

export const INCOME_MID: Record<IncomeBand, number> = {
  '<50k': 35_000,
  '50-100k': 75_000,
  '100-125k': 112_500,
  '125-200k': 160_000,
  '200k+': 275_000,
};

export const SPEND_MID_MONTHLY: Record<SpendBand, number> = {
  '<1.5k': 1_000,
  '1.5-3k': 2_250,
  '3-5k': 4_000,
  '5-8k': 6_500,
  '8k+': 10_000,
};

export const CONTRIB_PCT_MID: Record<ContribPctBand, number> = {
  '0-3': 1.5,
  '3-5': 4,
  '5-10': 7,
  '10+': 12,
  'unsure': 3,
};

export const NI_YEARS_MID: Record<NIYearsBand, number> = {
  '<10': 5,
  '10-20': 15,
  '20-30': 25,
  '30-35': 33,
  '35+': 35,
};

export function band(v: WealthBand | 0 | undefined): number {
  if (v === 0 || v === undefined) return 0;
  return WEALTH_MID[v];
}

/**
 * Prefer the raw numeric value if it's a finite number; otherwise fall back
 * to the band midpoint. This is the A1 "stop re-banding sliders" plumbing —
 * sliders feed exact £ figures, bands keep working for legacy / radio inputs.
 */
export function resolveAmount(raw: number | undefined, banded: WealthBand | 0 | undefined): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
  return band(banded);
}

/**
 * Same as `resolveAmount` but for monthly £ spend bands.
 */
export function resolveMonthlySpend(raw: number | undefined, banded: SpendBand | undefined, fallback: number = 0): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
  if (banded === undefined) return fallback;
  return SPEND_MID_MONTHLY[banded];
}

/**
 * Resolve a contribution percentage (employer / own pension contribution).
 * Sliders give 0–25, bands give midpoints. Returned as a percentage (e.g. 5 = 5%).
 */
export function resolveContribPct(raw: number | undefined, banded: ContribPctBand): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
  return CONTRIB_PCT_MID[banded];
}

/**
 * Resolve NI qualifying years — slider 0–45 preferred over band midpoint.
 */
export function resolveNiYears(raw: number | undefined, banded: NIYearsBand): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
  return NI_YEARS_MID[banded];
}

// -----------------------------------------------------------------------------
// UK tax-year constants live in tax-year-2025-26.ts (single source of truth).
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Balance sheet
// -----------------------------------------------------------------------------

export function buildBalanceSheet(i: CompassInputs): BalanceSheet {
  // Prefer raw slider values where present, else fall back to band midpoints.
  const mainHome = resolveAmount(i.mainHomeValueRaw, i.mainHomeValue);
  const otherProperty = resolveAmount(i.otherPropertyValueRaw, i.otherPropertyValue);
  const property = mainHome + otherProperty;
  const business = resolveAmount(i.businessValueRaw, i.businessValue);
  const pension = resolveAmount(i.totalPensionValueRaw, i.totalPensionValue);
  const savings = resolveAmount(i.cashSavingsRaw, i.cashSavings);
  const isa = resolveAmount(i.isaBalanceRaw, i.isaBalance);
  const gia = resolveAmount(i.giaBalanceRaw, i.giaBalance);
  const otherAssets = band(i.otherAssets);
  const investments = isa + gia + otherAssets;
  const totalAssets = property + business + pension + savings + investments;

  const mainHomeMortgage = resolveAmount(i.mainHomeMortgageBalanceRaw, i.mainHomeMortgageBalance);
  const otherPropertyMortgage = resolveAmount(i.otherPropertyMortgageBalanceRaw, i.otherPropertyMortgageBalance);
  const mortgages = mainHomeMortgage + otherPropertyMortgage;
  const personalLoans = resolveAmount(i.personalLoansRaw, i.personalLoans);
  const creditCard = resolveAmount(i.creditCardDebtRaw, i.creditCardDebt);
  const totalLiabilities = mortgages + personalLoans + creditCard;

  return {
    assets: { property, business, pension, savings, investments, isa, gia, otherAssets, totalAssets },
    liabilities: { mortgages, personalLoans, creditCard, totalLiabilities },
    netWorth: totalAssets - totalLiabilities,
    liquidNetWorth: savings + investments,
  };
}

// -----------------------------------------------------------------------------
// Tax — UK income tax (rUK + Scottish), NI, and pension allowance helpers.
// -----------------------------------------------------------------------------

/**
 * Tapered Personal Allowance — £1 of PA is lost for every £2 earned over £100k,
 * fully gone by £125,140.
 */
function taperedPersonalAllowance(grossIncome: number): number {
  return Math.max(0, PERSONAL_ALLOWANCE - Math.max(0, grossIncome - PA_TAPER_START) / 2);
}

/** Rest-of-UK income tax (England, Wales, NI). */
function incomeTaxRUK(grossIncome: number): number {
  const pa = taperedPersonalAllowance(grossIncome);
  const taxable = Math.max(0, grossIncome - pa);

  let tax = 0;
  const basicBand = Math.min(taxable, BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE);
  tax += basicBand * RUK_BASIC_RATE;
  const higherBand = Math.min(
    Math.max(0, taxable - (BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE)),
    HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT,
  );
  tax += higherBand * RUK_HIGHER_RATE;
  const additionalBand = Math.max(0, taxable - (HIGHER_RATE_LIMIT - PERSONAL_ALLOWANCE));
  tax += additionalBand * RUK_ADDITIONAL_RATE;

  return tax;
}

/**
 * Scottish income tax — band-by-band, not a multiplier. PA is reserved by
 * Westminster so we still taper it from £100k.
 */
function incomeTaxScottish(grossIncome: number): number {
  const pa = taperedPersonalAllowance(grossIncome);
  let taxable = Math.max(0, grossIncome - pa);
  if (taxable === 0) return 0;

  let tax = 0;
  let consumed = 0;
  for (const band of SCOTTISH_BANDS) {
    const upper = band.upperBound === Infinity ? Infinity : band.upperBound - PERSONAL_ALLOWANCE;
    const slice = Math.min(taxable, Math.max(0, upper - consumed));
    if (slice <= 0) continue;
    tax += slice * band.rate;
    consumed += slice;
    taxable -= slice;
    if (taxable <= 0) break;
  }
  return tax;
}

function incomeTax(grossIncome: number, scottish: boolean): number {
  return scottish ? incomeTaxScottish(grossIncome) : incomeTaxRUK(grossIncome);
}

function nationalInsurance(grossIncome: number): number {
  const mainBand = Math.min(
    Math.max(0, grossIncome - NI_PRIMARY_THRESHOLD),
    NI_UPPER_EARNINGS_LIMIT - NI_PRIMARY_THRESHOLD,
  );
  const higherBand = Math.max(0, grossIncome - NI_UPPER_EARNINGS_LIMIT);
  return mainBand * NI_MAIN_RATE + higherBand * NI_HIGHER_RATE;
}

export function netIncome(grossIncome: number, scottish: boolean) {
  const it = incomeTax(grossIncome, scottish);
  const ni = nationalInsurance(grossIncome);
  const net = grossIncome - it - ni;
  return {
    net,
    incomeTax: it,
    ni,
    effectiveRate: grossIncome > 0 ? ((it + ni) / grossIncome) * 100 : 0,
  };
}

/**
 * Tapered Annual Allowance for high earners.
 *
 * If "adjusted income" (broadly total income + employer pension contribs)
 * exceeds £260k, AA tapers down by £1 for every £2 over the threshold,
 * floored at £10k.
 */
export function taperedAnnualAllowance(adjustedIncome: number, thresholdIncome: number): number {
  if (thresholdIncome <= ANNUAL_ALLOWANCE_TAPER_THRESHOLD) return ANNUAL_ALLOWANCE;
  if (adjustedIncome <= ANNUAL_ALLOWANCE_TAPER_ADJUSTED_INCOME) return ANNUAL_ALLOWANCE;
  const reduction = Math.floor((adjustedIncome - ANNUAL_ALLOWANCE_TAPER_ADJUSTED_INCOME) / 2);
  return Math.max(ANNUAL_ALLOWANCE_TAPERED_FLOOR, ANNUAL_ALLOWANCE - reduction);
}

/**
 * Cap pension contribution at the (tapered) Annual Allowance, and at the
 * Money Purchase Annual Allowance (MPAA) if the user has flexibly accessed
 * their pension. The MPAA stacks with the tapered AA — the lower wins.
 *
 * Returns the permitted amount, the £ excess that would have been
 * disallowed, the cap that was applied, and a flag indicating whether the
 * MPAA was the binding constraint (useful for disclosure / explainer copy).
 */
export function applyAnnualAllowanceCap(
  desiredContribution: number,
  grossIncome: number,
  employerContribution: number,
  mpaaApplies: boolean = false,
): { permitted: number; excess: number; cap: number; mpaaCapped: boolean } {
  const adjusted = grossIncome + employerContribution;
  const taperedCap = taperedAnnualAllowance(adjusted, grossIncome);
  const cap = mpaaApplies ? Math.min(taperedCap, MPAA_LIMIT) : taperedCap;
  const permitted = Math.min(desiredContribution, cap);
  return {
    permitted,
    excess: Math.max(0, desiredContribution - cap),
    cap,
    mpaaCapped: mpaaApplies && MPAA_LIMIT < taperedCap,
  };
}

// -----------------------------------------------------------------------------
// Retirement-phase tax helpers (PROJECTION_TAX_FIX_PLAN §6)
//
// CONFIRMED METHODOLOGY DECISIONS (28 Apr 2026, see PROJECTION_TAX_FIX_PLAN.md
// §15 for full decisions log). Changes to any of these constants or
// assumptions must be reflected in:
//   1. PROJECTION_TAX_FIX_PLAN.md decisions log
//   2. The disclosure text in `buildAssumptions()` below
//   3. A code comment at the assumption site
// -----------------------------------------------------------------------------

/**
 * §5.1 GIA cost-basis assumption — confirmed 28 Apr 2026.
 *
 * Each GIA withdrawal is treated as 50% taxable gain, 50% return of capital.
 * Industry-standard simplification for long-held diversified portfolios.
 * See PROJECTION_TAX_FIX_PLAN.md §5.1.
 */
export const GIA_GAIN_FRACTION = 0.5;

/**
 * §5.3 TFC consumption pattern — confirmed 28 Apr 2026.
 *
 * Each pension withdrawal is 25% tax-free (until cumulative LSA reached) +
 * 75% taxed as income at the user's marginal rate. Models flexi-access
 * drawdown — the most common HNW pattern.
 * See PROJECTION_TAX_FIX_PLAN.md §5.3.
 */
export const PENSION_TFC_FRACTION = 0.25;

/**
 * Tax state + DB pension as income, stacked on any other taxable income
 * the user has that year (e.g. work income for users still earning past
 * State Pension Age). Returns net cash actually delivered, the gross
 * taxable amount (for use as a stacking base for subsequent pot draws),
 * and the income tax paid. NI is not applied — neither state nor DB
 * pensions are NI'able under UK rules.
 */
export function taxRetirementGuaranteed(
  statePension: number,
  dbPension: number,
  otherTaxableIncome: number,
  isScottish: boolean,
): { netGuaranteed: number; grossTaxable: number; taxPaid: number } {
  const grossTaxable = statePension + dbPension;
  if (grossTaxable <= 0) {
    return { netGuaranteed: 0, grossTaxable: 0, taxPaid: 0 };
  }
  const baseTax = incomeTax(otherTaxableIncome, isScottish);
  const stackedTax = incomeTax(otherTaxableIncome + grossTaxable, isScottish);
  const taxPaid = stackedTax - baseTax;
  return {
    netGuaranteed: grossTaxable - taxPaid,
    grossTaxable,
    taxPaid,
  };
}

/**
 * Compute the TFC / taxable / tax breakdown of a known gross pension
 * withdrawal `gross`. Inverse of `grossUpPensionDraw`.
 *
 * Encapsulates the §5.3 flexi-access rule: 25% TFC up to `lsaRemaining`,
 * remainder taxed at marginal rate stacked on `otherTaxableIncome`.
 */
export function computePensionDrawTax(
  gross: number,
  lsaRemaining: number,
  otherTaxableIncome: number,
  isScottish: boolean,
): { tfc: number; taxable: number; tax: number } {
  if (gross <= 0) return { tfc: 0, taxable: 0, tax: 0 };
  const tfc = Math.min(PENSION_TFC_FRACTION * gross, Math.max(0, lsaRemaining));
  const taxable = gross - tfc;
  const baseTax = incomeTax(otherTaxableIncome, isScottish);
  const totalTax = incomeTax(otherTaxableIncome + taxable, isScottish);
  return { tfc, taxable, tax: totalTax - baseTax };
}

/**
 * Compute the CGT due on a known gross GIA withdrawal `gross`. Inverse
 * of `grossUpGiaDraw`.
 *
 * Per §5.1, gain is fixed at 50% of the gross. CGT is split between
 * 18% (gain falling in the basic-rate band of total taxable income)
 * and 24% (gain falling above), per current UK rules.
 */
export function computeGiaCgt(
  gross: number,
  otherTaxableIncome: number,
  cgtAllowanceRemaining: number,
): { gain: number; taxableGain: number; cgt: number } {
  if (gross <= 0) return { gain: 0, taxableGain: 0, cgt: 0 };
  const gain = gross * GIA_GAIN_FRACTION;
  const taxableGain = Math.max(0, gain - Math.max(0, cgtAllowanceRemaining));
  // Headroom in the basic-rate band that the gain can fall into. Income
  // already in the basic band consumes some of this width.
  const postPaIncome = Math.max(0, otherTaxableIncome - PERSONAL_ALLOWANCE);
  const basicBandWidth = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE;
  const basicHeadroom = Math.max(0, basicBandWidth - postPaIncome);
  const gainInBasic = Math.min(taxableGain, basicHeadroom);
  const gainInHigher = Math.max(0, taxableGain - gainInBasic);
  const cgt = gainInBasic * CGT_BASIC_RATE + gainInHigher * CGT_HIGHER_RATE;
  return { gain, taxableGain, cgt };
}

/**
 * Solve for the gross pension withdrawal needed to deliver `netNeeded`
 * after the §5.3 flexi-access tax treatment.
 *
 * Algorithm: Newton iteration with a clamped step size. The marginal rate
 * approximation accounts for PA tapering between £100k–£125,140 (effective
 * 60% on that slice). Converges in 3–5 iterations for typical inputs;
 * bounded at 10 as a safety net.
 */
export function grossUpPensionDraw(
  netNeeded: number,
  lsaRemaining: number,
  otherTaxableIncome: number,
  isScottish: boolean,
): { gross: number; tfc: number; taxable: number; tax: number } {
  if (netNeeded <= 0) return { gross: 0, tfc: 0, taxable: 0, tax: 0 };
  const lsa = Math.max(0, lsaRemaining);

  // Initial guess: assume basic-rate (20%) on 75% of G plus 25% TFC.
  // i.e. net ≈ G − 0.75G × 0.20 = 0.85G  ⇒  G ≈ netNeeded / 0.85.
  let G = netNeeded / 0.85;

  for (let iter = 0; iter < 10; iter++) {
    const r = computePensionDrawTax(G, lsa, otherTaxableIncome, isScottish);
    const net = G - r.tax;
    const err = netNeeded - net;
    if (Math.abs(err) < 0.5) {
      return { gross: G, tfc: r.tfc, taxable: r.taxable, tax: r.tax };
    }
    // Approximate marginal income-tax rate for the next slice of taxable.
    const stacked = otherTaxableIncome + r.taxable;
    let marginalRate: number;
    if (stacked <= PERSONAL_ALLOWANCE) marginalRate = 0;
    else if (stacked <= BASIC_RATE_LIMIT) marginalRate = 0.20;
    else if (stacked <= PA_TAPER_START) marginalRate = 0.40;
    else if (stacked <= HIGHER_RATE_LIMIT) marginalRate = 0.60; // PA taper
    else marginalRate = 0.45;
    // d(taxable)/dG = 0.75 if a slice of G's TFC is still under the LSA cap,
    // else 1 (cap binds, every additional pound is fully taxable).
    const tfcStillAvailable = PENSION_TFC_FRACTION * G < lsa;
    const taxableSlope = tfcStillAvailable ? 1 - PENSION_TFC_FRACTION : 1;
    const slope = 1 - taxableSlope * marginalRate;
    G += err / Math.max(0.40, slope); // floor to keep step size sane
  }
  // Convergence not reached — return the closest answer we have.
  const final = computePensionDrawTax(G, lsa, otherTaxableIncome, isScottish);
  return { gross: G, tfc: final.tfc, taxable: final.taxable, tax: final.tax };
}

/**
 * Solve for the gross GIA withdrawal needed to deliver `netNeeded` after CGT.
 * See `grossUpPensionDraw` for the iteration approach.
 */
export function grossUpGiaDraw(
  netNeeded: number,
  otherTaxableIncome: number,
  cgtAllowanceRemaining: number,
): { gross: number; gain: number; taxableGain: number; cgt: number } {
  if (netNeeded <= 0) return { gross: 0, gain: 0, taxableGain: 0, cgt: 0 };

  // Initial guess: ~7% effective CGT (50% gain × 18% rate, allowance pads it).
  let G = netNeeded * 1.08;

  for (let iter = 0; iter < 10; iter++) {
    const r = computeGiaCgt(G, otherTaxableIncome, cgtAllowanceRemaining);
    const net = G - r.cgt;
    const err = netNeeded - net;
    if (Math.abs(err) < 0.5) {
      return { gross: G, gain: r.gain, taxableGain: r.taxableGain, cgt: r.cgt };
    }
    // Marginal CGT rate depends on whether the gain has overflowed basic band.
    const postPaIncome = Math.max(0, otherTaxableIncome - PERSONAL_ALLOWANCE);
    const basicBandWidth = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE;
    const marginalCgt = postPaIncome + r.taxableGain > basicBandWidth ? CGT_HIGHER_RATE : CGT_BASIC_RATE;
    const slope = 1 - GIA_GAIN_FRACTION * marginalCgt;
    G += err / Math.max(0.80, slope);
  }
  const final = computeGiaCgt(G, otherTaxableIncome, cgtAllowanceRemaining);
  return { gross: G, gain: final.gain, taxableGain: final.taxableGain, cgt: final.cgt };
}

// -----------------------------------------------------------------------------
// Projection loop
// -----------------------------------------------------------------------------

function statePensionForUser(i: CompassInputs): number {
  const base = i.statePensionExpectedAmount ?? STATE_PENSION_FULL;
  const yearsHeld = resolveNiYears(i.niQualifyingYearsRaw, i.niQualifyingYears);
  return base * Math.min(1, yearsHeld / STATE_PENSION_FULL_QUALIFYING_YEARS);
}

export function mortgageEndAgeToNumber(b: MortgageEndBand, currentAge: number): number {
  switch (b) {
    case 'under_55': return Math.min(55, currentAge + 10);
    case '55_65': return 60;
    case '65_75': return 70;
    case 'paid': return currentAge;
    case 'renting': return 999;
  }
}

/**
 * Resolve the user's mortgage end age — slider value preferred over band.
 */
function resolveMortgageEndAge(i: CompassInputs): number {
  if (typeof i.mortgageEndAgeRaw === 'number' && Number.isFinite(i.mortgageEndAgeRaw)) {
    return i.mortgageEndAgeRaw;
  }
  return mortgageEndAgeToNumber(i.mortgageEndAge, i.currentAge);
}

/**
 * Tax-aware drawdown source picker — A6 order, with gross-up math so the
 * NET cash delivered to the user equals `shortfall` regardless of the tax
 * cost.
 *
 * Drawdown order (in real-world UK terms):
 *   1. Cash buffer — tax-free (PSA on interest is small and absorbed in
 *      the growth rate; deliberately not modelled separately).
 *   2. GIA — apply CGT (§5.1: 50/50 gain split, £3k annual allowance,
 *      18%/24% by band).
 *   3. Pension (only after pension access age) — apply 25% TFC up to LSA
 *      cap (§5.3), remainder taxed at marginal income rate.
 *   4. ISA — tax-free wrapper preserved for late-life flexibility + IHT.
 *
 * The function tracks tax paid, LSA consumed, and updates a running
 * `otherTaxableIncome` figure that the next pot's gross-up stacks on top
 * of (so e.g. a pension draw mid-year sees the basic-rate band already
 * partly consumed by state + DB pension).
 *
 * If a pot is too small to cover the remaining shortfall after gross-up,
 * we drain it entirely (computing the actual tax on the full balance) and
 * fall through to the next pot.
 */
function drawFrom(
  shortfall: number,
  balances: { cash: number; gia: number; pension: number; isa: number },
  ctx: {
    isPensionAccessible: boolean;
    lsaRemaining: number;
    otherTaxableIncome: number;
    cgtAllowanceRemaining: number;
    isScottish: boolean;
  },
): {
  drawn: { cash: number; gia: number; pension: number; isa: number };
  remaining: number;
  taxPaid: number;
  lsaConsumed: number;
  newTaxableIncome: number;
} {
  let remaining = shortfall;
  const drawn = { cash: 0, gia: 0, pension: 0, isa: 0 };
  let taxPaid = 0;
  let lsaConsumed = 0;
  let cgtAllowanceLeft = ctx.cgtAllowanceRemaining;
  let otherTaxable = ctx.otherTaxableIncome;

  // 1. Cash — tax-free at the point of withdrawal.
  const cashDraw = Math.min(balances.cash, remaining);
  drawn.cash = cashDraw;
  remaining -= cashDraw;
  if (remaining <= 0) {
    return { drawn, remaining: 0, taxPaid, lsaConsumed, newTaxableIncome: otherTaxable };
  }

  // 2. GIA — gross-up for CGT.
  if (balances.gia > 0) {
    const grossed = grossUpGiaDraw(remaining, otherTaxable, cgtAllowanceLeft);
    if (grossed.gross <= balances.gia) {
      // Full gross-up fits — shortfall met.
      drawn.gia = grossed.gross;
      taxPaid += grossed.cgt;
      cgtAllowanceLeft = Math.max(0, cgtAllowanceLeft - grossed.gain);
      remaining = 0;
      return { drawn, remaining: 0, taxPaid, lsaConsumed, newTaxableIncome: otherTaxable };
    }
    // Pot too small: take it all, recompute actual CGT and net delivered.
    const fullDraw = computeGiaCgt(balances.gia, otherTaxable, cgtAllowanceLeft);
    drawn.gia = balances.gia;
    taxPaid += fullDraw.cgt;
    cgtAllowanceLeft = Math.max(0, cgtAllowanceLeft - fullDraw.gain);
    remaining -= balances.gia - fullDraw.cgt;
  }
  if (remaining <= 0) {
    return { drawn, remaining: 0, taxPaid, lsaConsumed, newTaxableIncome: otherTaxable };
  }

  // 3. Pension — gross-up for 25% TFC + 75% taxable.
  if (ctx.isPensionAccessible && balances.pension > 0) {
    const lsaLeft = Math.max(0, ctx.lsaRemaining - lsaConsumed);
    const grossed = grossUpPensionDraw(remaining, lsaLeft, otherTaxable, ctx.isScottish);
    if (grossed.gross <= balances.pension) {
      drawn.pension = grossed.gross;
      taxPaid += grossed.tax;
      lsaConsumed += grossed.tfc;
      otherTaxable += grossed.taxable;
      remaining = 0;
      return { drawn, remaining: 0, taxPaid, lsaConsumed, newTaxableIncome: otherTaxable };
    }
    // Pot too small: drain it.
    const fullDraw = computePensionDrawTax(balances.pension, lsaLeft, otherTaxable, ctx.isScottish);
    drawn.pension = balances.pension;
    taxPaid += fullDraw.tax;
    lsaConsumed += fullDraw.tfc;
    otherTaxable += fullDraw.taxable;
    remaining -= balances.pension - fullDraw.tax;
  }
  if (remaining <= 0) {
    return { drawn, remaining: 0, taxPaid, lsaConsumed, newTaxableIncome: otherTaxable };
  }

  // 4. ISA — tax-free, no gross-up needed.
  const isaDraw = Math.min(balances.isa, remaining);
  drawn.isa = isaDraw;
  remaining -= isaDraw;

  return { drawn, remaining, taxPaid, lsaConsumed, newTaxableIncome: otherTaxable };
}

export function buildProjection(i: CompassInputs): ProjectionYear[] {
  const years: ProjectionYear[] = [];
  const bs = buildBalanceSheet(i);

  let cash = bs.assets.savings;
  let isa = resolveAmount(i.isaBalanceRaw, i.isaBalance);
  let gia = resolveAmount(i.giaBalanceRaw, i.giaBalance);
  let pension = bs.assets.pension;

  // §5.2 (PROJECTION_TAX_FIX_PLAN): assume the user's full Lump Sum
  // Allowance is unused at projection start. `lsaUsed` ratchets up over
  // years as 25% TFC is consumed; once it reaches LUMP_SUM_ALLOWANCE the
  // gross-up math switches to taxing 100% of pension drawdowns.
  let lsaUsed = 0;

  const growth = GROWTH_BY_RISK[i.riskProfile ?? 'balanced'];

  // Income — prefer raw slider value, fall back to band midpoint.
  const initialGrossIncome = resolveAmount(i.householdGrossIncomeRaw, undefined) || INCOME_MID[i.householdGrossIncome];
  const partnerInitialIncome = i.partnerGrossIncome ?? 0;

  // Salary sacrifice: pension contributions reduce taxable income & NI base.
  const employerPct = resolveContribPct(i.employerPensionContribPctRaw, i.employerPensionContribPct);
  const ownPct = resolveContribPct(i.ownPensionContribPctRaw, i.ownPensionContribPct);
  const useSalarySacrifice = i.salarySacrificeInUse === true;

  // Spending — prefer raw slider value, fall back to band midpoint.
  const essentialAnnual = resolveMonthlySpend(i.essentialMonthlySpendRaw, i.essentialMonthlySpend) * 12;
  const nonEssentialAnnual = resolveMonthlySpend(i.nonEssentialMonthlySpendRaw, i.nonEssentialMonthlySpend) * 12;

  const mortgageMonthly = resolveMonthlySpend(i.mortgageMonthlyPaymentRaw, i.mortgageMonthlyPayment);
  const mortgageAnnual = mortgageMonthly * 12;
  const mortgageEnd = resolveMortgageEndAge(i);

  // Personalised state pension age + DC pension access age (A8).
  const birthYear = i.birthYear ?? birthYearFromAge(i.currentAge);
  const userStatePensionAge = statePensionAgeForBirthYear(birthYear);
  const userPensionAccessAge = pensionAccessAgeForUser(birthYear);

  const baseStatePension = statePensionForUser(i);

  // DB pension wiring (B4).
  const dbAnnualIncome = i.hasDbPension ? (i.dbPensionAnnualIncome ?? 0) : 0;
  const dbStartAge = i.hasDbPension ? (i.dbPensionStartAge ?? userStatePensionAge) : Infinity;

  const monthlySavings = resolveMonthlySpend(i.monthlySavingAmountRaw, i.monthlySavingAmount);

  const retirementSpendMultiplier =
    i.retirementSpendRatio === 'less' ? 0.7 :
    i.retirementSpendRatio === 'more' ? 1.1 :
    0.85;
  const alreadyRetired = i.currentAge >= i.targetRetirementAge;
  const currentYear = new Date().getFullYear();

  for (let age = i.currentAge; age <= LIFE_EXPECTANCY; age++) {
    const isRetired = age >= i.targetRetirementAge;
    const isPensionAccessible = age >= userPensionAccessAge;
    const isStatePensionAge = age >= userStatePensionAge;
    const housingExpense = age < mortgageEnd ? mortgageAnnual : 0;

    // A7: Real income growth applied year-on-year while still working.
    const yearsWorked = age - i.currentAge;
    const yearGrossIncome = initialGrossIncome * Math.pow(1 + INCOME_GROWTH, yearsWorked);
    const yearPartnerIncome = partnerInitialIncome * Math.pow(1 + INCOME_GROWTH, yearsWorked);

    // Pension contribution amount (raw £, before allowance cap).
    const desiredOwnContrib = yearGrossIncome * (ownPct / 100);
    const employerContrib = yearGrossIncome * (employerPct / 100);
    const totalContribDesired = desiredOwnContrib + employerContrib;

    // A9 (PROJECTION_TAX_FIX_PLAN §6.5): MPAA reduces AA to £10k once the
    // user has flexibly accessed their pension AND is still working AND has
    // reached pension access age. Stacks with tapered AA — lower wins.
    const mpaaApplies = !!i.isFlexiblyAccessingPension && !isRetired && isPensionAccessible;
    const aaCheck = applyAnnualAllowanceCap(totalContribDesired, yearGrossIncome, employerContrib, mpaaApplies);
    const annualPensionContrib = aaCheck.permitted;

    // Track running totals for this year. yearTaxableIncomeBase is the
    // gross taxable-income figure that subsequent retirement-pot draws
    // stack on top of for marginal-rate calculations.
    let yearIncome = 0;
    let yearTaxableIncomeBase = 0;
    let yearTaxPaid = 0;

    if (!isRetired) {
      // Salary sacrifice reduces taxable + NI'able income by the OWN contribution.
      const sacrificed = useSalarySacrifice ? Math.min(desiredOwnContrib, aaCheck.permitted) : 0;
      const taxableIncome = Math.max(0, yearGrossIncome - sacrificed);
      const tax = incomeTax(taxableIncome, i.isScottishTaxpayer);
      // A10: NI only applies in working years.
      const ni = nationalInsurance(taxableIncome);
      const netUserIncome = yearGrossIncome - sacrificed - tax - ni;

      // Partner net (simplified — same tax rules, separate person).
      const partnerTax = yearPartnerIncome > 0 ? incomeTax(yearPartnerIncome, i.isScottishTaxpayer) : 0;
      const partnerNi = yearPartnerIncome > 0 ? nationalInsurance(yearPartnerIncome) : 0;
      const netPartnerIncome = Math.max(0, yearPartnerIncome - partnerTax - partnerNi);

      yearIncome += netUserIncome + netPartnerIncome;
      // The user's own taxable income forms the stacking base for any
      // state / DB pension hitting them while they're still working.
      // Partner income is treated as a separate tax person — not included.
      yearTaxableIncomeBase += taxableIncome;
    }

    // D1 + D2 (PROJECTION_TAX_FIX_PLAN §6.1): state and DB pension are
    // taxable income, stacked on whatever taxable income the user already
    // has from work that year (zero if fully retired).
    const stateThisYear = isStatePensionAge ? baseStatePension : 0;
    const dbThisYear = age >= dbStartAge ? dbAnnualIncome : 0;
    if (stateThisYear + dbThisYear > 0) {
      const guaranteed = taxRetirementGuaranteed(
        stateThisYear,
        dbThisYear,
        yearTaxableIncomeBase,
        i.isScottishTaxpayer,
      );
      yearIncome += guaranteed.netGuaranteed;
      yearTaxableIncomeBase += guaranteed.grossTaxable;
      yearTaxPaid += guaranteed.taxPaid;
    }

    const livingExpense = isRetired
      ? (alreadyRetired
          ? essentialAnnual + nonEssentialAnnual
          : (essentialAnnual + nonEssentialAnnual) * retirementSpendMultiplier)
      : essentialAnnual + nonEssentialAnnual;
    const yearExpense = livingExpense + housingExpense;

    const netCashFlow = yearIncome - yearExpense;

    if (!isRetired) {
      // A6 (PROJECTION_TAX_FIX_PLAN §6.4): cap ISA contribution at the
      // £20k annual allowance, spillover to GIA.
      const surplusToInvestments = monthlySavings * 12;
      const isaContribution = Math.min(surplusToInvestments, ISA_ANNUAL_ALLOWANCE);
      const giaSpillover = surplusToInvestments - isaContribution;
      isa += isaContribution;
      gia += giaSpillover;
      pension += annualPensionContrib;
      cash += Math.max(0, netCashFlow - surplusToInvestments);
    } else if (netCashFlow < 0) {
      // D3 + D4 + D5 (PROJECTION_TAX_FIX_PLAN §6.2 + 6.3): tax-aware
      // drawdown order — cash → GIA → pension → ISA, with gross-up so
      // the NET cash delivered equals the shortfall.
      const lsaRemainingThisYear = Math.max(0, LUMP_SUM_ALLOWANCE - lsaUsed);
      const result = drawFrom(
        -netCashFlow,
        { cash, gia, pension, isa },
        {
          isPensionAccessible,
          lsaRemaining: lsaRemainingThisYear,
          otherTaxableIncome: yearTaxableIncomeBase,
          cgtAllowanceRemaining: CAPITAL_GAINS_ALLOWANCE,
          isScottish: i.isScottishTaxpayer,
        },
      );
      cash -= result.drawn.cash;
      gia -= result.drawn.gia;
      pension -= result.drawn.pension;
      isa -= result.drawn.isa;
      yearTaxPaid += result.taxPaid;
      lsaUsed += result.lsaConsumed;
    } else {
      // Retired with surplus — top up cash buffer first, then ISA.
      cash += netCashFlow;
    }

    cash *= 1 + CASH_GROWTH;
    isa *= 1 + growth;
    gia *= 1 + growth;
    pension *= 1 + growth;
    cash = Math.max(0, cash); isa = Math.max(0, isa); gia = Math.max(0, gia); pension = Math.max(0, pension);

    years.push({
      age,
      year: currentYear + (age - i.currentAge),
      balanceCash: Math.round(cash),
      balanceISA: Math.round(isa),
      balanceGIA: Math.round(gia),
      pensionAccessible: isPensionAccessible ? Math.round(pension) : 0,
      pensionInaccessible: isPensionAccessible ? 0 : Math.round(pension),
      totalIncome: Math.round(yearIncome),
      totalExpense: Math.round(yearExpense),
      netSavings: Math.round(netCashFlow),
      taxPaid: Math.round(yearTaxPaid),
      isRetired,
      isPensionAccessible,
    });
  }

  return years;
}

// -----------------------------------------------------------------------------
// Scoring — legacy 0-100 + new target-coverage gauge
// -----------------------------------------------------------------------------

/**
 * Target-coverage gauge score.
 *
 * For accumulators (not-yet-retired):
 *   = projected liquid wealth at target retirement age ÷ (retirement-spend × 25 × inflation adjustment).
 *   100% = on track. <70% red. 70-90 amber. 90-115 green. 115+ blue.
 *
 * For drawdown clients (already retired at form time):
 *   = years of runway ÷ expected remaining lifetime (to 95).
 *   Same colour zones apply semantically ("on track" = funds cover lifetime).
 */
export function targetCoverage(inputs: CompassInputs, projection: ProjectionYear[]): {
  pct: number;
  mode: 'target' | 'lifetime';
} {
  const alreadyRetired = inputs.currentAge >= inputs.targetRetirementAge;

  if (alreadyRetired) {
    const remainingYears = LIFE_EXPECTANCY - inputs.currentAge;
    const depletion = projection.find(
      y => y.age > inputs.currentAge
        && (y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible) <= 0,
    );
    if (!depletion) {
      // Funds last beyond life expectancy — target-coverage is 100% or higher.
      return { pct: 120, mode: 'lifetime' };
    }
    const coveredYears = depletion.age - inputs.currentAge;
    return { pct: Math.round((coveredYears / remainingYears) * 100), mode: 'lifetime' };
  }

  // Accumulator: project wealth at retirement vs spend-based target.
  const atRetirement = projection.find(y => y.age === inputs.targetRetirementAge);
  const wealthAtRetirement = atRetirement
    ? atRetirement.balanceCash + atRetirement.balanceISA + atRetirement.balanceGIA + atRetirement.pensionAccessible + atRetirement.pensionInaccessible
    : 0;

  // Resolve raw values where present, fall back to band midpoints (A1).
  const essentialMonthly = resolveMonthlySpend(inputs.essentialMonthlySpendRaw, inputs.essentialMonthlySpend);
  const nonEssentialMonthly = resolveMonthlySpend(inputs.nonEssentialMonthlySpendRaw, inputs.nonEssentialMonthlySpend);

  const retirementSpend =
    (essentialMonthly + nonEssentialMonthly) * 12 *
    (inputs.retirementSpendRatio === 'less' ? 0.7
      : inputs.retirementSpendRatio === 'more' ? 1.1
      : 0.85);

  // A4: subtract guaranteed retirement income from the spend the user must
  // self-fund. State pension + DB pension reduce required pot dramatically.
  const statePension = statePensionForUser(inputs);
  const dbPension = inputs.hasDbPension ? (inputs.dbPensionAnnualIncome ?? 0) : 0;
  const guaranteedRetirementIncome = statePension + dbPension;
  const selfFundedSpend = Math.max(0, retirementSpend - guaranteedRetirementIncome);

  // Years of projection retirement life (to life expectancy)
  const retirementYears = LIFE_EXPECTANCY - inputs.targetRetirementAge;
  // Target wealth ≈ self-funded retirement spend × years × inflation-adjusted pot-size factor.
  // Using 25× multiplier as a 4% safe-withdrawal proxy, then scaling for the actual horizon.
  const horizonFactor = retirementYears / 25;
  const targetWealth = selfFundedSpend * 25 * horizonFactor;

  // Edge case: if guaranteed income covers retirement spend entirely, the gauge
  // shows the user as comfortably ahead — they need no self-funded pot.
  if (targetWealth === 0) {
    return { pct: wealthAtRetirement > 0 ? 130 : 110, mode: 'target' };
  }

  const pct = Math.round((wealthAtRetirement / targetWealth) * 100);
  return { pct, mode: 'target' };
}

/**
 * Legacy 0-100 heuristic. Retained for reference / debug — the gauge uses targetCoverage().
 */
export function scoreHealth(inputs: CompassInputs, projection: ProjectionYear[]) {
  const shortfallYear = projection.find(
    y => y.age >= inputs.targetRetirementAge
      && (y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible) <= 0,
  );
  const onTrack = !shortfallYear;

  let score = 50;
  if (inputs.willInPlace) score += 5;
  if (inputs.lpaInPlace) score += 5;
  if (inputs.niQualifyingYears === '35+') score += 10;
  if (inputs.employerPensionContribPct === '10+' || inputs.employerPensionContribPct === '5-10') score += 10;
  if (inputs.totalEstate === '3m+' || inputs.totalEstate === '2-3m') score -= 5;
  if (onTrack) score += 15;
  if (shortfallYear && shortfallYear.age < 80) score -= 20;

  return {
    financialHealth: Math.max(0, Math.min(100, score)),
    onTrackForRetirement: onTrack,
    shortfallAge: shortfallYear?.age,
  };
}

// -----------------------------------------------------------------------------
// Assumption publishing — feed the report methodology footer
// -----------------------------------------------------------------------------

export function buildAssumptions(i: CompassInputs): Record<string, string | number> {
  const birthYear = i.birthYear ?? birthYearFromAge(i.currentAge);
  const userStatePensionAge = statePensionAgeForBirthYear(birthYear);
  const userPensionAccessAge = pensionAccessAgeForUser(birthYear);
  const incomeUsed = resolveAmount(i.householdGrossIncomeRaw, undefined) || INCOME_MID[i.householdGrossIncome];
  return {
    // -------- Macro / growth --------
    incomeMidpoint: Math.round(incomeUsed),
    investmentGrowthRate: `${GROWTH_BY_RISK[i.riskProfile ?? 'balanced'] * 100}%`,
    cashGrowthRate: `${CASH_GROWTH * 100}%`,
    inflation: `${INFLATION * 100}%`,
    incomeGrowthRate: `${INCOME_GROWTH * 100}% real`,
    lifeExpectancy: LIFE_EXPECTANCY,

    // -------- Pension entitlements --------
    statePensionFullRate: STATE_PENSION_FULL,
    statePensionAge: userStatePensionAge,
    pensionAccessAge: userPensionAccessAge,
    retirementSpendRatio: i.retirementSpendRatio,
    niYearsAssumed: resolveNiYears(i.niQualifyingYearsRaw, i.niQualifyingYears),

    // -------- Profile flags --------
    riskProfile: i.riskProfile ?? 'balanced',
    salarySacrificeApplied: i.salarySacrificeInUse ? 'yes' : 'no',
    taxResidence: i.isScottishTaxpayer ? 'Scotland' : 'rest of UK',

    // -------- Allowance constants --------
    annualAllowance: ANNUAL_ALLOWANCE,
    lumpSumAllowance: LUMP_SUM_ALLOWANCE,
    isaAnnualAllowance: ISA_ANNUAL_ALLOWANCE,
    cgtAnnualAllowance: CAPITAL_GAINS_ALLOWANCE,
    mpaaLimit: MPAA_LIMIT,
    taxYear: TAX_YEAR,

    // -------- Methodology decisions (PROJECTION_TAX_FIX_PLAN §5) --------
    // Each of these sentences is the disclosure the client sees. Wording
    // changes here must be mirrored in PROJECTION_TAX_FIX_PLAN.md §10.
    incomeTaxOnRetirement:
      'Income tax is applied to your state pension, any DB pension, and to ' +
      '75% of every pension drawdown. Your marginal rate is calculated under the ' +
      'rUK or Scottish bands as appropriate to your tax residence.',
    pensionTaxFreePortion:
      '25% of every pension withdrawal is treated as tax-free, until the ' +
      `lifetime Lump Sum Allowance of £${LUMP_SUM_ALLOWANCE.toLocaleString('en-GB')} ` +
      'has been reached. Withdrawals after that point are taxed in full as income.',
    lsaStartingPosition:
      'We assume your full Lump Sum Allowance is unused at the start of the ' +
      'projection. If you have previously taken a tax-free lump sum from any ' +
      'pension, the actual tax cost of your future drawdowns will be higher than shown.',
    drawdownPattern:
      'Pension drawdowns are modelled as flexi-access with the 25% tax-free ' +
      'portion taken pro-rata across years. UFPLS-style front-loaded lump sums ' +
      'are not modelled.',
    giaCgtModel:
      'Capital Gains Tax is applied to GIA withdrawals. We assume each ' +
      `withdrawal is ${GIA_GAIN_FRACTION * 100}% taxable gain and ${(1 - GIA_GAIN_FRACTION) * 100}% return of capital — ` +
      'the industry-standard assumption for long-held diversified portfolios. ' +
      `CGT is charged above the £${CAPITAL_GAINS_ALLOWANCE.toLocaleString('en-GB')} annual allowance ` +
      `at ${CGT_BASIC_RATE * 100}% (basic-rate band) or ${CGT_HIGHER_RATE * 100}% (higher-rate band) ` +
      'depending on your other taxable income that year.',
    isaContributionCap:
      `ISA contributions are capped at the £${ISA_ANNUAL_ALLOWANCE.toLocaleString('en-GB')} annual ` +
      'allowance. Any surplus you intend to save above that is directed to your ' +
      'General Investment Account.',
    mpaaModelled: i.isFlexiblyAccessingPension
      ? `Money Purchase Annual Allowance applied: contribution allowance reduced to £${MPAA_LIMIT.toLocaleString('en-GB')} from pension access age.`
      : 'Money Purchase Annual Allowance: not applicable based on your inputs.',
    niOnRetirementIncome:
      'No National Insurance is applied to pension or state pension income, ' +
      'consistent with UK rules.',
    dividendTaxAndPsa:
      'Dividend tax on GIA holdings and Personal Savings Allowance on cash ' +
      'interest are not modelled separately — they are absorbed into the ' +
      'growth rates published above.',
  };
}

// -----------------------------------------------------------------------------
// Top-level entry point
// -----------------------------------------------------------------------------

export function buildReport(inputs: CompassInputs): CompassReport {
  const balanceSheet = buildBalanceSheet(inputs);
  const projection = buildProjection(inputs);
  const legacyScores = scoreHealth(inputs, projection);
  const coverage = targetCoverage(inputs, projection);
  const assumptions = buildAssumptions(inputs);
  return {
    inputs,
    balanceSheet,
    projection,
    scores: {
      ...legacyScores,
      targetCoveragePct: coverage.pct,
      targetCoverageMode: coverage.mode,
    },
    assumptions,
  };
}
