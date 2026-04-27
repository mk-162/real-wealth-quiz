/**
 * NetWorthDonut — Page-1 donut of assets by type.
 *
 * Pure SVG donut built with `stroke-dasharray` rather than recharts, so it
 * matches the Chart Pages design exactly and renders server-side without
 * client hydration. Slices with zero value are filtered out so a small-pot
 * client doesn't get an empty-looking chart.
 */

import type { BalanceSheet } from '@/lib/compass/types';
import { gbp } from '@/lib/compass/format';
import styles from './NetWorthDonut.module.css';

export interface NetWorthDonutProps {
  balanceSheet: BalanceSheet;
  /** Optional card title override. */
  title?: string;
}

const SLICE_COLOURS = {
  property:    '#0c7372',
  pension:     '#67e8f9',
  savings:     '#2563eb',
  isa:         '#f97316',
  gia:         '#fb923c',
  otherAssets: '#fbbf24',
  business:    '#8b5cf6',
} as const;

// Circumference of a circle with r=70 (matches SVG below).
const CIRCUMFERENCE = 2 * Math.PI * 70;

export function NetWorthDonut({ balanceSheet, title = 'What you own.' }: NetWorthDonutProps) {
  // Split investments into ISA / GIA / other so the wrapper mix is visible.
  const slices = [
    { name: 'Property',    value: balanceSheet.assets.property,    colour: SLICE_COLOURS.property },
    { name: 'Pension',     value: balanceSheet.assets.pension,     colour: SLICE_COLOURS.pension },
    { name: 'Savings',     value: balanceSheet.assets.savings,     colour: SLICE_COLOURS.savings },
    { name: 'ISA',         value: balanceSheet.assets.isa,         colour: SLICE_COLOURS.isa },
    { name: 'GIA',         value: balanceSheet.assets.gia,         colour: SLICE_COLOURS.gia },
    { name: 'Other',       value: balanceSheet.assets.otherAssets, colour: SLICE_COLOURS.otherAssets },
    { name: 'Business',    value: balanceSheet.assets.business,    colour: SLICE_COLOURS.business },
  ].filter(s => s.value > 0);

  const totalShown = slices.reduce((a, s) => a + s.value, 0);

  // Build each slice as (dash, gap) + offset rotation.
  let cursor = 0;
  const svgSlices = slices.map((s) => {
    const frac = totalShown > 0 ? s.value / totalShown : 0;
    const dash = frac * CIRCUMFERENCE;
    const offset = -cursor;
    cursor += dash;
    return { ...s, dash, offset };
  });

  return (
    <section className={styles.card} aria-label="Net worth by asset type">
      <header className={styles.header}>
        <p className={styles.kicker}>What you own</p>
        <h3 className={styles.title}>{title}</h3>
      </header>

      <div className={styles.wrap} aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <g transform="translate(100,100) rotate(-90)">
            {svgSlices.map((s, i) => (
              <circle
                key={i}
                r="70"
                fill="none"
                stroke={s.colour}
                strokeWidth="30"
                strokeDasharray={`${s.dash} ${CIRCUMFERENCE - s.dash}`}
                strokeDashoffset={s.offset}
              />
            ))}
          </g>
        </svg>
      </div>

      <div className={styles.heroNum}>
        <span className={styles.heroBig}>{gbp(balanceSheet.netWorth)}</span>
        <span className={styles.heroUnit}>net worth</span>
      </div>

      <div className={styles.legend}>
        {slices.map(s => (
          <div key={s.name} className={styles.legendRow}>
            <span className={styles.swatch} style={{ background: s.colour }} aria-hidden="true" />
            <span className={styles.legendLabel}>{s.name}</span>
            <span className={styles.legendValue}>{gbp(s.value)}</span>
          </div>
        ))}
        {balanceSheet.liabilities.totalLiabilities > 0 && (
          <div className={styles.legendRow} style={{ marginTop: 6, opacity: 0.85 }}>
            <span
              className={styles.swatch}
              style={{ background: 'transparent', border: '2px solid #b91c1c' }}
              aria-hidden="true"
            />
            <span className={styles.legendLabel}>Less liabilities</span>
            <span className={styles.legendValue}>−{gbp(balanceSheet.liabilities.totalLiabilities)}</span>
          </div>
        )}
      </div>
    </section>
  );
}
