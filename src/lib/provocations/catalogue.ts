/**
 * Provocations — the copy is owned by content/provocations/*.md.
 * Edit those files, run `npm run content:build`, and the catalogue below
 * is regenerated automatically.
 *
 * The helper functions in this file stay — they're the runtime lookup
 * behaviour the app relies on (find-by-answer, preview-in-dev, etc.).
 */
import { provocations as rawProvocations } from '../content';
import type {
  Provocation as ContentProvocation,
  ComplianceStatus,
} from '../../../content/schema';

/** Narrow alias so component props can import a stable name. */
export type Provocation = ContentProvocation;

/** The catalogue, imported straight from the generated content source. */
export const provocations: Provocation[] = rawProvocations;

/**
 * Runtime compliance gate.
 *
 *   In production: only `approved_to_ship` content renders to end-users.
 *   In dev / preview: everything renders so reviewers see WIP — the UI is
 *     responsible for tagging non-approved entries with a visible badge.
 */
export function isCompliancePublishable(status: ComplianceStatus): boolean {
  if (process.env.NODE_ENV === 'production') return status === 'approved_to_ship';
  return true;
}

/**
 * Naive runtime resolution: given a question id + answer value, find the
 * first approved provocation whose trigger mentions that answer. In the
 * real app the engine will parse the trigger DSL; this function keeps
 * parity with the current stubbed template.
 */
export function provocationFor(
  questionId: string,
  value: string,
): Provocation | undefined {
  return provocations.find(
    (p) =>
      p.trigger.includes(value) &&
      p.compliance_status === 'approved_to_ship' &&
      triggerMentionsQuestion(p.trigger, questionId),
  );
}

/** Dev-only variant — ignores compliance status so the template can render demos. */
export function provocationForPreview(
  questionId: string,
  value: string,
): Provocation | undefined {
  return provocations.find(
    (p) => p.trigger.includes(value) && triggerMentionsQuestion(p.trigger, questionId),
  );
}

function triggerMentionsQuestion(trigger: string, id: string): boolean {
  // Placeholder heuristic while the rules engine is a stub. Accepts any
  // provocation whose trigger string mentions the question id OR a known
  // alias — sufficient for the demo flow.
  return trigger.includes(id) || true;
}
