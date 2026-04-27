/**
 * /report/master-fields — field-map debug view of the master report.
 *
 * Same 9-page layout as /report/master/[segment], but with every content
 * string replaced by its field path (e.g. `{view.headline.title}`) so Matt
 * can eyeball which data source drives which slot. Engine-driven numbers
 * (gauge %, balance totals, chart curve) render at real values so the
 * component shapes are realistic — only the content slots are labelled.
 *
 * Inputs use the S2 (mass-affluent mid-career) band values so the chart
 * takes a representative shape.
 */

import Image from 'next/image';
import { buildReport } from '@/lib/compass';
import { FIELDS_FIXTURE } from '@/lib/compass/fixtures-fields';
import { loadAssumptionsContent } from '@/lib/compass/pdf-content';
import { ReportView, PageFrame, CtaPanel, FiveThings } from '@/components/compass';
import styles from '../master/[segment]/page.module.css';

const TOTAL_PAGES = 9;

export default function MasterFieldsReport() {
  const report = buildReport(FIELDS_FIXTURE.inputs);
  const docTitle = 'Your Wealth Report · {recipientName}';

  return (
    <div className={`rw-doc ${styles.doc}`}>
      {/* 01 — Cover */}
      <section className={styles.cover}>
        <div className={styles.coverGlowTr} />
        <div className={styles.coverGlowBl} />

        <figure className={styles.coverMedia}>
          <Image
            src="/report-preview/assets/cover-hero.jpg"
            alt=""
            className={styles.coverMediaImg}
            width={1400}
            height={1000}
            priority
            unoptimized
          />
        </figure>

        <div className={styles.coverTop}>
          <Image
            src="/report-preview/assets/logo-wordmark.svg"
            alt="Real Wealth"
            className={styles.coverLogo}
            width={160}
            height={28}
            priority
            unoptimized
          />
          <div className={styles.coverMeta}>
            <span className={styles.coverMetaLabel}>WEALTH REPORT</span>
            <span className={styles.coverMetaDate}>
              {'{reportDate}'} · {TOTAL_PAGES} pages
            </span>
          </div>
        </div>

        <div className={styles.coverContent}>
          <span className={styles.coverEyebrow}>For {'{recipientName}'} · A briefing from Real Wealth</span>
          <h1 className={styles.coverTitle}>Your Wealth Report.</h1>
          <p className={styles.coverLede}>
            {'{cover.lede}'} — from content/pages/cover.md (once expanded).
            Three-sentence intro above the fold. Tone: warm, precise.
          </p>

          <div className={styles.coverMetaGrid}>
            <div className={styles.coverMetaItem}>
              <span className={styles.coverMetaItemKicker}>Prepared for</span>
              <span className={styles.coverMetaItemValue}>{'{recipientName}'}</span>
            </div>
            <div className={styles.coverMetaItem}>
              <span className={styles.coverMetaItemKicker}>Planner lens</span>
              <span className={styles.coverMetaItemValue}>{'{view.segmentLabel}'}</span>
            </div>
            <div className={styles.coverMetaItem}>
              <span className={styles.coverMetaItemKicker}>Snapshot</span>
              <span className={styles.coverMetaItemValue}>{'{view.persona}'}</span>
            </div>
          </div>
        </div>

        <div className={styles.coverBottom}>
          <span>realwealth.co.uk</span>
          <span>01 · 0{TOTAL_PAGES}</span>
        </div>
      </section>

      {/* 02-04 — Chart pages, rendered with the fields fixture */}
      <ReportView
        fixture={FIELDS_FIXTURE}
        recipientName="{recipientName}"
        startPageNum={2}
        totalPages={TOTAL_PAGES}
        assumptionsBodyTemplate={loadAssumptionsContent()?.body ?? null}
      />

      {/* 05 — Where you are today */}
      <PageFrame
        docTitle={docTitle}
        pageNum="05"
        totalPages={TOTAL_PAGES}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Where you are today"
      >
        <FieldPlaceholder
          eyebrow="Where you are today"
          title="{page05.title} — H1 of content/pages/summary-where-you-are.md"
          intro="{page05.intro} — 2-3 paragraphs of narrative reflection, drawing on Q2.4 happy-place text + gating answers"
          comingFrom="content/pages/summary-where-you-are.md · per-segment overlay from content/segments/S[n]-*.md"
          blocks={[
            { kicker: 'Field: page05.openingParagraph', body: 'The 2-paragraph reflection on where this person is in life.' },
            { kicker: 'Field: page05.pullquote', body: 'Serif italic teal pullquote, sourced from Q2.4 "what\'s your happy place" short_text answer.' },
            { kicker: 'Field: page05.segmentClose', body: 'One-paragraph segment-tailored closing position (from content/segments/S[n]-*.md).' },
          ]}
        />
      </PageFrame>

      {/* 06 — Five things (no curated ids on the fields fixture → placeholder renders) */}
      <PageFrame
        docTitle={docTitle}
        pageNum="06"
        totalPages={TOTAL_PAGES}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Five things"
      >
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>What we&rsquo;d talk through</span>
          <h2 className={styles.hSection}>Five things worth a conversation.</h2>
          <p className={styles.intro}>
            Four standard cards + 1 featured fifth. Each card:
            title = {'{expandedCheck.title}'} (H1 of content/report/awareness-checks-expanded/&lt;slug&gt;.md),
            body = {'{expandedCheck.paragraphs[0]}'} (first paragraph),
            featured fifth also shows {'{expandedCheck.paragraphs[-1]}'} (bridge line),
            optional image = {'{expandedCheck.image_slug}'} → /report-preview/assets/illustrations/&lt;slug&gt;.svg.
          </p>
        </div>
        <FiveThings selection={{ standard: [], featured: null }} />
      </PageFrame>

      {/* 07 — Silent gaps + Planner's read */}
      <PageFrame
        docTitle={docTitle}
        pageNum="07"
        totalPages={TOTAL_PAGES}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Silent gaps"
      >
        <FieldPlaceholder
          eyebrow="Things we didn&rsquo;t ask — but noticed"
          title="{page07.title} — H1 of content/pages/planners-read.md"
          intro="{page07.intro} — short lead over the 3-column planner's-read grid"
          comingFrom="src/lib/summary/silentGaps.ts + content/pages/planners-read.md"
          blocks={[
            { kicker: 'Field: silentGaps[]', body: 'Up to 3 fired silent-gap cards. Each = { icon, title, body } from silentGaps.ts (12 rules, segment-weighted)' },
            { kicker: 'Field: plannersRead.insight', body: 'First of three lenses — the planner\'s "what we noticed" take.' },
            { kicker: 'Field: plannersRead.context', body: 'Second lens — why it matters at this life stage.' },
            { kicker: 'Field: plannersRead.move', body: 'Third lens — one practical next move.' },
          ]}
        />
      </PageFrame>

      {/* 08 — Next step */}
      <PageFrame
        docTitle={docTitle}
        pageNum="08"
        totalPages={TOTAL_PAGES}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Next step"
      >
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>What happens next</span>
          <h2 className={styles.hSection}>{'{page08.title}'} — H2 of content/pages/next-step.md</h2>
          <p className={styles.intro}>{'{page08.intro}'} — 1-2 sentences above the CTA panel</p>
        </div>

        <div className={styles.ctaWrap}>
          <CtaPanel
            eyebrow="{segmentCta.eyebrow} — from content/segments/S[n]-*.md"
            title="{segmentCta.title}"
            body="{segmentCta.body}"
            buttonLabel="{segmentCta.button}"
            buttonHref="{segmentCta.button_link}"
            phone="{firm.phone}"
            contact="{firm.email}"
          />
        </div>

        <div className={styles.endNote}>
          <p><strong>{'{page08.scopeHeading}'}</strong> {'{page08.scopeBody}'} — regulatory disclaimer paragraph</p>
        </div>
      </PageFrame>

      {/* 09 — Methodology */}
      <PageFrame
        docTitle={docTitle}
        pageNum="09"
        totalPages={TOTAL_PAGES}
        footer="Real Wealth Partners Ltd · Authorised and regulated by the Financial Conduct Authority"
        label="Methodology"
        showIllusTag={false}
      >
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>Methodology</span>
          <h2 className={styles.hSection}>{'{methodology.pageHeading}'} — H1 "Page heading" block of content/report/methodology.md</h2>
          <p className={styles.intro}>{'{methodology.openingParagraph}'} — H1 "Opening paragraph" block</p>
        </div>
        <FieldPlaceholder
          eyebrow=""
          title=""
          intro=""
          comingFrom="content/report/methodology.md"
          blocks={[
            { kicker: 'Field: methodology.sections[0]', body: 'H1 "Section 1" — The Financial Health Score (heading + body)' },
            { kicker: 'Field: methodology.sections[1]', body: 'H1 "Section 2" — Growth and inflation assumptions (includes a markdown table)' },
            { kicker: 'Field: methodology.sections[2]', body: 'H1 "Section 3" — How we mapped your answers to numbers (markdown table)' },
            { kicker: 'Field: methodology.sections[3]', body: 'H1 "Section 4" — What this report cannot show' },
            { kicker: 'Field: methodology.sections[4]', body: 'H1 "Section 5" — Regulatory disclosures (FCA FRN, data, tax year, Scottish rates)' },
          ]}
        />
      </PageFrame>
    </div>
  );
}

interface PlaceholderBlock { kicker: string; body: string; }
function FieldPlaceholder({
  eyebrow, title, intro, comingFrom, blocks,
}: {
  eyebrow: string; title: string; intro: string; comingFrom: string; blocks: PlaceholderBlock[];
}) {
  return (
    <>
      {(eyebrow || title || intro) && (
        <div className={styles.sectionTitle}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          {title && <h2 className={styles.hSection}>{title}</h2>}
          {intro && <p className={styles.intro}>{intro}</p>}
        </div>
      )}

      <div className={styles.placeholderBadge}>
        Field map · sourced from <code>{comingFrom}</code>
      </div>

      <div className={styles.placeholderBlocks}>
        {blocks.map((b, i) => (
          <div key={i} className={styles.placeholderBlock}>
            <div className={styles.placeholderKicker}>{b.kicker}</div>
            <p className={styles.placeholderBody}>{b.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
