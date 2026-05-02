/**
 * PrivacyClearModal — instructions for removing the saved report from
 * the user's browser.
 *
 * The Wealth Conversation persists the user's session (answers, contact
 * details, segment assignment) in `localStorage`. We never copy it to a
 * server. To remove it, the user must clear this site's saved data in
 * their browser. This modal explains how, per major browser.
 *
 * Triggered from the ReportViewBanner on /conversation/report. Closes
 * on backdrop click, Escape key, or "Got it" button.
 */
'use client';

import { useEffect, useRef } from 'react';
import styles from './PrivacyClearModal.module.css';

export interface PrivacyClearModalProps {
  onClose: () => void;
}

export function PrivacyClearModal({ onClose }: PrivacyClearModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape; trap focus inside the modal while open.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    // Focus the dialog so screen readers announce it and the Escape handler
    // is reachable from the keyboard.
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-clear-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="privacy-clear-title" className={styles.title}>
          Clearing your report from your browser
        </h2>

        <p className={styles.body}>
          Your report is stored on this device, not on our servers. To
          remove it, clear this site&rsquo;s saved data in your browser.
        </p>

        <section className={styles.section}>
          <h3 className={styles.browserName}>Chrome / Edge</h3>
          <ol className={styles.steps}>
            <li>
              Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Delete</kbd>
              {' '}(<kbd>⌘</kbd> on Mac)
            </li>
            <li>Choose &ldquo;Cookies and other site data&rdquo;</li>
            <li>Click &ldquo;Clear data&rdquo;</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h3 className={styles.browserName}>Safari</h3>
          <ol className={styles.steps}>
            <li>Safari → Settings → Privacy → Manage Website Data</li>
            <li>Find <code>realwealth.co.uk</code> → click Remove</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h3 className={styles.browserName}>Firefox</h3>
          <ol className={styles.steps}>
            <li>
              Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Delete</kbd>
              {' '}(<kbd>⌘</kbd> on Mac)
            </li>
            <li>Choose &ldquo;Cookies&rdquo; → click &ldquo;Clear Now&rdquo;</li>
          </ol>
        </section>

        <p className={styles.footnote}>
          Once cleared, the report is gone — we can&rsquo;t get it back
          for you.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
