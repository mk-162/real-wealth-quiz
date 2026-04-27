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
 * expansions are wired in. Page 09 reads from content/pdf-report/methodology.md.
 *
 * Chart pages (02-04) are enriched at SSG time from:
 *   - content/pdf-report/planning-grid/tile-NN-*.md   → per-tile status + note + whatItChecks
 *   - content/pdf-report/goals/S[n]-*.md              → goal capacity + rationale
 *   - content/pdf-report/health-gauge.md              → zone-specific gauge copy
 *   - content/pdf-report/takeaway-banners.md          → headline + supporting body
 *
 * See `src/lib/compass/pdf-content.ts` for the loader.
 */

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { FIXTURES, fixtureById, buildReport, scoreAllTiles } from '@/lib/compass';
import { enrichSegmentView, loadMethodology, loadAllExpandedChecks } from '@/lib/compass/pdf-content';
import { getWhereYouAre, getSilentGapsAndRead, loadSegmentCta } from '@/lib/compass/narrative-content';
import { ReportView, PageFrame, CtaPanel } from '@/components/compass';
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

  // Page-number helper. Page 06 onwards is variable-length (one page per check).
  const N = allChecks.length;
  const p = (n: number) => String(n).padStart(2, '0');

  return (
    <div className={`rw-doc ${styles.doc}`}>
      {/* 01 — Cover */}
      <CoverPage name={name} segmentLabel={fixture.view.segmentLabel} persona={fixture.view.persona} />

      {/* 02-04 — Chart pages, enriched with content-agent data */}
      <ReportView
        fixture={enrichedFixture}
        recipientName={name}
        startPageNum={2}
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
            intro="Content file not found at content/pdf-report/methodology.md. Once it lands the page renders automatically."
            comingFrom="content/pdf-report/methodology.md"
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

function CoverPage({ name, segmentLabel, persona }: { name: string; segmentLabel: string; persona: string }) {
  return (
    <section className={styles.cover}>
      <div className={styles.coverGlowTr} />
      <div className={styles.coverGlowBl} />

      {/* Hero image. Path points at `cover-hero.jpg` — drop your chosen hero
          image there to override the default. The logo-shaped clip-path
          (rw-hero-2-leaves) is applied via CSS on .coverMediaImg. */}
      <figure className={styles.coverMedia}>
        <Image
          src="/report-preview/assets/cover-hero.jpg"
          alt="Real Wealth — cover image"
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
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className={styles.coverContent}>
        <span className={styles.coverEyebrow}>For {name} · A briefing from Real Wealth</span>
        <h1 className={styles.coverTitle}>Your Wealth Report.</h1>
        <p className={styles.coverLede}>
          Ten minutes of honest questions about your money — and here&rsquo;s what a planner
          would say back. A short, structured picture of where you are, where you&rsquo;re
          heading, and the few things worth a conversation.
        </p>

        <div className={styles.coverMetaGrid}>
          <div className={styles.coverMetaItem}>
            <span className={styles.coverMetaItemKicker}>Prepared for</span>
            <span className={styles.coverMetaItemValue}>{name}</span>
          </div>
          <div className={styles.coverMetaItem}>
            <span className={styles.coverMetaItemKicker}>Planner lens</span>
            <span className={styles.coverMetaItemValue}>{segmentLabel}</span>
          </div>
          <div className={styles.coverMetaItem}>
            <span className={styles.coverMetaItemKicker}>Snapshot</span>
            <span className={styles.coverMetaItemValue}>{persona}</span>
          </div>
        </div>
      </div>

      <div className={styles.coverBottom}>
        <span>realwealth.co.uk</span>
        <span>01</span>
      </div>
    </section>
  );
}

interface PlaceholderBlock { kicker: string; body: string; }
function NarrativePlaceholder({
  eyebrow, title, intro, comingFrom, blocks,
}: {
  eyebrow: string; title: string; intro: string; comingFrom: string; blocks: PlaceholderBlock[];
}) {
  return (
    <>
      <div className={styles.sectionTitle}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.hSection}>{title}</h2>
        <p className={styles.intro} dangerouslySetInnerHTML={{ __html: intro }} />
      </div>

      <div className={styles.placeholderBadge}>
        Content in development · sourced from <code>{comingFrom}</code>
      </div>

      <div className={styles.placeholderBlocks}>
        {blocks.map((b, i) => (
          <div key={i} className={styles.placeholderBlock}>
            <div className={styles.placeholderKicker}>{b.kicker}</div>
            <p className={styles.placeholderBody}>{b.body}</p>
          </div>
        ))}
      </div>

      <div className={styles.placeholderFoot}>
        The content agent is expanding the markdown files that feed this page.
        See <code>content/pages/*.md</code>, <code>content/segments/*.md</code>,
        and <code>content/provocations/*.md</code>. Visual treatment will match
        the rest of the report — same typography, same chip system, same chrome.
      </div>
    </>
  );
}

/** Renders one methodology section body as markdown-ish HTML (handles tables + lists). */
function MethodologySection({ heading, body }: { heading: string; body: string }) {
  // Basic inline Markdown → HTML for bold/italic + paragraphs + tables.
  // Keep this narrow; methodology.md is a known shape.
  const html = bodyToHtml(body);
  return (
    <section className={styles.methodologySection}>
      <h3 className={styles.methodologyHeading}>{heading}</h3>
      <div className={styles.methodologyBody} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

function bodyToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Table start: "| col | col |"
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*[-:| ]+\|?\s*$/.test(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\s*\|.*\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      out.push(renderTable(tableLines));
      continue;
    }

    // H2
    if (/^##\s+/.test(line)) {
      out.push(`<h4>${escapeHtml(line.replace(/^##\s+/, ''))}</h4>`);
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      out.push('');
      i++;
      continue;
    }

    // Paragraph
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^##\s+/.test(lines[i]) && !/^\s*\|/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

function renderTable(lines: string[]): string {
  if (lines.length < 2) return '';
  const header = splitCells(lines[0]);
  const rows = lines.slice(2).map(splitCells);
  const thead = `<thead><tr>${header.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table class="${styles.methodologyTable}">${thead}${tbody}</table>`;
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(c => c.trim());
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
