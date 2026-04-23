/**
 * /report/compass-preview — developer-only preview of the Compass Page-1 + Page-2 design.
 *
 * Renders all 9 segment fixtures (S1-S9) against the new component set
 * (HealthGauge, PlanningGrid, GoalsMatrix, BalanceStrip, NetWorthDonut,
 * LifetimeWealthChart) so the design can be visually audited without
 * running the full questionnaire.
 *
 * This route is additive — it does NOT replace the live `/conversation/summary`
 * page. Activation into the real flow is Phase 1B (see PHASE_1_NOTES.md).
 */

'use client';

import { useState } from 'react';
import { FIXTURES, buildReport, type Fixture } from '@/lib/compass';
import { gbp } from '@/lib/compass/format';
import {
  HealthGauge, PlanningGrid, GoalsMatrix, BalanceStrip, NetWorthDonut, LifetimeWealthChart,
} from '@/components/compass';
import styles from './page.module.css';

export default function CompassPreviewPage() {
  const [segmentId, setSegmentId] = useState<string>('S2');
  const fixture = FIXTURES.find(f => f.view.segmentId === segmentId) ?? FIXTURES[1];

  return (
    <>
      <div className={styles.exampleBanner}>
        EXAMPLE ONLY — Illustrative projection built from banded answers. Not personalised financial advice. Speak to a qualified IFA for advice tailored to you.
      </div>

      <main className={styles.page}>
        <div className={styles.devNotice}>
          <strong>Developer preview.</strong> This route is not linked from the live site. It renders the redesigned Page-1 + Page-2 of the Compass report against the 9 canned personas defined in <code>src/lib/compass/fixtures.ts</code>. Switch personas using the tabs below; each view shows the snapshot page then the projection page. Use this to visually audit the design before wiring into <code>/conversation/summary</code>.
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Segment picker">
          {FIXTURES.map(f => (
            <button
              key={f.view.segmentId}
              role="tab"
              aria-selected={f.view.segmentId === segmentId}
              className={`${styles.tab} ${f.view.segmentId === segmentId ? styles.tabActive : ''}`}
              onClick={() => setSegmentId(f.view.segmentId)}
            >
              <strong>{f.view.segmentId}</strong> &middot; {f.view.segmentLabel}
            </button>
          ))}
        </div>

        <ReportView fixture={fixture} />
      </main>
    </>
  );
}

function ReportView({ fixture }: { fixture: Fixture }) {
  const report = buildReport(fixture.inputs);
  const proj = report.projection;
  const { view } = fixture;

  const today = proj[0];
  const peak = proj.reduce((m, p) => {
    const pTotal = p.balanceCash + p.balanceISA + p.balanceGIA + p.pensionAccessible + p.pensionInaccessible;
    const mTotal = m.balanceCash + m.balanceISA + m.balanceGIA + m.pensionAccessible + m.pensionInaccessible;
    return pTotal > mTotal ? p : m;
  }, proj[0]);
  const atRetire = proj.find(y => y.age === fixture.inputs.targetRetirementAge) ?? proj[Math.min(5, proj.length - 1)];
  const end = proj[proj.length - 1];

  const alreadyRetired = fixture.inputs.currentAge >= fixture.inputs.targetRetirementAge;
  const depletion = proj.find(y => y.age > fixture.inputs.currentAge
    && (y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible) <= 0);

  const todayTotal = total(today);
  const atRetireTotal = total(atRetire);
  const peakTotal = total(peak);
  const endTotal = total(end);

  return (
    <section className={styles.reportSection}>
      {/* ---------- PAGE 1 — SNAPSHOT ---------- */}
      <article className={styles.panel}>
        <div className={styles.page1Header}>
          <div>
            <div className={styles.kicker}>{view.segmentId} &middot; {view.segmentLabel} — Page 1 of 2</div>
            <h1 className={styles.pageTitle}>Where you are today</h1>
            <p className={styles.personaLine}>{view.persona}</p>
          </div>
          <span className={styles.examplePill}>EXAMPLE</span>
        </div>

        {/* Full-width Financial Health gauge */}
        <div className={styles.gaugePanel}>
          <HealthGauge
            score={report.scores.targetCoveragePct}
            mode={report.scores.targetCoverageMode}
            interpretation={view.healthInterpretation}
          />
        </div>

        {/* Donut + planning grid */}
        <div className={styles.twoCol}>
          <div className={styles.panel}>
            <div className={styles.sectionTitle}>What you own &middot; Net worth {gbp(report.balanceSheet.netWorth)}</div>
            <NetWorthDonut balanceSheet={report.balanceSheet} />
          </div>
          <div className={styles.panel}>
            <div className={styles.sectionTitle}>Planning grid &middot; 12 areas at a glance</div>
            <PlanningGrid tiles={view.grid} />
          </div>
        </div>

        {/* Goals matrix */}
        <div>
          <div className={styles.sectionTitle}>Goals &amp; wellbeing &middot; how your position aligns with what matters to you</div>
          <GoalsMatrix goals={view.goals} />
        </div>

        {/* Compact balance strip */}
        <div>
          <div className={styles.sectionTitle}>Balance sheet &middot; headline totals</div>
          <BalanceStrip balanceSheet={report.balanceSheet} />
        </div>

        {/* Headline takeaway */}
        <div className={`${styles.headline} ${styles['headline' + capitalise(view.headline.tone)]}`}>
          <div className={styles.headlineKicker}>Key takeaway</div>
          <div className={styles.headlineTitle}>{view.headline.title}</div>
          <div className={styles.headlineBody}>{view.headline.body}</div>
        </div>

        {/* Caveat */}
        <div className={styles.caveat}>
          <strong>This is an illustrative example, not advice.</strong> Figures are generated from banded answers and published assumptions (see methodology). Your actual position depends on variables not captured here. Before acting on any of this, speak to a qualified Independent Financial Adviser.
        </div>
      </article>

      {/* ---------- PAGE 2 — PROJECTION ---------- */}
      <article className={styles.panel}>
        <div className={styles.page2Header}>
          <div>
            <div className={styles.kicker}>{view.segmentId} &middot; {view.segmentLabel} — Page 2 of 2</div>
            <h1 className={styles.pageTitle}>Where you&rsquo;re heading</h1>
            <p className={styles.personaLine}>Lifetime liquid wealth — the big picture</p>
          </div>
          <span className={styles.examplePill}>EXAMPLE</span>
        </div>

        <div className={styles.heroStrip}>
          <div className={styles.heroCell}>
            <div className={styles.kicker}>Today</div>
            <div className={styles.heroNum}>{gbp(todayTotal)}</div>
            <div className={styles.heroNote}>age {today.age}</div>
          </div>
          <div className={styles.heroCell}>
            <div className={styles.kicker}>{alreadyRetired ? 'At age 80' : 'At retirement'}</div>
            <div className={styles.heroNum}>{gbp(alreadyRetired ? total(proj.find(p => p.age === 80) ?? end) : atRetireTotal)}</div>
            <div className={styles.heroNote}>age {alreadyRetired ? 80 : fixture.inputs.targetRetirementAge}</div>
          </div>
          <div className={styles.heroCell}>
            <div className={styles.kicker}>Peak wealth</div>
            <div className={styles.heroNum}>{gbp(peakTotal)}</div>
            <div className={styles.heroNote}>age {peak.age}</div>
          </div>
          <div className={`${styles.heroCell} ${depletion ? styles.heroCellAlert : ''}`}>
            <div className={styles.kicker}>{depletion ? 'Funds last to' : 'At age 95'}</div>
            <div className={styles.heroNum}>{depletion ? 'age ' + depletion.age : gbp(endTotal)}</div>
            <div className={styles.heroNote}>{depletion ? 'current spend level' : 'end of horizon'}</div>
          </div>
        </div>

        <LifetimeWealthChart
          data={proj}
          targetRetirementAge={fixture.inputs.targetRetirementAge}
          depletionAge={depletion ? depletion.age : undefined}
        />

        <div>
          <div className={styles.sectionTitle}>How to read this chart</div>
          <ul className={styles.bulletList}>
            {view.bullets.map((b, i) => (
              <li key={i} className={styles.bullet}>
                <span className={`${styles.bulletBadge} ${styles['bullet' + capitalise(b.tone)]}`}>
                  {b.tone === 'good' ? 'Good' : b.tone === 'warn' ? 'Watch' : b.tone === 'risk' ? 'Risk' : 'Info'}
                </span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.nextSteps}>
          <div className={styles.kicker}>Three things worth discussing with an adviser</div>
          <ol>
            {view.nextSteps.map((n, i) => <li key={i}>{n}</li>)}
          </ol>
        </div>

        <div className={styles.methodology}>
          <div>
            <strong>Assumptions used</strong><br/>
            Growth: {report.assumptions.investmentGrowthRate} balanced (4% cautious / 8% adventurous) &middot; Inflation {report.assumptions.inflation} &middot; Cash {report.assumptions.cashGrowthRate} &middot; State pension £{report.assumptions.statePensionFullRate} full rate from age {report.assumptions.statePensionAge} &middot; Life expectancy {report.assumptions.lifeExpectancy} &middot; Tax year {report.assumptions.taxYear}.
          </div>
          <div>
            <strong>Not modelled</strong><br/>
            One-off events (weddings, inheritances, school fees), major career breaks, divorce/separation, long-term care costs, tax rule changes, market sequence-of-return variations, Scottish tax refinements, student loan, dividend tax, CGT on rebalancing.
          </div>
        </div>

        <div className={styles.caveat}>
          <strong>Illustrative only — speak to an IFA before acting.</strong> This report is produced from banded answers and published assumptions. It is not personalised advice, nor is it regulated under FCA rules as advice. Figures shown use simplified models. For decisions about your retirement, investments, tax, or estate, you should meet with a qualified Independent Financial Adviser.
        </div>
      </article>
    </section>
  );
}

function total(y: { balanceCash: number; balanceISA: number; balanceGIA: number; pensionAccessible: number; pensionInaccessible: number }): number {
  return y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible + y.pensionInaccessible;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
