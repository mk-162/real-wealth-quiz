/**
 * CtaPanel — final-page teal-gradient CTA.
 *
 * The report's booking call-to-action. Kept deliberately spare because
 * this is a print-first artefact:
 *   - a short eyebrow
 *   - a headline
 *   - a "book online" button
 *   - a phone number (prominent — because a reader holding a printed sheet
 *     can't click a button, but they can pick up a phone)
 *
 * Copy and destination will be segment-aware via `content/segments/S[n]-*.md`
 * when wired to live data; for the mockup we accept explicit props.
 */
import styles from './CtaPanel.module.css';

export interface CtaPanelProps {
  eyebrow: string;
  title: string;
  /** Optional supporting paragraph. Omit for the print-first variant. */
  body?: string;
  buttonLabel: string;
  buttonHref: string;
  /** Phone number (prominent, for print readers). */
  phone?: string;
  /** Extra contact line under the phone (e.g. address or website). */
  contact?: string;
}

export function CtaPanel({
  eyebrow, title, body, buttonLabel, buttonHref, phone, contact,
}: CtaPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.left}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h3 className={styles.title}>{title}</h3>
        {body && <p className={styles.body}>{body}</p>}
      </div>
      <div className={styles.right}>
        <a className={styles.btn} href={buttonHref}>
          {buttonLabel}
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10h12m-5-5 5 5-5 5" />
          </svg>
        </a>
        {phone && (
          <span className={styles.phone} aria-label="Call us">
            <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 3h3l2 5-2 1a10 10 0 0 0 4 4l1-2 5 2v3c0 1-1 2-2 2a14 14 0 0 1-13-13c0-1 1-2 2-2Z"/>
            </svg>
            <span className={styles.phoneLabel}>or call</span>
            <span className={styles.phoneNumber}>{phone}</span>
          </span>
        )}
        {contact && <span className={styles.contact}>{contact}</span>}
      </div>
    </section>
  );
}
