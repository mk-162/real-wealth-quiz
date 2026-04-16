/**
 * AspirationEcho — the single most emotional moment in the app.
 * Echoes the user's Q2.4 answer back in quiet gelica italic.
 * See Voice and Tone.md "Aspiration echo" for the copy rules.
 */
import styles from './AspirationEcho.module.css';

export interface AspirationEchoProps {
  /** The user's literal Q2.4 answer, or a blended template line. */
  line: string;
  /** Small caption beneath, in area-normal. */
  caption?: string;
}

export function AspirationEcho({
  line,
  caption = "That's what your plan is for.",
}: AspirationEchoProps) {
  return (
    <section className={styles.hero} aria-label="The life you're planning for">
      <p className={styles.label}>You said:</p>
      <blockquote className={styles.quote}>
        <span className={styles.quoteMark} aria-hidden="true">
          &ldquo;
        </span>
        {line}
        <span className={styles.quoteMark} aria-hidden="true">
          &rdquo;
        </span>
      </blockquote>
      <p className={styles.caption}>{caption}</p>
    </section>
  );
}
