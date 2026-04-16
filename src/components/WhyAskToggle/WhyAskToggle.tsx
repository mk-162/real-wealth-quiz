/**
 * WhyAskToggle — a subtle "Why we ask" disclosure. Click to reveal a short
 * paragraph explaining why this question matters to a planner conversation.
 *
 * Not a tooltip — that would hide the content from keyboard users. A native
 * <details>/<summary> with a styled teal pill as the trigger.
 */
import type { ReactNode } from 'react';
import styles from './WhyAskToggle.module.css';

export interface WhyAskToggleProps {
  label?: string;
  children: ReactNode;
}

export function WhyAskToggle({
  label = 'Why we ask',
  children,
}: WhyAskToggleProps) {
  return (
    <details className={styles.wrap}>
      <summary className={styles.summary}>
        <span className={styles.icon} aria-hidden="true">
          ?
        </span>
        {label}
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
