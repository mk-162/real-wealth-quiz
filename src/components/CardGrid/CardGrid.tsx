/**
 * CardGrid — a 2×2 (desktop) / 1-col (mobile) grid of selectable option cards.
 * Each card shows a teal icon, a short title, and a one-line description.
 * Pattern lifted from the tax_exposures_unified prototype screen.
 *
 * Multi-select mode toggles selection per-card; single-select mode works as
 * a radiogroup.
 *
 * When a card is selected it reveals an "appears-on-click" info block
 * underneath the title — tiny, animated — that explains why this one
 * matters. That info stays hidden for unselected cards.
 */
'use client';

import type { ReactNode } from 'react';
import styles from './CardGrid.module.css';

export interface CardGridItem {
  value: string;
  title: string;
  description: string;
  /** One-line reveal shown only when this card is selected. */
  reveal?: string;
  /** Lucide-style glyph name, rendered as an inline SVG by the consumer. */
  icon?: ReactNode;
}

export interface CardGridProps {
  items: CardGridItem[];
  selected: string[];
  mode?: 'single' | 'multi';
  onToggle: (value: string) => void;
  columns?: 2 | 3;
}

export function CardGrid({
  items,
  selected,
  mode = 'single',
  onToggle,
  columns = 2,
}: CardGridProps) {
  return (
    <div
      className={styles.grid}
      data-cols={columns}
      role={mode === 'single' ? 'radiogroup' : 'group'}
    >
      {items.map((item, i) => {
        const isSelected = selected.includes(item.value);
        return (
          <button
            key={item.value}
            type="button"
            role={mode === 'single' ? 'radio' : 'checkbox'}
            aria-checked={isSelected}
            data-selected={isSelected}
            className={styles.card}
            onClick={() => onToggle(item.value)}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
            <span className={styles.title}>{item.title}</span>
            <span className={styles.desc}>{item.description}</span>
            {item.reveal ? (
              <span className={styles.reveal} aria-hidden={!isSelected}>
                {item.reveal}
              </span>
            ) : null}
            <span className={styles.tick} aria-hidden="true">
              {isSelected ? '✓' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
