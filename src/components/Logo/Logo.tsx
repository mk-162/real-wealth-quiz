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
import styles from './Logo.module.css';

export interface LogoProps {
  /** Controls the fill via `color`. Set to 'inherit' to let a parent ancestor decide. */
  tone?: 'teal' | 'paper' | 'ink' | 'inherit';
  /** Display width in pixels. Height scales naturally (5.09:1 aspect). */
  width?: number;
  /** Extra aria label; default is "Real Wealth — home". */
  label?: string;
}

export function Logo({ tone = 'teal', width = 160, label = 'Real Wealth' }: LogoProps) {
  return (
    <span
      className={styles.wrap}
      data-tone={tone}
      aria-label={label}
      role="img"
      style={{ width }}
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
