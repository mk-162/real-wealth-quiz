/**
 * Silent-gap resolver for Section 5 — the "things we didn't ask, but noticed"
 * card list.
 *
 * Twelve candidate triggers per the brief. All candidates are evaluated; the
 * top-ranked 2–3 (by segment relevance) are returned. The section only
 * renders when 2+ match — "the point is surprise, not volume".
 */
import { pageValue } from '@/lib/content';
import { estateAtLeast, incomeAtLeast, investmentsAtLeast } from './inputs';
import type { SilentGap, SummaryInputs } from './types';

type GapId =
  | 'business_spouse'
  | 'btl_mortgages'
  | 'life_change'
  | 'trusts_gifting'
  | 'auto_enrolment'
  | 'spousal_split'
  | 'bank_of_family'
  | 'vct_eis'
  | 'investment_bonds'
  | 'care_fee'
  | 'esg'
  | 'lpa_urgency';

const FALLBACKS: Record<GapId, string> = {
  business_spouse:
    'If your partner is also involved in the business, the succession and tax picture usually looks different — worth mentioning on the call.',
  btl_mortgages:
    'If any of those properties are mortgaged, the tax-deductibility rules changed significantly in 2015 — most portfolio landlords we meet are still catching up.',
  life_change:
    'You mentioned a change coming up. Whatever it is — a move, a new role, a family change — the timing of the financial planning around it usually matters as much as the event itself.',
  trusts_gifting:
    'At this level of estate, the tools that usually matter most — trusts, timed gifting, Business Relief — are the ones that take years to work properly. The earlier the conversation, the more options remain open.',
  auto_enrolment:
    "If you've ever opted out of a workplace pension to free up cash, it's usually worth revisiting — the employer contribution is often the best return you'll get on any money.",
  spousal_split:
    'How your household assets are split between you and your partner — shifting who holds what can often keep more of your returns out of the higher tax brackets.',
  bank_of_family:
    'The safest way to help children onto the property ladder or with school fees — balancing what they need now with the 7-year inheritance tax clock.',
  vct_eis:
    "Whether you've explored the alternative tax reliefs designed for high earners, which usually become relevant once your standard pension allowances are restricted.",
  investment_bonds:
    'Where to house your money once your ISAs and pensions are full — certain structures allow you to defer tax entirely until you draw the money out.',
  care_fee:
    'How care fees might eventually impact the estate, and the specific financial products designed to cap that liability before it depletes the family home.',
  esg: 'Whether the companies your money is currently backing actually align with your personal values — most investors have never looked under the bonnet.',
  lpa_urgency:
    'A Lasting Power of Attorney becomes more urgent to put in place the older you get — not because something will happen, but because the Court of Protection route takes 6+ months if it does.',
};

interface Rule {
  id: GapId;
  triggers: (i: SummaryInputs) => boolean;
  /** Higher = more likely to be surfaced when the section is capped. */
  weight: (i: SummaryInputs) => number;
}

const RULES: Rule[] = [
  {
    id: 'business_spouse',
    triggers: (i) =>
      i.workStatus === 'business_owner' && i.household.includes('partner'),
    weight: (i) => (i.segmentId === 'S5' || i.segmentId === 'S6' ? 9 : 7),
  },
  {
    id: 'btl_mortgages',
    triggers: (i) => i.otherProperty === 'two_or_more' || i.otherProperty === 'portfolio',
    weight: () => 8,
  },
  {
    id: 'life_change',
    triggers: (i) => i.intent === 'life_change',
    weight: () => 9,
  },
  {
    id: 'trusts_gifting',
    triggers: (i) => estateAtLeast(i.estateBand, '3m_to_5m'),
    weight: (i) => (i.segmentId === 'S9' ? 10 : 8),
  },
  {
    id: 'auto_enrolment',
    triggers: (i) => i.segmentId === 'S1',
    weight: () => 7,
  },
  {
    id: 'spousal_split',
    triggers: (i) =>
      i.household.includes('partner') && incomeAtLeast(i.incomeBand, '100to125k'),
    weight: () => 7,
  },
  {
    id: 'bank_of_family',
    triggers: (i) => {
      const hasOlderKids = i.household.includes('adult_children');
      const bigEstate = estateAtLeast(i.estateBand, '1m_to_2m');
      const bigCash = investmentsAtLeast(i.investmentsBand, '250k_1m');
      return hasOlderKids && (bigEstate || bigCash);
    },
    weight: () => 8,
  },
  {
    id: 'vct_eis',
    triggers: (i) => incomeAtLeast(i.incomeBand, '125to200k'),
    weight: (i) => (i.segmentId === 'S3' || i.segmentId === 'S4' ? 8 : 6),
  },
  {
    id: 'investment_bonds',
    triggers: (i) =>
      investmentsAtLeast(i.investmentsBand, '50to250k') &&
      incomeAtLeast(i.incomeBand, '100to125k'),
    weight: () => 6,
  },
  {
    id: 'care_fee',
    triggers: (i) =>
      (i.age !== null && i.age > 65) || i.household.includes('elderly_parent'),
    weight: (i) => (i.segmentId === 'S7' || i.segmentId === 'S8' ? 9 : 7),
  },
  {
    id: 'esg',
    triggers: (i) =>
      i.wealthDefinition === 'legacy' ||
      i.moneyMindset === 'tool_freedom' ||
      i.moneyMindset === 'scorecard',
    weight: () => 5,
  },
  {
    id: 'lpa_urgency',
    triggers: (i) =>
      (i.age !== null && i.age >= 55) && i.willAndLpaStatus.includes('lpa_unsure'),
    weight: (i) => ((i.age ?? 0) >= 65 ? 9 : 7),
  },
];

function copyFor(id: GapId): string {
  return pageValue<string>('summary', `silent_gaps.prompts.${id}`, FALLBACKS[id]);
}

export function selectSilentGaps(inputs: SummaryInputs): SilentGap[] {
  const max = pageValue<number>('summary', 'silent_gaps.max_cards', 3);
  const scored = RULES
    .filter((r) => r.triggers(inputs))
    .map((r) => ({ id: r.id, weight: r.weight(inputs) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, max);

  return scored.map(({ id }) => ({ id, body: copyFor(id) }));
}
