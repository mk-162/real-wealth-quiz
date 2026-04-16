/**
 * SilentGapCard — small "noticed, but we didn't ask" card used inside the
 * tonal-shift band in Section 5. Info-icon top-left, body copy only.
 */
import styles from './SilentGapCard.module.css';

export interface SilentGapCardProps {
  body: string;
}

export function SilentGapCard({ body }: SilentGapCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.icon} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="5" r="0.9" fill="currentColor" />
        </svg>
      </span>
      <p className={styles.body}>{body}</p>
    </div>
  );
}
