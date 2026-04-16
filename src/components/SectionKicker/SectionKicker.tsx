/**
 * SectionKicker — the tiny uppercase letter-spaced label that sits above
 * every serif stem. Matches the "STEP 04 — ASSETS" pattern from the prototype.
 */
import type { ReactNode } from 'react';
import styles from './SectionKicker.module.css';

export interface SectionKickerProps {
  tone?: 'teal' | 'stone' | 'paper';
  children: ReactNode;
}

export function SectionKicker({ tone = 'teal', children }: SectionKickerProps) {
  return (
    <span className={styles.kicker} data-tone={tone}>
      {children}
    </span>
  );
}
