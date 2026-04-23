/**
 * HealthGauge — Page-1 financial health gauge.
 *
 * Half-circle arc gauge with a needle, a hero numeral underneath, and a
 * thin coloured scale bar at the bottom. Matches the Chart Pages design.
 *
 * The arc gradient transitions:
 *   red (shortfall) → amber (behind) → green (on track) → deep teal (ahead).
 *
 * The needle rotates from -88° (0%) to +88° (150%+), clamped at both ends.
 *
 * `mode` switches semantics:
 *   - `target`   "X% of your retirement target"
 *   - `lifetime` "X% of expected remaining lifetime covered" (drawdown)
 */

import styles from './HealthGauge.module.css';

export interface HealthGaugeProps {
  /** Integer percentage. Display shows actual value; arc needle clamps to [0, 150]. */
  score: number;
  /** `target` for accumulators, `lifetime` for drawdown clients. */
  mode: 'target' | 'lifetime';
  /** Friendly short title e.g. "You're on track — and time is on your side." */
  title: string;
  /** Plain-English one-sentence interpretation below the arc + numeral. */
  interpretation: string;
}

function bandFor(score: number): { label: string; delta: string; toneClass: string } {
  if (score < 70)  return { label: 'Shortfall', delta: '• Shortfall', toneClass: 'deltaRisk' };
  if (score < 90)  return { label: 'Behind',    delta: '• Behind',    toneClass: 'deltaWarn' };
  if (score <= 115) return { label: 'On track',  delta: '• On track',  toneClass: 'deltaGood' };
  return { label: 'Ahead', delta: '• Ahead', toneClass: 'deltaGood' };
}

export function HealthGauge({ score, mode, title, interpretation }: HealthGaugeProps) {
  // Needle rotation: map 0→150 to -88→+88 degrees. Clamp score > 150.
  const clamped = Math.min(Math.max(score, 0), 150);
  const rotateDeg = -88 + (clamped / 150) * 176;

  // Scale bar needle position as a percentage (clamps same way)
  const needleLeftPct = (clamped / 150) * 100;

  const band = bandFor(score);
  const modeLabel = mode === 'lifetime' ? 'of lifetime covered' : 'of target';

  return (
    <section className={styles.card} aria-label="Financial health">
      <header className={styles.header}>
        <p className={styles.kicker}>Financial health</p>
        <h3 className={styles.title}>{title}</h3>
      </header>

      <div className={styles.figure} aria-hidden="true">
        <svg viewBox="0 0 200 115" width="200" height="115">
          <defs>
            <linearGradient id="rwGaugeFill" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%"   stopColor="#c95a2b" />
              <stop offset="35%"  stopColor="#e8a23a" />
              <stop offset="65%"  stopColor="#3aa37a" />
              <stop offset="100%" stopColor="#0c7372" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <path
            d="M15,100 A85,85 0 0 1 185,100"
            fill="none" stroke="#efece6" strokeWidth="18" strokeLinecap="round"
          />
          {/* Coloured arc */}
          <path
            d="M15,100 A85,85 0 0 1 185,100"
            fill="none" stroke="url(#rwGaugeFill)" strokeWidth="18" strokeLinecap="round"
          />
          {/* Needle */}
          <g transform={`translate(100,100) rotate(${rotateDeg})`}>
            <line x1="0" y1="0" x2="0" y2="-82" stroke="#353535" strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy="0" r="6" fill="#353535" />
            <circle cx="0" cy="0" r="2.5" fill="#faf7f2" />
          </g>
        </svg>
      </div>

      <div className={styles.heroNum}>
        <span className={styles.heroBig}>{score}%</span>
        <span className={styles.heroUnit}>{modeLabel}</span>
        <span className={`${styles.heroDelta} ${styles[band.toneClass]}`}>{band.delta}</span>
      </div>

      <div>
        <div className={styles.scale} role="img" aria-label={`Score ${score}%, zone: ${band.label}`}>
          <div className={styles.seg} style={{ background: '#c95a2b' }} />
          <div className={styles.seg} style={{ background: '#e8a23a' }} />
          <div className={styles.seg} style={{ background: '#d7b45a' }} />
          <div className={styles.seg} style={{ background: '#3aa37a' }} />
          <div className={styles.seg} style={{ background: '#0c7372' }} />
          <div className={styles.needle} style={{ left: `calc(${needleLeftPct}% - 1px)` }} />
        </div>
        <div className={styles.marks}>
          <span>0%</span>
          <span>70%</span>
          <span>90%</span>
          <span>115%</span>
          <span>150%+</span>
        </div>
        <p className={styles.body}>{interpretation}</p>
      </div>
    </section>
  );
}
