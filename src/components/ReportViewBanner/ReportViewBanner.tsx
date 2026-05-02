/**
 * ReportViewBanner — sticky banner at the top of /conversation/report.
 *
 * Tells the user this is their only copy of the report (we don't email
 * it, we don't keep it server-side) and gives them three actions:
 *   - Save as PDF — calls window.print(), browser's PDF destination
 *   - Print      — same window.print() dialog, framed for paper output
 *   - How to clear it from my browser — opens PrivacyClearModal
 *
 * Hidden on print via @media print so the saved file contains only the
 * report itself.
 */
'use client';

import styles from './ReportViewBanner.module.css';

export interface ReportViewBannerProps {
  onClearClick: () => void;
}

export function ReportViewBanner({ onClearClick }: ReportViewBannerProps) {
  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  return (
    <div className={styles.banner} role="region" aria-label="Report actions">
      <div className={styles.inner}>
        <p className={styles.message}>
          This report is in your browser only — we don&rsquo;t have a copy.
          {' '}
          Print or save it now to keep it.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handlePrint}
          >
            Save as PDF
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handlePrint}
          >
            Print
          </button>
          <button
            type="button"
            className={styles.linkButton}
            onClick={onClearClick}
          >
            How to clear it from my browser
          </button>
        </div>
      </div>
    </div>
  );
}
