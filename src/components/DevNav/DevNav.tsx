/**
 * DevNav — a temporary floating navigation strip for template development.
 * Lets reviewers jump between the four page templates without having to
 * walk the real funnel. Remove this component (and its import in the root
 * layout) before shipping v1.
 */
import styles from './DevNav.module.css';

const LINKS = [
  { href: '/', label: '1 · Homepage' },
  { href: '/conversation?tier=standard', label: '2 · Questionnaire' },
  { href: '/conversation/details', label: '3 · Details' },
  { href: '/conversation/summary', label: '4 · Summary' },
];

export function DevNav() {
  // Dev-only aid — hide in production builds. Next will tree-shake the
  // children because `process.env.NODE_ENV` is statically inlined at build.
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className={styles.strip} aria-label="Template navigation (dev only)">
      <span className={styles.tag}>dev</span>
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} className={styles.link}>
          {l.label}
        </a>
      ))}
    </div>
  );
}
