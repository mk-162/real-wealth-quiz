/**
 * SlideSwap — wraps a block of changing content and animates cross-fades
 * when the `swapKey` prop changes. This is the single primitive used across
 * the app for "text that updates" moments so the motion language is
 * consistent: currency readouts, provocation cards, section chips, etc.
 *
 * Behaviour:
 *   - Each swap runs a mount animation (slide-up + fade) on the new content.
 *   - If a previous value is being replaced by null, the container collapses
 *     gracefully via the auto-rows grid trick.
 *   - Respects prefers-reduced-motion (globally disabled in base.css).
 */
import type { ReactNode } from 'react';
import styles from './SlideSwap.module.css';

export interface SlideSwapProps {
  /** A stable value that, when it changes, replays the entry animation. */
  swapKey: string | number | null | undefined;
  /** Optional direction — up is the default. */
  direction?: 'up' | 'down';
  children: ReactNode;
}

export function SlideSwap({ swapKey, direction = 'up', children }: SlideSwapProps) {
  return (
    <div className={styles.outer} data-direction={direction}>
      {/* Keying on swapKey re-mounts the inner, which re-runs the CSS entry
          animation. The outer wrapper is a grid row that collapses smoothly
          when children become null. */}
      <div key={String(swapKey ?? '')} className={styles.inner}>
        {children}
      </div>
    </div>
  );
}
