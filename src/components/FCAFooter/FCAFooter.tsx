/**
 * FCAFooter — the regulatory footer. Appears at the foot of every page.
 * Tone is deliberately matter-of-fact — see Voice and Tone.md.
 *
 * Copy sourced from content/pages/homepage.md → footer block. Entity name
 * and register number come through from the same block — update the
 * markdown file when the Compliance Officer confirms the live values.
 */
import { Logo } from '../Logo';
import { pageValue } from '@/lib/content';
import styles from './FCAFooter.module.css';

interface FooterLink {
  label?: string;
  href?: string;
}

export function FCAFooter() {
  const disclosure = pageValue<string>(
    'homepage',
    'footer.disclosure',
    'Real Wealth is authorised and regulated by the Financial Conduct Authority.',
  );
  const generalLine = pageValue<string>(
    'homepage',
    'footer.general_line',
    'This tool provides general guidance and does not constitute a personal recommendation or financial advice.',
  );
  const links = pageValue<FooterLink[]>('homepage', 'footer.links', []);

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.logoWrap}>
          {/* Matches the live realwealth.co.uk wordmark — 177px width in
              the site footer's row. Pure white via the parent's filter
              override (see FCAFooter.module.css .logoWrap img). */}
          <Logo tone="paper" width={177} />
        </div>

        {/* Promises strip — moved here from beneath each question so the
            form itself is uncluttered. The two lines that previously sat
            under every screen ("Your answers stay with you" / "A real
            planner reads every answer") are surfaced once, globally, in
            the footer. */}
        <ul className={styles.promises} aria-label="Our promises">
          <li className={styles.promise}>
            <span className={styles.promiseTitle}>Your answers stay with you.</span>{' '}
            <span className={styles.promiseBody}>
              We won&rsquo;t share or sell your responses.
            </span>
          </li>
          <li className={styles.promise}>
            <span className={styles.promiseTitle}>A real planner reads every answer.</span>{' '}
            <span className={styles.promiseBody}>
              No AI scorecard, no auto-verdict.
            </span>
          </li>
        </ul>

        <p className={styles.disclosure}>{disclosure}</p>
        <p className={styles.disclosure}>{generalLine}</p>
        <p className={styles.links}>
          {links.map((l, i) => (
            <span key={i}>
              <a href={l.href ?? '#'}>{l.label}</a>
              {i < links.length - 1 ? (
                <span aria-hidden="true" className={styles.sep}>
                  ·
                </span>
              ) : null}
            </span>
          ))}
        </p>
        <p className={styles.contact}>
          Manchester · Taunton &nbsp; | &nbsp; 0161 768 7722 &nbsp; | &nbsp;{' '}
          <a href="mailto:hello@realwealth.co.uk">hello@realwealth.co.uk</a>
        </p>
      </div>
    </footer>
  );
}
