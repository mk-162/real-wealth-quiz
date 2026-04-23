/**
 * PlanningGrid — 4×3 status dashboard on Page 1.
 *
 * Twelve universal tiles covering retirement readiness, pension, state pension,
 * investment, tax, emergency cash, debt, mortgage, estate, IHT, protection,
 * and (owners) business exit / (others) income mix. Each tile is one of four
 * statuses: green / amber / red / grey (unknown or not applicable).
 *
 * See `PROMPT_design_agent.md` §4 "Planning grid" for the UX intent; the
 * universal tile set is defined in `TileKey` on `src/lib/compass/types.ts`.
 */

import type { PlanningTile, TileStatus } from '@/lib/compass/types';
import styles from './PlanningGrid.module.css';

export interface PlanningGridProps {
  tiles: PlanningTile[];
}

const STATUS_LABEL: Record<TileStatus, string> = {
  green: 'Good',
  amber: 'Review',
  red: 'Attention',
  grey: 'Not checked',
};

export function PlanningGrid({ tiles }: PlanningGridProps) {
  return (
    <div className={styles.grid} role="list" aria-label="Planning areas at a glance">
      {tiles.map(t => (
        <div
          key={t.key}
          role="listitem"
          className={`${styles.tile} ${styles[t.status]}`}
          aria-label={`${t.label}: ${STATUS_LABEL[t.status]}. ${t.note}`}
        >
          <div className={styles.band} aria-hidden="true" />
          <div className={styles.body}>
            <div className={styles.label}>{t.label}</div>
            <div className={styles.status}>{STATUS_LABEL[t.status]}</div>
            <div className={styles.note}>{t.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
