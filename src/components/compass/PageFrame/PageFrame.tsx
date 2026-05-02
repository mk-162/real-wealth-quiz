/**
 * PageFrame — A4 page chrome wrapping a single report page.
 *
 * Provides the Chart Pages page-chrome pattern:
 *   - orange accent strip
 *   - chrome-top with logo + doc title
 *   - page body
 *   - regulatory disclaimer band (always visible; same on every page)
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
  /** Logo SVG path. Default /report-preview/assets/logo-wordmark.svg. */
  logoSrc?: string;
  /** Debug label shown in dev tabs etc. */
  label?: string;
  children: React.ReactNode;
}

/**
 * The regulatory disclaimer rendered above the chrome footer on every
 * PageFrame page. Single source of truth — change it here once and every
 * report page picks up the new copy.
 *
 * Note: cover and chart pages have their own custom layouts outside
 * PageFrame; they carry equivalent regulatory text in their own footers.
 */
const DISCLAIMER_TITLE = 'REAL WEALTH GROUP LTD';
const DISCLAIMER_BODY =
  'The Wealth Conversation is a financial planning discovery tool intended to help you reflect more deeply and deliberately on your present and future personal financial situation. The outputs are intended to provide a directional sense of where you are and where you are heading, both in general and relative to your stated objectives, as well as an indication of where opportunities for improvement may lie. While the outputs are intended to be accurate, meaningful and helpful, they are for illustrative purposes only and do not constitute, and are not intended to replace, formal, personalised, professional financial, legal or accounting advice.';

export function PageFrame({
  docTitle,
  pageNum,
  totalPages,
  footer,
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

      <div className={styles.body}>{children}</div>

      <aside className={styles.disclaimer} aria-label="Regulatory disclaimer">
        <span className={styles.disclaimerTitle}>{DISCLAIMER_TITLE}</span>
        <span className={styles.disclaimerBody}>{DISCLAIMER_BODY}</span>
      </aside>

      <footer className={styles.chromeBot}>
        <span>{footer}</span>
        <span className={styles.pageNum}>
          {totalPages !== undefined
            ? `${pageNum} · ${String(totalPages).padStart(2, '0')}`
            : pageNum}
        </span>
      </footer>
    </section>
  );
}
