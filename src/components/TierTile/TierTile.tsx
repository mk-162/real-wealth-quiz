/**
 * TierTile — one of the three depth options on the homepage tier picker.
 * Implements the radiogroup accessibility pattern per the Tier Picker spec
 * (Design Agent Prompt — Tier Picker.md §Interaction).
 */
import type { ReactNode } from 'react';
import styles from './TierTile.module.css';

export type TierId = 'quick' | 'standard' | 'thorough';

export interface TierTileProps {
  id: TierId;
  timeLabel: string;
  name: string;
  description: string;
  icon?: ReactNode;
  selected: boolean;
  featured?: boolean; /* Shows the MOST PEOPLE START HERE ribbon when selected */
  onSelect: (id: TierId) => void;
}

export function TierTile({
  id,
  timeLabel,
  name,
  description,
  icon,
  selected,
  featured = false,
  onSelect,
}: TierTileProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-selected={selected}
      data-featured={featured && selected}
      className={styles.tile}
      onClick={() => onSelect(id)}
    >
      {featured && selected ? (
        <span className={styles.ribbon} aria-hidden="true">
          MOST PEOPLE START HERE
        </span>
      ) : null}
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.time}>{timeLabel}</span>
      {/* Span (not <h3>) because headings are not valid inside an interactive
          control with role="radio". The radio's accessible name is composed
          from its visible text children automatically. */}
      <span className={styles.name}>{name}</span>
      <p className={styles.description}>{description}</p>
    </button>
  );
}
