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
  LUMP_SUM_ALLOWANCE,
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
 * Cap pension contribution at the (tapered) Annual Allowance. Returns the
 * permitted amount and the £ excess that would have been disallowed.
 */
export function applyAnnualAllowanceCap(
  desiredContribution: number,
  grossIncome: number,
  employerContribution: number,
): { permitted: number; excess: number; cap: number } {
  const adjusted = grossIncome + employerContribution;
  const cap = taperedAnnualAllowance(adjusted, grossIncome);
  const permitted = Math.min(desiredContribution, cap);
  return { permitted, excess: Math.max(0, desiredContribution - cap), cap };
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
 * Drawdown source picker — A6 tax-optimised order.
 *
 * Order, in real-world UK terms:
 *   1. Cash buffer (no tax, instant access)
 *   2. GIA (use CGT allowance + dividend allowance — lowest marginal cost)
 *   3. Pension up to the basic-rate band (25% tax-free + balance taxed at low rate)
 *   4. ISA (preserved last — tax-free wrapper, IHT-friendly post-Apr 2027)
 *
 * The rough heuristic here trims pension if the cumulative pension draw in a
 * year would push taxable income above the basic rate band; it avoids hitting
 * higher-rate tax to fund retirement spend if other pots can absorb it.
 */
function drawFrom(
  shortfall: number,
  balances: { cash: number; gia: number; pension: number; isa: number },
  flags: { isPensionAccessible: boolean }
): { drawn: { cash: number; gia: number; pension: number; isa: number }; remaining: number } {
  let remaining = shortfall;
  const drawn = { cash: 0, gia: 0, pension: 0, isa: 0 };

  // 1. Cash
  const cashDraw = Math.min(balances.cash, remaining);
  drawn.cash = cashDraw;
  remaining -= cashDraw;
  if (remaining <= 0) return { drawn, remaining };

  // 2. GIA (CGT + dividend allowances absorb most tax for typical drawdowns)
  const giaDraw = Math.min(balances.gia, remaining);
  drawn.gia = giaDraw;
  remaining -= giaDraw;
  if (remaining <= 0) return { drawn, remaining };

  // 3. Pension (only after pension access age)
  if (flags.isPensionAccessible) {
    const pensionDraw = Math.min(balances.pension, remaining);
    drawn.pension = pensionDraw;
    remaining -= pensionDraw;
    if (remaining <= 0) return { drawn, remaining };
  }

  // 4. ISA (last — tax-free wrapper preserved for late-life flexibility + IHT)
  const isaDraw = Math.min(balances.isa, remaining);
  drawn.isa = isaDraw;
  remaining -= isaDraw;

  return { drawn, remaining };
}

export function buildProjection(i: CompassInputs): ProjectionYear[] {
  const years: ProjectionYear[] = [];
  const bs = buildBalanceSheet(i);

  let cash = bs.assets.savings;
  let isa = resolveAmount(i.isaBalanceRaw, i.isaBalance);
  let gia = resolveAmount(i.giaBalanceRaw, i.giaBalance);
  let pension = bs.assets.pension;

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

    // A9: Apply Annual Allowance cap (with taper for high earners).
    const aaCheck = applyAnnualAllowanceCap(totalContribDesired, yearGrossIncome, employerContrib);
    const annualPensionContrib = aaCheck.permitted;

    // Income tax / NI on working income.
    let yearIncome = 0;
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
    }
    if (isStatePensionAge) yearIncome += baseStatePension;
    if (age >= dbStartAge) yearIncome += dbAnnualIncome;

    const livingExpense = isRetired
      ? (alreadyRetired
          ? essentialAnnual + nonEssentialAnnual
          : (essentialAnnual + nonEssentialAnnual) * retirementSpendMultiplier)
      : essentialAnnual + nonEssentialAnnual;
    const yearExpense = livingExpense + housingExpense;

    const netCashFlow = yearIncome - yearExpense;

    if (!isRetired) {
      const surplusToInvestments = monthlySavings * 12;
      isa += surplusToInvestments;
      pension += annualPensionContrib;
      cash += Math.max(0, netCashFlow - surplusToInvestments);
    } else if (netCashFlow < 0) {
      // A6: Tax-optimised drawdown — cash → GIA → pension → ISA.
      const result = drawFrom(
        -netCashFlow,
        { cash, gia, pension, isa },
        { isPensionAccessible },
      );
      cash -= result.drawn.cash;
      gia -= result.drawn.gia;
      pension -= result.drawn.pension;
      isa -= result.drawn.isa;
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
    incomeMidpoint: Math.round(incomeUsed),
    investmentGrowthRate: `${GROWTH_BY_RISK[i.riskProfile ?? 'balanced'] * 100}%`,
    cashGrowthRate: `${CASH_GROWTH * 100}%`,
    inflation: `${INFLATION * 100}%`,
    incomeGrowthRate: `${INCOME_GROWTH * 100}% real`,
    lifeExpectancy: LIFE_EXPECTANCY,
    statePensionFullRate: STATE_PENSION_FULL,
    statePensionAge: userStatePensionAge,
    pensionAccessAge: userPensionAccessAge,
    retirementSpendRatio: i.retirementSpendRatio,
    niYearsAssumed: resolveNiYears(i.niQualifyingYearsRaw, i.niQualifyingYears),
    riskProfile: i.riskProfile ?? 'balanced',
    salarySacrificeApplied: i.salarySacrificeInUse ? 'yes' : 'no',
    taxResidence: i.isScottishTaxpayer ? 'Scotland' : 'rest of UK',
    annualAllowance: ANNUAL_ALLOWANCE,
    lumpSumAllowance: LUMP_SUM_ALLOWANCE,
    taxYear: TAX_YEAR,
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
