/**
 * Compass report — types.
 *
 * Ported from C:/AI_Project/Compass-Report-Kit/types.ts (April 2026).
 * See DATA_REQUIREMENTS.md in that folder for the field spec and banding conventions.
 *
 * This file is the single source of truth for the shape of:
 *   - the inputs the form collects
 *   - the balance sheet snapshot (page-1 donut + table)
 *   - the year-by-year projection (page-2 stacked area chart)
 *   - the final Compass report payload consumed by the report components
 */

// -----------------------------------------------------------------------------
// Form inputs (banded where noted)
// -----------------------------------------------------------------------------

export type IncomeBand = '<50k' | '50-100k' | '100-125k' | '125-200k' | '200k+';
export type WealthBand =
  | '<25k' | '25-100k' | '100-250k' | '250-500k' | '500k-1m' | '1-2m' | '2-3m' | '3m+';
export type SpendBand = '<1.5k' | '1.5-3k' | '3-5k' | '5-8k' | '8k+';
export type ContribPctBand = '0-3' | '3-5' | '5-10' | '10+' | 'unsure';
export type NIYearsBand = '<10' | '10-20' | '20-30' | '30-35' | '35+';
export type MortgageEndBand = 'under_55' | '55_65' | '65_75' | 'paid' | 'renting';
export type RiskProfile = 'cautious' | 'balanced' | 'adventurous';
export type RetirementSpendRatio = 'less' | 'same' | 'more';

export interface CompassInputs {
  // §1 Personal
  currentAge: number;
  birthYear?: number;
  partnerPresent: boolean;
  partnerAge?: number;
  hasDependentChildren: boolean;
  hasElderlyParents: boolean;
  targetRetirementAge: number;

  // §2 Wealth
  mainHomeValue: WealthBand | 0;
  otherPropertyValue: WealthBand | 0;
  totalPensionValue: WealthBand | 0;
  cashSavings: WealthBand | 0;
  isaBalance: WealthBand | 0;
  giaBalance: WealthBand | 0;
  businessValue: WealthBand | 0;
  otherAssets: WealthBand | 0;

  mainHomeMortgageBalance: WealthBand | 0;
  otherPropertyMortgageBalance: WealthBand | 0;
  personalLoans: WealthBand | 0;
  creditCardDebt: WealthBand | 0;

  // §3 Income
  householdGrossIncome: IncomeBand;
  isScottishTaxpayer: boolean;
  monthlySavingAmount: SpendBand;
  employerPensionContribPct: ContribPctBand;
  ownPensionContribPct: ContribPctBand;
  salarySacrificeInUse?: boolean;
  dividendIncome?: IncomeBand;
  rentalIncomeNet?: IncomeBand;

  // §4 Expenses
  essentialMonthlySpend: SpendBand;
  nonEssentialMonthlySpend: SpendBand;
  retirementSpendRatio: RetirementSpendRatio;

  // §5 Mortgage
  mortgageMonthlyPayment?: SpendBand;
  mortgageEndAge: MortgageEndBand;
  rentMonthly?: SpendBand;

  // §6 State pension / NI
  statePensionKnown: 'yes' | 'no' | 'partial';
  statePensionExpectedAmount?: number; // annual £, default to 2025/26 full rate
  niQualifyingYears: NIYearsBand;

  // §7 Tax extras
  studentLoanPlan?: 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgraduate';
  capitalGainsRealisedLast12m?: WealthBand | 0;

  // §8 Legacy
  totalEstate: WealthBand;
  isMarriedOrCP: boolean;
  homeLeftToDescendants: boolean;
  priorGiftsLast7y?: WealthBand | 0;
  willInPlace: boolean;
  lpaInPlace: boolean;

  // §9 Assumption knobs (optional)
  riskProfile?: RiskProfile;
}

// -----------------------------------------------------------------------------
// Balance sheet snapshot — drives the donut + compact strip on page 1
// -----------------------------------------------------------------------------

export interface BalanceSheet {
  assets: {
    property: number;       // main home + other property (gross values)
    business: number;
    pension: number;
    savings: number;        // cash
    investments: number;    // ISA + GIA + other assets
    totalAssets: number;
  };
  liabilities: {
    mortgages: number;
    personalLoans: number;
    creditCard: number;
    totalLiabilities: number;
  };
  netWorth: number;
  liquidNetWorth: number;   // cash + investments (excludes property + pension)
}

// -----------------------------------------------------------------------------
// Projection output — one row per age, drives the page-2 stacked chart
// -----------------------------------------------------------------------------

export interface ProjectionYear {
  age: number;
  year: number;

  // Balances at end of year (stacked area fills)
  balanceCash: number;
  balanceISA: number;       // ISA + GIA lumped as "Investments" on chart
  balanceGIA: number;
  pensionAccessible: number; // 0 while age < pensionAccessAge
  pensionInaccessible: number;

  // Flow (for tooltip / debug)
  totalIncome: number;
  totalExpense: number;
  netSavings: number;

  // Flags
  isRetired: boolean;
  isPensionAccessible: boolean;
}

// -----------------------------------------------------------------------------
// Overall report payload
// -----------------------------------------------------------------------------

export interface CompassReport {
  inputs: CompassInputs;
  balanceSheet: BalanceSheet;
  projection: ProjectionYear[];
  scores: {
    financialHealth: number;  // 0-100 (legacy Compass kit score — kept for reference)
    onTrackForRetirement: boolean;
    shortfallAge?: number;    // age at which money runs out, if any
    /**
     * Target-coverage % used by the Page-1 gauge.
     * = projected wealth at target retirement age / (retirement spend × 25 × inflation).
     * For drawdown (already-retired) clients, re-interpreted as % of expected remaining lifetime covered.
     */
    targetCoveragePct: number;
    /** 'target' for accumulators, 'lifetime' for drawdown. */
    targetCoverageMode: 'target' | 'lifetime';
  };
  assumptions: Record<string, string | number>;
}

// -----------------------------------------------------------------------------
// Page-1 segment view — tiles + goals + interpretation
// -----------------------------------------------------------------------------

export type TileStatus = 'green' | 'amber' | 'red' | 'grey';
export type TileKey =
  | 'retirement' | 'pension' | 'statePension' | 'investment'
  | 'tax' | 'cash' | 'debt' | 'mortgage'
  | 'estate' | 'iht' | 'protection' | 'twelfth';

export interface PlanningTile {
  key: TileKey;
  label: string;        // can be overridden (e.g. 'Business exit' vs 'Income mix')
  status: TileStatus;
  note: string;         // one-line plain-English rationale
  /** "What this tile checks" — sourced from content/pdf-report/planning-grid/tile-NN-*.md frontmatter. */
  whatItChecks?: string;
}

export interface WellbeingGoal {
  goal: string;
  capacity: string;
  alignment: TileStatus;
  /** One-line status summary sourced from content/pdf-report/goals/S[n]-*.md (`rationale:` field). */
  rationale?: string;
}

export type HealthGaugeZone = 'red' | 'amber' | 'green' | 'blue';

/**
 * Zone-specific interpretation copy sourced from content/pdf-report/health-gauge.md.
 * The loader keys them by zone so the runtime picks the right one based on the
 * actual calculated score: red < 70, amber 70-89, green 90-115, blue >= 116.
 */
export interface HealthZoneVariants {
  red?: string;
  amber?: string;
  green?: string;
  blue?: string;
}

export interface SegmentView {
  segmentId: string;         // S1..S9
  segmentLabel: string;
  persona: string;           // e.g. 'Age 42 • £75k • Partner + kids'
  /** Fallback / "typical" interpretation. Used if no zoneVariants match the actual score. */
  healthInterpretation: string;
  /** Zone-specific interpretations from content/pdf-report/health-gauge.md. */
  healthZoneVariants?: HealthZoneVariants;
  headline: {
    tone: 'good' | 'warn' | 'risk' | 'info';
    title: string;
    body: string;
  };
  grid: PlanningTile[];      // 12 tiles, always in TileKey order
  goals: WellbeingGoal[];    // 3-5 goals
  nextSteps: string[];       // 3 advisor conversation starters
  bullets: { tone: 'good' | 'warn' | 'risk' | 'info'; text: string }[]; // page-2 chart commentary
}
