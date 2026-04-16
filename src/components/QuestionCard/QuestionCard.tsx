/**
 * QuestionCard — wraps the question stem, the micro-helper, and the option list.
 * One question per screen; generous whitespace; serif stem for care.
 * Consumer-side renders the OptionTile children inside the .options slot.
 */
import type { ReactNode } from 'react';
import styles from './QuestionCard.module.css';

export interface QuestionCardProps {
  /** The question stem — shown in the serif face. */
  stem: string;
  /** Optional one-line helper below the stem. */
  micro?: string;
  /** Add the Consumer-Duty-friendly skip micro-copy when a question is sensitive. */
  sensitive?: boolean;
  /** The option rows. */
  children: ReactNode;
}

export function QuestionCard({ stem, micro, sensitive, children }: QuestionCardProps) {
  return (
    <section className={styles.card} aria-label="Question">
      <h2 className={styles.stem}>{stem}</h2>
      {micro ? <p className={styles.micro}>{micro}</p> : null}
      {sensitive ? (
        <p className={styles.sensitive}>
          We ask because it can really shape what a plan looks like. Skip if you&rsquo;d
          rather.
        </p>
      ) : null}
      <div className={styles.options} role="radiogroup">
        {children}
      </div>
    </section>
  );
}
