/**
 * Inline-chart resolver for Section 4 cards.
 *
 * Each considered-list card MAY receive one inline chart, driven by the
 * card's topic/category. The summary page caps inline charts at TWO across
 * the whole list — so this returns a map of card-id → chart, and the page
 * applies the cap.
 *
 * Mapping is per the brief §4 "Chart-to-card mapping" table.
 */
import { pageValue } from '@/lib/content';
import type { ChartId, InlineChart, SummaryInputs } from './types';

const TITLES: Record<ChartId, string> = {
  income_trap_100k: 'The £100k trap',
  iht_on_3m: 'IHT on a £3m estate',
  extraction_mix: 'Extraction mix',
  compounding_line: 'The compounding line',
  drawdown_paths: 'Drawdown paths',
  badr_transition: 'BADR rate transition',
};

const CAPTIONS: Record<ChartId, string> = {
  income_trap_100k: 'The band between £100k and £125k.',
  iht_on_3m: 'What planning does to the bill.',
  extraction_mix: 'Three ways to take £100k from a company.',
  compounding_line: 'What an extra £100/month looks like over 30 years.',
  drawdown_paths: 'Same pot, two paces.',
  badr_transition: 'The cost of the date on the contract.',
};

function copyFor(id: ChartId): InlineChart {
  return {
    id,
    title: pageValue<string>('summary', `charts.titles.${id}`, TITLES[id]),
    caption: pageValue<string>('summary', `charts.captions.${id}`, CAPTIONS[id]),
  };
}

/**
 * Return the chart that matches a card's id/category, or null if no chart
 * should render on that card.
 *
 * Matches id patterns from the flag spec + segment relevance per the brief.
 */
export function chartForCard(cardId: string, inputs: SummaryInputs): InlineChart | null {
  const id = cardId.toLowerCase();

  if (/income_trap_100k|tapered_annual_allowance/.test(id)) {
    return copyFor('income_trap_100k');
  }
  if (/iht_mitigation|rnrb_taper|iht/.test(id)) {
    return copyFor('iht_on_3m');
  }
  if (/extraction_mix|extraction|director/.test(id)) {
    return copyFor('extraction_mix');
  }
  if (/pension_consolidation|carry_forward|ni_gaps|pension_iht/.test(id)) {
    return copyFor('compounding_line');
  }
  if (/badr/.test(id)) {
    return copyFor('badr_transition');
  }
  /* S7/S8 drawdown: match any retirement-flavoured flag for those segments. */
  if (
    (inputs.segmentId === 'S7' || inputs.segmentId === 'S8') &&
    /retire|drawdown|mpaa|glide/.test(id)
  ) {
    return copyFor('drawdown_paths');
  }

  return null;
}

export { TITLES as chartTitles, CAPTIONS as chartCaptions };
