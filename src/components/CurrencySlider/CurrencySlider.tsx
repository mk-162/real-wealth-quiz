/**
 * CurrencySlider — a labelled range slider with a live currency readout.
 *
 * The track is driven by a fine internal step (£100 by default) so the
 * thumb glides smoothly. The emitted value is snapped to a piecewise
 * "nice number" scale — finer at low values, coarser at high — so users
 * always land on round numbers instead of £37,283. People think in
 * round numbers when describing money; the scale matches that.
 *
 * Endpoint labels sit beneath the track. The current value is announced
 * in brand-orange gelica serif above the track so it reads with care.
 */
'use client';

import { useId, type ChangeEvent } from 'react';
import styles from './CurrencySlider.module.css';

/** A piecewise step — "for values up to and including `until`, snap to `step`". */
export interface ScaleBand {
  until: number;
  step: number;
}
export type Scale = ReadonlyArray<ScaleBand>;

/**
 * Lump-sum / wealth scale — for pots, savings, property values, salaries.
 * Range: 0 → unlimited.
 *   £0–£10k     → £500
 *   £10k–£50k   → £1,000
 *   £50k–£200k  → £5,000
 *   £200k–£1m   → £25,000
 *   £1m+        → £50,000
 */
export const LUMP_SCALE: Scale = [
  { until: 10_000, step: 500 },
  { until: 50_000, step: 1_000 },
  { until: 200_000, step: 5_000 },
  { until: 1_000_000, step: 25_000 },
  { until: Number.POSITIVE_INFINITY, step: 50_000 },
];

/**
 * Monthly / small-amount scale — for monthly spend, savings, mortgage payments.
 * Range: typically 0 → £25k.
 *   £0–£1k    → £50
 *   £1k–£5k   → £100
 *   £5k+      → £500
 */
export const MONTHLY_SCALE: Scale = [
  { until: 1_000, step: 50 },
  { until: 5_000, step: 100 },
  { until: Number.POSITIVE_INFINITY, step: 500 },
];

/**
 * Pick a sensible default scale from the slider's `max`. Sliders with a
 * tight upper bound (≤£25k) are almost always monthly amounts; anything
 * larger is a lump-sum.
 */
export function defaultScaleFor(max: number): Scale {
  return max <= 25_000 ? MONTHLY_SCALE : LUMP_SCALE;
}

/** Snap a raw value to the nearest "nice" step under the active scale band. */
export function snapToScale(value: number, scale: Scale): number {
  for (const band of scale) {
    if (value <= band.until) return Math.round(value / band.step) * band.step;
  }
  // Defensive: if no band matched (shouldn't happen — last band is +Infinity).
  const last = scale[scale.length - 1];
  return Math.round(value / last.step) * last.step;
}

export interface CurrencySliderProps {
  label: string;
  min: number;
  max: number;
  /**
   * Internal step that drives the native range input. A small value (£100)
   * keeps thumb movement smooth; the emitted value is snapped to `scale`
   * so the user always lands on a round number. Defaults to 100 if a
   * scale is in use, or to 10_000 for the legacy fixed-step mode.
   */
  step?: number;
  /**
   * Piecewise step scale — fine at low values, coarse at high. When
   * provided (or when `useDefaultScale` is true) the emitted value is
   * snapped to the nearest band step. Pass `null` to opt out of snapping
   * and use a single fixed `step` instead (legacy callers).
   */
  scale?: Scale | null;
  /**
   * If true and no `scale` is given, auto-pick a scale from `max`
   * (LUMP_SCALE or MONTHLY_SCALE). Defaults to true so existing callers
   * get smarter granularity for free.
   */
  useDefaultScale?: boolean;
  value: number;
  onChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
  /** Currency symbol shown before the number. Default £. */
  symbol?: string;
  /** Tone of the large readout — orange is the default to draw the eye. */
  readoutTone?: 'orange' | 'teal' | 'ink';
}

function formatMoney(symbol: string, n: number) {
  if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}m`;
  return `${symbol}${new Intl.NumberFormat('en-GB').format(Math.round(n))}`;
}

export function CurrencySlider({
  label,
  min,
  max,
  step,
  scale,
  useDefaultScale = true,
  value,
  onChange,
  minLabel,
  maxLabel,
  symbol = '£',
  readoutTone = 'orange',
}: CurrencySliderProps) {
  const id = useId();

  // Resolve the active snapping scale. `null` opts out (legacy fixed-step).
  const activeScale: Scale | null =
    scale === null ? null
      : scale ?? (useDefaultScale ? defaultScaleFor(max) : null);

  // The native input's step. Fine when snapping (so the thumb glides);
  // legacy fallback when the caller wants a fixed step value back.
  const internalStep = step ?? (activeScale ? 100 : 10_000);

  const pct = ((value - min) / (max - min)) * 100;

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    const snapped = activeScale ? snapToScale(raw, activeScale) : raw;
    onChange(snapped);
  };

  return (
    <div className={styles.row}>
      <div className={styles.head}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <span className={styles.readout} data-tone={readoutTone}>
          {formatMoney(symbol, value)}
        </span>
      </div>
      <div
        className={styles.track}
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      >
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={internalStep}
          value={value}
          onChange={handle}
          className={styles.range}
          aria-label={label}
          aria-valuetext={formatMoney(symbol, value)}
        />
      </div>
      <div className={styles.ends}>
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
