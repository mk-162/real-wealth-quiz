/**
 * Emotional-state intro selector for the summary page.
 *
 * Six priority-ranked variants + a neutral fallback, per the Summary Page
 * Redesign prompt §2. First match wins — the order matters and must not be
 * rearranged without a product-voice review.
 */
import { pageValue } from '@/lib/content';
import type { EmotionalIntro, SummaryInputs } from './types';

type IntroKey =
  | 'urgency'
  | 'advised_but_looking'
  | 'money_stress'
  | 'retirement_less'
  | 's1_early'
  | 's9_hnw'
  | 'fallback';

function copyFor(id: IntroKey, fallbackCopy: string): string {
  return pageValue<string>('summary', `emotional_intros.${id}`, fallbackCopy);
}

export function selectEmotionalIntro(inputs: SummaryInputs): EmotionalIntro {
  if (inputs.urgency === 'this_week') {
    return {
      id: 'urgency',
      copy: copyFor(
        'urgency',
        "Here are the things we can start looking at straight away — we'll move as fast as you need us to.",
      ),
    };
  }
  if (inputs.currentAdviser === 'yes_but_looking') {
    return {
      id: 'advised_but_looking',
      copy: copyFor(
        'advised_but_looking',
        "Here are the things your current arrangement may not be covering — the gaps that made you start looking.",
      ),
    };
  }
  if (inputs.moneyMindset === 'stress') {
    return {
      id: 'money_stress',
      copy: copyFor(
        'money_stress',
        'Here are the things that might help untangle the money side — so the unknowns stop weighing on you.',
      ),
    };
  }
  if (inputs.retirementFeel === 'already_less_than_hoped') {
    return {
      id: 'retirement_less',
      copy: copyFor(
        'retirement_less',
        "Here are the things that can still improve the shape of retirement — even after you've stopped work.",
      ),
    };
  }
  if (inputs.segmentId === 'S1') {
    return {
      id: 's1_early',
      copy: copyFor(
        's1_early',
        'Here are the basics that usually make the biggest difference at your stage — small moves now that compound later.',
      ),
    };
  }
  if (inputs.segmentId === 'S9') {
    return {
      id: 's9_hnw',
      copy: copyFor(
        's9_hnw',
        'Here are the structural questions that usually matter most at this level — trusts, timing, and the 2027 pension change.',
      ),
    };
  }
  return {
    id: 'fallback',
    copy: copyFor(
      'fallback',
      "Here's what we noticed, based on what you told us. None of this is advice yet — it's a shortlist of conversations that would be valuable for someone in your situation.",
    ),
  };
}
