/**
 * Normalise the persisted session's `answers` record into the narrowly-typed
 * `SummaryInputs` shape consumed by the summary-page resolvers.
 *
 * Every field is nullable — the summary page must render gracefully for
 * partial sessions (e.g. someone who skipped the retirement horizon).
 */
import type { Session } from '@/lib/questionnaire/session';
import type { SummaryInputs } from './types';

function toString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}
function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}
function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim().length > 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function buildSummaryInputs(
  session: Session | null,
  segmentId: string,
  overrides: Partial<Pick<SummaryInputs, 'urgency' | 'currentAdviser' | 'happyPlace'>> = {},
): SummaryInputs {
  const a = session?.answers ?? {};
  return {
    segmentId,
    age: toNumber(a.age),
    household: toStringArray(a.household),
    workStatus: toString(a.work_status),
    wealthDefinition: toString(a.wealth_definition),
    happyPlace: overrides.happyPlace ?? toString(a.happy_place),
    incomeBand: toString(a.income_band),
    moneyMindset: toString(a.money_mindset),
    mainHome: toString(a.main_home),
    otherProperty: toString(a.other_property),
    pensionPots: toString(a.pension_pots),
    investmentsBand: toString(a.investments_band),
    estateBand: toString(a.estate_band),
    succession: toString(a.succession),
    willAndLpaStatus: toStringArray(a.will_and_lpa_status),
    passingOnIntent: toString(a.passing_on_intent),
    targetRetirementAge: toNumber(a.target_retirement_age),
    retirementFeel: toString(a.retirement_feel),
    statePensionAwareness: toString(a.state_pension_awareness),
    earningsProtectionScale: toNumber(a.earnings_protection_scale),
    lifeCoverStatus: toString(a.life_cover_status),
    currentAdviser: overrides.currentAdviser ?? toString(a.current_adviser),
    urgency: overrides.urgency ?? toString(a.urgency),
    intent: toString(a.intent),
    lifeChangeText: toString(a.life_change_text),
  };
}

/** Income bands in ascending order — used by at-least comparisons. */
const INCOME_ORDER: string[] = ['lt50k', '50to100k', '100to125k', '125to200k', 'gt200k'];
export function incomeAtLeast(band: string | null, minBand: string): boolean {
  if (!band) return false;
  const idx = INCOME_ORDER.indexOf(band);
  const min = INCOME_ORDER.indexOf(minBand);
  return idx >= 0 && min >= 0 && idx >= min;
}

/** Estate bands in ascending order. */
const ESTATE_ORDER: string[] = ['lt500k', '500k_to_1m', '1m_to_2m', '2m_to_3m', '3m_to_5m', 'gt5m'];
export function estateAtLeast(band: string | null, minBand: string): boolean {
  if (!band) return false;
  const idx = ESTATE_ORDER.indexOf(band);
  const min = ESTATE_ORDER.indexOf(minBand);
  return idx >= 0 && min >= 0 && idx >= min;
}

/** Investments/cash bands in ascending order. */
const INVEST_ORDER: string[] = ['lt50k', '50to250k', '250k_1m', '1m_3m', 'gt3m'];
export function investmentsAtLeast(band: string | null, minBand: string): boolean {
  if (!band) return false;
  const idx = INVEST_ORDER.indexOf(band);
  const min = INVEST_ORDER.indexOf(minBand);
  return idx >= 0 && min >= 0 && idx >= min;
}
