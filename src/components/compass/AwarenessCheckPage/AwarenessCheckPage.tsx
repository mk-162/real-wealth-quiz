/**
 * AwarenessCheckPage — body of one awareness-check page in the report.
 *
 * Renders inside a <PageFrame>. Designed to flex from a plain 3-paragraph
 * page (the original treatment) up to a richer layout with an illustration,
 * key-facts strip, pull-quote, at-a-glance bullets, and a planner-voice
 * "worth a conversation" callout — every block is optional, so the content
 * team adds richness one file at a time.
 *
 * Layout:
 *   [eyebrow] [risk chip?]
 *   [title]                       [hero image right, if any]
 *   [key facts strip?]
 *   [paragraph 1]
 *   [pull quote?]
 *   [paragraph 2]
 *   [at a glance box?]
 *   [paragraph 3?]
 *   [worth a conversation callout?]
 */
import Image from 'next/image';
import type { ExpandedAwarenessCheck, RiskBand } from '@/lib/compass/pdf-content';
import styles from './AwarenessCheckPage.module.css';
import reportStyles from '@/app/report/master/[segment]/page.module.css';

export interface AwarenessCheckPageProps {
  check: ExpandedAwarenessCheck;
}

const RISK_LABEL: Record<RiskBand, string> = {
  low: 'Low priority',
  watch: 'Worth watching',
  urgent: 'Urgent',
};

export function AwarenessCheckPage({ check }: AwarenessCheckPageProps) {
  const {
    title,
    paragraphs,
    imageSlug,
    pullQuote,
    keyFacts,
    atAGlance,
    worthAConversation,
    riskBand,
  } = check;

  const [p1, p2, p3] = paragraphs;
  const heroSrc = imageSlug
    ? `/report-preview/assets/illustrations/${imageSlug}.svg`
    : null;

  return (
    <>
      <div className={heroSrc ? styles.headerRow : reportStyles.sectionTitle}>
        <div className={heroSrc ? styles.headerCopy : undefined}>
          <span className={reportStyles.eyebrow}>Things worth a conversation</span>
          <h2 className={reportStyles.hSection}>
            {title}
            {riskBand ? <RiskChip band={riskBand} /> : null}
          </h2>
        </div>
        {heroSrc ? (
          <figure className={styles.hero}>
            <Image
              src={heroSrc}
              alt=""
              className={styles.heroImg}
              width={360}
              height={360}
              unoptimized
            />
          </figure>
        ) : null}
      </div>

      {keyFacts && keyFacts.length > 0 ? (
        <div className={styles.keyFactsStrip}>
          {keyFacts.map((f, i) => (
            <div key={i} className={styles.keyFact}>
              <span className={styles.keyFactLabel}>{f.label}</span>
              <span className={styles.keyFactValue}>{f.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {p1 ? <p className={reportStyles.narrativePara}>{p1}</p> : null}

      {pullQuote ? (
        <blockquote className={reportStyles.narrativePullquote}>{pullQuote}</blockquote>
      ) : null}

      {p2 ? <p className={reportStyles.narrativePara}>{p2}</p> : null}

      {atAGlance && atAGlance.length > 0 ? (
        <aside className={styles.atAGlance}>
          <p className={styles.atAGlanceTitle}>At a glance</p>
          <ul className={styles.atAGlanceList}>
            {atAGlance.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </aside>
      ) : null}

      {p3 ? <p className={reportStyles.narrativePara}>{p3}</p> : null}

      {worthAConversation ? (
        <aside className={styles.worthAConversation}>
          <p className={styles.worthAConversationTitle}>Worth a conversation</p>
          <p className={styles.worthAConversationBody}>{worthAConversation}</p>
        </aside>
      ) : null}
    </>
  );
}

function RiskChip({ band }: { band: RiskBand }) {
  const cls =
    band === 'urgent'
      ? styles.riskChipUrgent
      : band === 'watch'
        ? styles.riskChipWatch
        : styles.riskChipLow;
  return <span className={`${styles.riskChip} ${cls}`}>{RISK_LABEL[band]}</span>;
}
