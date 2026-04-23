/**
 * /report/master/[segment] — the master 8-page Compass report.
 *
 * Renders (in order):
 *   01 Cover                          — placeholder, copy from content team
 *   02 Snapshot                       — chart page (HealthGauge, donut, balance)
 *   03 Planning grid + Goals          — chart page
 *   04 Projection + CTA               — chart page
 *   05 Where you are today            — narrative, content from markdown
 *   06 Five things worth a conversation — narrative
 *   07 Silent gaps + Planner's read   — narrative
 *   08 Next step                      — narrative + CTA
 *
 * Pages 05-08 are placeholders right now — the content agent's markdown
 * expansion will feed them. See MASTER_REPORT_PLAN.md for the content
 * integration contract.
 */

import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  FIXTURES, fixtureById,
} from '@/lib/compass';
import {
  ReportView, PageFrame, CtaPanel,
} from '@/components/compass';
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

  const name = SEGMENT_NAMES[fixture.view.segmentId] ?? 'your plan';
  const docTitle = `Your Wealth Report · ${name}`;
  const TOTAL_PAGES = 8;

  return (
    <div className={`rw-doc ${styles.doc}`}>
      {/* 01 — Cover */}
      <CoverPage name={name} segmentLabel={fixture.view.segmentLabel} persona={fixture.view.persona} />

      {/* 02-04 — Chart pages, rendered inline with PageFrame */}
      <ReportView
        fixture={fixture}
        recipientName={name}
        startPageNum={2}
        totalPages={TOTAL_PAGES}
      />

      {/* 05 — Where you are today (narrative, placeholder) */}
      <PageFrame
        docTitle={docTitle}
        pageNum="05"
        totalPages={TOTAL_PAGES}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Where you are today"
      >
        <NarrativePlaceholder
          eyebrow="Where you are today"
          title="A quick picture of what you told us."
          intro="This page opens the narrative conversation — the emotional tone, the &lsquo;in your own words&rsquo; pull quote, and the direct interpretation of the gating answers (age, household, work, income, estate)."
          comingFrom="content/pages/summary-where-you-are.md · segments/s[n]-*.md"
          blocks={[
            { kicker: 'Context', body: 'A short 2-3 paragraph reflection on the shape of the person\'s life right now, using their own words (Q2.4 happy-place text).' },
            { kicker: 'In your own words', body: 'A pullquote from Q2.4 styled in serif italic teal.' },
            { kicker: 'Segment-tailored close', body: 'One paragraph positioning where we think they are, by segment (S1-S9).' },
          ]}
        />
      </PageFrame>

      {/* 06 — Five things worth a conversation */}
      <PageFrame
        docTitle={docTitle}
        pageNum="06"
        totalPages={TOTAL_PAGES}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Five things"
      >
        <NarrativePlaceholder
          eyebrow="What we&rsquo;d talk through"
          title="Five things worth a conversation."
          intro="The provocation engine output, compliance-gated. Existing runtime: src/lib/provocations/catalogue.ts + content/provocations/*.md."
          comingFrom="content/provocations/*.md (24 drafts) · filtered by segment and trigger DSL"
          blocks={[
            { kicker: 'Top 4 provocations', body: 'One short headline + body per provocation, card format.' },
            { kicker: 'The fifth', body: 'Highlight card — the "and one more" — segment-specific compound flag.' },
          ]}
        />
      </PageFrame>

      {/* 07 — Silent gaps + Planner's read */}
      <PageFrame
        docTitle={docTitle}
        pageNum="07"
        totalPages={TOTAL_PAGES}
        footer="Manchester · Taunton · hello@realwealth.co.uk"
        label="Silent gaps"
      >
        <NarrativePlaceholder
          eyebrow="Things we didn&rsquo;t ask — but noticed"
          title="The shape of your answers says more than the answers themselves."
          intro="Silent-gap selector + planner&rsquo;s-read panels. Existing runtime: src/lib/summary/silentGaps.ts."
          comingFrom="src/lib/summary/silentGaps.ts (12 rules, segment-weighted ranking)"
          blocks={[
            { kicker: 'Silent gaps', body: '2-3 compact cards, each with icon + headline + one-line body.' },
            { kicker: 'Planner&rsquo;s read', body: 'Three lenses (insight / context / practical move) in a 3-column grid.' },
          ]}
        />
      </PageFrame>

      {/* 08 — Next step */}
      <PageFrame
        docTitle={docTitle}
        pageNum="08"
        totalPages={TOTAL_PAGES}
        footer="Real Wealth Partners Ltd · Authorised and regulated by the Financial Conduct Authority"
        label="Next step"
      >
        <div className={styles.sectionTitle}>
          <span className={styles.eyebrow}>What happens next</span>
          <h2 className={styles.hSection}>Talk it through with a planner.</h2>
          <p className={styles.intro}>
            You&rsquo;ve given us a thoughtful picture. The last step is the only one that matters —
            a 30-minute conversation with a Real Wealth planner, tailored to you, no obligation.
          </p>
        </div>

        <div className={styles.ctaWrap}>
          <CtaPanel
            eyebrow="Book your free 30-minute consultation"
            title={`Let's talk about you, ${name}.`}
            body="Bring this report. We&rsquo;ll go through the amber tiles first, the red ones next, then decide what&rsquo;s worth acting on together."
            buttonLabel="Book the call"
            buttonHref="https://calendly.com/realwealth/intro"
            contact="0161 768 7722 · hello@realwealth.co.uk"
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
    </div>
  );
}

function CoverPage({ name, segmentLabel, persona }: { name: string; segmentLabel: string; persona: string }) {
  return (
    <section className={styles.cover}>
      <div className={styles.coverGlowTr} />
      <div className={styles.coverGlowBl} />

      <figure className={styles.coverMedia}>
        <Image
          src="/report-preview/assets/welcome-image.png"
          alt="Welcome"
          className={styles.coverMediaImg}
          width={560}
          height={420}
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
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · 8 pages
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
        <span>01 · 08</span>
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
