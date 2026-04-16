/**
 * CurrencySlider — a labelled range slider with a live currency readout.
 * Pattern lifted from the property_mortgage prototype screen.
 *
 * Endpoint labels sit beneath the track. The current value is announced
 * in brand-orange gelica serif above the track so it reads with care.
 */
'use client';

import { useId, type ChangeEvent } from 'react';
import styles from './CurrencySlider.module.css';

export interface CurrencySliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
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
  step = 10_000,
  value,
  onChange,
  minLabel,
  maxLabel,
  symbol = '£',
  readoutTone = 'orange',
}: CurrencySliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value));

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
          step={step}
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
