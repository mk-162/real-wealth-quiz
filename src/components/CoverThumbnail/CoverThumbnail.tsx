/**
 * CoverThumbnail — static brand graphic shown next to the "Open my report"
 * button on /conversation/summary state 2.
 *
 * Stylised mock of the cover page, not a live render — keeps the surface
 * lightweight and avoids re-rendering the full report twice. The dimensions
 * mirror the cover's portrait ratio so the visual cue feels like the same
 * artefact the user is about to open.
 */
import styles from './CoverThumbnail.module.css';

export interface CoverThumbnailProps {
  /** First name for the "For [name]" line. Falls back to a neutral string. */
  recipientName?: string;
}

export function CoverThumbnail({ recipientName }: CoverThumbnailProps) {
  const name = recipientName?.trim() || 'you';
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <figure className={styles.frame} aria-hidden="true">
      <div className={styles.card}>
        <div className={styles.glowTr} />
        <div className={styles.glowBl} />

        <div className={styles.top}>
          <span className={styles.brand}>REAL WEALTH</span>
          <span className={styles.kind}>WEALTH REPORT</span>
        </div>

        <div className={styles.leafMark}>
          <svg viewBox="0 0 60 80" width="100%" height="100%">
            <ellipse cx="30" cy="30" rx="14" ry="22" fill="rgba(255, 211, 58, 0.85)" />
            <ellipse cx="30" cy="52" rx="14" ry="22" fill="rgba(255, 255, 255, 0.92)" />
          </svg>
        </div>

        <div className={styles.bottom}>
          <span className={styles.eyebrow}>For {name}</span>
          <span className={styles.title}>Your Wealth Report.</span>
          <span className={styles.date}>{date}</span>
        </div>
      </div>
    </figure>
  );
}
