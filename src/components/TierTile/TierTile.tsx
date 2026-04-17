/**
 * TierTile — one of the three depth options on the homepage tier picker.
 *
 * Action semantics, not selection semantics: each tile navigates directly
 * to the conversation for its tier. Three tiles = three distinct offers,
 * not three states of a single choice. The previous radiogroup + separate
 * Begin button pattern confused users (they'd click the tile, then not
 * realise they also had to click Begin). See the design-critique in the
 * session transcript for the full rationale.
 *
 * The whole card is the hit target (it renders as an <a>), but we also
 * render an explicit "Start →" affordance near the bottom so users who
 * parse UI literally aren't left guessing whether the card is informational
 * or actionable.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './TierTile.module.css';

export type TierId = 'quick' | 'standard' | 'thorough';

export interface TierTileProps {
  id: TierId;
  timeLabel: string;
  name: string;
  description: string;
  icon?: ReactNode;
  /** Shows the "MOST PEOPLE START HERE" ribbon permanently on the
      featured tile. This is social proof / a nudge, not a state
      indicator — it no longer depends on selection. */
  featured?: boolean;
}

export function TierTile({
  id,
  timeLabel,
  name,
  description,
  icon,
  featured = false,
}: TierTileProps) {
  return (
    <Link
      href={`/conversation?tier=${id}`}
      className={styles.tile}
      data-featured={featured}
      aria-label={`Start the ${name} conversation — ${timeLabel}`}
    >
      {featured ? (
        <span className={styles.ribbon} aria-hidden="true">
          MOST PEOPLE START HERE
        </span>
      ) : null}
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.time}>{timeLabel}</span>
      <span className={styles.name}>{name}</span>
      <p className={styles.description}>{description}</p>
      <span className={styles.startAffordance} aria-hidden="true">
        Start <span className={styles.startArrow}>→</span>
      </span>
    </Link>
  );
}
