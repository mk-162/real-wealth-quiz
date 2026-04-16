/**
 * Card — the generic paper-surface container.
 * Used as the base for question cards, benefit cards, chart cards, etc.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 'none' | 'sm' | 'md';
  tone?: 'paper' | 'tinted';
  children: ReactNode;
}

export function Card({
  elevation = 'sm',
  tone = 'paper',
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [
    styles.card,
    styles[`elev-${elevation}`],
    styles[`tone-${tone}`],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
