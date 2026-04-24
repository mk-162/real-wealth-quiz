/**
 * /report/compass-preview — developer preview of the Compass report.
 *
 * Renders all 9 segment fixtures (S1-S9) via a tab picker, against the
 * real `ReportView` component. Used to visually audit the design across
 * the full segment range.
 *
 * For a client-facing view of a single segment (no tabs, no dev notice),
 * see /report/compass-client-view/[segment].
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FIXTURES } from '@/lib/compass';
import { ReportView } from '@/components/compass';
import styles from './page.module.css';

export default function CompassPreviewPage() {
  const [segmentId, setSegmentId] = useState<string>('S2');
  const fixture = FIXTURES.find(f => f.view.segmentId === segmentId) ?? FIXTURES[1];

  return (
    <>
      <div className={styles.exampleBanner}>
        EXAMPLE ONLY — Illustrative projection built from banded answers. Not personalised financial advice. Speak to a qualified IFA for advice tailored to you.
      </div>

      <main className={styles.page}>
        <div className={styles.devNotice}>
          <strong>Developer preview.</strong> This route is not linked from the live site. It renders the redesigned Page-1 + Page-2 of the Compass report against the 9 canned personas defined in <code>src/lib/compass/fixtures.ts</code>. Switch personas using the tabs below; each view shows the snapshot page then the projection page. For a clean client-facing view, see <Link href="/report/compass-client-view">/report/compass-client-view</Link>.
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Segment picker">
          {FIXTURES.map(f => (
            <button
              key={f.view.segmentId}
              role="tab"
              aria-selected={f.view.segmentId === segmentId}
              className={`${styles.tab} ${f.view.segmentId === segmentId ? styles.tabActive : ''}`}
              onClick={() => setSegmentId(f.view.segmentId)}
            >
              <strong>{f.view.segmentId}</strong> &middot; {f.view.segmentLabel}
            </button>
          ))}
        </div>

        <ReportView fixture={fixture} />
      </main>
    </>
  );
}
