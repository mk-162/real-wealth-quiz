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

  /* The segment source of truth: a completed gate in the persisted
     session. A URL param can provide a demo/dev override. If neither
     is available we keep `segmentId` null and render a neutral
     "incomplete" summary further down rather than silently adopting
     S3's copy for every visitor. */
  const segmentId: string | null =
    derived.segmentId ?? params.get('segment') ?? null;
  const hasResolvedSegment = Boolean(segmentId);
  const urgency = derived.urgency ?? params.get('urgency');
  const adviceStatus = derived.adviceStatus ?? params.get('adviceStatus');
  const aspirationParam = derived.aspiration ?? params.get('aspiration') ?? '';
  const tier = (session?.tier ?? params.get('tier') ?? 'A') as string;
  /* Aspiration came from the user directly (Q2.4) rather than a
     fallback template — controls whether we render it in quote marks
     (only their own words get attributed). */
  const aspirationIsUserWritten = aspirationParam.trim().length > 0;

  /* Treat yes_but_looking (internal form value) and yes_looking
     (legacy overlay key) as the same high-intent state. */
  const isAdvisedLooking =
    adviceStatus === 'yes_but_looking' || adviceStatus === 'yes_looking';

  /* Internal segment passed to the resolvers — they require a string.
     When the real segment is unknown we fall back to S2 (mass-affluent
     mid-career) because that's the most generally applicable CTA
     shape; we still drive the user-facing copy off `hasResolvedSegment`
     below. */
  const resolverSegmentId = segmentId ?? 'S2';
  const inputs: SummaryInputs = useMemo(
    () =>
      buildSummaryInputs(session, resolverSegmentId, {
        urgency,
        currentAdviser: isAdvisedLooking ? 'yes_but_looking' : adviceStatus,
        happyPlace: aspirationIsUserWritten ? aspirationParam : null,
      }),
    [
      session,
      resolverSegmentId,
      urgency,
      adviceStatus,
      isAdvisedLooking,
      aspirationIsUserWritten,
      aspirationParam,
    ],
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

  const items = useMemo(
    () => buildConsideredList(resolverSegmentId, inputs),
    [resolverSegmentId, inputs],
  );
  const cta = useMemo(
    () => resolveCta(resolverSegmentId, urgency, isAdvisedLooking ? 'yes_looking' : adviceStatus),
    [resolverSegmentId, urgency, adviceStatus, isAdvisedLooking],
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
        ctaVariant: isAdvisedLooking
          ? `${resolverSegmentId}+advised_but_looking`
          : resolverSegmentId,
        ctaEnhanced: isAdvisedLooking,
      },
    };
    try {
      window.localStorage.setItem('real-wealth:conversation', JSON.stringify(record));
    } catch {
      /* quota exceeded — silently drop */
    }
  }, [
    session,
    emotionalIntro.id,
    spotlight,
    silentGaps,
    items,
    isAdvisedLooking,
    resolverSegmentId,
  ]);

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

  /* Graceful "incomplete" path — user landed on /summary without a
     resolved segment (skipped the gate, or hit the Dev-nav shortcut).
     Show a polite "finish the form first" nudge rather than silently
     rendering a made-up segment's copy. */
  if (!hasResolvedSegment) {
    return (
      <div className={styles.shell}>
        <SummaryHeader contactHref={contactHref} />
        <section className={styles.hero} aria-labelledby="incomplete-headline">
          <div className={styles.heroInner}>
            <h1 id="incomplete-headline" className={styles.heroHeadline}>
              There&rsquo;s a little more to fill in first.
            </h1>
            <p className={styles.heroFrame}>
              Your briefing is assembled from your answers — and we
              haven&rsquo;t got enough yet to shape it. Pick up the
              conversation where you left off and we&rsquo;ll bring you
              back here when it&rsquo;s ready.
            </p>
            <div className={styles.heroActions}>
              <Button
                onClick={() => {
                  window.location.href = '/conversation';
                }}
              >
                Continue the conversation
              </Button>
              <a
                className={styles.heroSecondary}
                href={contactHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Or get in touch first
              </a>
            </div>
          </div>
        </section>
        <StartOverFooter />
      </div>
    );
  }

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
              {aspirationIsUserWritten
                ? `\u201C${aspirationLine}\u201D`
                : aspirationLine}
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
            {primaryCtaHref ? (
              <Button
                onClick={() =>
                  window.open(primaryCtaHref, '_blank', 'noopener,noreferrer')
                }
              >
                {primaryCtaLabel}
              </Button>
            ) : (
              /* When no live booking link is configured the primary
                 action falls back to the contact form so the button
                 isn't silently inert. */
              <Button
                onClick={() =>
                  window.open(contactHref, '_blank', 'noopener,noreferrer')
                }
              >
                Get in touch
              </Button>
            )}
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

        {/* Sidebar column — compact "share with a friend" tertiary
            action only. The full book-a-call CTA used to live here too,
            but it duplicated the action-ladder further down and made
            the page feel pushy. The primary CTA is already in the hero
            and again at the end of the page (action ladder) where it
            resolves the emotional arc. */}
        <aside className={styles.ctaSidebar} aria-label="Share this briefing">
          <ShareWithFriend />
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
            /* Segment-specific helper — each segment's content file
               provides a "Helper" line. Previously the ladder hard-coded
               a generic string which meant S2/S4/S5/S7's personal touch
               ("We'll hold a slot this week and next.") never rendered
               and the relevant Playwright assertions failed. */
            helper={cta.helper}
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
 * ShareWithFriend — a small "recommend this" widget that sits below
 * the sidebar CTA. Explains what the friend will experience (so the
 * share doesn't feel like a cold link-drop), then the primary action
 * is a single "Share link" button.
 *
 * Share strategy (graceful fallback chain):
 *   1. `navigator.share()` — native share sheet on mobile + most
 *      modern desktops; best experience.
 *   2. Clipboard copy — on desktops without Web Share, we copy the
 *      URL and swap the button label to "Link copied" briefly. The
 *      user can paste it anywhere (WhatsApp, email, Slack) on their
 *      own terms.
 *   3. mailto: — last-ditch fallback if both above throw. Rare.
 *
 * The widget is deliberately quieter than the sidebar's primary
 * booking card above it: softer surface, smaller headline, a single
 * outline button. It should feel like a thoughtful P.S., not a
 * second competing call-to-action.
 */
function ShareWithFriend() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
    const shareTitle = 'Real Wealth — The Wealth Conversation';
    const shareText =
      "A 10-minute conversation I thought you'd find useful. No numbers, no forms — just a thoughtful run through what's worth a planner's time. Real Wealth send you your own briefing at the end.";

    /* Preferred: native share sheet. */
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        /* User cancelled, or share not permitted — fall through to
           copy so the action never feels inert. */
      }
    }

    /* Fallback: copy the URL and show a brief confirmation. */
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2400);
        return;
      } catch {
        /* Clipboard unavailable (older browsers, insecure context) —
           drop to mailto. */
      }
    }

    /* Last resort: pre-filled mail client. */
    const subject = encodeURIComponent('A 10-minute conversation worth trying');
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <section className={styles.shareCard} aria-label="Share with a friend">
      <h3 className={styles.shareHeadline}>
        Know someone who&rsquo;d find this useful?
      </h3>
      <p className={styles.shareBody}>
        Send them the link. It&rsquo;s a 10-minute conversation — no forms,
        no numbers — and they&rsquo;ll get the same kind of briefing we just
        put together for you.
      </p>
      <button
        type="button"
        className={styles.shareButton}
        onClick={handleShare}
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
        <span aria-live="polite">{copied ? 'Link copied' : 'Share link'}</span>
      </button>
    </section>
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
