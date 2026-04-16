/**
 * Button — primary / secondary / text variants.
 * Consumes brand tokens from tokens.css; no hex values live here.
 * All variants are keyboard-focusable and meet the 56px tap target on mobile.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant =
  /** Solid-orange signature CTA (matches realwealth.co.uk "Get in Touch"). */
  | 'primary'
  /** White fill + orange ring variant of the primary (matches "Let's talk about you"). */
  | 'outline-primary'
  /** Teal outline on paper. Used for supportive, non-primary actions. */
  | 'secondary'
  /** Inline text-link style for Back / Cancel. */
  | 'text'
  /** Transparent with a white ring — use on teal/dark hero surfaces. */
  | 'outline-on-dark';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
