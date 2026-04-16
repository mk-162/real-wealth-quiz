/**
 * PrioritySliders — several importance sliders stacked in a single panel.
 * Each row has a short label, a right-aligned PRIORITY LEVEL tag, and a
 * teal-filled bar with a draggable teal thumb.
 *
 * Pattern lifted from the lifestyle_importance_sliders prototype screen.
 */
'use client';

import { useId, type ChangeEvent } from 'react';
import styles from './PrioritySliders.module.css';

export interface PriorityItem {
  id: string;
  label: string;
  /** 0..100 — maps to Low ↔ High under the hood. */
  value: number;
}

export interface PrioritySlidersProps {
  items: PriorityItem[];
  onChange: (id: string, value: number) => void;
  leftLabel?: string;
  rightLabel?: string;
}

export function PrioritySliders({
  items,
  onChange,
  leftLabel = 'LOW',
  rightLabel = 'HIGH',
}: PrioritySlidersProps) {
  return (
    <div className={styles.wrap}>
      {items.map((item) => (
        <Row
          key={item.id}
          item={item}
          onChange={onChange}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
        />
      ))}
    </div>
  );
}

function Row({
  item,
  onChange,
  leftLabel,
  rightLabel,
}: {
  item: PriorityItem;
  onChange: (id: string, value: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  const id = useId();
  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(item.id, Number(e.target.value));

  return (
    <div className={styles.row}>
      <div className={styles.head}>
        <label htmlFor={id} className={styles.label}>
          {item.label}
        </label>
        <span className={styles.tag}>Priority level</span>
      </div>
      <div
        className={styles.track}
        style={{ '--pct': `${item.value}%` } as React.CSSProperties}
      >
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={item.value}
          onChange={handle}
          className={styles.range}
          aria-label={item.label}
          aria-valuetext={`${item.value} out of 100`}
        />
      </div>
      <div className={styles.ends}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
