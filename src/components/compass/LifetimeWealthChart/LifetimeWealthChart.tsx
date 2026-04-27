/**
 * LifetimeWealthChart — Page-3 stacked-area projection.
 *
 * Uses recharts (data-driven) but restyled to match the Chart Pages visual:
 * four stacked layers — investments (orange), savings (blue), pension
 * accessible (teal mid), pension inaccessible (teal deep) — with dashed
 * brand-ink reference lines, orange marker dots, and teal-toned grid.
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
  isa: '#f97316',
  gia: '#fb923c',
  pensionAccessible: '#11a09f',
  pensionInaccessible: '#09595a',
  marker: '#353535',
  alert: '#a33a00',
  grid: '#eeeeee',
} as const;

type TooltipEntry = {
  value: number;
  payload: ProjectionYear;
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
      <Row colour={COLOURS.cash}              label="Savings"               value={d.balanceCash} />
      {d.balanceISA          > 0 && <Row colour={COLOURS.isa}              label="ISA"                   value={d.balanceISA} />}
      {d.balanceGIA          > 0 && <Row colour={COLOURS.gia}              label="GIA"                   value={d.balanceGIA} />}
      {d.pensionAccessible   > 0 && <Row colour={COLOURS.pensionAccessible}   label="Pension (accessible)"   value={d.pensionAccessible} />}
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
        <span>{label}</span>
      </span>
      <span className={styles.tooltipValue}>{gbp(value)}</span>
    </div>
  );
}

export function LifetimeWealthChart({ data, targetRetirementAge, depletionAge, height = 320 }: LifetimeWealthChartProps) {
  const chartData = data;
  const showRetirementMarker = depletionAge === undefined && targetRetirementAge > data[0].age;

  return (
    <div className={styles.card}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 24, left: 12, bottom: 8 }}>
            <defs>
              <linearGradient id="rwGradISA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOURS.isa} stopOpacity={0.92} />
                <stop offset="95%" stopColor={COLOURS.isa} stopOpacity={0.75} />
              </linearGradient>
              <linearGradient id="rwGradGIA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOURS.gia} stopOpacity={0.92} />
                <stop offset="95%" stopColor={COLOURS.gia} stopOpacity={0.75} />
              </linearGradient>
              <linearGradient id="rwGradCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOURS.cash} stopOpacity={0.92} />
                <stop offset="95%" stopColor={COLOURS.cash} stopOpacity={0.75} />
              </linearGradient>
              <linearGradient id="rwGradPenAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOURS.pensionAccessible} stopOpacity={0.92} />
                <stop offset="95%" stopColor={COLOURS.pensionAccessible} stopOpacity={0.78} />
              </linearGradient>
              <linearGradient id="rwGradPenInacc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOURS.pensionInaccessible} stopOpacity={0.95} />
                <stop offset="95%" stopColor={COLOURS.pensionInaccessible} stopOpacity={0.80} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLOURS.grid} />
            <XAxis
              dataKey="age"
              tick={{ fill: '#707070', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: COLOURS.grid }}
              label={{ value: 'AGE', position: 'insideBottom', offset: -2, style: { fill: '#353535', fontSize: 9, letterSpacing: 1.5, fontWeight: 700 } }}
            />
            <YAxis
              tickFormatter={gbp}
              tick={{ fill: '#707070', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} />

            {showRetirementMarker && (
              <ReferenceLine
                x={targetRetirementAge}
                stroke={COLOURS.marker}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                strokeWidth={1}
                label={{
                  value: `RETIREMENT · ${targetRetirementAge}`,
                  position: 'top',
                  fill: COLOURS.marker,
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />
            )}
            {depletionAge !== undefined && (
              <ReferenceLine
                x={depletionAge}
                stroke={COLOURS.alert}
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `FUNDS DEPLETE · ${depletionAge}`,
                  position: 'top',
                  fill: COLOURS.alert,
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Stack order (bottom to top): ISA, GIA, savings, pension accessible, pension inaccessible */}
            <Area type="monotone" dataKey="balanceISA"          stackId="1" name="ISA"                  stroke={COLOURS.isa}                 fill="url(#rwGradISA)" />
            <Area type="monotone" dataKey="balanceGIA"          stackId="1" name="GIA"                  stroke={COLOURS.gia}                 fill="url(#rwGradGIA)" />
            <Area type="monotone" dataKey="balanceCash"         stackId="1" name="Savings"              stroke={COLOURS.cash}                fill="url(#rwGradCash)" />
            <Area type="monotone" dataKey="pensionAccessible"   stackId="1" name="Pension (accessible)" stroke={COLOURS.pensionAccessible}   fill="url(#rwGradPenAcc)" />
            <Area type="monotone" dataKey="pensionInaccessible" stackId="1" name="Pension (inaccessible)" stroke={COLOURS.pensionInaccessible} fill="url(#rwGradPenInacc)" />

            <Legend iconType="square" wrapperStyle={{ paddingTop: 10, fontSize: 10.5, fontFamily: 'DM Sans, sans-serif' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
