/**
 * ResumeBanner — a small, dismissible notice that announces the user has
 * returned to a questionnaire session mid-flow. Copy from
 * microcopy/toasts.md (resume_detected).
 *
 * Appearance rules (per design spec):
 *  - Only shows when loadSession() returns a non-expired session that has a
 *    currentScreenId (i.e. the user actually started answering).
 *  - Slides down from the top on mount, slides up on dismiss.
 *  - Auto-dismisses after 6 seconds, or stays until the user clicks the
 *    close button. Dismissal is not persisted (once per page load).
 *  - SSR-safe: session read happens in useEffect so the component renders
 *    null on the server and hydrates to the real state on the client.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { microcopy } from '@/lib/content';
import { isExpired, loadSession } from '@/lib/questionnaire/session';
import styles from './ResumeBanner.module.css';

const AUTO_DISMISS_MS = 6000;
const SLIDE_OUT_MS = 250;

export function ResumeBanner() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, SLIDE_OUT_MS);
  }, []);

  useEffect(() => {
    /* Defer to the next tick so the initial SSR render doesn't flash this
       banner in, and the linter is happy about the setState-in-effect. */
    const mount = window.setTimeout(() => {
      const session = loadSession();
      if (!session) return;
      if (isExpired(session)) return;
      if (!session.currentScreenId) return;
      setVisible(true);
    }, 0);

    const autoDismiss = window.setTimeout(() => {
      dismiss();
    }, AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(mount);
      window.clearTimeout(autoDismiss);
    };
  }, [dismiss]);

  if (!visible) return null;

  const message = microcopy('toasts', 'resume_detected');

  return (
    <div
      className={`${styles.banner} ${leaving ? styles.leaving : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.close}
        onClick={dismiss}
        aria-label="Dismiss resume notice"
      >
        &times;
      </button>
    </div>
  );
}
