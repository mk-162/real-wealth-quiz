/**
 * GoalsMatrix — Page-1 goals × capacity × alignment panel.
 *
 * One row per goal captured from the start of the conversation (S1-S9-specific).
 * Each row shows the goal, the current capacity to achieve it, and a coloured
 * alignment badge. This is the page's "emotional" panel — see design brief §4
 * "Goals & Wellbeing matrix" for treatment guidance.
 */

import type { WellbeingGoal, TileStatus } from '@/lib/compass/types';
import styles from './GoalsMatrix.module.css';

export interface GoalsMatrixProps {
  goals: WellbeingGoal[];
}

const LABEL: Record<TileStatus, string> = {
  green: 'Aligned',
  amber: 'Watch',
  red: 'Challenge',
  grey: 'Unclear',
};

export function GoalsMatrix({ goals }: GoalsMatrixProps) {
  return (
    <div className={styles.wrap} role="table" aria-label="Your goals against your current position">
      {goals.map((g, i) => (
        <div key={i} className={styles.row} role="row">
          <div className={styles.goal} role="cell">{g.goal}</div>
          <div className={styles.capacity} role="cell">{g.capacity}</div>
          <span
            className={`${styles.badge} ${styles[g.alignment]}`}
            role="cell"
            aria-label={`Alignment: ${LABEL[g.alignment]}`}
          >
            {LABEL[g.alignment]}
          </span>
        </div>
      ))}
    </div>
  );
}
