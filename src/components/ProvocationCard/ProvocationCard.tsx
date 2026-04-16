/**
 * ProvocationCard — the quiet, high-care callout that appears after a user
 * answers a provocation-triggering question. See Voice and Tone.md
 * "Provocation voice" for the copy rules.
 *
 * a11y: role="status" + aria-live="polite" so screen readers announce it
 * without interrupting focus.
 */
import styles from './ProvocationCard.module.css';

export interface ProvocationCardProps {
  format?: 'quote' | 'fact' | 'magnitude' | 'gentle';
  headline: string;
  body: string;
  source?: string;
  /** The soft closing line. Never "click here" / "act now". */
  closing: string;
  /** Compliance status tag — non-approved entries get a small badge in dev. */
  complianceTag?: string | null;
}

export function ProvocationCard({
  format = 'fact',
  headline,
  body,
  source,
  closing,
  complianceTag,
}: ProvocationCardProps) {
  return (
    <aside
      role="status"
      aria-live="polite"
      data-format={format}
      className={styles.card}
    >
      {complianceTag ? (
        <span
          className={styles.tag}
          aria-label={`Compliance status: ${complianceTag}`}
        >
          {complianceTag.toUpperCase()}
        </span>
      ) : null}
      <h3 className={styles.headline}>{headline}</h3>
      <p className={styles.body}>{body}</p>
      {source ? <p className={styles.source}>{source}</p> : null}
      <p className={styles.closing}>{closing}</p>
    </aside>
  );
}
