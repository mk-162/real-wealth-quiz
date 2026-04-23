/**
 * Session answers → CompassInputs transformer.
 *
 * Maps the Wealth Conversation's localStorage session shape into the strict
 * CompassInputs shape the projection engine consumes. This is the boundary
 * where banded answers stop being strings tagged to question IDs and start
 * being typed fields the engine understands.
 *
 * STATUS: scaffolded but not yet wired to the live form. The 4 new content
 * screens (balance sheet / debts / cash flow / state pension) need to be
 * activated before `buildCompassInputs` can produce a complete CompassInputs
 * from a real session. Until then, use the fixtures in `./fixtures.ts`.
 *
 * See `docs/PHASE_1_NOTES.md` in the repo root for the activation plan.
 */

import type { CompassInputs, IncomeBand, WealthBand, SpendBand, ContribPctBand, NIYearsBand, MortgageEndBand, RetirementSpendRatio } from './types';

// -----------------------------------------------------------------------------
// Question ID → field map
//
// Pointers into the runtime `answers` object. Most of these IDs are already
// present in the existing question catalogue (Q2.1 etc); the ones prefixed
// `q4a*` / `q5*` are the 4 new screens that need the xlsx-Sheet-2 update.
// -----------------------------------------------------------------------------

export const INPUT_QUESTION_IDS = {
  // Existing
  currentAge: 'Q2.1',
  partnership: 'Q2.2',
  workStatus: 'Q2.3',
  happyWeek: 'Q2.4',
  householdGrossIncome: 'Q3.1',
  essentialMonthlySpend: 'Q3.2',
  nonEssentialMonthlySpend: 'Q3.3',
  pensionPotCount: 'Q4.3',           // still the count — NOT a value; superseded by totalPensionValue (Q4.A.1)
  combinedInvestments: 'Q4.4',       // still the combined lump — superseded by cashSavings/isaBalance/giaBalance (Q4.A.2-4)
  totalEstate: 'Q4.5',
  willLpa: 'Q6.3',
  targetRetirementAge: 'Q7.1',
  statePensionKnown: 'Q7.3',
  exitIntent: 'Q5.3',                // business owners only

  // NEW (to be added — see content/screens-staging/*.md)
  totalPensionValue: 'Q4.A.1',
  cashSavings: 'Q4.A.2',
  isaBalance: 'Q4.A.3',
  giaBalance: 'Q4.A.4',
  mainHomeValue: 'Q4.A.5',           // conditional on home-owner
  mainHomeMortgageBalance: 'Q4.B.1',
  mortgageEndAge: 'Q4.B.2',
  monthlySavingAmount: 'Q4.C.1',
  employerPensionContribPct: 'Q4.C.2',
  statePensionExpectedAmount: 'Q4.D.1',
  niQualifyingYears: 'Q4.D.2',
  retirementSpendRatio: 'Q4.D.3',    // the "less/same/more" card — piggy-backed onto the state-pension screen
} as const;

// -----------------------------------------------------------------------------
// Band-label ↔ field-value maps.
//
// The question screens use human-readable labels (e.g. "£50,000–£100,000");
// the engine uses typed band literals (e.g. '50-100k'). These tables bridge.
// -----------------------------------------------------------------------------

const INCOME_LABEL_TO_BAND: Record<string, IncomeBand> = {
  'lt50k': '<50k',
  '50to100k': '50-100k',
  '100to125k': '100-125k',
  '125to200k': '125-200k',
  'gt200k': '200k+',
};

const WEALTH_LABEL_TO_BAND: Record<string, WealthBand | 0> = {
  'none': 0,
  'lt25k': '<25k',
  '25to100k': '25-100k',
  '100to250k': '100-250k',
  '250to500k': '250-500k',
  '500kto1m': '500k-1m',
  '1to2m': '1-2m',
  '2to3m': '2-3m',
  'gt3m': '3m+',
};

const SPEND_LABEL_TO_BAND: Record<string, SpendBand> = {
  'lt1500': '<1.5k',
  '1500to3000': '1.5-3k',
  '3000to5000': '3-5k',
  '5000to8000': '5-8k',
  'gt8000': '8k+',
};

const CONTRIB_LABEL_TO_BAND: Record<string, ContribPctBand> = {
  '0to3': '0-3',
  '3to5': '3-5',
  '5to10': '5-10',
  '10plus': '10+',
  'unsure': 'unsure',
};

const NI_LABEL_TO_BAND: Record<string, NIYearsBand> = {
  'lt10': '<10',
  '10to20': '10-20',
  '20to30': '20-30',
  '30to35': '30-35',
  'gte35': '35+',
};

const MORTGAGE_END_LABEL_TO_BAND: Record<string, MortgageEndBand> = {
  'under_55': 'under_55',
  '55_65': '55_65',
  '65_75': '65_75',
  'paid': 'paid',
  'renting': 'renting',
};

const RETIREMENT_SPEND_LABEL_TO_BAND: Record<string, RetirementSpendRatio> = {
  'less': 'less',
  'same': 'same',
  'more': 'more',
};

// -----------------------------------------------------------------------------
// Partial-input builder
//
// Accepts the raw answers map from the session. Missing answers fall through
// to sensible defaults — the engine tolerates undefined for optional fields
// and uses published assumptions for required-but-missing fields.
// -----------------------------------------------------------------------------

export interface PartialAnswersMap {
  [questionId: string]: string | number | boolean | undefined;
}

export function buildCompassInputs(answers: PartialAnswersMap): CompassInputs {
  const ids = INPUT_QUESTION_IDS;

  const getStr = (k: string): string | undefined => {
    const v = answers[k];
    return typeof v === 'string' ? v : undefined;
  };
  const getNum = (k: string, fallback: number): number => {
    const v = answers[k];
    return typeof v === 'number' ? v : fallback;
  };
  const getBool = (k: string): boolean => answers[k] === true;

  const wealth = (k: string): WealthBand | 0 =>
    WEALTH_LABEL_TO_BAND[getStr(k) ?? 'none'] ?? 0;

  const spend = (k: string, fallback: SpendBand): SpendBand =>
    SPEND_LABEL_TO_BAND[getStr(k) ?? ''] ?? fallback;

  const income = (k: string, fallback: IncomeBand): IncomeBand =>
    INCOME_LABEL_TO_BAND[getStr(k) ?? ''] ?? fallback;

  const contrib = (k: string, fallback: ContribPctBand): ContribPctBand =>
    CONTRIB_LABEL_TO_BAND[getStr(k) ?? ''] ?? fallback;

  const retSpend = getStr(ids.retirementSpendRatio);

  const inputs: CompassInputs = {
    currentAge: getNum(ids.currentAge, 45),
    targetRetirementAge: getNum(ids.targetRetirementAge, 65),
    partnerPresent: getStr(ids.partnership) === 'couple',
    hasDependentChildren: getStr(ids.partnership) === 'couple_children',
    hasElderlyParents: false,

    mainHomeValue: wealth(ids.mainHomeValue),
    otherPropertyValue: 0,
    totalPensionValue: wealth(ids.totalPensionValue),
    cashSavings: wealth(ids.cashSavings),
    isaBalance: wealth(ids.isaBalance),
    giaBalance: wealth(ids.giaBalance),
    businessValue: 0,
    otherAssets: 0,

    mainHomeMortgageBalance: wealth(ids.mainHomeMortgageBalance),
    otherPropertyMortgageBalance: 0,
    personalLoans: 0,
    creditCardDebt: 0,

    householdGrossIncome: income(ids.householdGrossIncome, '50-100k'),
    isScottishTaxpayer: false,
    monthlySavingAmount: spend(ids.monthlySavingAmount, '<1.5k'),
    employerPensionContribPct: contrib(ids.employerPensionContribPct, 'unsure'),
    ownPensionContribPct: 'unsure',

    essentialMonthlySpend: spend(ids.essentialMonthlySpend, '1.5-3k'),
    nonEssentialMonthlySpend: spend(ids.nonEssentialMonthlySpend, '1.5-3k'),
    retirementSpendRatio: RETIREMENT_SPEND_LABEL_TO_BAND[retSpend ?? 'same'] ?? 'same',

    mortgageEndAge: MORTGAGE_END_LABEL_TO_BAND[getStr(ids.mortgageEndAge) ?? 'paid'] ?? 'paid',

    statePensionKnown: (getStr(ids.statePensionKnown) as 'yes' | 'no' | 'partial') ?? 'no',
    statePensionExpectedAmount: typeof answers[ids.statePensionExpectedAmount] === 'number'
      ? (answers[ids.statePensionExpectedAmount] as number)
      : undefined,
    niQualifyingYears: NI_LABEL_TO_BAND[getStr(ids.niQualifyingYears) ?? ''] ?? '20-30',

    totalEstate: (WEALTH_LABEL_TO_BAND[getStr(ids.totalEstate) ?? ''] as WealthBand) ?? '250-500k',
    isMarriedOrCP: getStr(ids.partnership)?.startsWith('couple') ?? false,
    homeLeftToDescendants: false,
    willInPlace: getBool(ids.willLpa + '_will'),
    lpaInPlace: getBool(ids.willLpa + '_lpa'),

    riskProfile: 'balanced',
  };

  return inputs;
}

/**
 * Which new questions still need answers?
 *
 * Returns the list of input fields that are critical for the engine but
 * derived from new screens not yet live. Used by the preview route to show
 * a "readiness" bar for how complete any given submission is.
 */
export function missingFields(answers: PartialAnswersMap): string[] {
  const ids = INPUT_QUESTION_IDS;
  const missing: string[] = [];
  const required: Array<[string, string]> = [
    [ids.totalPensionValue, 'Total pension value'],
    [ids.cashSavings, 'Cash savings'],
    [ids.isaBalance, 'ISA balance'],
    [ids.giaBalance, 'GIA balance'],
    [ids.monthlySavingAmount, 'Monthly savings'],
    [ids.employerPensionContribPct, 'Employer pension contribution'],
    [ids.mortgageEndAge, 'Mortgage end age'],
    [ids.retirementSpendRatio, 'Retirement spend ratio'],
    [ids.niQualifyingYears, 'NI qualifying years'],
  ];
  for (const [qid, label] of required) {
    if (answers[qid] === undefined || answers[qid] === null || answers[qid] === '') {
      missing.push(`${qid} — ${label}`);
    }
  }
  return missing;
}
