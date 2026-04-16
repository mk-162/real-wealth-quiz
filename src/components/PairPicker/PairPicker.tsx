/**
 * PairPicker — a single wide card split into two halves, one per option.
 * Picking one half fills it with a teal tint + orange accent border.
 *
 * Pattern lifted from the brief §4.D.1 trade-offs screen. Three pair-pickers
 * are stacked on that screen; each is independent.
 */
'use client';

import styles from './PairPicker.module.css';

export interface PairPickerProps {
  leftValue: string;
  leftLabel: string;
  rightValue: string;
  rightLabel: string;
  value?: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function PairPicker({
  leftValue,
  leftLabel,
  rightValue,
  rightLabel,
  value,
  onChange,
  ariaLabel = 'Trade-off choice',
}: PairPickerProps) {
  return (
    <div
      className={styles.pair}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === leftValue}
        data-selected={value === leftValue}
        data-side="left"
        className={styles.half}
        onClick={() => onChange(leftValue)}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === rightValue}
        data-selected={value === rightValue}
        data-side="right"
        className={styles.half}
        onClick={() => onChange(rightValue)}
      >
        {rightLabel}
      </button>
    </div>
  );
}
