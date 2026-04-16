/**
 * Sensitive-path / "support" page.
 *
 * Reached when the Q2.4 free-text answer trips the distress-indicator
 * safeguard in src/lib/safeguards/distress.ts. The page is deliberately
 * non-commercial: no booking link, no segment copy, no considered list.
 * It is a quiet, brand-aligned hand-off to organisations better placed
 * to help than we are.
 */
import Link from 'next/link';
import { SIGNPOSTS } from '@/lib/safeguards/distress';
import styles from './page.module.css';

export default function SupportPage() {
  return (
    <div className={styles.shell}>
      <section className={styles.inner}>
        <p className={styles.opening}>
          Before we go any further — something you wrote earlier sounded like
          you might be going through a difficult time. If that&rsquo;s not what
          you meant, just head back and carry on. If it is, the people below
          are better placed to help than we are.
        </p>

        <ul className={styles.signposts} aria-label="Support contacts">
          {SIGNPOSTS.map((s) => (
            <li key={s.name} className={styles.signpost}>
              <h2 className={styles.name}>{s.name}</h2>
              <p className={styles.line}>
                <a href={`tel:${s.phone.replace(/\s+/g, '')}`} className={styles.link}>
                  {s.phone}
                </a>
              </p>
              <p className={styles.line}>
                <a
                  href={s.url}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.url.replace(/^https?:\/\//, '')}
                </a>
              </p>
              <p className={styles.hours}>{s.hours}</p>
            </li>
          ))}
        </ul>

        <p className={styles.closing}>
          When you&rsquo;re ready, we&rsquo;ll be here. No rush.
        </p>

        <p className={styles.backRow}>
          <Link href="/" className={styles.backLink}>
            Back to the homepage
          </Link>
        </p>
      </section>
    </div>
  );
}
