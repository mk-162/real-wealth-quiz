/**
 * PlanningGrid — 9 universal tiles in a 3×3 layout.
 *
 * Status colours are a fundamentally different kind of signal from the rest
 * of the report: they say "this area is good / worth reviewing / needs your
 * attention / we didn't check". The chip colour is the primary carrier;
 * "Attention" also gets an orange left-border band on the tile itself so a
 * reader eyeballing the grid for reds sees them first.
 */

import type { PlanningTile, TileStatus } from '@/lib/compass/types';
import styles from './PlanningGrid.module.css';

export interface PlanningGridProps {
  tiles: PlanningTile[];
  /** Show the colour-key legend above the grid. Default true. */
  showKey?: boolean;
  /** Show the "what this tile checks" methodology line under each note. Default false. */
  showMethodology?: boolean;
}

const STATUS_LABEL: Record<TileStatus, string> = {
  green: 'Good',
  amber: 'Review',
  red: 'Attention',
  grey: 'Not checked',
};

const STATUS_CHIP_CLASS: Record<TileStatus, string> = {
  green: 'chipGood',
  amber: 'chipReview',
  red: 'chipAttention',
  grey: 'chipNeutral',
};

export function PlanningGrid({ tiles, showKey = true, showMethodology = false }: PlanningGridProps) {
  return (
    <>
      {showKey && (
        <div className={styles.keyBar}>
          <span className={styles.keyItem}>
            <span className={styles.keyDot} style={{ background: 'var(--status-good-fg)' }} />
            Good — no action needed
          </span>
          <span className={styles.keyItem}>
            <span className={styles.keyDot} style={{ background: 'var(--status-review-fg)' }} />
            Review — worth a closer look
          </span>
          <span className={styles.keyItem}>
            <span className={styles.keyDot} style={{ background: 'var(--status-attention-fg)' }} />
            Attention — action recommended
          </span>
          <span className={styles.keyItem}>
            <span className={styles.keyDot} style={{ background: 'var(--status-neutral-fg)' }} />
            Not checked
          </span>
        </div>
      )}

      <div className={styles.grid} role="list" aria-label="Planning areas at a glance">
        {tiles.map(t => (
          <div
            key={t.key}
            role="listitem"
            className={`${styles.tile} ${t.status === 'red' ? styles.attention : ''}`}
            aria-label={`${t.label}: ${STATUS_LABEL[t.status]}. ${t.note}`}
            title={t.whatItChecks ? `What this checks: ${t.whatItChecks}` : undefined}
          >
            <span className={`${styles.chip} ${styles[STATUS_CHIP_CLASS[t.status]]} ${styles.status}`}>
              {STATUS_LABEL[t.status]}
            </span>
            <h4 className={styles.tileTitle}>{t.label}</h4>
            <p className={styles.tileBody}>{t.note}</p>
            {showMethodology && t.whatItChecks && (
              <p className={styles.tileMethod} title="What this tile checks">
                {t.whatItChecks}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
