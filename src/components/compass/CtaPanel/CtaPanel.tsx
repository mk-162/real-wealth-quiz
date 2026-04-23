/**
 * CtaPanel — final-page teal-gradient CTA.
 *
 * The report's booking call-to-action. Copy and destination should be
 * segment-aware via the `content/segments/S[n]-*.md` CTA fields when wired
 * to the live data; for the mockup we accept explicit props.
 */
import styles from './CtaPanel.module.css';

export interface CtaPanelProps {
  eyebrow: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  /** Contact line rendered under the button (phone / address). */
  contact?: string;
}

export function CtaPanel({ eyebrow, title, body, buttonLabel, buttonHref, contact }: CtaPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.glow} aria-hidden="true" />
      <div>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.body}>{body}</p>
      </div>
      <div className={styles.right}>
        <a className={styles.btn} href={buttonHref}>
          {buttonLabel}
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10h12m-5-5 5 5-5 5" />
          </svg>
        </a>
        {contact && <span className={styles.contact}>{contact}</span>}
      </div>
    </section>
  );
}
