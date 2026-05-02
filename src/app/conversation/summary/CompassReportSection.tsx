/**
 * CompassReportSection — the 9-page Compass report, embedded inline in the
 * post-unlock /conversation/summary page.
 *
 * Server component. Mirrors the structure of /report/master/[segment]/page.tsx
 * (Cover → Snapshot/Planning/Projection via ReportView → narrative pages 05-08
 * → Methodology). Re-uses the same module.css from that route so the visual
 * treatment matches exactly.
 *
 * Why a separate file? /conversation/summary/page.tsx is a client component
 * ('use client') but `enrichSegmentView`, `loadMethodology`, and `loadFiveThings`
 * use Node `fs` and must run server-side. Server components can be rendered
 * inside client components as children, so we lift the server work into this
 * file and let the page.tsx embed it without breaking.
 *
 * Two render paths:
 *   1. Pre-rendered fixture variants (one per segment) shipped from page.tsx
 *      as a fallback / demo mode. The component receives no `inputs` prop
 *      and falls back to `fixture.inputs`.
 *   2. User-driven render via the `renderUserCompassReport` server action,
 *      which calls this component with `inputs` derived from the live
 *      session via `buildCompassInputs`. The `view` still comes from the
 *      fixture (segment-specific persona/label is stage-setting, not user
 *      data) — the dynamic parts (charts, tile scoring, gauge) come from
 *      the user's real inputs.
 */
import { fixtureById, buildReport, scoreAllTiles, type CompassInputs } from '@/lib/compass';
import {
  enrichSegmentView,
  loadMethodology,
  loadAllExpandedChecks,
  loadAssumptionsContent,
} from '@/lib/compass/pdf-content';
import { getWhereYouAre, getSilentGapsAndRead, loadSegmentCta } from '@/lib/compass/narrative-content';
import { ReportView, PageFrame, CtaPanel, AwarenessCheckPage } from '@/components/compass';
import { CoverPage, NarrativePlaceholder, MethodologySection, formatPageNum } from '@/app/report/master/[segment]/report-helpers';
import reportStyles from '@/app/report/master/[segment]/page.module.css';
// The .rw-doc / .rw-eyebrow / .rw-h-section global classes used by the
// embedded report come from compass-theme.css. /report/* gets it via
// /report/layout.tsx, but /conversation/* doesn't share that layout — so
// we import it here, scoped to wherever this component lands.
import '@/app/report/_theme/compass-theme.css';

export interface CompassReportSectionProps {
  segmentId: string;
  recipientName: string;
  /** Live user inputs from the questionnaire session. When omitted (e.g. the
   *  pre-rendered fallback variants in page.tsx), the component falls back
   *  to the fixture's stock inputs so demos still render. */
  inputs?: CompassInputs;
}

export default function CompassReportSection({
  segmentId,
  recipientName,
  inputs,
}: CompassReportSectionProps) {
  const fixture = fixtureById(segmentId);
  if (!fixture) return null;

  // Enrich the fixture with content-agent markdown at SSG/request time.
  //
  // This component renders the post-unlock report to end users, so in
  // production every loader must reject draft / in_review content and throw
  // rather than silently downgrading. In dev/staging the flag is a no-op
  // (see src/lib/content/compliance.ts) so authors can preview WIP markdown.
  const requireApproved = process.env.NODE_ENV === 'production';
  const effectiveInputs = inputs ?? fixture.inputs;
  const report = buildReport(effectiveInputs);
  const tileScores = scoreAllTiles(effectiveInputs, report);
  const enrichedView = enrichSegmentView(
    fixture.view,
    report.scores.targetCoveragePct,
    requireApproved,
    tileScores,
  );
  // Override fixture.inputs with effectiveInputs so ReportView's internal
  // buildReport call runs against the user's real numbers (when supplied).
  const enrichedFixture = { ...fixture, inputs: effectiveInputs, view: enrichedView };

  const methodology = loadMethodology(requireApproved);
  const allChecks = loadAllExpandedChecks();
  const whereYouAre = getWhereYouAre(segmentId);
  const silentGapsAndRead = getSilentGapsAndRead(segmentId);
  const segmentCta = loadSegmentCta(segmentId);

  const name = recipientName || 'your plan';
  const docTitle = `Your Wealth Report · ${name}`;

  const N = allChecks.length;
  const p = formatPageNum;

  return (
    <div className={`rw-doc ${reportStyles.doc}`}>
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
        <div className={reportStyles.sectionTitle}>
          <span className={reportStyles.eyebrow}>Where you are today</span>
          <h2 className={reportStyles.hSection}>A quick picture of what you told us.</h2>
        </div>
        {whereYouAre.openingParagraphs.map((para, i) => (
          <p key={i} className={reportStyles.narrativePara}>{para}</p>
        ))}
        <blockquote className={reportStyles.narrativePullquote}>
          {whereYouAre.pullQuote}
        </blockquote>
        <p className={reportStyles.narrativePara}>{whereYouAre.segmentClose}</p>
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
          <AwarenessCheckPage check={check} />
        </PageFrame>
      ))}

      {/* Silent gaps + Planner's read */}
      <PageFrame
        docTitle={docTitle}
        pageNum={p(6 + N)}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Silent gaps"
      >
        <div className={reportStyles.sectionTitle}>
          <span className={reportStyles.eyebrow}>Things we didn&rsquo;t ask — but noticed</span>
          <h2 className={reportStyles.hSection}>The shape of your answers says more than the answers themselves.</h2>
          <p className={reportStyles.intro}>
            Based on the shape of what you&rsquo;ve told us, a few things stand out —
            even though we didn&rsquo;t ask about them directly.
          </p>
        </div>

        <div className={reportStyles.silentGapsGrid}>
          {silentGapsAndRead.gaps.map((gap, i) => (
            <div key={i} className={reportStyles.silentGapCard}>
              <h3 className={reportStyles.silentGapTitle}>{gap.title}</h3>
              <p className={reportStyles.silentGapBody}>{gap.body}</p>
            </div>
          ))}
        </div>

        <div className={reportStyles.sectionTitleTight}>
          <span className={reportStyles.eyebrow}>Planner&rsquo;s read</span>
        </div>
        <div className={reportStyles.plannersReadGrid}>
          <div className={reportStyles.plannersReadCol}>
            <div className={reportStyles.plannersReadKicker}>What we noticed</div>
            <p className={reportStyles.plannersReadBody}>{silentGapsAndRead.plannersRead.insight}</p>
          </div>
          <div className={reportStyles.plannersReadCol}>
            <div className={reportStyles.plannersReadKicker}>Why it matters now</div>
            <p className={reportStyles.plannersReadBody}>{silentGapsAndRead.plannersRead.context}</p>
          </div>
          <div className={reportStyles.plannersReadCol}>
            <div className={reportStyles.plannersReadKicker}>One practical move</div>
            <p className={reportStyles.plannersReadBody}>{silentGapsAndRead.plannersRead.move}</p>
          </div>
        </div>
      </PageFrame>

      {/* Next step */}
      <PageFrame
        docTitle={docTitle}
        pageNum={p(7 + N)}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Next step"
      >
        <div className={reportStyles.sectionTitle}>
          <span className={reportStyles.eyebrow}>What happens next</span>
          <h2 className={reportStyles.hSection}>
            {segmentCta?.headline ?? 'Talk it through with a planner.'}
          </h2>
          <p className={reportStyles.intro}>
            {segmentCta?.body ??
              'You\u2019ve given us a thoughtful picture. The last step is the only one that matters — a 30-minute conversation with a Real Wealth planner, tailored to you, no obligation.'}
          </p>
        </div>

        <div className={reportStyles.ctaWrap}>
          <CtaPanel
            eyebrow={segmentCta?.helper ?? 'Book your free 30-minute consultation'}
            title={`Let's talk about you, ${name}.`}
            body="Bring this report — we\u2019ll go through the amber tiles first, the red ones next, then decide what\u2019s worth acting on together."
            buttonLabel={segmentCta?.buttonLabel ?? 'Book online'}
            buttonHref={segmentCta?.buttonHref ?? 'https://calendly.com/realwealth/intro'}
            phone="0161 768 7722"
            contact="hello@realwealth.co.uk"
          />
        </div>

        <div className={reportStyles.endNote}>
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
      >
        <div className={reportStyles.sectionTitle}>
          <span className={reportStyles.eyebrow}>Methodology</span>
          <h2 className={reportStyles.hSection}>
            {methodology?.pageHeading || 'How this report was built — and what it doesn\u2019t tell you.'}
          </h2>
          {methodology?.openingParagraph && (
            <p className={reportStyles.intro}>{methodology.openingParagraph}</p>
          )}
        </div>

        {methodology ? (
          <div className={reportStyles.methodologySections}>
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
          >
          <div className={reportStyles.sectionTitle}>
            <span className={reportStyles.eyebrow}>Methodology — continued</span>
          </div>
          <div className={reportStyles.methodologySections}>
            {methodology.sections.slice(3).map((s, i) => (
              <MethodologySection key={i} heading={s.heading} body={s.body} />
            ))}
          </div>
        </PageFrame>
      )}
    </div>
  );
}

