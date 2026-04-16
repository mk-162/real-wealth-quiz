/**
 * SectionNav — the subtle left-rail nav that tells a user where they are
 * in the questionnaire, using the ten Compass-style sections. States:
 *   - done     (teal check)
 *   - current  (teal orange-accent bar, bold label)
 *   - pending  (stone text)
 *
 * Collapsed to a horizontal dot-row on mobile. Decorative — the progress
 * bar at the top is the authoritative indicator for screen readers.
 */
import styles from './SectionNav.module.css';
import type { SectionMeta } from '@/lib/sections';

export type SectionStatus = 'done' | 'current' | 'pending';

export interface SectionNavProps {
  items: (SectionMeta & { status: SectionStatus })[];
}

export function SectionNav({ items }: SectionNavProps) {
  return (
    <nav className={styles.nav} aria-label="Section progress" aria-hidden="true">
      <ol className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item} data-status={item.status}>
            <span className={styles.marker}>
              {item.status === 'done' ? '✓' : item.step.toString().padStart(2, '0')}
            </span>
            <span className={styles.label}>{item.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
