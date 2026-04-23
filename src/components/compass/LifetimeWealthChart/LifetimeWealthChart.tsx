/**
 * LifetimeWealthChart — Page-2 stacked area chart.
 *
 * Ported from C:/AI_Project/Compass-Report-Kit/components/LifetimeWealthChart.tsx.
 * Uses recharts. Stack order (bottom to top):
 *   Savings (cash) → Investments (ISA + GIA) → Pension (accessible) → Pension (inaccessible).
 *
 * Vertical dashed reference line at the target retirement age labelled
 * "Desired financial independence age: N". For drawdown clients, the caller
 * can override with a "Funds deplete near age N" marker via `depletionAge`.
 */

'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { ProjectionYear } from '@/lib/compass/types';
import { gbp } from '@/lib/compass/format';
import styles from './LifetimeWealthChart.module.css';

export interface LifetimeWealthChartProps {
  data: ProjectionYear[];
  targetRetirementAge: number;
  depletionAge?: number;
  height?: number;
}

const COLOURS = {
  cash: '#2563eb',
  investments: '#f97316',
  pensionAccessible: '#10b981',
  pensionInaccessible: '#a7f3d0',
  retirementMarker: '#065f46',
  depleteMarker: '#b91c1c',
  grid: '#e2e8f0',
} as const;

type TooltipEntry = {
  color: string;
  dataKey: string;
  name: string;
  value: number;
  payload: ProjectionYear & { investments: number };
};

type TooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
};

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const total = d.balanceCash + d.balanceISA + d.balanceGIA + d.pensionAccessible + d.pensionInaccessible;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHead}>
        Age {label} <span className={styles.tooltipYear}>({d.year})</span>
      </div>
      <Row colour={COLOURS.cash} label="Savings" value={d.balanceCash} />
      <Row colour={COLOURS.investments} label="Investments" value={d.balanceISA + d.balanceGIA} />
      {d.pensionAccessible > 0 && <Row colour={COLOURS.pensionAccessible} label="Pension (accessible)" value={d.pensionAccessible} />}
      {d.pensionInaccessible > 0 && <Row colour={COLOURS.pensionInaccessible} label="Pension (inaccessible)" value={d.pensionInaccessible} />}
      <div className={styles.tooltipTotal}>
        <span>Total liquid wealth</span><span>{gbp(total)}</span>
      </div>
    </div>
  );
}

function Row({ colour, label, value }: { colour: string; label: string; value: number }) {
  return (
    <div className={styles.tooltipRow}>
      <span className={styles.tooltipRowLeft}>
        <span className={styles.tooltipSwatch} style={{ background: colour }} />
        <span className={styles.tooltipLabel}>{label}</span>
      </span>
      <span className={styles.tooltipValue}>{gbp(value)}</span>
    </div>
  );
}

export function LifetimeWealthChart({
  data,
  targetRetirementAge,
  depletionAge,
  height = 380,
}: LifetimeWealthChartProps) {
  // Collapse ISA + GIA into a single "investments" key for the visual.
  const chartData = data.map(d => ({
    ...d,
    investments: d.balanceISA + d.balanceGIA,
  }));

  return (
    <div className={styles.root} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 24, right: 24, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOURS.cash} stopOpacity={0.9} />
              <stop offset="95%" stopColor={COLOURS.cash} stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOURS.investments} stopOpacity={0.9} />
              <stop offset="95%" stopColor={COLOURS.investments} stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="gradPenAcc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOURS.pensionAccessible} stopOpacity={0.9} />
              <stop offset="95%" stopColor={COLOURS.pensionAccessible} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="gradPenInacc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOURS.pensionInaccessible} stopOpacity={0.9} />
              <stop offset="95%" stopColor={COLOURS.pensionInaccessible} stopOpacity={0.4} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLOURS.grid} />
          <XAxis
            dataKey="age"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: COLOURS.grid }}
            label={{ value: 'AGE', position: 'insideBottom', offset: -2, style: { fill: '#94a3b8', fontSize: 10, letterSpacing: 1 } }}
          />
          <YAxis
            tickFormatter={gbp}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} />

          {depletionAge === undefined && (
            <ReferenceLine
              x={targetRetirementAge}
              stroke={COLOURS.retirementMarker}
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Desired financial independence age: ${targetRetirementAge}`,
                position: 'top',
                fill: COLOURS.retirementMarker,
                fontSize: 10,
              }}
            />
          )}

          {depletionAge !== undefined && (
            <ReferenceLine
              x={depletionAge}
              stroke={COLOURS.depleteMarker}
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Funds deplete near age ${depletionAge}`,
                position: 'top',
                fill: COLOURS.depleteMarker,
                fontSize: 10,
              }}
            />
          )}

          <Area type="monotone" dataKey="balanceCash" stackId="1" name="Savings" stroke={COLOURS.cash} fill="url(#gradCash)" />
          <Area type="monotone" dataKey="investments" stackId="1" name="Investments" stroke={COLOURS.investments} fill="url(#gradInv)" />
          <Area type="monotone" dataKey="pensionAccessible" stackId="1" name="Pension (accessible)" stroke={COLOURS.pensionAccessible} fill="url(#gradPenAcc)" />
          <Area type="monotone" dataKey="pensionInaccessible" stackId="1" name="Pension (inaccessible)" stroke={COLOURS.pensionInaccessible} fill="url(#gradPenInacc)" />

          <Legend iconType="square" wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
