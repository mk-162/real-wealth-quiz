/**
 * NetWorthDonut — Page-1 large asset-allocation donut.
 *
 * Renders property / pension / savings / investments / business slices from
 * the computed balance sheet. Slices with zero value are filtered out so
 * small-pot clients (S1) don't get a sparse-looking chart.
 */

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { BalanceSheet } from '@/lib/compass/types';
import { gbp } from '@/lib/compass/format';
import styles from './NetWorthDonut.module.css';

export interface NetWorthDonutProps {
  balanceSheet: BalanceSheet;
}

const SLICE_COLOURS = {
  property:    '#0284c7', // sky-600
  pension:     '#67e8f9', // cyan-300
  savings:     '#2563eb', // blue-600
  investments: '#f97316', // orange-500
  business:    '#a855f7', // purple-500
} as const;

export function NetWorthDonut({ balanceSheet }: NetWorthDonutProps) {
  const data = [
    { name: 'Property',    value: balanceSheet.assets.property,    colour: SLICE_COLOURS.property },
    { name: 'Pension',     value: balanceSheet.assets.pension,     colour: SLICE_COLOURS.pension },
    { name: 'Savings',     value: balanceSheet.assets.savings,     colour: SLICE_COLOURS.savings },
    { name: 'Investments', value: balanceSheet.assets.investments, colour: SLICE_COLOURS.investments },
    { name: 'Business',    value: balanceSheet.assets.business,    colour: SLICE_COLOURS.business },
  ].filter(s => s.value > 0);

  return (
    <div className={styles.root} aria-label="Net worth by asset type">
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="62%"
              outerRadius="100%"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((s, i) => <Cell key={i} fill={s.colour} />)}
            </Pie>
            <Tooltip formatter={(v) => gbp(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.centre}>
          <div className={styles.centreKicker}>Net worth</div>
          <div className={styles.centreNumber}>{gbp(balanceSheet.netWorth)}</div>
        </div>
      </div>

      <div className={styles.legend}>
        {data.map(s => (
          <div key={s.name} className={styles.legendRow}>
            <span className={styles.swatch} style={{ background: s.colour }} aria-hidden="true" />
            <span className={styles.legendLabel}>{s.name}</span>
            <span className={styles.legendValue}>{gbp(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
