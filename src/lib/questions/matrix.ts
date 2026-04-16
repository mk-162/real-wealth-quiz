/**
 * Segment x Question matrix — Y / C / N per cell.
 *
 * Source of truth: content/generated/matrix.json, which is produced by the
 * spreadsheet parser script from Question Segment Master.xlsx tab 2. Do NOT
 * edit cells here — edit the spreadsheet and regenerate.
 *
 *   Y — always asked
 *   C — conditional (only if an earlier answer warrants it)
 *   N — never asked
 */
import matrixData from '../../../content/generated/matrix.json';
import type { MatrixCell, QuestionId, SegmentId, SegmentMatrix } from '../segmentation/types';

type MatrixRow = {
  questionId: string;
  S1: string;
  S2: string;
  S3: string;
  S4: string;
  S5: string;
  S6: string;
  S7: string;
  S8: string;
  S9: string;
};

const SEGMENT_IDS: SegmentId[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];

/**
 * Build the SegmentMatrix object keyed by questionId, reading each row
 * from the generated JSON. Cell values are narrowed to MatrixCell.
 */
function buildMatrix(rows: MatrixRow[]): SegmentMatrix {
  const out: SegmentMatrix = {};
  for (const row of rows) {
    const cells = {} as Record<SegmentId, MatrixCell>;
    for (const sid of SEGMENT_IDS) {
      const v = row[sid];
      if (v !== 'Y' && v !== 'C' && v !== 'N') {
        throw new Error(
          `Invalid matrix cell for ${row.questionId}/${sid}: ${v}`,
        );
      }
      cells[sid] = v;
    }
    out[row.questionId as QuestionId] = cells;
  }
  return out;
}

export const matrix: SegmentMatrix = buildMatrix(matrixData as MatrixRow[]);

/**
 * The canonical order the form asks questions in.
 * Source of truth: content/generated/matrix.json row order.
 * The generated file is emitted by scripts/content-build.ts on every build
 * (re-reading the authoritative spreadsheet output), so drift is impossible.
 */
export { questionOrder } from '../content/generated-order';

/** The five ids that drive segment assignment. */
export const gatingQuestionIds = ['Q2.1', 'Q2.2', 'Q2.3', 'Q3.1', 'Q4.5'] as const;
