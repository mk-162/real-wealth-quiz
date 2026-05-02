/**
 * DevNav — a temporary floating navigation strip for template development.
 * Lets reviewers jump between the four page templates without having to
 * walk the real funnel. Remove this component (and its import in the root
 * layout) before shipping v1.
 *
 * Also exposes a "Start over" reset that wipes the questionnaire session
 * + unlock flag from localStorage so testing can restart from Q1 without
 * hand-editing devtools storage.
 */
'use client';

import { clearSession } from '@/lib/questionnaire/session';
import styles from './DevNav.module.css';

const LINKS = [
  { href: '/', label: '1 · Homepage' },
  { href: '/conversation?tier=standard', label: '2 · Questionnaire' },
  { href: '/conversation/summary', label: '3 · Summary' },
];

const UNLOCK_KEY = 'real-wealth:report-unlocked';

export function DevNav() {
  // Dev-only aid — hide in production builds. Next will tree-shake the
  // children because `process.env.NODE_ENV` is statically inlined at build.
  if (process.env.NODE_ENV === 'production') return null;

  function handleReset() {
    if (typeof window === 'undefined') return;
    if (!window.confirm('Clear all answers and start over?')) return;
    clearSession();
    try {
      window.localStorage.removeItem(UNLOCK_KEY);
    } catch {
      /* ignore */
    }
    // Hard-navigate so any in-memory React state (engine, summary cache)
    // is rebuilt from the empty session on the next mount.
    window.location.href = '/conversation?tier=standard';
  }

  return (
    <div className={styles.strip} aria-label="Template navigation (dev only)">
      <span className={styles.tag}>dev</span>
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} className={styles.link}>
          {l.label}
        </a>
      ))}
      <button
        type="button"
        className={styles.resetButton}
        onClick={handleReset}
        title="Wipe session + unlock flag, return to Q1"
      >
        ↻ Start over
      </button>
    </div>
  );
}
