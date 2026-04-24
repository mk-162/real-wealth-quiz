/**
 * /conversation/summary — server wrapper.
 *
 * The summary UI itself is a client component (`SummaryClient.tsx`) because
 * it reads the persisted session and unlock flag from `localStorage`. The
 * embedded 9-page Compass report, however, depends on content loaders that
 * use Node `fs` (see `src/lib/compass/pdf-content.ts`). Those cannot reach
 * the client bundle.
 *
 * This file resolves that split: it is a server component that pre-renders
 * one `CompassReportSection` per segment at SSG/request time and passes the
 * result as a `Record<segmentId, ReactNode>` into the client. The client
 * looks up the right section once it knows the segment (derived from the
 * session) and embeds it after the considered-list.
 *
 * Pre-rendering all 9 segments is cheap — each fixture is a few kilobytes
 * of structured content, and the rendered markup is a handful of pages of
 * static JSX. The alternative (one page per segment as a dynamic route) was
 * rejected because it would break the existing `/conversation/summary` URL
 * contract the upstream flow and Playwright tests rely on.
 *
 * Fixture-driven for now. A parallel agent is wiring `buildCompassInputs`
 * so the live user answers will feed the report in a follow-up commit.
 */

import { FIXTURES } from '@/lib/compass';
import CompassReportSection from './CompassReportSection';
import SummaryClient from './SummaryClient';

const SEGMENT_NAMES: Record<string, string> = {
  S1: 'Marcus',
  S2: 'Sarah',
  S3: 'James',
  S4: 'Diane',
  S5: 'Rob',
  S6: 'Elena',
  S7: 'Paul',
  S8: 'Margaret',
  S9: 'Charles',
};

export default function SummaryPage() {
  // Render one CompassReportSection per segment, keyed by segmentId.
  // The client component picks the right one once it has resolved the
  // session-driven segmentId.
  const reportSectionsBySegment: Record<string, React.ReactNode> = {};
  for (const fixture of FIXTURES) {
    const segId = fixture.view.segmentId;
    // Fallback first-name used when the session has none yet — matches
    // the fixture stock persona so the cover page reads naturally in
    // dev/demo mode.
    const fallbackName = SEGMENT_NAMES[segId] ?? 'your plan';
    reportSectionsBySegment[segId] = (
      <CompassReportSection
        key={segId}
        segmentId={segId}
        recipientName={fallbackName}
      />
    );
  }

  return <SummaryClient reportSectionsBySegment={reportSectionsBySegment} />;
}
