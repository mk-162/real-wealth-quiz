/**
 * ReassuranceStrip — the two-tile row that sits beneath the question shell,
 * mirroring the prototype's "Secure Encryption / Advisor Tip" pattern but
 * with on-brand copy that respects the Voice and Tone rules (no hype).
 *
 * The second tile is the provocation slot on answered questions — it becomes
 * the inline "worth a conversation" callout when the engine fires one.
 */
import type { ReactNode } from 'react';
import styles from './ReassuranceStrip.module.css';

export interface ReassuranceTileProps {
  icon?: ReactNode;
  title: string;
  body: string;
  tone?: 'neutral' | 'teal' | 'orange';
}

export interface ReassuranceStripProps {
  tiles: ReassuranceTileProps[];
}

export function ReassuranceStrip({ tiles }: ReassuranceStripProps) {
  return (
    <div className={styles.strip}>
      {tiles.map((tile, i) => (
        <article key={i} className={styles.tile} data-tone={tile.tone ?? 'neutral'}>
          {tile.icon ? <span className={styles.icon}>{tile.icon}</span> : null}
          <div>
            <h3 className={styles.title}>{tile.title}</h3>
            <p className={styles.body}>{tile.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
