/**
 * AwarenessCheck — an aware/partial/unaware triad.
 * Shown as a screen type inside the questionnaire flow. The answer tunes
 * the tone of the subsequent provocation and never blames the user.
 *
 * After the user picks a level, the matching body (aware / partial /
 * unaware) is revealed inline beneath the options. The continue button on
 * the surrounding screen advances once the user has chosen.
 *
 * See Design Agent Prompt — Wealth Conversation.md for the pattern.
 */
import styles from './AwarenessCheck.module.css';

export type AwarenessLevel = 'aware' | 'partial' | 'unaware';

export interface AwarenessCheckProps {
  /** The headline question (the part that follows "Had you come across…?"). */
  topic: string;
  value?: AwarenessLevel;
  onChange: (level: AwarenessLevel) => void;
  /** Body to show after the user has picked a response. */
  body?: string;
  /** Compliance status — non-approved entries get a small DRAFT badge in dev. */
  complianceTag?: string | null;
}

const LEVELS: { id: AwarenessLevel; label: string; description: string }[] = [
  {
    id: 'aware',
    label: "I'd come across this",
    description: "I've heard of it — maybe even thought about it.",
  },
  {
    id: 'partial',
    label: "Vaguely — not the detail",
    description: "I know the shape but not the specifics.",
  },
  {
    id: 'unaware',
    label: 'New to me',
    description: "I haven't come across this before.",
  },
];

export function AwarenessCheck({
  topic,
  value,
  onChange,
  body,
  complianceTag,
}: AwarenessCheckProps) {
  return (
    <section className={styles.container} aria-label="Awareness check">
      {complianceTag ? (
        <span className={styles.tag} aria-label={`Compliance status: ${complianceTag}`}>
          {complianceTag.toUpperCase()}
        </span>
      ) : null}
      <h2 className={styles.question}>
        <span className={styles.topic}>{topic}</span>
      </h2>
      <p className={styles.micro}>
        Honest answer — &ldquo;new to me&rdquo; is as useful as &ldquo;yes&rdquo;.
      </p>
      <div className={styles.options} role="radiogroup">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            role="radio"
            aria-checked={value === level.id}
            data-selected={value === level.id}
            className={styles.option}
            onClick={() => onChange(level.id)}
          >
            <span className={styles.label}>{level.label}</span>
            <span className={styles.description}>{level.description}</span>
          </button>
        ))}
      </div>
      {value && body ? (
        /*
         * aria-live="polite" + aria-atomic so that assistive tech announces the
         * revealed body after the user picks aware/partial/unaware, without
         * interrupting focus on the chosen option. The radio group above is
         * deliberately kept OUTSIDE this region — it's focusable UI, not
         * announcement content. (Audit P2.4.)
         */
        <div
          className={styles.body}
          data-level={value}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {body.split('\n').map((line, i) =>
            line.trim() ? <p key={i}>{line}</p> : null,
          )}
        </div>
      ) : null}
    </section>
  );
}
