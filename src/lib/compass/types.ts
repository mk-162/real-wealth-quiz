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
  /** Partner gross annual income (£). Set when partner block fires. */
  partnerGrossIncome?: number;
  /** Partner pension pot (£). Set when partner block fires. */
  partnerPensionValue?: number;
  hasDependentChildren: boolean;
  hasElderlyParents: boolean;
  targetRetirementAge: number;

  // §2 Wealth — banded fallbacks
  mainHomeValue: WealthBand | 0;
  otherPropertyValue: WealthBand | 0;
  totalPensionValue: WealthBand | 0;
  cashSavings: WealthBand | 0;
  isaBalance: WealthBand | 0;
  giaBalance: WealthBand | 0;
  businessValue: WealthBand | 0;
  otherAssets: WealthBand | 0;

  // §2b Wealth — raw values (preferred when present, set by sliders).
  // The engine uses these when defined and falls back to the banded midpoints
  // above otherwise. Adding these is the A1 "stop re-banding sliders" fix.
  mainHomeValueRaw?: number;
  otherPropertyValueRaw?: number;
  totalPensionValueRaw?: number;
  cashSavingsRaw?: number;
  isaBalanceRaw?: number;
  giaBalanceRaw?: number;
  businessValueRaw?: number;
  /** Net monthly rent received from BTL / second home, gross of tax. */
  otherPropertyMonthlyRentRaw?: number;

  mainHomeMortgageBalance: WealthBand | 0;
  otherPropertyMortgageBalance: WealthBand | 0;
  personalLoans: WealthBand | 0;
  creditCardDebt: WealthBand | 0;

  // Liabilities — raw values
  mainHomeMortgageBalanceRaw?: number;
  otherPropertyMortgageBalanceRaw?: number;
  personalLoansRaw?: number;
  creditCardDebtRaw?: number;

  // §3 Income
  householdGrossIncome: IncomeBand;
  /** Exact gross income (£). Preferred over the banded fallback when present. */
  householdGrossIncomeRaw?: number;
  isScottishTaxpayer: boolean;
  monthlySavingAmount: SpendBand;
  /** Exact monthly saving (£). Preferred over band when present. */
  monthlySavingAmountRaw?: number;
  employerPensionContribPct: ContribPctBand;
  ownPensionContribPct: ContribPctBand;
  /** Exact employer pension contribution % (0–25). Preferred over band when present. */
  employerPensionContribPctRaw?: number;
  /** Exact own pension contribution % (0–25). Preferred over band when present. */
  ownPensionContribPctRaw?: number;
  salarySacrificeInUse?: boolean;
  dividendIncome?: IncomeBand;
  rentalIncomeNet?: IncomeBand;

  // §4 Expenses
  essentialMonthlySpend: SpendBand;
  nonEssentialMonthlySpend: SpendBand;
  /** Exact essential monthly spend (£). */
  essentialMonthlySpendRaw?: number;
  /** Exact non-essential monthly spend (£). */
  nonEssentialMonthlySpendRaw?: number;
  retirementSpendRatio: RetirementSpendRatio;

  // §5 Mortgage
  mortgageMonthlyPayment?: SpendBand;
  /** Exact mortgage monthly payment (£). */
  mortgageMonthlyPaymentRaw?: number;
  mortgageEndAge: MortgageEndBand;
  /** Exact mortgage end age (years). Preferred over band when present. */
  mortgageEndAgeRaw?: number;
  rentMonthly?: SpendBand;

  // §6 State pension / NI
  statePensionKnown: 'yes' | 'no' | 'partial';
  statePensionExpectedAmount?: number; // annual £, default to 2025/26 full rate
  niQualifyingYears: NIYearsBand;
  /** Exact NI qualifying years (0–45). Preferred over band when present. */
  niQualifyingYearsRaw?: number;

  // §6b Defined Benefit pension (B4)
  /** Whether the user has any DB pension entitlement. */
  hasDbPension?: boolean;
  /** Annual income (£) the DB pension will pay, in today's money. */
  dbPensionAnnualIncome?: number;
  /** Age at which DB pension payments start. */
  dbPensionStartAge?: number;

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

  // §9 Protection signals (optional — screen 4.B.3 only fires for relevant segments)
  /** Life cover status as reported on screen 4.B.3. `undefined` when the screen didn't fire. */
  lifeCoverStatus?: 'through_work_only' | 'personal_policy' | 'both' | 'no' | 'unknown';
  /**
   * Self-reported confidence (1–5 Likert) that income is protected against illness/injury.
   * 1 = very low, 5 = very high. `undefined` when the screen didn't fire.
   */
  earningsProtectionConfidence?: 1 | 2 | 3 | 4 | 5;

  // §10 Assumption knobs (optional)
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
    investments: number;    // ISA + GIA + other assets (combined for legacy callers)
    /** ISA balance, exposed separately so visualisations can split wrapper-by-wrapper. */
    isa: number;
    /** GIA / general-investment-account balance, exposed separately. */
    gia: number;
    /** "Other" investments (crypto, P2P, EIS/VCT) when collected. */
    otherAssets: number;
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
  /** "What this tile checks" — sourced from content/report/planning-grid/tile-NN-*.md frontmatter. */
  whatItChecks?: string;
}

export interface WellbeingGoal {
  goal: string;
  capacity: string;
  alignment: TileStatus;
  /** One-line status summary sourced from content/report/goals/S[n]-*.md (`rationale:` field). */
  rationale?: string;
}

export type HealthGaugeZone = 'red' | 'amber' | 'green' | 'blue';

/**
 * Zone-specific interpretation copy sourced from content/report/health-gauge.md.
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
  /** Zone-specific interpretations from content/report/health-gauge.md. */
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
  /**
   * Per-segment "Five things worth a conversation" selection. Up to 5 source_ids
   * from content/awareness-checks/*.md (format `pitfall.<slug>`). Order matters:
   * items 0-3 render as standard cards, item 4 as the featured "fifth" highlight.
   * Hand-curated on fixtures today; will be derived by a DSL-driven resolver
   * against the originals' `trigger` field once sessions produce real answers.
   */
  awarenessCheckIds?: string[];
}
