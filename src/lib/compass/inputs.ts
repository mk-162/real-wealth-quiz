/**
 * Session answers → CompassInputs transformer.
 *
 * Maps the Wealth Conversation's localStorage session shape into the strict
 * CompassInputs shape the projection engine consumes. This is the boundary
 * where banded answers stop being strings tagged to question IDs and start
 * being typed fields the engine understands.
 *
 * KEY DETAIL: the runtime `session.answers` map is keyed by the screen
 * `input.id` (lowercase snake_case, e.g. `income_band`, `age`, `pension_pots`)
 * — NOT by the Q-ref codes from the segment master. Every pointer in this
 * module uses the actual runtime id.
 *
 * The 4 Compass data screens (`4.E.1`..`4.E.4`) introduce the new
 * `pension_total_value`, `cash_savings_band`, `isa_balance_band`,
 * `gia_balance_band`, `monthly_saving_band`, `employer_pension_pct_band`,
 * `mortgage_monthly_payment_band`, `mortgage_end_age_band`,
 * `state_pension_amount_band`, `ni_qualifying_years_band`, and
 * `retirement_spend_ratio` inputs. All are handled here.
 *
 * See `docs/PHASE_1_NOTES.md` for the activation plan.
 */

import type {
  CompassInputs,
  IncomeBand,
  WealthBand,
  SpendBand,
  ContribPctBand,
  NIYearsBand,
  MortgageEndBand,
  RetirementSpendRatio,
} from './types';

// -----------------------------------------------------------------------------
// Runtime input-id → CompassInputs-field map
//
// Every id below is the `inputs[*].id` string from a `content/screens/*.md`
// file's frontmatter. session.answers[id] holds the raw user response.
// -----------------------------------------------------------------------------

export const INPUT_QUESTION_IDS = {
  // §1 Personal (3.3, 3.4, 4.A.5, 4.C.1, 4.B.1)
  currentAge: 'age',                              // slider, number
  household: 'household',                          // multi_select array
  workStatus: 'work_status',
  happyPlace: 'happy_place',                       // short_text
  targetRetirementAge: 'target_retirement_age',    // slider, number
  dependencyHorizon: 'dependency_horizon',

  // §2 Wealth — Money today + Assets snapshot (3.5, 4.A.3)
  householdGrossIncome: 'income_band',
  totalEstate: 'estate_band',
  earnersOneOrTwo: 'earners_one_or_two',
  mainHome: 'main_home',
  mortgageBalance: 'mortgage_balance',             // under 4.A.3 — a BAND, not a number
  pensionPots: 'pension_pots',
  pensionTotalBandOld: 'pension_total_band',       // legacy compound band inside 4.A.3
  investmentsBand: 'investments_band',
  otherProperty: 'other_property',

  // §3 Monthly shape (4.A.1)
  essentialMonthlySpend: 'essential_monthly_spend',
  nonEssentialMonthlySpend: 'non_essential_monthly_spend',

  // §4 Legacy / Will / LPA (4.B.2)
  passingOnIntent: 'passing_on_intent',
  willAndLpaStatus: 'will_and_lpa_status',         // multi_select array

  // §5 Protection (4.B.3)
  earningsProtectionScale: 'earnings_protection_scale',
  lifeCoverStatus: 'life_cover_status',

  // §6 Retirement horizon (4.C.1, 4.C.2)
  retirementFeel: 'retirement_feel',
  statePensionAwareness: 'state_pension_awareness',

  // §7 Business branch (4.C1.1, 4.C1.2)
  role: 'role',
  businessValue: 'business_value_band',
  extractionMix: 'extraction_mix',
  succession: 'succession',

  // §8 NEW Compass screens (4.E.1 → 4.E.4)
  pensionTotalValue: 'pension_total_value',
  cashSavings: 'cash_savings_band',
  isaBalance: 'isa_balance_band',
  giaBalance: 'gia_balance_band',
  monthlySaving: 'monthly_saving_band',
  employerPensionPct: 'employer_pension_pct_band',
  ownPensionPct: 'own_pension_pct_band',
  mortgageMonthlyPayment: 'mortgage_monthly_payment_band',
  mortgageEndAge: 'mortgage_end_age_band',
  statePensionAmount: 'state_pension_amount_band',
  niQualifyingYears: 'ni_qualifying_years_band',
  retirementSpendRatio: 'retirement_spend_ratio',
} as const;

// -----------------------------------------------------------------------------
// Band-label ↔ field-value maps.
//
// Screen frontmatter uses compact option values; the engine wants typed bands.
// These tables bridge — kept separate so each screen's label-set can be
// understood in isolation.
// -----------------------------------------------------------------------------

/** Income band — screen 3.5 `income_band`. */
const INCOME_LABEL_TO_BAND: Record<string, IncomeBand> = {
  lt50k: '<50k',
  '50to100k': '50-100k',
  '100to125k': '100-125k',
  '125to200k': '125-200k',
  gt200k: '200k+',
};

/** Wealth bands for 4.E.1 pension + 4.E.2 liquid-wealth + 4.A.3 investments. */
const WEALTH_LABEL_TO_BAND: Record<string, WealthBand | 0> = {
  none: 0,
  lt25k: '<25k',
  '25to100k': '25-100k',
  '100to250k': '100-250k',
  '250to500k': '250-500k',
  '500kto1m': '500k-1m',
  '1to2m': '1-2m',
  '2to3m': '2-3m',
  gt3m: '3m+',

  // 4.E.2 cash/ISA/GIA bands top out earlier — map the gt* to highest sensible slot.
  gt250k: '250-500k', // cash savings cap — treat as mid of the open tail
  gt500k: '500k-1m',  // ISA/GIA cap

  // 4.A.3 investments_band compact labels
  lt50k: '<25k',            // "under £50k" — nudged down one band to stay conservative
  '50k_to_250k': '100-250k',
  '250k_to_1m': '500k-1m',
  '1m_to_3m': '2-3m',
};

/** Estate band — screen 3.5 `estate_band` (underscore format, not `250to500k`). */
const ESTATE_LABEL_TO_BAND: Record<string, WealthBand> = {
  lt500k: '250-500k',
  '500k_to_1m': '500k-1m',
  '1m_to_2m': '1-2m',
  '2m_to_3m': '2-3m',
  '3m_to_5m': '3m+',
  gt5m: '3m+',
};

/** Business value band — screen 4.C1.1 `business_value_band`. Only answered
 *  when `work_status == business_owner`. `WealthBand | 0` matches the shape
 *  of `CompassInputs.businessValue`, so `prefer_not` / `no_idea` / missing
 *  all fall back to `0`. */
const BUSINESS_LABEL_TO_BAND: Record<string, WealthBand | 0> = {
  lt25k: '<25k',
  '25k_to_100k': '25-100k',
  '100k_to_250k': '100-250k',
  '250k_to_500k': '250-500k',
  '500k_to_1m': '500k-1m',
  '1m_to_2m': '1-2m',
  '2m_to_3m': '2-3m',
  gt3m: '3m+',
};

/** Mortgage balance — 4.A.3 `mortgage_balance` (compound compact labels). */
const MORTGAGE_BAL_LABEL_TO_BAND: Record<string, WealthBand | 0> = {
  lt100k: '<25k',          // "under £100k" is wider than <25k, but the engine's own
                           // "<25k" band midpoint is only 12.5k — safer would be 25-100k:
                           // keep it simple — map to 25-100k to represent midpoint ~£62k.
  '100k_to_250k': '100-250k',
  '250k_to_500k': '250-500k',
  gt500k: '500k-1m',
};
// NB: overwrite lt100k above so the common case ends up in 25-100k not <25k.
MORTGAGE_BAL_LABEL_TO_BAND.lt100k = '25-100k';

/** Legacy pension_total_band (4.A.3 compound reveal) — mostly same compact labels. */
const PENSION_LEGACY_LABEL_TO_BAND: Record<string, WealthBand | 0> = {
  lt100k: '25-100k',
  '100k_to_250k': '100-250k',
  '250k_to_500k': '250-500k',
  gt500k: '500k-1m',
};

/** Monthly-saving band — 4.E.3 `monthly_saving_band`. */
const SAVING_LABEL_TO_BAND: Record<string, SpendBand> = {
  lt1500: '<1.5k',
  '1500to3000': '1.5-3k',
  '3000to5000': '3-5k',
  '5000to8000': '5-8k',
  gt8000: '8k+',
};

/** Essential monthly spend — 4.A.1 `essential_monthly_spend`. */
const ESSENTIAL_SPEND_LABEL_TO_BAND: Record<string, SpendBand> = {
  lt2k: '1.5-3k',          // <£2k straddles both <1.5k and 1.5-3k; pick the larger.
  '2to3_5k': '1.5-3k',
  '3_5to5k': '3-5k',
  '5to7_5k': '5-8k',
  '7_5to12k': '8k+',
  gt12k: '8k+',
};

/** Non-essential monthly spend — 4.A.1 `non_essential_monthly_spend`. */
const NON_ESSENTIAL_SPEND_LABEL_TO_BAND: Record<string, SpendBand> = {
  lt500: '<1.5k',
  '500to1k': '<1.5k',
  '1k_to_2k': '1.5-3k',
  '2k_to_4k': '3-5k',
  gt4k: '5-8k',
};

/** Mortgage monthly payment — 4.E.3 `mortgage_monthly_payment_band`. */
const MORTGAGE_PAYMENT_LABEL_TO_BAND: Record<string, SpendBand> = {
  lt1500: '<1.5k',
  '1500to3000': '1.5-3k',
  '3000to5000': '3-5k',
  gt5000: '5-8k',
};

/** Employer pension contribution — 4.E.3 `employer_pension_pct_band`. */
const CONTRIB_LABEL_TO_BAND: Record<string, ContribPctBand> = {
  '0to3': '0-3',
  '3to5': '3-5',
  '5to10': '5-10',
  '10plus': '10+',
  unsure: 'unsure',
  not_applicable: 'unsure',
};

/** NI qualifying years — 4.E.4 `ni_qualifying_years_band`. */
const NI_LABEL_TO_BAND: Record<string, NIYearsBand> = {
  lt10: '<10',
  '10to20': '10-20',
  '20to30': '20-30',
  '30to35': '30-35',
  gte35: '35+',
};

/** Mortgage end age — 4.E.3 `mortgage_end_age_band`. */
const MORTGAGE_END_LABEL_TO_BAND: Record<string, MortgageEndBand> = {
  under_55: 'under_55',
  '55_65': '55_65',
  '65_75': '65_75',
  paid: 'paid',
};

/** Retirement spend ratio — 4.E.4 `retirement_spend_ratio`. */
const RETIREMENT_SPEND_LABEL_TO_BAND: Record<string, RetirementSpendRatio> = {
  less: 'less',
  same: 'same',
  more: 'more',
};

/**
 * State pension expected amount — 4.E.4 `state_pension_amount_band`.
 * Maps the band to an annual £ number; `no_idea` returns `undefined`
 * so the engine falls through to its default (2025/26 full rate).
 */
const STATE_PENSION_AMOUNT_TO_ANNUAL: Record<string, number | undefined> = {
  full_rate: 11_502,
  partial: 8_000,
  none: 0,
  no_idea: undefined,
};

// -----------------------------------------------------------------------------
// Session-answers shape (what we accept)
// -----------------------------------------------------------------------------

export interface PartialAnswersMap {
  [inputId: string]: string | number | boolean | string[] | undefined | null;
}

// -----------------------------------------------------------------------------
// Main builder
// -----------------------------------------------------------------------------

export function buildCompassInputs(answers: PartialAnswersMap): CompassInputs {
  const ids = INPUT_QUESTION_IDS;

  // -------- Accessors --------------------------------------------------------

  const getStr = (k: string): string | undefined => {
    const v = answers[k];
    return typeof v === 'string' && v !== '' ? v : undefined;
  };
  const getNum = (k: string, fallback: number): number => {
    const v = answers[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    // Slider answers can arrive as numeric strings after a round-trip through JSON.
    if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v))) return Number(v);
    return fallback;
  };
  const getArr = (k: string): string[] => {
    const v = answers[k];
    return Array.isArray(v) ? (v.filter((x) => typeof x === 'string') as string[]) : [];
  };

  /** Look up a value in a band table. If it's a "prefer_not" / "no_idea" / missing answer, return the fallback. */
  function lookup<T>(table: Record<string, T>, raw: string | undefined, fallback: T): T {
    if (raw === undefined) return fallback;
    if (raw === 'prefer_not' || raw === 'prefer_not_to_say' || raw === 'no_idea' || raw === 'not_sure') {
      return fallback;
    }
    const mapped = table[raw];
    return mapped === undefined ? fallback : mapped;
  }

  /** Wealth band lookup with graceful fallback. */
  function wealth(k: string, fallback: WealthBand | 0 = 0): WealthBand | 0 {
    return lookup(WEALTH_LABEL_TO_BAND, getStr(k), fallback);
  }

  // -------- Household flags --------------------------------------------------

  const household = getArr(ids.household);
  const partnerPresent = household.includes('partner');
  const hasDependentChildren = household.includes('dependent_children');
  const hasElderlyParents = household.includes('elderly_parent');

  // -------- Home-ownership gating -------------------------------------------

  const mainHomeAnswer = getStr(ids.mainHome);
  const isHomeOwner = mainHomeAnswer === 'own_outright' || mainHomeAnswer === 'own_mortgage';
  const hasMortgage = mainHomeAnswer === 'own_mortgage';
  const isRenting = mainHomeAnswer === 'rent' || mainHomeAnswer === 'with_family';

  // -------- Business-owner gating -------------------------------------------
  const isBusinessOwner = getStr(ids.workStatus) === 'business_owner';

  // Main home value — we don't have a direct question for it on the live form.
  // Fall back to the estate band as a coarse proxy when the client owns.
  const estateRaw = getStr(ids.totalEstate);
  const estateBand: WealthBand = lookup(ESTATE_LABEL_TO_BAND, estateRaw, '250-500k');
  const mainHomeValue: WealthBand | 0 = isHomeOwner
    ? estimateHomeValueFromEstate(estateBand)
    : 0;

  // Other property — if the 4.A.4 screen fired we can upgrade. Default 0.
  const otherProp = getStr(ids.otherProperty);
  const otherPropertyValue: WealthBand | 0 =
    otherProp === 'one_other' ? '250-500k'
      : otherProp === 'two_or_more' ? '500k-1m'
      : otherProp === 'portfolio' ? '1-2m'
      : 0;

  // -------- Mortgage end age -------------------------------------------------

  let mortgageEndAge: MortgageEndBand;
  if (isRenting) {
    mortgageEndAge = 'renting';
  } else if (!hasMortgage) {
    mortgageEndAge = 'paid';
  } else {
    mortgageEndAge = lookup(MORTGAGE_END_LABEL_TO_BAND, getStr(ids.mortgageEndAge), '55_65');
  }

  // -------- Main home mortgage balance --------------------------------------

  const mainHomeMortgageBalance: WealthBand | 0 = hasMortgage
    ? lookup(MORTGAGE_BAL_LABEL_TO_BAND, getStr(ids.mortgageBalance), '100-250k')
    : 0;

  // -------- Pensions ---------------------------------------------------------

  const pensionPotsRaw = getStr(ids.pensionPots);
  // If the 4.E.1 screen fired it overrides everything.
  const pensionDirect = getStr(ids.pensionTotalValue);
  const pensionLegacy = getStr(ids.pensionTotalBandOld);
  let totalPensionValue: WealthBand | 0;
  if (pensionDirect !== undefined) {
    totalPensionValue = lookup(WEALTH_LABEL_TO_BAND, pensionDirect, '<25k');
  } else if (pensionLegacy !== undefined) {
    totalPensionValue = lookup(PENSION_LEGACY_LABEL_TO_BAND, pensionLegacy, '<25k');
  } else if (pensionPotsRaw === 'none') {
    totalPensionValue = 0;
  } else if (pensionPotsRaw === 'one') {
    totalPensionValue = '25-100k';
  } else if (pensionPotsRaw === 'two_three') {
    totalPensionValue = '100-250k';
  } else if (pensionPotsRaw === 'four_six' || pensionPotsRaw === 'more_than_six') {
    totalPensionValue = '250-500k';
  } else {
    totalPensionValue = '<25k';
  }

  // -------- Liquid wealth (cash / ISA / GIA) --------------------------------

  // If the 4.E.2 screen fired we have direct bands. Otherwise split the legacy
  // investments_band roughly 1/3-1/3-1/3 between cash/ISA/GIA.
  const legacyInvestmentsRaw = getStr(ids.investmentsBand);
  const hasDirectLiquid =
    answers[ids.cashSavings] !== undefined ||
    answers[ids.isaBalance] !== undefined ||
    answers[ids.giaBalance] !== undefined;

  let cashSavings: WealthBand | 0;
  let isaBalance: WealthBand | 0;
  let giaBalance: WealthBand | 0;
  if (hasDirectLiquid) {
    cashSavings = wealth(ids.cashSavings, '<25k');
    isaBalance = wealth(ids.isaBalance, 0);
    giaBalance = wealth(ids.giaBalance, 0);
  } else if (legacyInvestmentsRaw !== undefined) {
    // Legacy investments_band is the combined lump — attribute to ISA by default.
    isaBalance = lookup(WEALTH_LABEL_TO_BAND, legacyInvestmentsRaw, 0);
    cashSavings = '<25k';
    giaBalance = 0;
  } else {
    cashSavings = '<25k';
    isaBalance = 0;
    giaBalance = 0;
  }

  // -------- Will / LPA flags -------------------------------------------------

  const willLpa = getArr(ids.willAndLpaStatus);
  const willInPlace = willLpa.includes('will_fresh') || willLpa.includes('will_old');
  const lpaInPlace = willLpa.includes('lpa_health') || willLpa.includes('lpa_finance');

  // -------- State pension awareness & amount --------------------------------

  const awarenessRaw = getStr(ids.statePensionAwareness);
  const statePensionKnown: 'yes' | 'no' | 'partial' = mapStatePensionAwareness(awarenessRaw);

  const spAmountRaw = getStr(ids.statePensionAmount);
  const statePensionExpectedAmount: number | undefined =
    spAmountRaw !== undefined
      ? STATE_PENSION_AMOUNT_TO_ANNUAL[spAmountRaw]
      : typeof answers[ids.statePensionAmount] === 'number'
        ? (answers[ids.statePensionAmount] as number)
        : undefined;

  // -------- Legacy / IHT flags ----------------------------------------------

  const passingOn = getStr(ids.passingOnIntent);
  const homeLeftToDescendants = isHomeOwner &&
    (passingOn === 'max_family' || passingOn === 'boost' || passingOn === undefined);

  // -------- Final assembly ---------------------------------------------------

  const inputs: CompassInputs = {
    // §1 Personal
    currentAge: getNum(ids.currentAge, 45),
    targetRetirementAge: getNum(ids.targetRetirementAge, 65),
    partnerPresent,
    hasDependentChildren,
    hasElderlyParents,

    // §2 Wealth
    mainHomeValue,
    otherPropertyValue,
    totalPensionValue,
    cashSavings,
    isaBalance,
    giaBalance,
    // Business value — only surfaced on 4.C1.1 when work_status == business_owner.
    // Non-owners, prefer_not, and no_idea all collapse to 0 so the engine's tile
    // scoring (business concentration, exit-vs-income-mix) remains conservative
    // when the signal is absent.
    businessValue: isBusinessOwner
      ? lookup(BUSINESS_LABEL_TO_BAND, getStr(ids.businessValue), 0)
      : 0,
    otherAssets: 0,

    mainHomeMortgageBalance,
    otherPropertyMortgageBalance: 0,
    personalLoans: 0,
    creditCardDebt: 0,

    // §3 Income
    householdGrossIncome: lookup(INCOME_LABEL_TO_BAND, getStr(ids.householdGrossIncome), '50-100k'),
    isScottishTaxpayer: false,
    monthlySavingAmount: lookup(SAVING_LABEL_TO_BAND, getStr(ids.monthlySaving), '<1.5k'),
    employerPensionContribPct: lookup(CONTRIB_LABEL_TO_BAND, getStr(ids.employerPensionPct), 'unsure'),
    ownPensionContribPct: lookup(CONTRIB_LABEL_TO_BAND, getStr(ids.ownPensionPct), 'unsure'),

    // §4 Expenses
    essentialMonthlySpend: lookup(ESSENTIAL_SPEND_LABEL_TO_BAND, getStr(ids.essentialMonthlySpend), '1.5-3k'),
    nonEssentialMonthlySpend: lookup(NON_ESSENTIAL_SPEND_LABEL_TO_BAND, getStr(ids.nonEssentialMonthlySpend), '<1.5k'),
    retirementSpendRatio: lookup(RETIREMENT_SPEND_LABEL_TO_BAND, getStr(ids.retirementSpendRatio), 'same'),

    // §5 Mortgage
    mortgageMonthlyPayment: hasMortgage
      ? lookup(MORTGAGE_PAYMENT_LABEL_TO_BAND, getStr(ids.mortgageMonthlyPayment), '1.5-3k')
      : undefined,
    mortgageEndAge,

    // §6 State pension / NI
    statePensionKnown,
    statePensionExpectedAmount,
    niQualifyingYears: lookup(NI_LABEL_TO_BAND, getStr(ids.niQualifyingYears), '20-30'),

    // §8 Legacy
    totalEstate: estateBand,
    isMarriedOrCP: partnerPresent,
    homeLeftToDescendants,
    willInPlace,
    lpaInPlace,

    // §9 Protection signals (screen 4.B.3 — fires only for certain segments)
    lifeCoverStatus: mapLifeCoverStatus(getStr(ids.lifeCoverStatus)),
    earningsProtectionConfidence: mapEarningsProtection(getNum(ids.earningsProtectionScale, 0)),

    // §10 Assumptions
    riskProfile: 'balanced',
  };

  return inputs;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Heuristic: when the client owns a home but we have no direct home-value
 * question, use the estate-band to apportion a plausible home value. This
 * assumes the home is roughly half the estate at the low end, tapering to
 * a third at the high end.
 */
function estimateHomeValueFromEstate(estate: WealthBand): WealthBand | 0 {
  switch (estate) {
    case '<25k':
    case '25-100k':
    case '100-250k':
      return '100-250k';
    case '250-500k':
      return '250-500k';
    case '500k-1m':
      return '250-500k';
    case '1-2m':
      return '500k-1m';
    case '2-3m':
      return '1-2m';
    case '3m+':
      return '1-2m';
    default:
      return '250-500k';
  }
}

function mapLifeCoverStatus(
  raw: string | undefined,
): CompassInputs['lifeCoverStatus'] {
  if (raw === undefined) return undefined;
  const allowed = ['through_work_only', 'personal_policy', 'both', 'no'] as const;
  if ((allowed as readonly string[]).includes(raw)) {
    return raw as CompassInputs['lifeCoverStatus'];
  }
  return 'unknown'; // covers 'not_sure' and any future values
}

function mapEarningsProtection(raw: number): CompassInputs['earningsProtectionConfidence'] {
  if (raw < 1 || raw > 5) return undefined;
  return raw as 1 | 2 | 3 | 4 | 5;
}

function mapStatePensionAwareness(raw: string | undefined): 'yes' | 'no' | 'partial' {
  if (raw === 'yes_checked') return 'yes';
  if (raw === 'roughly') return 'partial';
  if (raw === 'no_should_check' || raw === 'not_relevant_yet') return 'no';
  return 'no';
}

// -----------------------------------------------------------------------------
// Readiness — which live inputs the engine still needs for a complete reading.
// -----------------------------------------------------------------------------

/**
 * Return the labels of live-form inputs that are missing from the session but
 * that the engine relies on for a fully grounded projection. Used by the
 * preview route to show a "readiness" bar for how complete any given submission is.
 */
export function missingFields(answers: PartialAnswersMap): string[] {
  const ids = INPUT_QUESTION_IDS;
  const missing: string[] = [];
  const required: Array<[string, string]> = [
    [ids.currentAge, 'Age'],
    [ids.targetRetirementAge, 'Target retirement age'],
    [ids.householdGrossIncome, 'Household income'],
    [ids.totalEstate, 'Total estate'],
    [ids.pensionTotalValue, 'Pension total value'],
    [ids.cashSavings, 'Cash savings'],
    [ids.isaBalance, 'ISA balance'],
    [ids.giaBalance, 'GIA balance'],
    [ids.monthlySaving, 'Monthly saving'],
    [ids.employerPensionPct, 'Employer pension %'],
    [ids.essentialMonthlySpend, 'Essential monthly spend'],
    [ids.nonEssentialMonthlySpend, 'Non-essential monthly spend'],
    [ids.retirementSpendRatio, 'Retirement spend ratio'],
    [ids.niQualifyingYears, 'NI qualifying years'],
    [ids.statePensionAmount, 'State pension amount'],
    [ids.willAndLpaStatus, 'Will / LPA status'],
  ];
  for (const [inputId, label] of required) {
    const v = answers[inputId];
    if (v === undefined || v === null || v === '') {
      missing.push(`${inputId} — ${label}`);
    } else if (Array.isArray(v) && v.length === 0) {
      missing.push(`${inputId} — ${label}`);
    }
  }
  return missing;
}
