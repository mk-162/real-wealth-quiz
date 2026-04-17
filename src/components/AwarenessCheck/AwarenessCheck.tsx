/**
 * AwarenessCheck — an aware/partial/unaware triad.
 *
 * Previously this component rendered its own heading, micro-copy, and a
 * custom option grid with an orange selected border. In the consistency
 * pass it's been pared down to just the three options + the revealed body.
 *
 * The outer shell (kicker, stem, panel, ActionRow) is supplied by the
 * surrounding QuestionShell in conversation/page.tsx. The options
 * themselves now reuse CardGrid so the selected state matches every
 * other selectable box on the site (teal tint + inset teal ring, no
 * border-width swap, no orange).
 */
import { CardGrid, type CardGridItem } from '@/components/CardGrid';
import styles from './AwarenessCheck.module.css';

export type AwarenessLevel = 'aware' | 'partial' | 'unaware';

export interface AwarenessCheckProps {
  /**
   * Retained for backward compatibility — callers used to pass this as
   * the awareness stem. The wrapper in conversation/page.tsx now hoists
   * the stem into QuestionShell, so the topic is ignored here.
   */
  topic?: string;
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
    label: 'Vaguely — not the detail',
    description: 'I know the shape but not the specifics.',
  },
  {
    id: 'unaware',
    label: 'New to me',
    description: "I haven't come across this before.",
  },
];

const ITEMS: CardGridItem[] = LEVELS.map((l) => ({
  value: l.id,
  title: l.label,
  description: l.description,
}));

export function AwarenessCheck({
  value,
  onChange,
  body,
  complianceTag,
}: AwarenessCheckProps) {
  const selected = value ? [value] : [];
  return (
    <div className={styles.container}>
      {complianceTag ? (
        <span className={styles.tag} aria-label={`Compliance status: ${complianceTag}`}>
          {complianceTag.toUpperCase()}
        </span>
      ) : null}
      <p className={styles.micro}>
        Honest answer — &ldquo;new to me&rdquo; is as useful as &ldquo;yes&rdquo;.
      </p>
      <CardGrid
        items={ITEMS}
        selected={selected}
        mode="single"
        onToggle={(v) => onChange(v as AwarenessLevel)}
        columns={3}
      />
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
    </div>
  );
}
