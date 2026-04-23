/**
 * /report/master — index page listing the 9 segment URLs for the master 8-page report.
 */

import Link from 'next/link';
import { FIXTURES } from '@/lib/compass';
import styles from './page.module.css';

export default function MasterIndex() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Master report — 8 pages</h1>
      <p className={styles.lede}>
        Pick a segment to see the full report (Cover → Snapshot → Planning grid →
        Projection → Where you are today → Five things → Silent gaps → Next step).
        Pages 5&ndash;8 are placeholders until the content agent&rsquo;s markdown
        expansion lands.
      </p>
      <ul className={styles.list}>
        {FIXTURES.map(f => (
          <li key={f.view.segmentId}>
            <Link href={`/report/master/${f.view.segmentId}`} className={styles.link}>
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
