/**
 * OptionTile — a single selectable answer row for radio / card_select questions.
 * Used inside QuestionCard. Meets the radio-group accessibility pattern when
 * wrapped in a container with role="radiogroup".
 */
import type { KeyboardEvent, ReactNode } from 'react';
import styles from './OptionTile.module.css';

export interface OptionTileProps {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: (value: string) => void;
  name?: string;
  icon?: ReactNode;
}

export function OptionTile({
  value,
  label,
  description,
  selected,
  onSelect,
  icon,
}: OptionTileProps) {
  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelect(value);
    }
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-selected={selected}
      className={styles.option}
      onClick={() => onSelect(value)}
      onKeyDown={handleKey}
    >
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.body}>
        <span className={styles.label}>{label}</span>
        {description ? <span className={styles.description}>{description}</span> : null}
      </span>
      <span className={styles.tick} aria-hidden="true">
        {selected ? '✓' : ''}
      </span>
    </button>
  );
}
