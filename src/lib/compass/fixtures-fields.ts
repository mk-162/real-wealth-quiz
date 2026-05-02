/**
 * Field-map fixture — every content slot replaced with its field path.
 *
 * Consumed by `/report/master-fields` — a debug variant of the master
 * report where engine-driven numbers render at real values (so the chart
 * and gauge take realistic shapes) but every content string is replaced
 * with the path of the field that would be rendered in production. Use
 * this to check exactly which data source feeds which slot on the page.
 *
 * Inputs use S2's banded values so the projection engine runs over a
 * realistic mid-career profile.
 */

import type { Fixture } from './fixtures';
import type { CompassInputs, SegmentView, PlanningTile, WellbeingGoal } from './types';

const TILE_KEYS = [
  'retirement', 'pension', 'investment',
  'tax', 'cash', 'debt',
  'mortgage', 'estate', 'protection',
] as const;

const TILE_STATUSES: PlanningTile['status'][] = [
  'green', 'amber', 'amber',
  'green', 'amber', 'amber',
  'green', 'red', 'red',
];

const GOAL_ALIGNMENTS: WellbeingGoal['alignment'][] = ['amber', 'green', 'amber', 'amber'];
const BULLET_TONES: ('good' | 'warn' | 'risk' | 'info')[] = ['good', 'warn', 'info', 'risk'];

const fieldsInputs: CompassInputs = {
  currentAge: 42,
  partnerPresent: true,
  partnerAge: 40,
  hasDependentChildren: true,
  hasElderlyParents: false,
  targetRetirementAge: 62,
  mainHomeValue: '250-500k',
  otherPropertyValue: 0,
  totalPensionValue: '25-100k',
  cashSavings: '<25k',
  isaBalance: '25-100k',
  giaBalance: 0,
  businessValue: 0,
  otherAssets: 0,
  mainHomeMortgageBalance: '100-250k',
  otherPropertyMortgageBalance: 0,
  personalLoans: 0,
  creditCardDebt: '<25k',
  householdGrossIncome: '50-100k',
  isScottishTaxpayer: false,
  monthlySavingAmount: '<1.5k',
  employerPensionContribPct: '5-10',
  ownPensionContribPct: '3-5',
  essentialMonthlySpend: '3-5k',
  nonEssentialMonthlySpend: '<1.5k',
  retirementSpendRatio: 'same',
  mortgageMonthlyPayment: '1.5-3k',
  mortgageEndAge: '55_65',
  statePensionKnown: 'partial',
  niQualifyingYears: '20-30',
  totalEstate: '250-500k',
  isMarriedOrCP: true,
  homeLeftToDescendants: true,
  willInPlace: false,
  lpaInPlace: false,
  riskProfile: 'balanced',
};

const fieldsView: SegmentView = {
  segmentId: '{view.segmentId}',
  segmentLabel: '{view.segmentLabel}',
  persona: '{view.persona}',
  healthInterpretation: '{view.healthInterpretation} — zone-matched copy from content/report/health-gauge.md, picked by score',
  headline: {
    tone: 'warn',
    title: '{view.headline.title} — from content/report/takeaway-banners.md / H1 segment / ## Banner headline',
    body: '{view.headline.body} — from content/report/takeaway-banners.md / H1 segment / ## Supporting copy',
  },
  grid: TILE_KEYS.map((key, i) => ({
    key,
    label: `{grid[${i}].label} (from content/report/planning-grid/tile-${String(i+1).padStart(2,'0')}-*.md frontmatter)`,
    status: TILE_STATUSES[i],
    note: `{grid[${i}].note} — per-segment note from the tile file's H1 section`,
    whatItChecks: `{grid[${i}].whatItChecks} — from tile frontmatter what_it_checks field (shown as tooltip)`,
  })),
  goals: [
    { goal: '{goals[0].goal} — Goal 1 H1 from content/report/goals/S[n]-*.md',
      capacity: '{goals[0].capacity} — capacity: field in same goal block',
      rationale: '{goals[0].rationale} — rationale: field in same goal block',
      alignment: GOAL_ALIGNMENTS[0] },
    { goal: '{goals[1].goal} — Goal 2 H1',
      capacity: '{goals[1].capacity}',
      rationale: '{goals[1].rationale}',
      alignment: GOAL_ALIGNMENTS[1] },
    { goal: '{goals[2].goal} — Goal 3 H1',
      capacity: '{goals[2].capacity}',
      rationale: '{goals[2].rationale}',
      alignment: GOAL_ALIGNMENTS[2] },
    { goal: '{goals[3].goal} — Goal 4 H1 (optional)',
      capacity: '{goals[3].capacity}',
      rationale: '{goals[3].rationale}',
      alignment: GOAL_ALIGNMENTS[3] },
  ],
  nextSteps: [
    '{nextSteps[0]} — first advisor talking point (SegmentView.nextSteps)',
    '{nextSteps[1]} — second talking point',
    '{nextSteps[2]} — third talking point',
  ],
  bullets: BULLET_TONES.map((tone, i) => ({
    tone,
    text: `{bullets[${i}].text} — chart-reading row ${i+1}. Will migrate to content/segments/S[n]-*.md chartReadings[${i}]`,
  })),
  // No awarenessCheckIds on the fields fixture — Page 06 component renders the
  // "no curated list" placeholder which tells the reader exactly what feeds it.
};

export const FIELDS_FIXTURE: Fixture = {
  inputs: fieldsInputs,
  view: fieldsView,
};
