/**
 * FiveThings — Page 06 "Five things worth a conversation".
 *
 * Renders 4 standard cards in a 2×2 grid, plus one featured "fifth" highlight
 * card below. Content comes from `content/pdf-report/awareness-checks-expanded/`
 * via `loadFiveThings()` in `pdf-content.ts`.
 *
 * Each card shows the H1 title + the first paragraph of body copy (the
 * "context" paragraph). The featured card also shows a bridge line (last
 * paragraph). If the expanded frontmatter carries an `image_slug:` field,
 * the card's left column renders an illustration instead of the default icon.
 */

import type { ExpandedAwarenessCheck, FiveThingsSelection } from '@/lib/compass/pdf-content';
import styles from './FiveThings.module.css';

export interface FiveThingsProps {
  selection: FiveThingsSelection;
}

export function FiveThings({ selection }: FiveThingsProps) {
  const { standard, featured } = selection;

  return (
    <>
      <div className={styles.standardGrid}>
        {standard.map(item => (
          <StandardCard key={item.sourceId} item={item} />
        ))}
      </div>
      {featured && <FeaturedCard item={featured} />}
    </>
  );
}

function StandardCard({ item }: { item: ExpandedAwarenessCheck }) {
  const lead = item.paragraphs[0] ?? '';
  const titleShort = shortenTitle(item.title);
  const hasImage = !!item.imageSlug;

  return (
    <div className={`${styles.card} ${hasImage ? styles.cardWithImage : ''}`}>
      {hasImage ? (
        <div className={styles.illus}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/report-preview/assets/illustrations/${item.imageSlug}.svg`} alt="" />
        </div>
      ) : (
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24">{pickIcon(item.sourceId)}</svg>
        </span>
      )}
      <div className={styles.cardBody}>
        <h4 className={styles.cardTitle}>{titleShort}</h4>
        <p className={styles.cardLead}>{truncate(lead, 280)}</p>
      </div>
    </div>
  );
}

function FeaturedCard({ item }: { item: ExpandedAwarenessCheck }) {
  const lead = item.paragraphs[0] ?? '';
  const bridge = item.paragraphs[item.paragraphs.length - 1] ?? '';
  const hasSeparateBridge = item.paragraphs.length >= 3;
  const hasImage = !!item.imageSlug;

  return (
    <div className={`${styles.featured} ${hasImage ? styles.featuredWithImage : ''}`}>
      {hasImage ? (
        <div className={styles.featuredIllus}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/report-preview/assets/illustrations/${item.imageSlug}.svg`} alt="" />
        </div>
      ) : (
        <span className={styles.featuredIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24">{pickIcon(item.sourceId)}</svg>
        </span>
      )}
      <div>
        <div className={styles.featuredKicker}>And the fifth</div>
        <h3 className={styles.featuredTitle}>{shortenTitle(item.title)}</h3>
        <p className={styles.featuredLead}>{truncate(lead, 420)}</p>
        {hasSeparateBridge && bridge !== lead && (
          <p className={styles.featuredBridge}>{truncate(bridge, 280)}</p>
        )}
      </div>
    </div>
  );
}

/** Drop the subtitle after the first em-dash so card titles stay short. */
function shortenTitle(title: string): string {
  const idx = title.indexOf('—');
  if (idx > 0 && idx < 60) return title.slice(0, idx).trim();
  return title;
}

/** Trim to `max` chars at the last word boundary. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return cut.slice(0, Math.max(max * 0.7, lastSpace)).trim() + '…';
}

/** Heuristic icon picker for a card — fallback when no image_slug is set. */
function pickIcon(sourceId: string): React.ReactNode {
  const id = sourceId.toLowerCase();
  if (id.includes('lpa') || id.includes('will')) {
    return (<><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M8 7h8M8 11h8M8 15h5" /></>);
  }
  if (id.includes('iht') || id.includes('rnrb') || id.includes('pension_iht')) {
    return (<><path d="M12 3v18M3 8h18M3 14h18" /><circle cx="7" cy="6" r="1" /><circle cx="17" cy="6" r="1" /></>);
  }
  if (id.includes('income_trap') || id.includes('tapered') || id.includes('carry_forward')) {
    return (<><path d="M4 18h16M4 18V8M20 18V4" /><path d="M8 18v-6M12 18v-9M16 18v-5" /></>);
  }
  if (id.includes('ni_gap') || id.includes('care_funding')) {
    return (<><path d="M12 2l9 4v6c0 5-3.5 9-9 10-5.5-1-9-5-9-10V6l9-4Z" /></>);
  }
  if (id.includes('fund_fee') || id.includes('adviser_fee')) {
    return (<><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></>);
  }
  if (id.includes('consolidation') || id.includes('pension_as_extraction')) {
    return (<><path d="M4 7h16M4 12h16M4 17h16" /><path d="M8 4v3M16 10v4M12 14v3" /></>);
  }
  if (id.includes('extraction_mix') || id.includes('glide_path')) {
    return (<><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h6v6" /></>);
  }
  if (id.includes('ssp_gap') || id.includes('group_life')) {
    return (<><path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /><path d="M9 12l2 2 4-4" /></>);
  }
  if (id.includes('couples_alignment')) {
    return (<><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M4 20c0-3 2-5 4-5s4 2 4 5M12 20c0-3 2-5 4-5s4 2 4 5" /></>);
  }
  if (id.includes('savings_tax') || id.includes('emergency_fund')) {
    return (<><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M7 6V4M17 6V4M3 11h18" /></>);
  }
  if (id.includes('badr') || id.includes('mpaa')) {
    return (<><path d="M8 3h8l2 5-6 13-6-13 2-5Z" /></>);
  }
  // Default: a small clock (time / planning)
  return (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
}
