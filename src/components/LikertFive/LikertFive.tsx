/**
 * LikertFive — a five-point scale with named endpoints.
 *
 * Five circular nodes. Selected node fills teal with an orange ring. Endpoints
 * labelled in small sans (*"Not at all confident"* / *"Very confident"*).
 * Keyboard-accessible via arrow keys; full radiogroup ARIA.
 */
'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import styles from './LikertFive.module.css';

export interface LikertFiveProps {
  value?: number; /* 1..5, undefined when no selection */
  onChange: (value: number) => void;
  leftLabel?: string;
  rightLabel?: string;
  ariaLabel?: string;
}

export function LikertFive({
  value,
  onChange,
  leftLabel = 'Not at all',
  rightLabel = 'Very',
  ariaLabel = 'Confidence scale',
}: LikertFiveProps) {
  const scaleRef = useRef<HTMLDivElement>(null);

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = (delta: number) => {
      const target = (value ?? 3) + delta;
      if (target >= 1 && target <= 5) onChange(target);
    };
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        next(1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        next(-1);
        break;
      case 'Home':
        e.preventDefault();
        onChange(1);
        break;
      case 'End':
        e.preventDefault();
        onChange(5);
        break;
    }
  };

  useEffect(() => {
    if (value && scaleRef.current) {
      const button = scaleRef.current.querySelector(
        `[data-node="${value}"]`,
      ) as HTMLButtonElement | null;
      button?.focus({ preventScroll: true });
    }
  }, [value]);

  return (
    <div className={styles.wrap}>
      <div
        ref={scaleRef}
        role="radiogroup"
        aria-label={ariaLabel}
        className={styles.scale}
        onKeyDown={handleKey}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              data-node={n}
              aria-checked={selected}
              aria-label={`${n} of 5`}
              className={styles.node}
              data-selected={selected}
              onClick={() => onChange(n)}
              tabIndex={selected || (!value && n === 1) ? 0 : -1}
            />
          );
        })}
      </div>
      <div className={styles.labels}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
