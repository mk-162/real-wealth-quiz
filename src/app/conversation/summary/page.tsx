/**
 * Summary / results page.
 *
 * Seven-section structure (per Summary Page Redesign prompt, 2026-04-16):
 *   1. Aspiration echo
 *   2. Emotional-state intro + considered-list heading
 *   3. Spotlight compound flag (conditional)
 *   4. Considered list + inline charts
 *   5. "Things we didn't ask — but noticed" (conditional)
 *   6. "What We Didn't Ask" bridge paragraph (not for Tier C)
 *   7. Segment-tailored CTA (enhanced treatment for advised_but_looking)
 *   + FCA footer and start-over link
 *
 * Every flag is a conversation invitation — never a calculation.
 * All visual tokens via var(--*). No hex values in CSS (see tokens.css).
 */
'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bridge } from '@/components/Bridge';
import { BriefingCard } from '@/components/BriefingCard';
import { Button } from '@/components/Button';
import { FinalCTA } from '@/components/FinalCTA';
import { IllustrativeChart } from '@/components/IllustrativeChart';
import { SilentGapCard } from '@/components/SilentGapCard';
import { SpotlightFlag } from '@/components/SpotlightFlag';
import { SummaryHeader } from '@/components/SummaryHeader';
import {
  awareness as awarenessCatalogue,
  microcopy,
  overlayCta,
  pageValue,
  provocations as provocationCatalogue,
  segmentCta,
  type SegmentCta,
} from '@/lib/content';
import { clearSession, loadSession, type Session } from '@/lib/questionnaire/session';
import {
  segment as runSegmentation,
  upgradeSegment,
  type GatingAnswers,
  type HouseholdTag,
} from '@/lib/segmentation';
import {
  buildSummaryInputs,
  chartForCard,
  selectEmotionalIntro,
  selectSilentGaps,
  selectSpotlightFlag,
  type SummaryInputs,
} from '@/lib/summary';
import styles from './page.module.css';

export default function SummaryPage() {
  return (
    <Suspense fallback={null}>
      <Summary />
    </Suspense>
  );
}

function Summary() {
  const params = useSearchParams();

  /* Prefer session state when a real session exists; fall back to URL params
     (demo/dev mode where no answers were captured upstream). */
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSession(loadSession());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const derived = useMemo(() => deriveFromSession(session), [session]);

  const segmentId = derived.segmentId ?? params.get('segment') ?? 'S3';
  const urgency = derived.urgency ?? params.get('urgency');
  const adviceStatus = derived.adviceStatus ?? params.get('adviceStatus');
  const aspirationParam = derived.aspiration ?? params.get('aspiration') ?? '';
  const tier = (session?.tier ?? params.get('tier') ?? 'A') as string;

  /* Treat yes_but_looking (internal form value) and yes_looking
     (legacy overlay key) as the same high-intent state. */
  const isAdvisedLooking =
    adviceStatus === 'yes_but_looking' || adviceStatus === 'yes_looking';

  /* Narrowed inputs for every summary resolver. */
  const inputs: SummaryInputs = useMemo(
    () =>
      buildSummaryInputs(session, segmentId, {
        urgency,
        currentAdviser: isAdvisedLooking ? 'yes_but_looking' : adviceStatus,
        happyPlace: aspirationParam.trim().length > 0 ? aspirationParam : null,
      }),
    [session, segmentId, urgency, adviceStatus, isAdvisedLooking, aspirationParam],
  );

  /* --- Copy sourced from content/pages/summary.md ------------------ */
  const listKicker = pageValue<string>(
    'summary',
    'considered_list.section_heading',
    'THINGS WORTH A CONVERSATION',
  );
  const listFinal = pageValue<string>(
    'summary',
    'considered_list.final_line',
    "We'll save this list against your name. If you book a call, we'll bring it to the conversation so you don't have to.",
  );
  const chartsDisclaimer = pageValue<string>(
    'summary',
    'charts.disclaimer',
    'These are not projections of your personal numbers.',
  );
  const silentGapsHeading = pageValue<string>(
    'summary',
    'silent_gaps.section_heading',
    "THINGS WE DIDN'T ASK — BUT NOTICED",
  );
  const silentGapsIntro = pageValue<string>(
    'summary',
    'silent_gaps.intro',
    "Based on the shape of what you've told us, a few things stand out — even though we didn't ask about them directly.",
  );
  const bridgeCopy = pageValue<string>(
    'summary',
    'bridge.copy',
    "We haven't asked everything — no 10-minute form could. A planner will fill in the detail that changes the picture.",
  );
  const illustrativeTag = pageValue<string>(
    'summary',
    'charts.per_chart_illustrative_tag',
    'ILLUSTRATIVE EXAMPLE',
  );

  /* Aspiration echo — user-written line, else a template fallback. */
  const fallbackLine = pageValue<string>(
    'summary',
    'aspiration_echo.fallback_templates.freedom_time',
    "The life you're planning for.",
  );
  const aspirationLine = aspirationParam.trim().length > 0 ? aspirationParam : fallbackLine;

  /* Resolvers. */
  const emotionalIntro = useMemo(() => selectEmotionalIntro(inputs), [inputs]);
  const spotlight = useMemo(() => selectSpotlightFlag(inputs), [inputs]);
  const silentGaps = useMemo(() => {
    const min = pageValue<number>('summary', 'silent_gaps.min_cards', 2);
    const gaps = selectSilentGaps(inputs);
    return gaps.length >= min ? gaps : [];
  }, [inputs]);

  const items = useMemo(() => buildConsideredList(segmentId, inputs), [segmentId, inputs]);
  const cta = useMemo(
    () => resolveCta(segmentId, urgency, isAdvisedLooking ? 'yes_looking' : adviceStatus),
    [segmentId, urgency, adviceStatus, isAdvisedLooking],
  );

  /* Hide the bridge for Tier C — the quick-picture path is deliberately terse. */
  const showBridge = tier !== 'C';

  /* Telemetry — expose the resolver results in the persisted session so the
     /demo/raw view can render them. We write once per render key change. */
  useEffect(() => {
    if (typeof window === 'undefined' || !session) return;
    const record = {
      ...session,
      summary: {
        emotionalStateVariant: emotionalIntro.id,
        compoundFlagId: spotlight?.id ?? null,
        compoundFlagTriggerAnswers: spotlight?.triggerAnswerIds ?? [],
        silentGapFlags: silentGaps.map((g) => g.id),
        inlineChartIds: items.flatMap((i) => (i.chartId ? [i.chartId] : [])),
        ctaVariant: isAdvisedLooking ? `${segmentId}+advised_but_looking` : segmentId,
        ctaEnhanced: isAdvisedLooking,
      },
    };
    try {
      window.localStorage.setItem('real-wealth:conversation', JSON.stringify(record));
    } catch {
      /* quota exceeded — silently drop */
    }
  }, [session, emotionalIntro.id, spotlight, silentGaps, items, isAdvisedLooking, segmentId]);

  /* Primary action — uniform across the page. The free 30-minute
     consultation is the lead-gen offer; segment-specific copy stays as
     framing in the FinalCTA body but the button label is consistent. */
  const primaryCtaLabel = 'Book your free 30-minute consultation';
  /* Segment/overlay button_link values in the content files are stored
     without protocol (e.g. "calendly.com/..."). FinalCTA normalises
     internally; the hero opens window.open directly so we must
     normalise here too — otherwise the URL resolves as a relative path. */
  const primaryCtaHref = normaliseHref(cta.button_link);
  const contactHref = pageValue<string>(
    'summary',
    'contact_url',
    'https://realwealth.co.uk/contact',
  );
  const briefingHref = pageValue<string>(
    'summary',
    'briefing_signup_url',
    'https://realwealth.co.uk/briefing',
  );

  return (
    <div className={styles.shell}>
      <SummaryHeader contactHref={contactHref} />

      {/* Hero — problem framing + primary CTA. The aspiration echo line
          is preserved as a small quiet caption above the headline so the
          user still sees their own words back (without the "You said:"
          prefix, which read as a chore). The headline is the dominant
          element. */}
      <section className={styles.hero} aria-labelledby="hero-headline">
        <div className={styles.heroInner}>
          <p className={styles.heroAspiration}>
            <span className={styles.heroAspirationLine}>
              &ldquo;{aspirationLine}&rdquo;
            </span>
          </p>
          <h1 id="hero-headline" className={styles.heroHeadline}>
            Five things worth a conversation.
          </h1>
          <p className={styles.heroFrame}>
            The gap between the life you described and the money working
            quietly behind it is usually made of small, fixable things.
            Below is a shortlist of what we&rsquo;d talk through with you —
            and a free 30-minute conversation if you want one.
          </p>
          <div className={styles.heroActions}>
            <Button
              onClick={() =>
                primaryCtaHref &&
                window.open(primaryCtaHref, '_blank', 'noopener,noreferrer')
              }
            >
              {primaryCtaLabel}
            </Button>
            <a className={styles.heroSecondary} href={contactHref} target="_blank" rel="noopener noreferrer">
              Or get in touch first
            </a>
          </div>
          <p className={styles.heroHelper}>
            30 minutes. Free. On this exact briefing — no preparation needed
            on your side.
          </p>
        </div>
      </section>

      {/* Section 3 — Spotlight compound flag (conditional) */}
      {spotlight ? (
        <div className={styles.spotlightWrap}>
          <SpotlightFlag
            eyebrow={spotlight.eyebrow}
            headline={spotlight.headline}
            body={spotlight.body}
            close={spotlight.close}
          />
        </div>
      ) : null}

      {/* Section heading for the considered list. The kicker stays as
          the formal section label; the heading frames the list as the
          planner's preview. The emotional-intro copy from the resolver
          lives here as the warmer, segment-aware lede that softens the
          shortlist. */}
      <section className={styles.listHeading} aria-labelledby="considered">
        <span className={styles.listKicker}>{listKicker}</span>
        <h2 id="considered" className={styles.listHeadline}>
          What we&rsquo;d talk through with you
        </h2>
        <p className={styles.listLede}>{emotionalIntro.copy}</p>
      </section>

      {/* Section 4 — Considered list (with inline charts).
          On desktop the list shares a two-column grid with a sticky CTA
          card so the contact action is always in view as the user scans
          the list. The grid collapses to a single column below 1024px;
          the sidebar then drops directly under the list. The full-width
          narrative CTA at the bottom of the page (Section 7) remains as
          the emotional resolution to the briefing. */}
      <div className={styles.listLayout}>
      <section className={styles.list} aria-label="Considered list">
        <ul className={styles.items}>
          {items.map((item) => (
            <li
              key={item.id}
              className={styles.item}
              data-compliance={item.compliance}
            >
              <span aria-hidden="true" className={styles.chev}>
                <svg
                  viewBox="0 0 10 10"
                  width="10"
                  height="10"
                  focusable="false"
                  aria-hidden="true"
                >
                  <path
                    d="M3 2.5 L6 5 L3 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={styles.itemBody}>
                <span className={styles.itemEyebrow}>{item.category}</span>
                <span className={styles.itemHeadline}>{item.headline}</span>
                <span className={styles.itemText}>{item.body}</span>
                {item.chart ? (
                  <span className={styles.inlineChartWrap}>
                    <IllustrativeChart
                      title={item.chart.title}
                      assumptions={item.chart.caption}
                    >
                      <PlaceholderBars highlightIndex={highlightForChart(item.chart.id)} />
                    </IllustrativeChart>
                  </span>
                ) : null}
                {item.close ? (
                  <span className={styles.itemClose}>{item.close}</span>
                ) : null}
                {item.compliance === 'draft' &&
                process.env.NODE_ENV !== 'production' ? (
                  <span className={styles.draftTag}>DRAFT — pending compliance</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.listFinal}>{listFinal}</p>
        {items.some((i) => i.chart) ? (
          <p className={styles.chartsDisclaimer}>{chartsDisclaimer}</p>
        ) : null}
        {/* Unused but retained for future injection of a custom label. */}
        <span hidden>{illustrativeTag}</span>
      </section>

        {/* Sidebar CTA — compact, consistent type scale with the briefing
            card below. Fixed short body to avoid the long segment copy
            wrapping past the sidebar's narrow column. Secondary action
            links to the marketing-site contact form. A subtle
            "recommend to a friend" share link sits outside the card as
            a tertiary action. */}
        <aside className={styles.ctaSidebar} aria-label="Book a conversation">
          <div className={styles.ctaCard}>
            <FinalCTA
              variant="compact"
              ariaLabel="Book a call (sidebar)"
              headline="Talk this through with a planner."
              body="A free 30-minute conversation. No preparation needed on your side."
              button={primaryCtaLabel}
              buttonHref={primaryCtaHref}
              helper="We'll bring this briefing to the call."
              preamble={cta.preamble}
              secondaryButton="Get in touch"
              secondaryHref={contactHref}
            />
          </div>
          <ShareWithFriend className={styles.shareLink} />
        </aside>
      </div>

      {/* Section 5 — Silent gaps (conditional, 2+ triggers) */}
      {silentGaps.length > 0 ? (
        <section
          className={styles.silentGaps}
          aria-labelledby="silent-gaps-heading"
        >
          <div className={styles.silentGapsInner}>
            <h2 id="silent-gaps-heading" className={styles.silentGapsKicker}>
              {silentGapsHeading}
            </h2>
            <p className={styles.silentGapsIntro}>{silentGapsIntro}</p>
            <div className={styles.silentGapsGrid}>
              {silentGaps.map((g) => (
                <SilentGapCard key={g.id} body={g.body} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Section 6 — Bridge (not for Tier C) */}
      {showBridge ? <Bridge copy={bridgeCopy} /> : null}

      {/* Action ladder — two peer cards in a matched grid. Same padding,
          border, border-radius, headline size, button height. Distinction
          is carried by the primary's orange top stripe + gradient button
          and the briefing's outline button. Both headlines use the same
          weight/size to read as peers. The "share with a friend" link
          below is a tertiary action in a quieter register. */}
      <section className={styles.actionLadder} aria-label="Next steps">
        <div className={styles.actionLadderGrid}>
          <FinalCTA
            variant="ladder"
            ariaLabel="Book a call (end of summary)"
            headline={cta.headline}
            body={cta.body}
            button={primaryCtaLabel}
            buttonHref={primaryCtaHref}
            helper="30 minutes, free, on this exact briefing — no preparation needed."
            preamble={cta.preamble}
            enhanced={isAdvisedLooking}
            secondaryButton="Get in touch instead"
            secondaryHref={contactHref}
          />

          <BriefingCard href={briefingHref} />
        </div>
      </section>

      <StartOverFooter />
    </div>
  );
}

/* ================================================================ */
/* Start-over link + confirmation modal                              */
/* ================================================================ */

function StartOverFooter() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const headline = microcopy('modals', 'start_over_headline');
  const body = microcopy('modals', 'start_over_body');
  const primary = microcopy('modals', 'start_over_primary');
  const secondary = microcopy('modals', 'start_over_secondary');

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function confirmStartOver() {
    clearSession();
    dialogRef.current?.close();
    router.push('/');
  }

  return (
    <>
      <div className={styles.startOverRow}>
        <button
          type="button"
          className={styles.startOverLink}
          onClick={openModal}
        >
          Start over
        </button>
      </div>

      <dialog ref={dialogRef} className={styles.startOverDialog}>
        <h3 className={styles.startOverHeadline}>{headline}</h3>
        <p className={styles.startOverBody}>{body}</p>
        <div className={styles.startOverActions}>
          <button
            type="button"
            className={styles.startOverSecondary}
            onClick={closeModal}
          >
            {secondary}
          </button>
          <button
            type="button"
            className={styles.startOverPrimary}
            onClick={confirmStartOver}
          >
            {primary}
          </button>
        </div>
      </dialog>
    </>
  );
}

/* ================================================================ */
/* CTA resolver                                                      */
/* ================================================================ */

interface ResolvedCta {
  headline: string;
  body: string;
  button: string;
  button_link: string;
  helper: string;
  preamble?: string;
}

function resolveCta(
  segmentId: string,
  urgency: string | null,
  adviceStatus: string | null,
): ResolvedCta {
  // Rule 1: advised_but_looking replaces the segment CTA entirely.
  if (adviceStatus === 'yes_looking' || adviceStatus === 'advised_but_looking') {
    const overlay = overlayCta('advised_but_looking');
    if (overlay) return fromCta(overlay);
  }

  // Base: segment-specific CTA (fall back to S2 then to a generic line).
  const base = segmentCta(segmentId) ?? segmentCta('S2');
  const resolved = base ? fromCta(base) : fallbackCta();

  // Rule 2: urgency=this_week adds a preamble ABOVE the segment CTA.
  if (urgency === 'this_week') {
    const urgencyOverlay = overlayCta('urgency_this_week');
    if (urgencyOverlay) {
      resolved.preamble = urgencyOverlay.body;
    }
  }

  return resolved;
}

function fromCta(cta: SegmentCta): ResolvedCta {
  return {
    headline: cta.headline,
    body: cta.body,
    button: cta.button,
    button_link: cta.button_link,
    helper: cta.helper,
  };
}

function fallbackCta(): ResolvedCta {
  return {
    headline: "Let's talk about you.",
    body: 'Book a 20-minute call — no preparation needed on your side.',
    button: 'Book a 20-minute call',
    button_link: '',
    helper: "We'll be in touch within one working day.",
  };
}

/* ================================================================ */
/* Considered list                                                   */
/* ================================================================ */

interface ListItem {
  id: string;
  category: string;
  headline: string;
  body: string;
  close?: string;
  compliance: 'draft' | 'ok';
  rank: number;
  chart?: { id: string; title: string; caption: string };
  chartId?: string;
}

function buildConsideredList(segmentId: string, inputs: SummaryInputs): ListItem[] {
  /* Provocations whose `segments` array includes `'all'` or the assigned id. */
  const segmentProvocations = provocationCatalogue.filter(
    (p) => p.segments.includes('all') || p.segments.includes(segmentId),
  );

  /* Core awareness checks, ranked. */
  const coreAwareness = [...awarenessCatalogue]
    .filter((a) => a.core)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  const awarenessItems: ListItem[] = coreAwareness.slice(0, 3).map((a) => ({
    id: a.id,
    category: categoryFromId(a.id),
    headline: trimToTenWords(a.stem),
    body: a.partial_body,
    close: 'Worth a conversation.',
    compliance: a.compliance_status === 'approved_to_ship' ? 'ok' : 'draft',
    rank: a.rank ?? 50,
  }));

  const provocationItems: ListItem[] = segmentProvocations.map((p, i) => ({
    id: p.id,
    category: categoryFromId(p.id),
    headline: p.headline,
    body: p.body,
    close: p.close,
    compliance: p.compliance_status === 'approved_to_ship' ? 'ok' : 'draft',
    rank: 60 + i,
  }));

  const combined = [...awarenessItems, ...provocationItems];
  const seen = new Set<string>();
  const deduped = combined.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  deduped.sort((a, b) => a.rank - b.rank);

  /* Cap at 5 (reduced from 6 — spotlight compound flag now carries the 6th slot). */
  let trimmed: ListItem[];
  if (process.env.NODE_ENV === 'production') {
    const approvedOnly = deduped.filter((item) => item.compliance === 'ok');
    trimmed = approvedOnly.length > 0 ? approvedOnly.slice(0, 5) : deduped.slice(0, 5);
  } else {
    trimmed = deduped.slice(0, 5);
  }

  /* Attach inline charts — max 2 across the whole list per brief §4. */
  let chartsAttached = 0;
  const withCharts = trimmed.map((item) => {
    if (chartsAttached >= 2) return item;
    const chart = chartForCard(item.id, inputs);
    if (!chart) return item;
    chartsAttached += 1;
    return { ...item, chart, chartId: chart.id };
  });

  return withCharts;
}

interface Derived {
  segmentId: string | null;
  urgency: string | null;
  adviceStatus: string | null;
  aspiration: string | null;
}

/**
 * Read the persisted session (if any) and derive the values the summary page
 * needs: assigned segment, urgency overlay, advice-status overlay, aspiration
 * echo line. Returns null fields when the session hasn't been started yet —
 * the page falls back to URL params in that case.
 */
function deriveFromSession(session: Session | null): Derived {
  if (!session) {
    return { segmentId: null, urgency: null, adviceStatus: null, aspiration: null };
  }
  const answers = session.answers ?? {};
  const gating: Partial<GatingAnswers> = {
    age: typeof answers.age === 'number' ? answers.age : undefined,
    household: Array.isArray(answers.household)
      ? (answers.household as HouseholdTag[])
      : undefined,
    workStatus:
      typeof answers.work_status === 'string'
        ? (answers.work_status as GatingAnswers['workStatus'])
        : undefined,
    income:
      typeof answers.income_band === 'string'
        ? (answers.income_band as GatingAnswers['income'])
        : undefined,
    estate:
      typeof answers.estate_band === 'string'
        ? (answers.estate_band as GatingAnswers['estate'])
        : undefined,
  };
  const gateReady =
    gating.age !== undefined &&
    gating.household !== undefined &&
    gating.workStatus !== undefined &&
    gating.income !== undefined &&
    gating.estate !== undefined;
  let segmentId: string | null = null;
  if (gateReady) {
    const { segmentId: base } = runSegmentation(gating as GatingAnswers);
    const q53 = typeof answers.succession === 'string' ? answers.succession : undefined;
    segmentId = upgradeSegment(base, q53);
  }
  return {
    segmentId,
    urgency: typeof answers.urgency === 'string' ? answers.urgency : null,
    adviceStatus:
      typeof answers.current_adviser === 'string' ? answers.current_adviser : null,
    aspiration:
      typeof answers.happy_place === 'string' ? (answers.happy_place as string) : null,
  };
}

/** Mirrors FinalCTA's normaliser — content files store Calendly URLs
 *  without protocol (e.g. "calendly.com/..."). */
function normaliseHref(href: string): string {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|\/)/i.test(href)) return href;
  return `https://${href}`;
}

function trimToTenWords(s: string): string {
  const words = s.split(/\s+/);
  if (words.length <= 10) return s;
  return words.slice(0, 10).join(' ') + '…';
}

function categoryFromId(id: string): string {
  if (/iht|rnrb|estate|will|lpa|pension_iht|care_funding/i.test(id)) {
    return 'ESTATE & INHERITANCE';
  }
  if (/pension|carry_forward|mpaa|glide|ni_gaps/i.test(id)) {
    return 'PENSIONS';
  }
  if (/income_trap|tapered|savings_tax|fund_fee/i.test(id)) {
    return 'TAX & SAVINGS';
  }
  if (/protection|group_life|ssp_gap/i.test(id)) {
    return 'PROTECTION';
  }
  if (/btl|overpayment|mortgage|property/i.test(id)) {
    return 'PROPERTY';
  }
  if (/extraction|succession|director|exit|business|badr/i.test(id)) {
    return 'BUSINESS';
  }
  if (/independent|adviser_fee|couples/i.test(id)) {
    return 'ADVICE & FAMILY';
  }
  return 'WORTH NOTICING';
}

function highlightForChart(id: string): number {
  switch (id) {
    case 'income_trap_100k':
      return 4;
    case 'iht_on_3m':
      return 0;
    case 'extraction_mix':
      return 2;
    case 'compounding_line':
      return 5;
    case 'drawdown_paths':
      return 1;
    case 'badr_transition':
      return 3;
    default:
      return 2;
  }
}

/* ================================================================ */
/* Share-with-a-friend tertiary action                               */
/* ================================================================ */

/**
 * Small text-link share action. Uses `navigator.share` where available
 * (mobile + most modern desktops) and falls back to a pre-filled
 * mailto: when it isn't. Designed to read as a quiet tertiary beside
 * the sidebar CTA — never compete with the primary "book a call"
 * action. The page-level share text is intentionally soft: users are
 * recommending a tool their friend might find useful, not forwarding a
 * personal briefing.
 */
function ShareWithFriend({ className }: { className?: string }) {
  function handleShare() {
    const shareUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
    const shareTitle = 'Real Wealth — The Wealth Conversation';
    const shareText =
      "I tried this 10-minute conversation with Real Wealth — it's a thoughtful way to see what might be worth a planner's time. Thought you'd find it useful.";

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator
        .share({ title: shareTitle, text: shareText, url: shareUrl })
        .catch(() => {
          /* user cancelled or share failed; no fallback needed */
        });
      return;
    }
    /* Fallback: open the user's mail client with a pre-filled message. */
    const subject = encodeURIComponent('A 10-minute conversation worth trying');
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleShare}
      aria-label="Recommend this to a friend"
    >
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        focusable="false"
        aria-hidden="true"
      >
        <path
          d="M11 2.5 L14 5.5 L11 8.5 M14 5.5 H6 C4.3 5.5 3 6.8 3 8.5 V13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Recommend to a friend</span>
    </button>
  );
}

/** Deliberately plain bar placeholder so the page renders end-to-end. */
function PlaceholderBars({ highlightIndex }: { highlightIndex: number }) {
  const heights = [40, 55, 65, 72, 80, 88];
  return (
    <div className={styles.bars}>
      {heights.map((h, i) => (
        <div
          key={i}
          className={`${styles.bar} ${i === highlightIndex ? styles.highlight : ''}`}
          style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
