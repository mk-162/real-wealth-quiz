/**
 * Logo — the Real Wealth wordmark.
 *
 * Lifted verbatim from dev.realwealth.co.uk/wp-content/uploads/2025/09/logo.svg
 * and recoloured to use `currentColor` so CSS drives the fill — teal on paper
 * surfaces, white on the teal hero and navy footer.
 *
 * TODO: Once Real Wealth supply the final logo pack (light / dark / monogram),
 * replace the SVG in /public accordingly.
 */
import type { CSSProperties } from 'react';
import styles from './Logo.module.css';

export interface LogoProps {
  /** Controls the fill via `color`. Set to 'inherit' to let a parent ancestor decide. */
  tone?: 'teal' | 'paper' | 'ink' | 'inherit';
  /**
   * Display width in pixels. Height scales naturally (5.09:1 aspect).
   * When OMITTED, width is governed by the `--logo-width` CSS custom
   * property cascaded from any parent — used by the page headers
   * which match the live realwealth.co.uk responsive ladder (200 /
   * 188 / 152 px across desktop / tablet / mobile). When PASSED,
   * it's written as an inline `--logo-width` that wins against any
   * parent cascade, preserving the old hard-coded behaviour for any
   * caller that needs a fixed size.
   */
  width?: number;
  /** Extra aria label; default is "Real Wealth — home". */
  label?: string;
}

export function Logo({ tone = 'teal', width, label = 'Real Wealth' }: LogoProps) {
  /* Inline style is only set when `width` was explicitly passed —
     otherwise the `var(--logo-width, 160px)` rule in Logo.module.css
     picks up a parent's cascaded value. */
  const style =
    typeof width === 'number'
      ? ({ '--logo-width': `${width}px` } as CSSProperties)
      : undefined;

  return (
    <span
      className={styles.wrap}
      data-tone={tone}
      aria-label={label}
      role="img"
      style={style}
    >
      <img
        src="/real-wealth-wordmark.svg"
        alt=""
        aria-hidden="true"
        className={styles.img}
      />
    </span>
  );
}
