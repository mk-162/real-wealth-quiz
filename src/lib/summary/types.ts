/**
 * Shared types for the summary page resolvers. The resolvers all take a
 * normalised view of the user's answers plus their assigned segment, and
 * return either a copy-bearing object (for the renderer) or null.
 *
 * Keeping the input shape narrow here means the trigger logic never sees
 * the raw `Record<string, unknown>` from localStorage.
 */
export interface SummaryInputs {
  segmentId: string;
  age: number | null;
  household: string[];
  workStatus: string | null;
  wealthDefinition: string | null;
  happyPlace: string | null;
  incomeBand: string | null;
  moneyMindset: string | null;
  mainHome: string | null;
  otherProperty: string | null;
  pensionPots: string | null;
  investmentsBand: string | null;
  estateBand: string | null;
  succession: string | null;
  willAndLpaStatus: string[];
  passingOnIntent: string | null;
  targetRetirementAge: number | null;
  retirementFeel: string | null;
  statePensionAwareness: string | null;
  earningsProtectionScale: number | null;
  lifeCoverStatus: string | null;
  currentAdviser: string | null;
  urgency: string | null;
  intent: string | null;
  lifeChangeText: string | null;
}

export interface SpotlightFlag {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  close: string;
  triggerAnswerIds: string[];
}

export interface SilentGap {
  id: string;
  body: string;
}

export interface EmotionalIntro {
  id: string;
  copy: string;
}

export type ChartId =
  | 'income_trap_100k'
  | 'iht_on_3m'
  | 'extraction_mix'
  | 'compounding_line'
  | 'drawdown_paths'
  | 'badr_transition';

export interface InlineChart {
  id: ChartId;
  title: string;
  caption: string;
}
