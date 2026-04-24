/**
 * /report/compass-client-view — index page listing the 9 segment URLs.
 */

import Link from 'next/link';
import { FIXTURES } from '@/lib/compass';
import styles from './page.module.css';

export default function CompassClientViewIndex() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Compass — client view</h1>
      <p className={styles.lede}>
        Pick a segment. The link opens the two-page report as a client would see it — no tabs, no developer chrome, no segment labels. The &ldquo;EXAMPLE ONLY&rdquo; banner stays (regulatory).
      </p>
      <ul className={styles.list}>
        {FIXTURES.map(f => (
          <li key={f.view.segmentId}>
            <Link href={`/report/compass-client-view/${f.view.segmentId}`} className={styles.link}>
              <span className={styles.id}>{f.view.segmentId}</span>
              <span className={styles.label}>{f.view.segmentLabel}</span>
              <span className={styles.persona}>{f.view.persona}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
