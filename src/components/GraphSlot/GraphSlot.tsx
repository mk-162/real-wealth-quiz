/**
 * GraphSlot — placeholder on the summary page for a user-supplied chart.
 *
 * The team owns the chart content; this component reserves the visual slot
 * and renders a lightweight placeholder so the layout is complete in the
 * meantime. Swap the inner content for the final chart when ready.
 */
import type { ReactNode } from 'react';
import styles from './GraphSlot.module.css';

export interface GraphSlotProps {
  /** Optional override — pass a real chart component here when ready. */
  children?: ReactNode;
  /** Eyebrow above the chart title (section label). */
  eyebrow?: string;
  /** Chart title shown as the section heading. */
  title?: string;
  /** Supporting line under the title. */
  caption?: string;
}

export function GraphSlot({
  children,
  eyebrow = 'Your snapshot',
  title = 'The shape of what you told us',
  caption = 'A quick picture of where the conversation leans — not a valuation.',
}: GraphSlotProps) {
  return (
    <section className={styles.wrap} aria-labelledby="graph-heading">
      <div className={styles.inner}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 id="graph-heading" className={styles.title}>
          {title}
        </h2>
        <p className={styles.caption}>{caption}</p>
        <div className={styles.chart}>{children ?? <Placeholder />}</div>
      </div>
    </section>
  );
}

function Placeholder() {
  return (
    <div className={styles.placeholder} aria-hidden="true">
      <div className={styles.placeholderBars}>
        {[40, 60, 75, 55, 82, 68].map((h, i) => (
          <div
            key={i}
            className={styles.placeholderBar}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className={styles.placeholderHint}>Chart coming soon</p>
    </div>
  );
}
