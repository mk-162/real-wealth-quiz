/**
 * CtaPanel — final-page teal-gradient CTA.
 *
 * Two presentational variants, picked from the props you pass:
 *
 *   1. **Print-first (no button).** Phone number is the primary CTA — large
 *      and prominent — with a clickable URL underneath. This is the
 *      layout used on the Projection page (page 04), where the printed
 *      sheet is the dominant artefact and the reader can't click. Pass a
 *      `contactHref` and `contact` to render a real link beside the phone.
 *
 *   2. **Online (button + phone).** Includes an "online" booking button
 *      alongside the phone fallback. Used where a button still makes
 *      sense (e.g. the Next-step page where the user has just unlocked
 *      the report on screen). Provide `buttonLabel` and `buttonHref`.
 *
 * The phone number stays prominent in both variants because a reader
 * holding a printed page can't click — but they can dial.
 */
import styles from './CtaPanel.module.css';

export interface CtaPanelProps {
  eyebrow: string;
  title: string;
  /** Optional supporting paragraph. Omit for the print-first variant. */
  body?: string;
  /** Online booking link. Omit for the print-first variant. */
  buttonLabel?: string;
  buttonHref?: string;
  /** Phone number (prominent — primary action when no button). */
  phone?: string;
  /** Display text for the secondary contact line (e.g. a URL or email). */
  contact?: string;
  /**
   * Clickable href for the contact line. When present, the contact text
   * renders as a real `<a>` so the link works on screen and the URL
   * remains readable in print. When omitted, the contact text falls back
   * to a plain caption.
   */
  contactHref?: string;
}

export function CtaPanel({
  eyebrow,
  title,
  body,
  buttonLabel,
  buttonHref,
  phone,
  contact,
  contactHref,
}: CtaPanelProps) {
  const hasButton = Boolean(buttonLabel && buttonHref);

  return (
    <section className={styles.panel}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.left}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h3 className={styles.title}>{title}</h3>
        {body && <p className={styles.body}>{body}</p>}
      </div>
      <div className={hasButton ? styles.rightWithButton : styles.rightCompact}>
        {hasButton && (
          <a className={styles.btn} href={buttonHref}>
            {buttonLabel}
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 10h12m-5-5 5 5-5 5" />
            </svg>
          </a>
        )}

        {phone && hasButton && (
          /* Online variant — phone reads as a fallback ("or call …"). */
          <span className={styles.phone} aria-label="Call us">
            <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 3h3l2 5-2 1a10 10 0 0 0 4 4l1-2 5 2v3c0 1-1 2-2 2a14 14 0 0 1-13-13c0-1 1-2 2-2Z" />
            </svg>
            <span className={styles.phoneLabel}>or call</span>
            <span className={styles.phoneNumber}>{phone}</span>
          </span>
        )}

        {phone && !hasButton && (
          /* Print-first variant — phone IS the primary CTA. No "or call"
             label; the number stands alone with a small dialer hint. */
          <a className={styles.phonePrimary} href={`tel:${phone.replace(/\s+/g, '')}`} aria-label={`Call ${phone}`}>
            <span className={styles.phonePrimaryNumber}>{phone}</span>
          </a>
        )}

        {contact && contactHref ? (
          <a className={styles.contactLink} href={contactHref}>
            {contact}
          </a>
        ) : contact ? (
          <span className={styles.contact}>{contact}</span>
        ) : null}
      </div>
    </section>
  );
}
