/**
 * GoalsMatrix — Chart Pages style "goals list".
 *
 * One row per goal, each with an icon, title, capacity sub-line, and a
 * coloured alignment chip. Icons are picked heuristically from the goal
 * text; override by passing `goals[i].icon`.
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

const CHIP_CLASS: Record<TileStatus, string> = {
  green: 'chipGood',
  amber: 'chipReview',
  red: 'chipAttention',
  grey: 'chipNeutral',
};

/** Heuristic icon picker based on the goal text. */
function pickIcon(goalText: string): React.ReactNode {
  const t = goalText.toLowerCase();
  if (/home|house|property|mortgage/.test(t)) {
    return <><path d="M3 9 10 3l7 6" /><path d="M5 9v8h10V9" /></>;
  }
  if (/retire|retirement|independence/.test(t)) {
    return <><circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" /></>;
  }
  if (/tax|trap/.test(t)) {
    return <><rect x="4" y="4" width="12" height="12" rx="1" /><path d="M7 8h6M7 12h6" /></>;
  }
  if (/legacy|children|grand|inherit/.test(t)) {
    return <><path d="M4 8c0-2 2-4 6-4s6 2 6 4-2 4-6 4-6-2-6-4Z" /><path d="M7 14l-2 3M13 14l2 3" /></>;
  }
  if (/exit|sale|business/.test(t)) {
    return <><path d="M4 10h12m-5-5 5 5-5 5" /></>;
  }
  if (/travel|holiday/.test(t)) {
    return <><path d="M2 12c0-3 2-5 4-5l3 4 3-4c2 0 4 2 4 5l-7 4Z" /></>;
  }
  if (/fund|education|uni/.test(t)) {
    return <><path d="M3 7l7-3 7 3-7 3Z" /><path d="M6 9v4l4 2 4-2V9" /></>;
  }
  // Default: a house-ish "life" icon
  return <><path d="M4 17V9l6-5 6 5v8" /><path d="M8 17v-5h4v5" /></>;
}

export function GoalsMatrix({ goals }: GoalsMatrixProps) {
  return (
    <div className={styles.list} role="list" aria-label="Your goals against your current position">
      {goals.map((g, i) => (
        <div key={i} className={styles.row} role="listitem">
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 20 20">{pickIcon(g.goal)}</svg>
          </span>
          <div className={styles.text}>
            <span className={styles.title}>{g.goal}</span>
            <span className={styles.sub}>{g.capacity}</span>
          </div>
          <span
            className={`${styles.chip} ${styles[CHIP_CLASS[g.alignment]]}`}
            aria-label={`Alignment: ${LABEL[g.alignment]}`}
          >
            {LABEL[g.alignment]}
          </span>
        </div>
      ))}
    </div>
  );
}
