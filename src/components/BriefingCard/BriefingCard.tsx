/**
 * BriefingCard — the secondary "next-best" action on the summary page.
 *
 * The primary lead-gen action is always the free 30-minute consultation.
 * For users not ready to book, the monthly briefing is a deliberately
 * lower-commitment alternative: short, thoughtful, no calendar required.
 * Treated as a clearly subordinate card beneath the primary call CTA so
 * users who scroll past without booking have an obvious second offer.
 */
import styles from './BriefingCard.module.css';

export interface BriefingCardProps {
  /** Email-capture or signup destination. */
  href: string;
  /** Card heading. */
  headline?: string;
  /** Short body explaining what the briefing is. */
  body?: string;
  /** Button label. */
  button?: string;
  /** Reassurance line below the button. */
  helper?: string;
}

export function BriefingCard({
  href,
  headline = 'Not ready to book yet?',
  body = 'Get our short monthly briefing — one email, plain English, no spam. The same things a planner would flag, sent to people who want to keep their thinking sharp without booking a call.',
  button = 'Join the monthly briefing',
  helper = 'Unsubscribe any time. We never share your address.',
}: BriefingCardProps) {
  return (
    <section className={styles.card} aria-label="Monthly briefing">
      <h3 className={styles.headline}>{headline}</h3>
      <p className={styles.body}>{body}</p>
      <a
        href={href}
        className={styles.button}
        target="_blank"
        rel="noopener noreferrer"
      >
        {button}
      </a>
      <p className={styles.helper}>{helper}</p>
    </section>
  );
}
