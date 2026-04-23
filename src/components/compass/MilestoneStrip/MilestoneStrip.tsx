/**
 * MilestoneStrip — 4-cell Page-3 milestone row.
 * Today / At retirement / Peak / End-of-horizon-or-deplete.
 */
import styles from './MilestoneStrip.module.css';

export interface Milestone {
  kicker: string;
  value: string;
  sub: string;
  alert?: boolean;
}

export interface MilestoneStripProps {
  items: [Milestone, Milestone, Milestone, Milestone];
}

export function MilestoneStrip({ items }: MilestoneStripProps) {
  return (
    <div className={styles.strip} role="list">
      {items.map((m, i) => (
        <div key={i} role="listitem" className={`${styles.cell} ${m.alert ? styles.cellAlert : ''}`}>
          <div className={styles.kicker}>{m.kicker}</div>
          <div className={styles.val}>{m.value}</div>
          <div className={styles.sub}>{m.sub}</div>
        </div>
      ))}
    </div>
  );
}
