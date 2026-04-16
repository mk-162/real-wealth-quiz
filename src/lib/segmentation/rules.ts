/**
 * Segment assignment rules — data imported from
 * content/generated/rules.json, which is produced by the spreadsheet parser
 * from Question Segment Master.xlsx tab 3 (Gating & Routing).
 *
 * The JSON captures rank, segmentId, label, predicate (human-readable string)
 * and description. The executable predicate logic for each rule lives here.
 *
 * Rules are applied in strict rank order. The first rule that matches wins.
 *
 * Two-stage assignment:
 *   - assignSegment() evaluates the 9 rules using only the 5 gating answers.
 *     The S6 rule requires Q5.3 which is asked later in the business branch,
 *     so when the age + business-owner conditions for S6 pass but Q5.3 is
 *     unknown, assignSegment returns S5 with provisional: true.
 *   - upgradeSegment() is called once Q5.3 is answered. If the current segment
 *     is S5 and Q5.3 indicates exit-intent, it is upgraded to S6.
 */
import rulesData from '../../../content/generated/rules.json';
import type { GatingAnswers, SegmentId } from './types';

type RuleJson = {
  rank: number;
  segmentId: string;
  label: string;
  predicate: string;
  description: string;
};

type Rule = {
  rank: number;
  id: SegmentId;
  label: string;
  predicate: string;
  description: string;
  /**
   * Returns the segment to assign if the rule matches (null otherwise).
   * For S6 the Q5.3 answer is not in GatingAnswers, so the rule may return
   * { id: 'S5', provisional: true } meaning "assign S5 for now; upgrade to
   * S6 once Q5.3 reveals exit-intent".
   */
  evaluate: (a: GatingAnswers) => { id: SegmentId; provisional: boolean } | null;
};

/* ------- Predicate building blocks ---------------------------------- */

const estateAtLeast3m = (a: GatingAnswers) =>
  a.estate === '3m_to_5m' || a.estate === 'gt5m';

const estateAtLeast1m = (a: GatingAnswers) =>
  a.estate === '1m_to_2m' ||
  a.estate === '2m_to_3m' ||
  a.estate === '3m_to_5m' ||
  a.estate === 'gt5m';

const estateAtLeast250k = (a: GatingAnswers) =>
  a.estate === '500k_to_1m' ||
  a.estate === '1m_to_2m' ||
  a.estate === '2m_to_3m' ||
  a.estate === '3m_to_5m' ||
  a.estate === 'gt5m';

const incomeAtLeast200k = (a: GatingAnswers) => a.income === 'gt200k';

const incomeBetween100kAnd200k = (a: GatingAnswers) =>
  a.income === '100to125k' || a.income === '125to200k';

const incomeBetween50kAnd100k = (a: GatingAnswers) => a.income === '50to100k';

const isBusinessOwner = (a: GatingAnswers) => a.workStatus === 'business_owner';

const isRetired = (a: GatingAnswers) =>
  a.workStatus === 'fully_retired' || a.workStatus === 'partly_retired';

const isEmployedOrSelfEmployed = (a: GatingAnswers) =>
  a.workStatus === 'employed' || a.workStatus === 'self_employed';

/* ------- Rule definitions ------------------------------------------ */

const rulesMeta = rulesData as RuleJson[];

function metaFor(segmentId: SegmentId): RuleJson {
  const found = rulesMeta.find((r) => r.segmentId === segmentId);
  if (!found) {
    throw new Error(`rules.json is missing a rule for ${segmentId}`);
  }
  return found;
}

function makeRule(
  segmentId: SegmentId,
  evaluate: Rule['evaluate'],
): Rule {
  const meta = metaFor(segmentId);
  return {
    rank: meta.rank,
    id: segmentId,
    label: meta.label,
    predicate: meta.predicate,
    description: meta.description,
    evaluate,
  };
}

/**
 * The nine rules, rank-ordered by construction. Ordering is load-bearing
 * and mirrors rules.json; the first rule whose evaluate() returns non-null
 * wins.
 */
export const rules: Rule[] = [
  /* 1. S9 — Q4.5 >= 3m */
  makeRule('S9', (a) =>
    estateAtLeast3m(a) ? { id: 'S9', provisional: false } : null,
  ),

  /* 2. S6 — business owner AND age >= 50 AND Q5.3 in exit-intent.
     Q5.3 is not in GatingAnswers, so we defer to upgradeSegment() later.
     If the age + owner conditions pass here, we assign S5 provisional. */
  makeRule('S6', (a) =>
    isBusinessOwner(a) && a.age >= 50
      ? { id: 'S5', provisional: true }
      : null,
  ),

  /* 3. S5 — business owner AND age < 50 */
  makeRule('S5', (a) =>
    isBusinessOwner(a) && a.age < 50 ? { id: 'S5', provisional: false } : null,
  ),

  /* 4. S8 — retired (fully or partly) AND age >= 60 */
  makeRule('S8', (a) =>
    isRetired(a) && a.age >= 60 ? { id: 'S8', provisional: false } : null,
  ),

  /* 5. S7 — age 55-65 AND work in (employed, self_employed) */
  makeRule('S7', (a) =>
    a.age >= 55 && a.age <= 65 && isEmployedOrSelfEmployed(a)
      ? { id: 'S7', provisional: false }
      : null,
  ),

  /* 6. S4 — income >= 200k AND estate >= 1m */
  makeRule('S4', (a) =>
    incomeAtLeast200k(a) && estateAtLeast1m(a)
      ? { id: 'S4', provisional: false }
      : null,
  ),

  /* 7. S3 — income in [100k, 200k) */
  makeRule('S3', (a) =>
    incomeBetween100kAnd200k(a) ? { id: 'S3', provisional: false } : null,
  ),

  /* 8. S2 — income in [50k, 100k) AND estate >= 250k */
  makeRule('S2', (a) =>
    incomeBetween50kAnd100k(a) && estateAtLeast250k(a)
      ? { id: 'S2', provisional: false }
      : null,
  ),

  /* 9. S1 — default */
  makeRule('S1', () => ({ id: 'S1', provisional: false })),
];

/**
 * Stage 1 of two-stage assignment.
 *
 * Evaluates the rules in rank order using only the 5 gating answers.
 * Returns the first non-null result. If the S6 rule fires (business owner,
 * age >= 50), the return is S5 with provisional: true — indicating that the
 * final segment depends on Q5.3, which is asked later. Call upgradeSegment()
 * once Q5.3 is known.
 */
export function assignSegment(
  a: GatingAnswers,
): { segmentId: SegmentId; provisional: boolean } {
  for (const rule of rules) {
    const result = rule.evaluate(a);
    if (result) return { segmentId: result.id, provisional: result.provisional };
  }
  // Unreachable — S1 is the default — but TypeScript wants the guarantee.
  return { segmentId: 'S1', provisional: false };
}

/**
 * Stage 2 of two-stage assignment.
 *
 * Called once Q5.3 is answered. If the current segment is S5 and Q5.3
 * indicates exit-intent ('exit_5_years' or 'no_plan_thinking'), the segment
 * upgrades to S6. Otherwise current is returned unchanged.
 */
export function upgradeSegment(
  current: SegmentId,
  q53: string | undefined,
): SegmentId {
  if (current !== 'S5') return current;
  if (q53 === 'exit_5_years' || q53 === 'no_plan_thinking') return 'S6';
  return current;
}
