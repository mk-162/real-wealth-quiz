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
  /**
   * Secondary "Get in touch" action shown alongside the primary Calendly
   * button. Typically a mailto: link. The button label defaults to
   * "Get in touch" when only `secondaryHref` is supplied.
   */
  secondaryButton?: string;
  secondaryHref?: string;
  /**
   * Layout variant.
   * - `"default"` — full-width hero block, centred copy (summary page legacy)
   * - `"compact"` — tight, left-aligned, for embedding in the sidebar card
   * - `"ladder"` — self-contained peer card matched to `BriefingCard`
   *   (paper surface, border, radius, orange top stripe, gradient button)
   */
  variant?: 'default' | 'compact' | 'ladder';
  /**
   * Overrides the default `aria-label` ("Book a call"). When the same
   * page renders multiple `FinalCTA` instances (sidebar + narrative
   * resolution on the summary page), each one should have a distinct
   * accessible name to keep landmark navigation unambiguous.
   */
  ariaLabel?: string;
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
  secondaryButton = 'Get in touch',
  secondaryHref,
  variant = 'default',
  ariaLabel = 'Book a call',
  onBook,
}: FinalCTAProps) {
  const handleClick = () => {
    if (onBook) onBook();
    else if (buttonHref) window.open(normaliseHref(buttonHref), '_blank', 'noopener,noreferrer');
  };

  const baseClass =
    variant === 'compact'
      ? styles.compact
      : variant === 'ladder'
        ? styles.ladder
        : styles.block;
  const cardClassName = enhanced ? `${baseClass} ${styles.enhanced}` : baseClass;

  return (
    <section
      className={cardClassName}
      aria-label={ariaLabel}
      data-enhanced={enhanced ? 'true' : undefined}
    >
      {preamble ? <p className={styles.preamble}>{preamble}</p> : null}
      <h2 className={styles.headline}>{headline}</h2>
      <p className={styles.sub}>{body}</p>
      <div className={styles.actions}>
        <Button onClick={handleClick}>{button}</Button>
        {secondaryHref ? (
          <a className={styles.secondary} href={secondaryHref}>
            {secondaryButton}
          </a>
        ) : null}
      </div>
      {helper ? <p className={styles.alt}>{helper}</p> : null}
    </section>
  );
}

/** Calendly URLs in the content files are stored without protocol — normalise. */
function normaliseHref(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return `https://${href}`;
}
