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
 * For now the report is driven by the segment's FIXTURE inputs (fixtureById).
 * A parallel agent is wiring `buildCompassInputs` so the live user answers
 * feed this component in a follow-up commit.
 */
import Image from 'next/image';
import { fixtureById, buildReport, scoreAllTiles } from '@/lib/compass';
import { enrichSegmentView, loadMethodology, loadFiveThings } from '@/lib/compass/pdf-content';
import { getWhereYouAre, getSilentGapsAndRead, loadSegmentCta } from '@/lib/compass/narrative-content';
import { ReportView, PageFrame, CtaPanel, FiveThings } from '@/components/compass';
import reportStyles from '@/app/report/master/[segment]/page.module.css';

const TOTAL_PAGES = 9;

export interface CompassReportSectionProps {
  segmentId: string;
  recipientName: string;
}

export default function CompassReportSection({
  segmentId,
  recipientName,
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
  const fiveThings = loadFiveThings(enrichedView.awarenessCheckIds ?? []);
  const whereYouAre = getWhereYouAre(segmentId);
  const silentGapsAndRead = getSilentGapsAndRead(segmentId);
  const segmentCta = loadSegmentCta(segmentId);

  const name = recipientName || 'your plan';
  const docTitle = `Your Wealth Report · ${name}`;

  return (
    <div className={`rw-doc ${reportStyles.doc}`}>
      {/* 01 — Cover */}
      <CoverPage name={name} segmentLabel={fixture.view.segmentLabel} persona={fixture.view.persona} />

      {/* 02-04 — Chart pages, enriched with content-agent data */}
      <ReportView
        fixture={enrichedFixture}
        recipientName={name}
        startPageNum={2}
        totalPages={TOTAL_PAGES}
      />

      {/* 05 — Where you are today */}
      <PageFrame
        docTitle={docTitle}
        pageNum="05"
        totalPages={TOTAL_PAGES}
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

      {/* 06 — Five things worth a conversation */}
      <PageFrame
        docTitle={docTitle}
        pageNum="06"
        totalPages={TOTAL_PAGES}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Five things"
      >
        <div className={reportStyles.sectionTitle}>
          <span className={reportStyles.eyebrow}>What we&rsquo;d talk through</span>
          <h2 className={reportStyles.hSection}>Five things worth a conversation.</h2>
          <p className={reportStyles.intro}>
            Four areas where a short conversation moves the dial — and one that tends to matter more
            than people realise. Everything here comes from the detail of what you&rsquo;ve told us.
          </p>
        </div>
        {fiveThings.standard.length === 0 ? (
          <NarrativePlaceholder
            eyebrow="What we&rsquo;d talk through"
            title="Five things worth a conversation."
            intro="No curated list is set for this segment yet. Once triggers fire against real answers, this page will show 4 cards + 1 featured."
            comingFrom="content/pdf-report/awareness-checks-expanded/*.md via segmentView.awarenessCheckIds"
            blocks={[]}
          />
        ) : (
          <FiveThings selection={fiveThings} />
        )}
      </PageFrame>

      {/* 07 — Silent gaps + Planner's read */}
      <PageFrame
        docTitle={docTitle}
        pageNum="07"
        totalPages={TOTAL_PAGES}
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

      {/* 08 — Next step */}
      <PageFrame
        docTitle={docTitle}
        pageNum="08"
        totalPages={TOTAL_PAGES}
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

      {/* 09 — Methodology */}
      <PageFrame
        docTitle={docTitle}
        pageNum="09"
        totalPages={TOTAL_PAGES}
        footer="Real Wealth Partners Ltd · Authorised and regulated by the Financial Conduct Authority"
        label="Methodology"
        showIllusTag={false}
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
            intro="Content file not found at content/pdf-report/methodology.md. Once it lands the page renders automatically."
            comingFrom="content/pdf-report/methodology.md"
            blocks={[]}
          />
        )}
      </PageFrame>

      {/* 09 continued — the rest of the methodology (split across pages if long) */}
      {methodology && methodology.sections.length > 3 && (
        <PageFrame
          docTitle={docTitle}
          pageNum="09"
          totalPages={TOTAL_PAGES}
          footer="Real Wealth Partners Ltd · Authorised and regulated by the Financial Conduct Authority"
          label="Methodology (continued)"
          showIllusTag={false}
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

function CoverPage({ name, segmentLabel, persona }: { name: string; segmentLabel: string; persona: string }) {
  return (
    <section className={reportStyles.cover}>
      <div className={reportStyles.coverGlowTr} />
      <div className={reportStyles.coverGlowBl} />

      {/* Hero image. Path points at `cover-hero.jpg` — drop your chosen hero
          image there to override the default. The logo-shaped clip-path
          (rw-hero-2-leaves) is applied via CSS on .coverMediaImg. */}
      <figure className={reportStyles.coverMedia}>
        <Image
          src="/report-preview/assets/cover-hero.jpg"
          alt="Real Wealth — cover image"
          className={reportStyles.coverMediaImg}
          width={1400}
          height={1000}
          priority
          unoptimized
        />
      </figure>

      <div className={reportStyles.coverTop}>
        <Image
          src="/report-preview/assets/logo-wordmark.svg"
          alt="Real Wealth"
          className={reportStyles.coverLogo}
          width={160}
          height={28}
          priority
          unoptimized
        />
        <div className={reportStyles.coverMeta}>
          <span className={reportStyles.coverMetaLabel}>WEALTH REPORT</span>
          <span className={reportStyles.coverMetaDate}>
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {TOTAL_PAGES} pages
          </span>
        </div>
      </div>

      <div className={reportStyles.coverContent}>
        <span className={reportStyles.coverEyebrow}>For {name} · A briefing from Real Wealth</span>
        <h1 className={reportStyles.coverTitle}>Your Wealth Report.</h1>
        <p className={reportStyles.coverLede}>
          Ten minutes of honest questions about your money — and here&rsquo;s what a planner
          would say back. A short, structured picture of where you are, where you&rsquo;re
          heading, and the few things worth a conversation.
        </p>

        <div className={reportStyles.coverMetaGrid}>
          <div className={reportStyles.coverMetaItem}>
            <span className={reportStyles.coverMetaItemKicker}>Prepared for</span>
            <span className={reportStyles.coverMetaItemValue}>{name}</span>
          </div>
          <div className={reportStyles.coverMetaItem}>
            <span className={reportStyles.coverMetaItemKicker}>Planner lens</span>
            <span className={reportStyles.coverMetaItemValue}>{segmentLabel}</span>
          </div>
          <div className={reportStyles.coverMetaItem}>
            <span className={reportStyles.coverMetaItemKicker}>Snapshot</span>
            <span className={reportStyles.coverMetaItemValue}>{persona}</span>
          </div>
        </div>
      </div>

      <div className={reportStyles.coverBottom}>
        <span>realwealth.co.uk</span>
        <span>01 · 0{TOTAL_PAGES}</span>
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
      <div className={reportStyles.sectionTitle}>
        <span className={reportStyles.eyebrow}>{eyebrow}</span>
        <h2 className={reportStyles.hSection}>{title}</h2>
        <p className={reportStyles.intro} dangerouslySetInnerHTML={{ __html: intro }} />
      </div>

      <div className={reportStyles.placeholderBadge}>
        Content in development · sourced from <code>{comingFrom}</code>
      </div>

      <div className={reportStyles.placeholderBlocks}>
        {blocks.map((b, i) => (
          <div key={i} className={reportStyles.placeholderBlock}>
            <div className={reportStyles.placeholderKicker}>{b.kicker}</div>
            <p className={reportStyles.placeholderBody}>{b.body}</p>
          </div>
        ))}
      </div>

      <div className={reportStyles.placeholderFoot}>
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
  const html = bodyToHtml(body);
  return (
    <section className={reportStyles.methodologySection}>
      <h3 className={reportStyles.methodologyHeading}>{heading}</h3>
      <div className={reportStyles.methodologyBody} dangerouslySetInnerHTML={{ __html: html }} />
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
  return `<table class="${reportStyles.methodologyTable}">${thead}${tbody}</table>`;
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
