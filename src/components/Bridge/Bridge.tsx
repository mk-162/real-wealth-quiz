/**
 * Bridge — Section 6 of the summary page. A single editorial paragraph
 * that manages expectations and bridges the shortlist to the CTA.
 *
 * Not a card. No border, no shadow — just the typography.
 */
import styles from './Bridge.module.css';

export interface BridgeProps {
  copy: string;
}

export function Bridge({ copy }: BridgeProps) {
  return (
    <section className={styles.block} aria-label="What we didn't ask">
      <p className={styles.copy}>{copy}</p>
    </section>
  );
}
