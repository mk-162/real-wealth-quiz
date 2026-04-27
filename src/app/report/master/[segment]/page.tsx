/**
 * /report/master/[segment] — the master 9-page Compass report.
 *
 * Renders (in order):
 *   01 Cover                          — placeholder, copy from content team
 *   02 Snapshot                       — chart page (HealthGauge, donut, balance)
 *   03 Planning grid + Goals          — chart page
 *   04 Projection + CTA               — chart page
 *   05 Where you are today            — narrative, content from markdown
 *   06 Five things worth a conversation — narrative (awareness-checks-expanded)
 *   07 Silent gaps + Planner's read   — narrative
 *   08 Next step                      — narrative + CTA
 *   09 Methodology                    — the full assumptions + regulatory page
 *
 * Pages 05-08 remain placeholder blocks until the content agent's narrative
 * expansions are wired in. Page 09 reads from content/report/methodology.md.
 *
 * Chart pages (02-04) are enriched at SSG time from:
 *   - content/report/planning-grid/tile-NN-*.md   → per-tile status + note + whatItChecks
 *   - content/report/goals/S[n]-*.md              → goal capacity + rationale
 *   - content/report/health-gauge.md              → zone-specific gauge copy
 *   - content/report/takeaway-banners.md          → headline + supporting body
 *
 * See `src/lib/compass/pdf-content.ts` for the loader.
 */

import { notFound } from 'next/navigation';
import { FIXTURES, fixtureById, buildReport, scoreAllTiles } from '@/lib/compass';
import {
  enrichSegmentView,
  loadMethodology,
  loadAllExpandedChecks,
  loadAssumptionsContent,
} from '@/lib/compass/pdf-content';
import { getWhereYouAre, getSilentGapsAndRead, loadSegmentCta } from '@/lib/compass/narrative-content';
import { ReportView, PageFrame, CtaPanel } from '@/components/compass';
import { CoverPage, NarrativePlaceholder, MethodologySection, formatPageNum } from './report-helpers';
import styles from './page.module.css';

export function generateStaticParams() {
  return FIXTURES.map(f => ({ segment: f.view.segmentId }));
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

export default async function MasterReport({
  params,
}: {
  params: Promise<{ segment: string }>;
}) {
  const { segment } = await params;
  const fixture = fixtureById(segment);
  if (!fixture) notFound();

  // Enrich the fixture with content-agent markdown at SSG time.
  //
  // In production this is a public, user-facing render path — every loader
  // must reject draft / in_review content and throw loudly rather than ship
  // unreviewed copy. In dev/staging the `requireApproved` flag is a no-op
  // (see src/lib/content/compliance.ts) so authors can preview WIP markdown.
  const requireApproved = process.env.NODE_ENV === 'production';
  const report = buildReport(fixture.inputs);
  const tileScores = scoreAllTiles(fixture.inputs, report);
  const enrichedView = enrichSegmentView(
    fixture.view,
    report.scores.targetCoveragePct,
    requireApproved,
    tileScores,
  );
  const enrichedFixture = { ...fixture, view: enrichedView };

  const methodology = loadMethodology(requireApproved);
  const allChecks = loadAllExpandedChecks();
  const whereYouAre = getWhereYouAre(fixture.view.segmentId);
  const silentGapsAndRead = getSilentGapsAndRead(fixture.view.segmentId);
  const segmentCta = loadSegmentCta(fixture.view.segmentId);

  const name = SEGMENT_NAMES[fixture.view.segmentId] ?? 'your plan';
  const docTitle = `Your Wealth Report · ${name}`;

  const N = allChecks.length;
  const p = formatPageNum;

  return (
    <div className={`rw-doc ${styles.doc}`}>
      {/* 01 — Cover */}
      <CoverPage name={name} segmentLabel={fixture.view.segmentLabel} persona={fixture.view.persona} />

      {/* 02-04 — Chart pages, enriched with content-agent data */}
      <ReportView
        fixture={enrichedFixture}
        recipientName={name}
        startPageNum={2}
        assumptionsBodyTemplate={loadAssumptionsContent()?.body ?? null}
      />

      {/* 05 — Where you are today */}
      <PageFrame
        docTitle={docTitle}
        pageNum="05"
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Where you are today"
      >
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>Where you are today</span>
          <h2 className={styles.hSection}>A quick picture of what you told us.</h2>
        </div>
        {whereYouAre.openingParagraphs.map((para, i) => (
          <p key={i} className={styles.narrativePara}>{para}</p>
        ))}
        <blockquote className={styles.narrativePullquote}>
          {whereYouAre.pullQuote}
        </blockquote>
        <p className={styles.narrativePara}>{whereYouAre.segmentClose}</p>
      </PageFrame>

      {/* 06…06+N-1 — All awareness checks, one page each */}
      {allChecks.map((check, idx) => (
        <PageFrame
          key={check.sourceId}
          docTitle={docTitle}
          pageNum={p(6 + idx)}
          footer="Manchester · Taunton · hello@realwealth.co.uk"
          label={check.title}
        >
          <div className={styles.sectionTitle}>
            <span className={styles.eyebrow}>Things worth a conversation</span>
            <h2 className={styles.hSection}>{check.title}</h2>
          </div>
          {check.paragraphs.map((para, i) => (
            <p key={i} className={styles.narrativePara}>{para}</p>
          ))}
        </PageFrame>
      ))}

      {/* Silent gaps + Planner's read */}
      <PageFrame
        docTitle={docTitle}
        pageNum={p(6 + N)}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Silent gaps"
      >
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>Things we didn&rsquo;t ask — but noticed</span>
          <h2 className={styles.hSection}>The shape of your answers says more than the answers themselves.</h2>
          <p className={styles.intro}>
            Based on the shape of what you&rsquo;ve told us, a few things stand out —
            even though we didn&rsquo;t ask about them directly.
          </p>
        </div>

        <div className={styles.silentGapsGrid}>
          {silentGapsAndRead.gaps.map((gap, i) => (
            <div key={i} className={styles.silentGapCard}>
              <h3 className={styles.silentGapTitle}>{gap.title}</h3>
              <p className={styles.silentGapBody}>{gap.body}</p>
            </div>
          ))}
        </div>

        <div className={styles.sectionTitleTight}>
          <span className={styles.eyebrow}>Planner&rsquo;s read</span>
        </div>
        <div className={styles.plannersReadGrid}>
          <div className={styles.plannersReadCol}>
            <div className={styles.plannersReadKicker}>What we noticed</div>
            <p className={styles.plannersReadBody}>{silentGapsAndRead.plannersRead.insight}</p>
          </div>
          <div className={styles.plannersReadCol}>
            <div className={styles.plannersReadKicker}>Why it matters now</div>
            <p className={styles.plannersReadBody}>{silentGapsAndRead.plannersRead.context}</p>
          </div>
          <div className={styles.plannersReadCol}>
            <div className={styles.plannersReadKicker}>One practical move</div>
            <p className={styles.plannersReadBody}>{silentGapsAndRead.plannersRead.move}</p>
          </div>
        </div>
      </PageFrame>

      {/* Next step (CTA from content/segments/S[n]-*.md) */}
      <PageFrame
        docTitle={docTitle}
        pageNum={p(7 + N)}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Next step"
      >
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>What happens next</span>
          <h2 className={styles.hSection}>
            {segmentCta?.headline ?? 'Talk it through with a planner.'}
          </h2>
          <p className={styles.intro}>
            {segmentCta?.body ??
              'You\u2019ve given us a thoughtful picture. The last step is the only one that matters — a 30-minute conversation with a Real Wealth planner, tailored to you, no obligation.'}
          </p>
        </div>

        <div className={styles.ctaWrap}>
          <CtaPanel
            eyebrow={segmentCta?.helper ?? 'Book your free 30-minute consultation'}
            title={`Let's talk about you, ${name}.`}
            body={
              segmentCta
                ? 'Bring this report — we\u2019ll go through the amber tiles first, the red ones next, then decide what\u2019s worth acting on together.'
                : 'Bring this report. We\u2019ll go through the amber tiles first, the red ones next, then decide what\u2019s worth acting on together.'
            }
            buttonLabel={segmentCta?.buttonLabel ?? 'Book online'}
            buttonHref={segmentCta?.buttonHref ?? 'https://calendly.com/realwealth/intro'}
            phone="0161 768 7722"
            contact="hello@realwealth.co.uk"
          />
        </div>

        <div className={styles.endNote}>
          <p>
            <strong>A note on scope.</strong> This report is an illustrative discovery document.
            It is not regulated advice under FCA rules, and no advice is given unless documented
            in a formal suitability letter. For decisions about your retirement, investments, tax,
            or estate, you should meet with a qualified Independent Financial Adviser.
          </p>
        </div>
      </PageFrame>

      {/* Methodology */}
      <PageFrame
        docTitle={docTitle}
        pageNum={p(8 + N)}
        footer="Real Wealth Partners Ltd · Authorised and regulated by the Financial Conduct Authority"
        label="Methodology"
        showIllusTag={false}
      >
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>Methodology</span>
          <h2 className={styles.hSection}>
            {methodology?.pageHeading || 'How this report was built — and what it doesn\u2019t tell you.'}
          </h2>
          {methodology?.openingParagraph && (
            <p className={styles.intro}>{methodology.openingParagraph}</p>
          )}
        </div>

        {methodology ? (
          <div className={styles.methodologySections}>
            {methodology.sections.slice(0, 3).map((s, i) => (
              <MethodologySection key={i} heading={s.heading} body={s.body} />
            ))}
          </div>
        ) : (
          <NarrativePlaceholder
            eyebrow="Methodology"
            title="Not yet loaded"
            intro="Content file not found at content/report/methodology.md. Once it lands the page renders automatically."
            comingFrom="content/report/methodology.md"
            blocks={[]}
          />
        )}
      </PageFrame>

      {/* Methodology continued */}
      {methodology && methodology.sections.length > 3 && (
        <PageFrame
          docTitle={docTitle}
          pageNum={p(9 + N)}
          footer="Real Wealth Partners Ltd · Authorised and regulated by the Financial Conduct Authority"
          label="Methodology (continued)"
          showIllusTag={false}
        >
          <div className={styles.sectionTitle}>
            <span className={styles.eyebrow}>Methodology — continued</span>
          </div>
          <div className={styles.methodologySections}>
            {methodology.sections.slice(3).map((s, i) => (
              <MethodologySection key={i} heading={s.heading} body={s.body} />
            ))}
          </div>
        </PageFrame>
      )}
    </div>
  );
}

