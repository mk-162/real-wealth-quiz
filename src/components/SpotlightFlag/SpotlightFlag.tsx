/**
 * SpotlightFlag — Section 3 of the summary page. The single "hero
 * observation" that combines several answers into one sharp framing.
 * Teal gradient background; same visual register as the enhanced CTA.
 */
import styles from './SpotlightFlag.module.css';

export interface SpotlightFlagProps {
  eyebrow: string;
  headline: string;
  body: string;
  close?: string;
}

export function SpotlightFlag({ eyebrow, headline, body, close }: SpotlightFlagProps) {
  return (
    <section className={styles.block} aria-label="Spotlight observation">
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2 className={styles.headline}>{headline}</h2>
      <p className={styles.body}>{body}</p>
      {close ? <p className={styles.close}>{close}</p> : null}
    </section>
  );
}
