/**
 * ReportView — the three data-driven chart pages of the Compass report.
 *
 * Pages rendered:
 *   - Snapshot: gauge + donut + balance strip + takeaway
 *   - Planning grid: key-bar + 3×4 tile grid + goals list
 *   - Projection: milestones + stacked area chart + chart-reading rows + CTA
 *
 * Narrative pages (Cover, Where you are, Five things, etc.) live elsewhere —
 * see src/app/report/master/[segment]/page.tsx for the full document.
 *
 * `hideFrame` renders the pages without the A4 PageFrame chrome (useful when
 * embedding inside another layout that already provides framing).
 */

import { buildReport, type Fixture } from '@/lib/compass';
import { gbp } from '@/lib/compass/format';
import {
  HealthGauge,
  NetWorthDonut,
  PlanningGrid,
  GoalsMatrix,
  BalanceStrip,
  LifetimeWealthChart,
  PageFrame,
  Takeaway,
  MilestoneStrip,
  Assumptions,
  CtaPanel,
  type Milestone,
} from '@/components/compass';
import styles from './ReportView.module.css';

export interface ReportViewProps {
  fixture: Fixture;
  /** First name used in doc title ("Your Wealth Report · Sarah"). Defaults to the segment's stock name. */
  recipientName?: string;
  /** Starting page number in the full document (default 2 — chart pages sit after Cover). */
  startPageNum?: number;
  /** Total pages in the doc for the chrome-bot page count (default 8). */
  totalPages?: number;
  /** Strip the PageFrame chrome (accent strip, top bar, footer). */
  hideFrame?: boolean;
  /** Kept for backward compat — no-op in the new design. */
  hideHeaders?: boolean;
}

const SEGMENT_NAMES: Record<string, string> = {
  S1: 'Marcus',
  S2: 'Sarah',
  S3: 'James',
  S4: 'Diane',
  S5: 'Rob',
  S6: 'Elena',
  S7: 'Paul',
  S8: 'Margaret',
  S9: 'Charles',
};

export function ReportView({
  fixture,
  recipientName,
  startPageNum = 2,
  totalPages = 8,
  hideFrame = false,
}: ReportViewProps) {
  const report = buildReport(fixture.inputs);
  const name = recipientName ?? SEGMENT_NAMES[fixture.view.segmentId] ?? 'your plan';
  const docTitle = `Your Wealth Report · ${name}`;
  const { projection, balanceSheet, scores, assumptions, inputs } = report;
  const { view } = fixture;

  const today = projection[0];
  const atRetire = projection.find(y => y.age === inputs.targetRetirementAge)
    ?? projection[Math.min(5, projection.length - 1)];
  const end = projection[projection.length - 1];
  const peak = projection.reduce(
    (m, p) => (total(p) > total(m) ? p : m),
    projection[0],
  );
  const depletion = projection.find(
    y => y.age > inputs.currentAge
      && (y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible) <= 0,
  );
  const alreadyRetired = inputs.currentAge >= inputs.targetRetirementAge;

  const milestones: [Milestone, Milestone, Milestone, Milestone] = [
    { kicker: 'Today',         value: gbp(total(today)),    sub: `age ${today.age}` },
    {
      kicker: alreadyRetired ? 'At age 80' : 'At retirement',
      value:  gbp(alreadyRetired ? total(projection.find(p => p.age === 80) ?? end) : total(atRetire)),
      sub:    `age ${alreadyRetired ? 80 : inputs.targetRetirementAge}`,
    },
    { kicker: 'Peak wealth',   value: gbp(total(peak)),     sub: `age ${peak.age}` },
    depletion
      ? { kicker: 'Funds last to', value: `age ${depletion.age}`, sub: 'current spend level', alert: true }
      : { kicker: 'At age 95',     value: gbp(total(end)),        sub: 'end of horizon' },
  ];

  const footerAddress = 'Manchester · Taunton · hello@realwealth.co.uk';
  const footerRegulated = 'Real Wealth Partners Ltd · Authorised and regulated by the Financial Conduct Authority';
  const chartReadings = view.bullets.slice(0, 4);

  function Page({ pageNum, footer, label, children }: { pageNum: number; footer: string; label: string; children: React.ReactNode }) {
    if (hideFrame) return <section>{children}</section>;
    return (
      <PageFrame
        docTitle={docTitle}
        pageNum={String(pageNum).padStart(2, '0')}
        totalPages={totalPages}
        footer={footer}
        label={label}
      >
        {children}
      </PageFrame>
    );
  }

  return (
    <>
      {/* ---------- SNAPSHOT ---------- */}
      <Page pageNum={startPageNum} footer={footerAddress} label="Snapshot">
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>Your snapshot</span>
          <h2 className={styles.hSection}>Where you stand today — in one picture.</h2>
          <p className={styles.intro}>
            The colour bar shows your overall financial health. The donut shows what you own.
            The strip underneath shows what it adds up to. Nothing here is advice —
            it&rsquo;s the starting point for a conversation.
          </p>
        </div>

        <div className={styles.snapHead}>
          {/* HealthGauge.title is the short zone-matched headline (e.g.
              "You're on track"). It is deliberately NOT the takeaway
              banner — that long sentence is the Takeaway panel at the
              bottom of this page. When no title is passed, HealthGauge
              derives a zone-matched default from the score. */}
          <HealthGauge
            score={scores.targetCoveragePct}
            mode={scores.targetCoverageMode}
            interpretation={view.healthInterpretation}
          />
          <NetWorthDonut balanceSheet={balanceSheet} />
        </div>

        <div className={styles.balanceHead}>
          <span className={styles.eyebrow}>Balance sheet · headline totals</span>
        </div>
        <BalanceStrip balanceSheet={balanceSheet} />

        <div className={styles.pushBottom}>
          <div style={{ marginTop: 18 }}>
            <Takeaway title={view.headline.title} body={view.headline.body} />
          </div>
        </div>
      </Page>

      {/* ---------- PLANNING GRID + GOALS ---------- */}
      <Page pageNum={startPageNum + 1} footer={footerAddress} label="Planning grid">
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>Planning grid · 12 areas at a glance</span>
          <h2 className={styles.hSection}>Where you&rsquo;re strong, where to look next.</h2>
          <p className={styles.intro}>
            Twelve planning areas, colour-coded by where you&rsquo;ve told us your head is at.
            Tiles marked <strong style={{ color: 'var(--rw-orange)' }}>Attention</strong>
            {' '}are where a small change now saves a bigger conversation later.
          </p>
        </div>

        <PlanningGrid tiles={view.grid} showKey />

        <div className={styles.sectionTitleTight}>
          <span className={styles.eyebrow}>Goals &amp; wellbeing · alignment with what matters to you</span>
        </div>
        <GoalsMatrix goals={view.goals} />
      </Page>

      {/* ---------- PROJECTION + CTA ---------- */}
      <Page pageNum={startPageNum + 2} footer={footerRegulated} label="Projection">
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>Your wealth over time</span>
          <h2 className={styles.hSection}>Today, at retirement, and beyond.</h2>
          <p className={styles.intro}>
            A projection from age {inputs.currentAge} to 95, built from your answers and
            published assumptions. The shape matters more than the number — it shows how
            time, not timing, does most of the work.
          </p>
        </div>

        <MilestoneStrip items={milestones} />

        <div style={{ marginTop: 14, marginBottom: 12 }}>
          <LifetimeWealthChart
            data={projection}
            targetRetirementAge={inputs.targetRetirementAge}
            depletionAge={depletion?.age}
            height={280}
          />
        </div>

        <div className={styles.sectionTitleTight}>
          <span className={styles.eyebrow}>How to read this chart</span>
        </div>

        <div className={styles.readGrid}>
          {chartReadings.map((b, i) => (
            <div key={i} className={styles.readRow}>
              <span className={`${styles.chip} ${styles[readChipClass(b.tone)]}`}>
                {readChipLabel(b.tone)}
              </span>
              <div>
                <p className={styles.readRowTitle}>{readShortTitle(b.text)}</p>
                <p className={styles.readRowBody}>{readShortBody(b.text)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.stackGap} style={{ marginTop: 8 }}>
          <CtaPanel
            eyebrow="Book a conversation"
            title={`Let's talk about you, ${name}.`}
            buttonLabel="Book online"
            buttonHref="https://calendly.com/realwealth/intro"
            phone="0161 768 7722"
            contact="realwealth.co.uk"
          />
          <Assumptions assumptions={assumptions} />
        </div>
      </Page>
    </>
  );
}

/* ------------------------------------------------------------------- */

function total(y: { balanceCash: number; balanceISA: number; balanceGIA: number; pensionAccessible: number; pensionInaccessible: number }): number {
  return y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible + y.pensionInaccessible;
}

function readChipClass(tone: 'good' | 'warn' | 'risk' | 'info'): string {
  return tone === 'good' ? 'chipGood'
    : tone === 'warn' ? 'chipReview'
    : tone === 'risk' ? 'chipAttention'
    : 'chipInfo';
}

function readChipLabel(tone: 'good' | 'warn' | 'risk' | 'info'): string {
  return tone === 'good' ? 'Good'
    : tone === 'warn' ? 'Watch'
    : tone === 'risk' ? 'Risk'
    : 'Info';
}

function readShortTitle(text: string): string {
  const firstSentence = text.split(/[.!?](?:\s|$)/)[0].trim();
  if (firstSentence.length <= 70) return firstSentence;
  return firstSentence.slice(0, 67) + '…';
}

function readShortBody(text: string): string {
  const parts = text.split(/[.!?](?:\s|$)/);
  if (parts.length <= 1) return '';
  return parts.slice(1).join('. ').replace(/^\s+/, '').trim() || text;
}
