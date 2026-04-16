/**
 * ProgressBar — percentage-based progress (NOT "Q 4 of 15").
 * Because the question count varies by segment (12–30), we communicate
 * progress as a completion percentage only. See Segmentation Design
 * Companion §10.
 */
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** 0..1 — the fraction of the user's own question list they've answered. */
  progress: number;
  /** Optional label for screen readers; visually hidden. */
  srLabel?: string;
}

export function ProgressBar({ progress, srLabel }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress));
  const label = srLabel ?? `${Math.round(pct * 100)}% through`;

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      aria-label={label}
    >
      <div
        className={styles.bar}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}
