/**
 * /report/compass-client-view/[segment] — clean, client-facing view of the report.
 *
 * Exactly what a recipient sees: sticky "EXAMPLE ONLY" banner, then the two
 * report pages. No tabs, no dev notice, no per-page segment labels, no
 * page-number kickers, no EXAMPLE pills on the pages themselves.
 *
 * Segment comes from the URL:
 *   /report/compass-client-view/S2
 *
 * An index at /report/compass-client-view lists all 9 segments.
 */

import { notFound } from 'next/navigation';
import { FIXTURES, fixtureById } from '@/lib/compass';
import { ReportView } from '@/components/compass';
import styles from './page.module.css';

export function generateStaticParams() {
  return FIXTURES.map(f => ({ segment: f.view.segmentId }));
}

export default async function CompassClientView({
  params,
}: {
  params: Promise<{ segment: string }>;
}) {
  const { segment } = await params;
  const fixture = fixtureById(segment);
  if (!fixture) notFound();

  return (
    <>
      <div className={styles.exampleBanner}>
        EXAMPLE ONLY — Illustrative projection built from banded answers. Not personalised financial advice. Speak to a qualified IFA for advice tailored to you.
      </div>
      <main className={styles.page}>
        <ReportView fixture={fixture} hideHeaders />
      </main>
    </>
  );
}
