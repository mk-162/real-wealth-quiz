/**
 * /conversation/report — server wrapper.
 *
 * Mirrors `/conversation/summary`'s server pattern: pre-renders one
 * CompassReportSection per segment so the Node-only content loaders
 * (`pdf-content.ts`) never reach the client bundle. The client picks
 * the right section once it has resolved the segment from the session.
 *
 * The user lands here from /conversation/summary after submitting their
 * email — this page wraps the embedded report in the privacy banner and
 * the "clear my browser data" modal trigger.
 *
 * Same A4 9-page layout as /report/master/[segment], driven by the live
 * user's answers via the `renderUserCompassReport` server action when
 * available; falls back to the pre-rendered fixture variant.
 */

import { FIXTURES } from '@/lib/compass';
import CompassReportSection from '../summary/CompassReportSection';
import { ReportViewClient } from './ReportViewClient';

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

export default function ReportViewPage() {
  const reportSectionsBySegment: Record<string, React.ReactNode> = {};
  for (const fixture of FIXTURES) {
    const segId = fixture.view.segmentId;
    const fallbackName = SEGMENT_NAMES[segId] ?? 'your plan';
    reportSectionsBySegment[segId] = (
      <CompassReportSection
        key={segId}
        segmentId={segId}
        recipientName={fallbackName}
      />
    );
  }
  return <ReportViewClient reportSectionsBySegment={reportSectionsBySegment} />;
}
