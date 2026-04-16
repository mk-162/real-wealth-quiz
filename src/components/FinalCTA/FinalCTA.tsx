/**
 * FinalCTA — the closing block on the summary page. Invites a conversation.
 * Does not, ever, give advice. See Voice and Tone.md "The final page voice".
 *
 * Presentational component. Summary page resolves which CTA content to show
 * (segment-specific, overlay-overridden, urgency-prefixed) and passes the
 * resolved strings in via props.
 */
import { Button } from '@/components/Button';
import styles from './FinalCTA.module.css';

export interface FinalCTAProps {
  headline?: string;
  body?: string;
  button?: string;
  buttonHref?: string;
  helper?: string;
  /** Shown as a small advisory line above the main CTA when the urgency overlay applies. */
  preamble?: string;
  /** Enhanced teal-gradient treatment for the highest-intent (`advised_but_looking`) users. */
  enhanced?: boolean;
  onBook?: () => void;
}

export function FinalCTA({
  headline = "Let's talk about you.",
  body = "Book a 20-minute call — no preparation needed on your side. We'll take it from here.",
  button = 'Book a 20-minute call',
  buttonHref,
  helper,
  preamble,
  enhanced = false,
  onBook,
}: FinalCTAProps) {
  const handleClick = () => {
    if (onBook) onBook();
    else if (buttonHref) window.open(normaliseHref(buttonHref), '_blank', 'noopener,noreferrer');
  };

  const cardClassName = enhanced ? `${styles.block} ${styles.enhanced}` : styles.block;

  return (
    <section className={cardClassName} aria-label="Book a call" data-enhanced={enhanced ? 'true' : undefined}>
      {preamble ? <p className={styles.preamble}>{preamble}</p> : null}
      <h2 className={styles.headline}>{headline}</h2>
      <p className={styles.sub}>{body}</p>
      <Button onClick={handleClick}>{button}</Button>
      {helper ? <p className={styles.alt}>{helper}</p> : null}
    </section>
  );
}

/** Calendly URLs in the content files are stored without protocol — normalise. */
function normaliseHref(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return `https://${href}`;
}
