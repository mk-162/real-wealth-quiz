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

  /* In the ladder variant this card sits next to BriefingCard which uses
     a flat rectangular outline button. Use outline-primary so both peer
     CTAs share the same geometry (flat rect, upright gelica, 6px radius)
     and differ only in brand colour — orange vs teal — which is the
     intended "primary vs secondary" signal. The default + compact
     variants keep the signature orange italic pill (variant unset). */
  const buttonVariant = variant === 'ladder' ? 'outline-primary' : undefined;

  /* In the ladder variant the secondary "Get in touch" link is folded
     into the same line as the helper micro-copy (joined by a middle
     dot) rather than sitting as its own element below the button. The
     peer BriefingCard only has a one-line helper below the button; if
     we kept the link on its own line we'd have two lines of content
     below the primary button here and one on the peer, so the two
     buttons would never line up across the grid. Folding keeps a
     single one-line strip below the button on both cards. */
  const inlineSecondary =
    variant === 'ladder' && secondaryHref ? (
      <>
        {helper ? <span aria-hidden="true">{' · '}</span> : null}
        <a className={styles.secondary} href={secondaryHref}>
          {secondaryButton}
        </a>
      </>
    ) : null;

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
        <Button variant={buttonVariant} onClick={handleClick}>{button}</Button>
        {variant === 'ladder' ? null : secondaryHref ? (
          <a className={styles.secondary} href={secondaryHref}>
            {secondaryButton}
          </a>
        ) : null}
      </div>
      {helper || inlineSecondary ? (
        <p className={styles.alt}>
          {helper}
          {inlineSecondary}
        </p>
      ) : null}
    </section>
  );
}

/** Calendly URLs in the content files are stored without protocol — normalise. */
function normaliseHref(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return `https://${href}`;
}
