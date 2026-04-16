/**
 * Spotlight compound-flag resolver. Returns the single most relevant compound
 * flag for the user, or null if none triggers.
 *
 * Priority order (v1.0 demo — first match wins):
 *   1. Sandwich Generation     — dependent children AND elderly parent
 *   2. Business Owner, No Exit — business owner AND no-plan succession
 *   3. High-Earner, Low-Pension — £100k+ AND none/one pension pot
 *   4. Mortgage + High Cash    — mortgage AND £50k+ investments AND £50k+ income
 *
 * Copy is sourced from content/pages/summary.md spotlight_flags.
 */
import { pageValue } from '@/lib/content';
import { incomeAtLeast, investmentsAtLeast } from './inputs';
import type { SpotlightFlag, SummaryInputs } from './types';

interface Candidate {
  id: 'sandwich_generation' | 'business_no_exit' | 'high_earner_low_pension' | 'mortgage_and_high_cash';
  fallback: Omit<SpotlightFlag, 'id' | 'triggerAnswerIds'>;
  triggers: (i: SummaryInputs) => string[] | null;
}

const FALLBACKS = {
  sandwich_generation: {
    eyebrow: 'THE SANDWICH GENERATION',
    headline: 'The planning group we see most stretched for time.',
    body: 'Supporting children and a parent at the same time is the planning group we see most stretched for time. The right legal and protection documents matter more here than anywhere.',
    close: 'Worth a conversation.',
  },
  business_no_exit: {
    eyebrow: 'ACROSS YOUR ANSWERS',
    headline: 'Most business sales take 18–24 months.',
    body: 'Most business sales take 18–24 months from decision to close. Starting the conversation early usually changes the outcome more than starting it late.',
    close: 'Worth a conversation.',
  },
  high_earner_low_pension: {
    eyebrow: 'SOMETHING WE NOTICED',
    headline: "The most valuable tax relief you're not using.",
    body: "At your income level, the pension annual allowance is one of the most valuable tax reliefs available — but only if you're using it.",
    close: 'Worth a conversation.',
  },
  mortgage_and_high_cash: {
    eyebrow: 'ACROSS YOUR ANSWERS',
    headline: 'You have cash and you have a mortgage.',
    body: 'You have cash and you have a mortgage — the comparison between the two rates is often worth sitting down with.',
    close: 'Worth a conversation.',
  },
} as const satisfies Record<Candidate['id'], Omit<SpotlightFlag, 'id' | 'triggerAnswerIds'>>;

const CANDIDATES: Candidate[] = [
  {
    id: 'sandwich_generation',
    fallback: FALLBACKS.sandwich_generation,
    triggers: (i) => {
      const hasChildren = i.household.includes('dependent_children');
      const hasParent = i.household.includes('elderly_parent');
      return hasChildren && hasParent ? ['household.dependent_children', 'household.elderly_parent'] : null;
    },
  },
  {
    id: 'business_no_exit',
    fallback: FALLBACKS.business_no_exit,
    triggers: (i) => {
      const isBusinessOwner = i.workStatus === 'business_owner';
      const noPlan = i.succession === 'no_plan_thinking' || i.succession === 'no_plan_low';
      return isBusinessOwner && noPlan
        ? ['work_status.business_owner', `succession.${i.succession}`]
        : null;
    },
  },
  {
    id: 'high_earner_low_pension',
    fallback: FALLBACKS.high_earner_low_pension,
    triggers: (i) => {
      const highEarner = incomeAtLeast(i.incomeBand, '100to125k');
      const lowPots = i.pensionPots === 'none' || i.pensionPots === 'one';
      return highEarner && lowPots
        ? [`income_band.${i.incomeBand}`, `pension_pots.${i.pensionPots}`]
        : null;
    },
  },
  {
    id: 'mortgage_and_high_cash',
    fallback: FALLBACKS.mortgage_and_high_cash,
    triggers: (i) => {
      const mortgage = i.mainHome === 'own_mortgage';
      const cash = investmentsAtLeast(i.investmentsBand, '50to250k');
      const income = incomeAtLeast(i.incomeBand, '50to100k');
      return mortgage && cash && income
        ? ['main_home.own_mortgage', `investments_band.${i.investmentsBand}`, `income_band.${i.incomeBand}`]
        : null;
    },
  },
];

function copyFor(id: Candidate['id'], key: keyof Omit<SpotlightFlag, 'id' | 'triggerAnswerIds'>): string {
  const fallback = FALLBACKS[id][key];
  return pageValue<string>('summary', `spotlight_flags.${id}.${key}`, fallback);
}

export function selectSpotlightFlag(inputs: SummaryInputs): SpotlightFlag | null {
  for (const c of CANDIDATES) {
    const trigger = c.triggers(inputs);
    if (trigger) {
      return {
        id: c.id,
        eyebrow: copyFor(c.id, 'eyebrow'),
        headline: copyFor(c.id, 'headline'),
        body: copyFor(c.id, 'body'),
        close: copyFor(c.id, 'close'),
        triggerAnswerIds: trigger,
      };
    }
  }
  return null;
}
