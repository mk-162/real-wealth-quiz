/**
 * /conversation/summary — server wrapper.
 *
 * Post-redesign, this page is a slim "your report is ready" confirmation
 * with two states:
 *   1. Capture — email + consent form
 *   2. View    — "Open my report" button + cover thumbnail
 *
 * The report itself lives at /conversation/report, which the user navigates
 * to from state 2. That keeps the privacy banner attached cleanly to the
 * report surface and avoids embedding 30+ A4 pages on a page that's just
 * meant to capture an email.
 *
 * No segment-specific pre-rendering happens here — the summary page no
 * longer surfaces report content. The /conversation/report wrapper does
 * its own pre-rendering for all 9 segments.
 */

import SummaryClient from './SummaryClient';

export default function SummaryPage() {
  return <SummaryClient />;
}
