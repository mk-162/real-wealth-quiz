/**
 * IllustrativeChart — generic wrapper for the small illustrative charts on
 * the summary page. Always carries the orange uppercase "Illustrative example"
 * tag per compliance rules (Design Agent Prompt — Wealth Conversation.md §Section C).
 *
 * Charts are never personalised to the user's answers. They show the shape
 * of the question for a typical household.
 */
import type { ReactNode } from 'react';
import styles from './IllustrativeChart.module.css';

export interface IllustrativeChartProps {
  title: string;
  assumptions: string; /* The short caption that names the illustrative assumption. */
  children: ReactNode; /* The chart itself (SVG, custom React, etc.). */
}

export function IllustrativeChart({
  title,
  assumptions,
  children,
}: IllustrativeChartProps) {
  return (
    <figure className={styles.chart}>
      <figcaption className={styles.cap}>
        <span className={styles.tag}>Illustrative example</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.assumptions}>{assumptions}</p>
      </figcaption>
      <div className={styles.body}>{children}</div>
    </figure>
  );
}
