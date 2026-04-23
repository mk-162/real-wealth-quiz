/**
 * Takeaway — big friendly "Key takeaway" panel.
 * Matches the orange-accent card from the Chart Pages design.
 */
import styles from './Takeaway.module.css';

export interface TakeawayProps {
  /** Short eyebrow above the title. Defaults to "Key takeaway". */
  kicker?: string;
  title: string;
  body: string;
}

export function Takeaway({ kicker = 'Key takeaway', title, body }: TakeawayProps) {
  return (
    <section className={styles.panel} aria-label={kicker}>
      <div className={styles.kicker}>{kicker}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.body}>{body}</p>
    </section>
  );
}
