/**
 * Segment x Question matrix — Y / C / N per cell.
 *
 * Source of truth (Phase 4): per-screen `audience` blocks, declared in each
 * `content/screens/*.md`. The previous monolithic `content/generated/matrix.json`
 * has been collapsed into per-question audience entries on the screens that
 * own those questions.
 *
 * This file rebuilds a flat `SegmentMatrix` (and the canonical `questionOrder`)
 * from the generated screen catalogue so existing consumers (the segmentation
 * engine, the runtime questionnaire engine's screen-visibility filter) keep
 * working without per-call screen-walking.
 *
 *   Y — always asked   (was `shown`)
 *   C — conditional    (was `conditional` — predicate lives in segmentation/engine.ts)
 *   N — never asked    (was `hidden`)
 */
import { screens } from '../content/catalogue';
import type { MatrixCell, QuestionId, SegmentId, SegmentMatrix } from '../segmentation/types';
import type { AudienceCell } from '../../../content/schema';

const SEGMENT_IDS: SegmentId[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];

/** Translate the new audience values back to the legacy Y/C/N triplet. */
function toCell(v: AudienceCell | undefined): MatrixCell {
  if (v === 'shown') return 'Y';
  if (v === 'conditional') return 'C';
  return 'N';
}

/**
 * Build the SegmentMatrix object keyed by questionId, by walking every screen's
 * `audience` block and projecting each (qid, segment) pair into the legacy
 * cell shape.
 */
function buildFromScreens(): SegmentMatrix {
  const out: SegmentMatrix = {};
  for (const screen of screens) {
    const audience = screen.audience;
    if (!audience) continue;
    for (const [qid, cells] of Object.entries(audience)) {
      const row = {} as Record<SegmentId, MatrixCell>;
      for (const sid of SEGMENT_IDS) {
        row[sid] = toCell(cells[sid]);
      }
      out[qid as QuestionId] = row;
    }
  }
  return out;
}

export const matrix: SegmentMatrix = buildFromScreens();

/**
 * The canonical order the engine iterates questions in. Hardcoded to preserve
 * the historical ordering produced by the pre-Phase-4 matrix.json — `segment()`
 * is a deterministic API consumed by `runSegmentation` and downstream code, so
 * we pin the order here rather than letting it drift with screen-file shuffles.
 *
 * This is NOT the order the user actually answers questions in — that's
 * determined by screen-file order in the runtime questionnaire engine
 * (`src/lib/questionnaire/engine.ts`). This `questionOrder` is solely the
 * iteration order for `buildQuestionList`'s output array.
 *
 * When you add a new question:
 *   1. Add an entry under `audience:` on the appropriate screen's frontmatter.
 *   2. Add the question id to this list in the position you want
 *      `buildQuestionList` to emit it.
 */
export const questionOrder: readonly string[] = [
  'Q1.1',
  'Q1.2',
  'Q2.1',
  'Q2.2',
  'Q2.3',
  'Q2.4',
  'Q3.1',
  'Q3.2',
  'Q3.3',
  'Q3.4',
  'Q3.5',
  'Q4.1',
  'Q4.2',
  'Q4.3',
  'Q4.4',
  'Q4.5',
  'Q4.A.1',
  'Q4.A.2',
  'Q4.A.3',
  'Q4.A.4',
  'Q4.B.1',
  'Q4.B.2',
  'Q4.C.1',
  'Q4.C.2',
  'Q4.D.1',
  'Q4.D.2',
  'Q4.D.3',
  'Q5.1',
  'Q5.2',
  'Q5.3',
  'Q6.1',
  'Q6.2',
  'Q6.3',
  'Q7.1',
  'Q7.2',
  'Q7.3',
  'Q8.1',
  'Q8.2',
  'Q9.1',
  'Q9.2',
  'Q10.1',
  'Q10.2',
  'Q10.3',
] as const;

/** The five ids that drive segment assignment. */
export const gatingQuestionIds = ['Q2.1', 'Q2.2', 'Q2.3', 'Q3.1', 'Q4.5'] as const;
