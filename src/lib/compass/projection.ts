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

// -----------------------------------------------------------------------------
// Constants — 2025/26 UK tax year. Update annually.
// -----------------------------------------------------------------------------

const PERSONAL_ALLOWANCE = 12_570;
const BASIC_RATE_LIMIT = 50_270;
const HIGHER_RATE_LIMIT = 125_140;
const PA_TAPER_START = 100_000;

const NI_PRIMARY_THRESHOLD = 12_570;
const NI_UPPER_EARNINGS_LIMIT = 50_270;

const STATE_PENSION_FULL = 11_502;
const STATE_PENSION_AGE = 67;
const PENSION_ACCESS_AGE = 57;

const INFLATION = 0.025;
const CASH_GROWTH = 0.025;

const GROWTH_BY_RISK: Record<RiskProfile, number> = {
  cautious: 0.04,
  balanced: 0.06,
  adventurous: 0.08,
};

const LIFE_EXPECTANCY = 95;

// -----------------------------------------------------------------------------
// Balance sheet
// -----------------------------------------------------------------------------

export function buildBalanceSheet(i: CompassInputs): BalanceSheet {
  const property = band(i.mainHomeValue) + band(i.otherPropertyValue);
  const business = band(i.businessValue);
  const pension = band(i.totalPensionValue);
  const savings = band(i.cashSavings);
  const investments = band(i.isaBalance) + band(i.giaBalance) + band(i.otherAssets);
  const totalAssets = property + business + pension + savings + investments;

  const mortgages = band(i.mainHomeMortgageBalance) + band(i.otherPropertyMortgageBalance);
  const personalLoans = band(i.personalLoans);
  const creditCard = band(i.creditCardDebt);
  const totalLiabilities = mortgages + personalLoans + creditCard;

  return {
    assets: { property, business, pension, savings, investments, totalAssets },
    liabilities: { mortgages, personalLoans, creditCard, totalLiabilities },
    netWorth: totalAssets - totalLiabilities,
    liquidNetWorth: savings + investments,
  };
}

// -----------------------------------------------------------------------------
// Tax — intentionally minimal. See originals/calculationEngine.ts for the full engine.
// -----------------------------------------------------------------------------

function incomeTax(grossIncome: number, scottish: boolean): number {
  const taperedPA = Math.max(0, PERSONAL_ALLOWANCE - Math.max(0, grossIncome - PA_TAPER_START) / 2);
  const taxable = Math.max(0, grossIncome - taperedPA);

  let tax = 0;
  const basicBand = Math.min(taxable, BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE);
  tax += basicBand * 0.20;
  const higherBand = Math.min(
    Math.max(0, taxable - (BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE)),
    HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT,
  );
  tax += higherBand * 0.40;
  const additionalBand = Math.max(0, taxable - (HIGHER_RATE_LIMIT - PERSONAL_ALLOWANCE));
  tax += additionalBand * 0.45;

  if (scottish) tax *= 1.03; // rough approximation
  return tax;
}

function nationalInsurance(grossIncome: number): number {
  const mainBand = Math.min(
    Math.max(0, grossIncome - NI_PRIMARY_THRESHOLD),
    NI_UPPER_EARNINGS_LIMIT - NI_PRIMARY_THRESHOLD,
  );
  const higherBand = Math.max(0, grossIncome - NI_UPPER_EARNINGS_LIMIT);
  return mainBand * 0.08 + higherBand * 0.02;
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

// -----------------------------------------------------------------------------
// Projection loop
// -----------------------------------------------------------------------------

function statePensionForUser(i: CompassInputs): number {
  const base = i.statePensionExpectedAmount ?? STATE_PENSION_FULL;
  const yearsHeld = NI_YEARS_MID[i.niQualifyingYears];
  return base * Math.min(1, yearsHeld / 35);
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

export function buildProjection(i: CompassInputs): ProjectionYear[] {
  const years: ProjectionYear[] = [];
  const bs = buildBalanceSheet(i);

  let cash = bs.assets.savings;
  let isa = band(i.isaBalance);
  let gia = band(i.giaBalance);
  let pension = bs.assets.pension;

  const growth = GROWTH_BY_RISK[i.riskProfile ?? 'balanced'];
  const grossIncome = INCOME_MID[i.householdGrossIncome];
  const { net: netAnnual } = netIncome(grossIncome, i.isScottishTaxpayer);

  const monthlySavings = SPEND_MID_MONTHLY[i.monthlySavingAmount];
  const employerPct = CONTRIB_PCT_MID[i.employerPensionContribPct];
  const ownPct = CONTRIB_PCT_MID[i.ownPensionContribPct];
  const annualPensionContrib = grossIncome * ((employerPct + ownPct) / 100);

  const essentialAnnual = SPEND_MID_MONTHLY[i.essentialMonthlySpend] * 12;
  const nonEssentialAnnual = SPEND_MID_MONTHLY[i.nonEssentialMonthlySpend] * 12;
  const mortgageAnnual = i.mortgageMonthlyPayment ? SPEND_MID_MONTHLY[i.mortgageMonthlyPayment] * 12 : 0;
  const mortgageEnd = mortgageEndAgeToNumber(i.mortgageEndAge, i.currentAge);

  const statePension = statePensionForUser(i);
  const retirementSpendMultiplier =
    i.retirementSpendRatio === 'less' ? 0.7 :
    i.retirementSpendRatio === 'more' ? 1.1 :
    0.85;
  const alreadyRetired = i.currentAge >= i.targetRetirementAge;
  const currentYear = new Date().getFullYear();

  for (let age = i.currentAge; age <= LIFE_EXPECTANCY; age++) {
    const isRetired = age >= i.targetRetirementAge;
    const isPensionAccessible = age >= PENSION_ACCESS_AGE;
    const isStatePensionAge = age >= STATE_PENSION_AGE;
    const housingExpense = age < mortgageEnd ? mortgageAnnual : 0;

    let yearIncome = 0;
    if (!isRetired) yearIncome += netAnnual;
    if (isStatePensionAge) yearIncome += statePension;

    // If the client reports themselves as already retired at form time, use
    // their stated spend as-is rather than applying the "target retirement
    // spend" multiplier (which projects working-age spend into retirement).
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
    } else {
      let shortfall = -netCashFlow;
      if (shortfall > 0) { const fc = Math.min(cash, shortfall); cash -= fc; shortfall -= fc; }
      if (shortfall > 0) { const fi = Math.min(isa, shortfall); isa -= fi; shortfall -= fi; }
      if (shortfall > 0) { const fg = Math.min(gia, shortfall); gia -= fg; shortfall -= fg; }
      if (shortfall > 0 && isPensionAccessible) {
        const fp = Math.min(pension, shortfall); pension -= fp;
      }
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

  const retirementSpend =
    (SPEND_MID_MONTHLY[inputs.essentialMonthlySpend] + SPEND_MID_MONTHLY[inputs.nonEssentialMonthlySpend]) * 12 *
    (inputs.retirementSpendRatio === 'less' ? 0.7
      : inputs.retirementSpendRatio === 'more' ? 1.1
      : 0.85);

  // Years of projection retirement life (to life expectancy)
  const retirementYears = LIFE_EXPECTANCY - inputs.targetRetirementAge;
  // Target wealth ≈ retirement spend × years × inflation-adjusted pot-size factor.
  // Using 25× multiplier as a 4% safe-withdrawal proxy, then scaling for the actual horizon.
  const horizonFactor = retirementYears / 25;
  const targetWealth = retirementSpend * 25 * horizonFactor;

  const pct = targetWealth > 0 ? Math.round((wealthAtRetirement / targetWealth) * 100) : 0;
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
  return {
    incomeMidpoint: INCOME_MID[i.householdGrossIncome],
    investmentGrowthRate: `${GROWTH_BY_RISK[i.riskProfile ?? 'balanced'] * 100}%`,
    cashGrowthRate: `${CASH_GROWTH * 100}%`,
    inflation: `${INFLATION * 100}%`,
    lifeExpectancy: LIFE_EXPECTANCY,
    statePensionFullRate: STATE_PENSION_FULL,
    statePensionAge: STATE_PENSION_AGE,
    pensionAccessAge: PENSION_ACCESS_AGE,
    retirementSpendRatio: i.retirementSpendRatio,
    niYearsAssumed: NI_YEARS_MID[i.niQualifyingYears],
    taxYear: '2025/26',
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
