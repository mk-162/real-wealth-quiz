/**
 * The segment-aware question engine.
 *
 * Takes the five gating answers and returns the ordered list of question ids
 * the user will be asked, honouring the per-screen audience block.
 *
 * Phase 4: audience now lives on each screen as `audience: { Q3.2: { S1: …,
 * S2: …, … }, Q3.3: { … } }`. The matrix loader walks screens to build a flat
 * `SegmentMatrix` keyed by questionId, plus a canonical `questionOrder` (in
 * screen-file order). This engine consumes those two structures so the
 * iteration logic stays unchanged from the pre-Phase-4 implementation.
 *
 * `Y` (shown), `C` (conditional), `N` (hidden) are the legacy cell labels —
 * they correspond 1:1 to `shown` / `conditional` / `hidden` in the screen
 * frontmatter.
 *
 * Conditional (`C`) cells require an additional predicate to fire — those
 * predicates are keyed by QuestionId, NOT by screen id. A screen with multiple
 * questions can have one predicate per question, each gated independently.
 */
import { matrix, questionOrder } from '../questions/matrix';
import { assignSegment } from './rules';
import type {
  GatingAnswers,
  QuestionId,
  SegmentId,
} from './types';

/**
 * Conditional predicates — the "C" cells in the matrix. Each predicate is a
 * single function keyed by QuestionId. If a cell is C and the predicate
 * returns true, the question is asked; otherwise it is skipped silently.
 *
 * Keep predicates question-keyed (not screen-keyed) so a screen with multiple
 * questions can gate each one independently.
 */
const conditionals: Partial<Record<QuestionId, (a: GatingAnswers) => boolean>> = {
  /* Q3.2 essential spend — asked of HNW only if they left Q3.1 answered (not prefer_not). */
  'Q3.2': (a) => a.income !== 'prefer_not_to_say',
  /* Q4.3 pensions — asked of S1 only if they indicated they have >=1 pot, which we
     do not gate on at the five-question stage. In this skeleton we always include
     it for S1 so the example stays live; the real predicate is a follow-up answer. */
  'Q4.3': () => true,
  /* Q5.2 / Q5.3 for HNW — only if they are also a business owner. */
  'Q5.2': (a) => a.workStatus === 'business_owner' || a.workStatus === 'self_employed',
  'Q5.3': (a) => a.workStatus === 'business_owner' || a.workStatus === 'self_employed',
  /* Q6.3 wills/LPA for S1 — only if household includes anyone else. */
  'Q6.3': (a) => !a.household.includes('solo'),
};

/**
 * Decide which questions this user sees, in the canonical order.
 */
export function buildQuestionList(
  a: GatingAnswers,
  segmentId: SegmentId,
): QuestionId[] {
  const seen = new Set<QuestionId>();
  const out: QuestionId[] = [];

  for (const id of questionOrder) {
    const row = matrix[id];
    if (!row) continue; /* a question id not yet wired into a screen's audience */

    const cell = row[segmentId];
    if (cell === 'N') continue;
    if (cell === 'C') {
      const predicate = conditionals[id];
      if (!predicate || !predicate(a)) continue;
    }

    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }

  return out;
}

/**
 * Return shape of `segment()`. Adds `provisional` on top of
 * SegmentationResult to flag cases where Q5.3 could still upgrade S5 to S6.
 */
export interface SegmentOutcome {
  segmentId: SegmentId;
  provisional: boolean;
  questionIds: QuestionId[];
}

/**
 * Top-level entry point. Pure, deterministic.
 *
 * Stage 1 segment assignment only — if the returned `provisional` is true,
 * call upgradeSegment() once Q5.3 is known to decide whether to upgrade
 * S5 to S6.
 */
export function segment(a: GatingAnswers): SegmentOutcome {
  const { segmentId, provisional } = assignSegment(a);
  const questionIds = buildQuestionList(a, segmentId);
  return { segmentId, provisional, questionIds };
}
