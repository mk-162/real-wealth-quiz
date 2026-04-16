/**
 * Summary / results page — aspiration echo, considered list, illustrative
 * charts, segment-specific CTA, FCA footer. Never gives advice.
 *
 * Reads URL params for demo purposes (since the engine's runtime state
 * doesn't yet persist across route changes):
 *
 *   ?segment=S3                     — assigned segment id
 *   ?urgency=this_week              — optional urgency overlay
 *   ?adviceStatus=yes_looking       — optional advised-but-looking overlay
 *   ?aspiration=<text>              — user's Q2.4 answer
 */
'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AspirationEcho } from '@/components/AspirationEcho';
import { FinalCTA } from '@/components/FinalCTA';
import { IllustrativeChart } from '@/components/IllustrativeChart';
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

  /* --- Copy sourced from content/pages/summary.md ------------------ */
  const listKicker = pageValue<string>(
    'summary',
    'considered_list.section_heading',
    'THINGS WORTH A CONVERSATION',
  );
  const listIntro = pageValue<string>(
    'summary',
    'considered_list.intro',
    'From your answers, these are worth a conversation.',
  );
  const listFinal = pageValue<string>(
    'summary',
    'considered_list.final_line',
    "We'll save this list against your name. If you book a call, we'll bring it to the conversation so you don't have to.",
  );

  const chartsKicker = pageValue<string>('summary', 'charts.section_heading', 'THE SHAPE OF IT');
  const chartsIntro = pageValue<string>(
    'summary',
    'charts.intro',
    "Not your numbers — nobody's numbers. The shape of the question.",
  );
  const chartsDisclaimer = pageValue<string>(
    'summary',
    'charts.disclaimer',
    'These are not projections of your personal numbers.',
  );

  const aspirationCaption = pageValue<string>(
    'summary',
    'aspiration_echo.caption',
    '— in your words, gently rephrased.',
  );

  /* Aspiration echo — user-written line, else a template fallback. */
  const fallbackLine = pageValue<string>(
    'summary',
    'aspiration_echo.fallback_templates.freedom_time',
    "The life you're planning for.",
  );
  const aspirationLine = aspirationParam.trim().length > 0 ? aspirationParam : fallbackLine;

  const cta = useMemo(() => resolveCta(segmentId, urgency, adviceStatus), [
    segmentId,
    urgency,
    adviceStatus,
  ]);
  const items = useMemo(() => buildConsideredList(segmentId), [segmentId]);

  return (
    <div className={styles.shell}>
      <div className={styles.heroOverlay}>
        <AspirationEcho line={aspirationLine} caption={aspirationCaption} />
      </div>

      <section className={styles.list} aria-labelledby="considered">
        <span className={styles.listKicker}>{listKicker}</span>
        <h2 id="considered">{listIntro}</h2>
        <ul className={styles.items}>
          {items.map((item) => (
            <li
              key={item.id}
              className={styles.item}
              data-compliance={item.compliance}
            >
              <span aria-hidden="true" className={styles.chev}>
                ›
              </span>
              <span className={styles.itemBody}>
                <span className={styles.itemEyebrow}>{item.category}</span>
                <span className={styles.itemHeadline}>{item.headline}</span>
                <span className={styles.itemText}>{item.body}</span>
                {item.close ? (
                  <span className={styles.itemClose}>{item.close}</span>
                ) : null}
                {item.compliance === 'draft' ? (
                  <span className={styles.draftTag}>DRAFT — pending compliance</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.listFinal}>{listFinal}</p>
      </section>

      <section className={styles.charts} aria-labelledby="illustrative">
        <div className={styles.chartsInner}>
          <span className={styles.chartsKicker}>{chartsKicker}</span>
          <p id="illustrative" className={styles.chartsIntro}>
            {chartsIntro}
          </p>
          <div className={styles.chartGrid}>
            <IllustrativeChart
              title="How IHT can bite above £2m"
              assumptions="£2.5m estate, married couple, RNRB in full."
            >
              <PlaceholderBars highlightIndex={4} />
            </IllustrativeChart>
            <IllustrativeChart
              title="0.6% in fees over 20 years"
              assumptions="£500k invested, 5% gross return, 0.3% vs 0.9% total fees."
            >
              <PlaceholderBars highlightIndex={1} />
            </IllustrativeChart>
            <IllustrativeChart
              title="How extraction mix changes the tax bill"
              assumptions="£100k drawn, salary-only vs salary + dividend + pension."
            >
              <PlaceholderBars highlightIndex={2} />
            </IllustrativeChart>
          </div>
          <p className={styles.chartsDisclaimer}>{chartsDisclaimer}</p>
        </div>
      </section>

      <FinalCTA
        headline={cta.headline}
        body={cta.body}
        button={cta.button}
        buttonHref={cta.button_link}
        helper={cta.helper}
        preamble={cta.preamble}
      />

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
}

function buildConsideredList(segmentId: string): ListItem[] {
  /* Provocations whose `segments` array includes `'all'` or the assigned id. */
  const segmentProvocations = provocationCatalogue.filter(
    (p) => p.segments.includes('all') || p.segments.includes(segmentId),
  );

  /* Core awareness checks, ranked. */
  const coreAwareness = [...awarenessCatalogue]
    .filter((a) => a.core)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  const awarenessItems: ListItem[] = coreAwareness.slice(0, 4).map((a) => ({
    id: a.id,
    category: categoryFromId(a.id),
    headline: trimToTenWords(a.stem),
    body: a.partial_body,
    close: 'Worth a conversation.',
    compliance: 'ok',
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
  return deduped.slice(0, 6);
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
