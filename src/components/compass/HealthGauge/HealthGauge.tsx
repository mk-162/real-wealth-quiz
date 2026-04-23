/**
 * HealthGauge — Page-1 full-width "target coverage" gauge.
 *
 * Replaces the legacy Compass 0-100 ring. Shows a horizontal bar with four
 * colour zones (Shortfall / Behind / On track / Ahead) and a needle at the
 * client's score. Interprets the score as:
 *
 *   - `target`   → projected retirement wealth ÷ wealth needed for stated spend
 *   - `lifetime` → years of runway ÷ expected remaining lifetime (drawdown mode)
 *
 * See `PROMPT_design_agent.md` §4 "Financial Health gauge" for the UX intent.
 */

import styles from './HealthGauge.module.css';

export interface HealthGaugeProps {
  /** Integer score. 0-150 rendered on-bar; >150 pegs to the right with pill showing actual value. */
  score: number;
  /** `target` for accumulators, `lifetime` for drawdown (already-retired) clients. */
  mode: 'target' | 'lifetime';
  /** Plain-English one-sentence interpretation shown alongside the big number. */
  interpretation: string;
}

const ZONE_LABELS: Array<{ text: string; leftPct: number }> = [
  { text: 'Shortfall', leftPct: 23 },
  { text: 'Behind',    leftPct: 53 },
  { text: 'On track',  leftPct: 68 },
  { text: 'Ahead',     leftPct: 88 },
];

const TICKS: Array<{ value: string; leftPct: number }> = [
  { value: '0%',    leftPct: 0 },
  { value: '70%',   leftPct: 46.67 },
  { value: '90%',   leftPct: 60 },
  { value: '115%',  leftPct: 76.67 },
  { value: '150%+', leftPct: 100 },
];

export function HealthGauge({ score, mode, interpretation }: HealthGaugeProps) {
  const capped = Math.min(Math.max(score, 0), 150);
  const needleLeftPct = (capped / 150) * 100;
  const modeLabel = mode === 'lifetime'
    ? 'of expected remaining lifetime covered'
    : 'of your retirement target';

  return (
    <section className={styles.root} aria-label="Financial health gauge">
      <div className={styles.head}>
        <div className={styles.scoreWrap}>
          <div className={styles.kicker}>Financial Health</div>
          <div className={styles.bigNumber}>{score}%</div>
          <div className={styles.modeLabel}>{modeLabel}</div>
        </div>
        <p className={styles.interpretation}>{interpretation}</p>
      </div>

      <div className={styles.barWrap}>
        <div className={styles.bar} role="img" aria-label={`Score ${score}% out of 150%+`}>
          {ZONE_LABELS.map(z => (
            <span
              key={z.text}
              className={styles.zoneLabel}
              style={{ left: `${z.leftPct}%` }}
              aria-hidden="true"
            >
              {z.text}
            </span>
          ))}
          <div className={styles.needle} style={{ left: `${needleLeftPct}%` }}>
            <span className={styles.scorePill}>{score}%</span>
          </div>
        </div>
        <div className={styles.ticks}>
          {TICKS.map(t => (
            <span key={t.value} className={styles.tick} style={{ left: `${t.leftPct}%` }}>
              {t.value}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
