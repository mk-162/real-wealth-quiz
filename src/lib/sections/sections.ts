/**
 * Section metadata for the questionnaire's left-rail nav.
 * One entry per Compass-style section with a short label and a
 * lucide-ish glyph name — the SectionNav component resolves the glyph.
 */
import type { QuestionSection } from '../questions/catalogue';

export interface SectionMeta {
  id: QuestionSection;
  step: number; /* 1-based ordinal displayed in the kicker, e.g. "STEP 03 — ASSETS". */
  label: string; /* Short title for the side-nav. */
  kicker: string; /* Short phrase shown above the serif stem on the left column. */
  /** Supporting image for the left column (Unsplash CDN — free, rights permissive). */
  image?: string;
  /** Italic pullquote shown below the stem on text-heavy questions. */
  pullquote?: string;
}

export const sections: SectionMeta[] = [
  {
    id: 'set_the_tone',
    step: 1,
    label: 'Welcome',
    kicker: 'STEP 01 — WELCOME',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    pullquote:
      '“Real wealth isn’t about the numbers in a ledger, but the sovereignty of your time and the breadth of your legacy.”',
  },
  {
    id: 'life_shape',
    step: 2,
    label: 'Your life',
    kicker: 'STEP 02 — YOUR LIFE',
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    pullquote:
      '“A plan is only useful if it knows who it’s for. Tell us about the people at the centre of yours.”',
  },
  {
    id: 'money_today',
    step: 3,
    label: 'Money today',
    kicker: 'STEP 03 — MONEY TODAY',
    image:
      'https://images.unsplash.com/photo-1515165562835-c3b8c8e5f1d3?auto=format&fit=crop&w=1200&q=80',
    pullquote:
      '“Where you are now is the start of the picture — not a judgement, just a starting line.”',
  },
  {
    id: 'assets',
    step: 4,
    label: 'Assets',
    kicker: 'STEP 04 — ASSETS',
    image:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    pullquote:
      '“Property, pensions, investments — the shapes your money has taken so far. Each tells its own story.”',
  },
  {
    id: 'business',
    step: 5,
    label: 'Business',
    kicker: 'STEP 05 — YOUR BUSINESS',
    image:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    pullquote:
      '“Succession is not a transaction. It is a continuation.”',
  },
  {
    id: 'people_and_legacy',
    step: 6,
    label: 'People & legacy',
    kicker: 'STEP 06 — PEOPLE & LEGACY',
    image:
      'https://images.unsplash.com/photo-1559664953-ba98316f4c9b?auto=format&fit=crop&w=1200&q=80',
    pullquote:
      '“Who matters, and what you’d like to leave them with. The quiet heart of a plan.”',
  },
  {
    id: 'retirement_horizon',
    step: 7,
    label: 'Retirement',
    kicker: 'STEP 07 — RETIREMENT',
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    pullquote:
      '“Not the day you stop — the day you could stop if you wanted to.”',
  },
  {
    id: 'protection',
    step: 8,
    label: 'Protection',
    kicker: 'STEP 08 — PROTECTION',
  },
  {
    id: 'advice_today',
    step: 9,
    label: 'Advice',
    kicker: 'STEP 09 — ADVICE TODAY',
  },
  {
    id: 'priorities',
    step: 10,
    label: 'Priorities',
    kicker: 'STEP 10 — PRIORITIES',
    image:
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
    pullquote:
      '“If you could only act on one thing this year — what would matter most?”',
  },
];

export function sectionMeta(id: QuestionSection): SectionMeta | undefined {
  return sections.find((s) => s.id === id);
}
