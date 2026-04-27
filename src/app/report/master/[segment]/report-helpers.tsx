/**
 * Shared report-page helpers.
 *
 * Used by both the static master route (page.tsx in this directory) and the
 * live summary embed (CompassReportSection). Co-located here because both
 * consumers reference the same CSS module — extracting keeps them in sync
 * without an extra import indirection.
 */
import Image from 'next/image';
import styles from './page.module.css';

// ---------------------------------------------------------------------------
// Cover page
// ---------------------------------------------------------------------------

export function CoverPage({
  name,
  segmentLabel,
  persona,
}: {
  name: string;
  segmentLabel: string;
  persona: string;
}) {
  return (
    <section className={styles.cover}>
      <div className={styles.coverGlowTr} />
      <div className={styles.coverGlowBl} />

      {/* Drop cover-hero.jpg into public/report-preview/assets/ to replace the default.
          The logo-shaped clip-path (rw-hero-2-leaves) is applied via CSS on .coverMediaImg. */}
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

// ---------------------------------------------------------------------------
// Narrative placeholder (visible in dev when content hasn't landed yet)
// ---------------------------------------------------------------------------

export interface PlaceholderBlock {
  kicker: string;
  body: string;
}

export function NarrativePlaceholder({
  eyebrow,
  title,
  intro,
  comingFrom,
  blocks,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  comingFrom: string;
  blocks: PlaceholderBlock[];
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

// ---------------------------------------------------------------------------
// Methodology section
// ---------------------------------------------------------------------------

/** Renders one methodology section body. Handles markdown tables, H2s, paragraphs.
 *  Keep this narrow — methodology.md has a known, stable shape. */
export function MethodologySection({ heading, body }: { heading: string; body: string }) {
  return (
    <section className={styles.methodologySection}>
      <h3 className={styles.methodologyHeading}>{heading}</h3>
      <div className={styles.methodologyBody} dangerouslySetInnerHTML={{ __html: bodyToHtml(body) }} />
    </section>
  );
}

function bodyToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*[-:| ]+\|?\s*$/.test(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\s*\|.*\|/.test(lines[i])) { tableLines.push(lines[i++]); }
      out.push(renderTable(tableLines));
      continue;
    }

    if (/^##\s+/.test(line)) { out.push(`<h4>${escapeHtml(line.replace(/^##\s+/, ''))}</h4>`); i++; continue; }
    if (line.trim() === '') { out.push(''); i++; continue; }

    const para: string[] = [line]; i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^##\s+/.test(lines[i]) && !/^\s*\|/.test(lines[i])) {
      para.push(lines[i++]);
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
  return line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

function inline(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// Page-number utility
// ---------------------------------------------------------------------------

/** Zero-pads a page index to 2 digits: 6 → "06". */
export const formatPageNum = (n: number): string => String(n).padStart(2, '0');
