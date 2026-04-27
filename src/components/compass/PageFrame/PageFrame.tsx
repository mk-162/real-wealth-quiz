/**
 * PageFrame — A4 page chrome wrapping a single report page.
 *
 * Provides the Chart Pages page-chrome pattern:
 *   - orange accent strip
 *   - chrome-top with logo + doc title
 *   - illustrative-example tag (optional)
 *   - page body
 *   - chrome-bot with footer text + page number
 *
 * Logo path defaults to `/report-preview/assets/logo-wordmark.svg` which is
 * placed in the public folder by the activation step.
 */

import Image from 'next/image';
import styles from './PageFrame.module.css';

export interface PageFrameProps {
  /** Document title shown top-right ("Your Wealth Report · Michelle"). */
  docTitle: string;
  /** "01", "02", etc. Page number displayed bottom-right. */
  pageNum: string;
  /** Total pages. Used as "02 · 08". */
  totalPages?: number;
  /** Footer left-hand copy (e.g. address line or regulatory line). */
  footer: string;
  /** Show the orange "Illustrative example" tag. Default true. */
  showIllusTag?: boolean;
  /** Logo SVG path. Default /report-preview/assets/logo-wordmark.svg. */
  logoSrc?: string;
  /** Debug label shown in dev tabs etc. */
  label?: string;
  children: React.ReactNode;
}

export function PageFrame({
  docTitle,
  pageNum,
  totalPages,
  footer,
  showIllusTag = true,
  logoSrc = '/report-preview/assets/logo-wordmark.svg',
  label,
  children,
}: PageFrameProps) {
  return (
    <section className={styles.page} data-screen-label={label}>
      <div className={styles.accent} />
      <header className={styles.chromeTop}>
        <Image
          src={logoSrc}
          alt="Real Wealth"
          className={styles.logo}
          width={120}
          height={20}
          priority
          unoptimized
        />
        <span className={styles.docTitle}>{docTitle}</span>
      </header>

      {showIllusTag && <span className={styles.illusTag}>Illustrative example</span>}

      <div className={styles.body}>{children}</div>

      <footer className={styles.chromeBot}>
        <span>{footer}</span>
        <span className={styles.pageNum}>
          {totalPages !== undefined
            ? `${pageNum} \u00B7 ${String(totalPages).padStart(2, '0')}`
            : pageNum}
        </span>
      </footer>
    </section>
  );
}
