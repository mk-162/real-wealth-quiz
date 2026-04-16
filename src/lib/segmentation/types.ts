/**
 * Segmentation types — shared vocabulary for the question engine.
 *
 * Source of truth: Segmentation Design Companion.md + Question Segment Master.xlsx.
 * When the companion changes, update this file.
 */

export type SegmentId =
  | 'S1' /* Early Accumulator              — under 35, under £50k, under £250k estate */
  | 'S2' /* Mass-Affluent Mid-Career       — 35–50, £50–100k, £250k–£1m              */
  | 'S3' /* High-Earner Mid-Career         — 35–55, £100–200k, £500k–£2m             */
  | 'S4' /* Senior Professional / Partner  — 40–60, £200k+, £1–3m                    */
  | 'S5' /* Business Owner — Growth        — 30–55, business owner, £500k–£3m        */
  | 'S6' /* Business Owner — Exit-minded   — 50–65, business owner, £1–5m            */
  | 'S7' /* Pre-Retiree Affluent           — 55–65, employed/SE, £1–3m               */
  | 'S8' /* Retired / In Decumulation      — 60+, retired, £500k–£3m                 */
  | 'S9'; /* HNW / Multi-Generational       — any age, £3m+ estate                    */

export type IncomeBand =
  | 'lt50k'
  | '50to100k'
  | '100to125k'
  | '125to200k'
  | 'gt200k'
  | 'prefer_not_to_say';

export type EstateBand =
  | 'lt500k'
  | '500k_to_1m'
  | '1m_to_2m'
  | '2m_to_3m'
  | '3m_to_5m'
  | 'gt5m'
  | 'not_sure';

export type WorkStatus =
  | 'employed'
  | 'self_employed'
  | 'business_owner'
  | 'partly_retired'
  | 'fully_retired'
  | 'between_roles';

export type HouseholdTag =
  | 'partner'
  | 'dependent_children'
  | 'adult_children'
  | 'elderly_parent'
  | 'solo';

/**
 * The five gating answers that decide segment assignment.
 * Anything else (Q1.1, Q2.4) is pure tone and does not touch this.
 */
export interface GatingAnswers {
  age: number; /* Q2.1 — whole years */
  household: HouseholdTag[]; /* Q2.2 — multi-select */
  workStatus: WorkStatus; /* Q2.3 */
  income: IncomeBand; /* Q3.1 */
  estate: EstateBand; /* Q4.5 */
}

/**
 * A question identifier. Matches the "Q1.1" / "Q4.5" shape from
 * Question Design Options.md so the schema travels with the data.
 */
export type QuestionId = string;

/**
 * Output of the engine. questionIds is the ordered list this user
 * will see, filtered for their segment and their conditional branches.
 */
export interface SegmentationResult {
  segmentId: SegmentId;
  questionIds: QuestionId[];
}

/**
 * The matrix cell value from Question Segment Master.xlsx tab 2.
 *   Y — always asked
 *   C — asked only if an earlier answer warrants it
 *   N — never asked of this segment (skipped silently)
 */
export type MatrixCell = 'Y' | 'C' | 'N';

export type SegmentMatrix = Record<QuestionId, Record<SegmentId, MatrixCell>>;
