/**
 * Questionnaire — drives the real flow from the content catalogue.
 *
 * The ScreenRenderer renders the active screen, dispatching on its layout.
 * The useQuestionnaireEngine hook walks the screens, applies the tier filter,
 * runs segmentation after the five gating answers, and applies the S6
 * two-stage upgrade when Q5.3 is answered later.
 *
 * In addition to "real" content screens the engine may surface virtual
 * awareness-check screens (a discriminated union on `engine.active`). Those
 * render via the AwarenessCheck component instead of the regular
 * ScreenRenderer; provocations whose triggers fire on the active content
 * screen render inline beneath the inputs.
 */
'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScreenRenderer, ActionRow } from '@/components/ScreenRenderer';
import { Logo } from '@/components/Logo';
import { SlideSwap } from '@/components/SlideSwap';
import { QuestionShell } from '@/components/QuestionShell';
import { AwarenessCheck } from '@/components/AwarenessCheck';
import { ProvocationCard } from '@/components/ProvocationCard';
import { useQuestionnaireEngine, type TierSlug } from '@/lib/questionnaire';
import styles from './page.module.css';

export default function QuestionnairePage() {
  return (
    <Suspense fallback={null}>
      <Questionnaire />
    </Suspense>
  );
}

function Questionnaire() {
  const router = useRouter();
  const params = useSearchParams();
  const tierParam = (params.get('tier') as TierSlug | null) ?? 'standard';

  const engine = useQuestionnaireEngine(tierParam);
  const {
    active,
    answers,
    segmentId,
    progress,
    isFirst,
    isLast,
    canCompleteFlow,
    canAdvance,
    chipMeta,
    inlineProvocations,
    firedAwareness,
  } = engine;

  /* Browser-back integration — pushes a sentinel history entry on mount so
     pressing the device back button steps backward through the questionnaire
     rather than navigating away. The sentinel is re-armed after each step;
     if the user is on question 1, the next back press exits to the prior page. */
  const engineRef = useRef(engine);
  useEffect(() => {
    engineRef.current = engine;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SENTINEL = { __wc_back_sentinel: true };
    try {
      window.history.pushState(SENTINEL, '');
    } catch {
      /* Some embeddings (iframes with strict sandbox) disallow
         pushState — fail open rather than crash the page. */
      return;
    }
    const onPopState = (e: PopStateEvent) => {
      const state = e.state as { __wc_back_sentinel?: boolean } | null;
      // Case (a): user returned from /conversation/details — sentinel
      // is the new top. Leave engine untouched.
      if (state && state.__wc_back_sentinel) return;
      // Case (b): sentinel was popped. Step back in-flow if we can.
      const eng = engineRef.current;
      if (!eng.isFirst && eng.active) {
        eng.back();
        try {
          window.history.pushState(SENTINEL, '');
        } catch {
          /* ignore */
        }
      }
      // If isFirst, we let the browser keep going back to the prior
      // page (homepage or wherever they came from).
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (!active) {
    return (
      <div className={styles.shell}>
        <p style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          Nothing to ask — the conversation is complete.
        </p>
      </div>
    );
  }

  /* Chrome (section chip) behaviour:
     - On a content screen, show the engine's running-max chipMeta. This
       prevents a lower-numbered section label from appearing after the
       user has already passed through a higher-numbered one (e.g. the
       "Happy place" screen is tagged `life_shape` but appears after the
       `assets` block — without the running max the chip would regress
       from "04 Assets" back to "02 Your life").
     - On an awareness screen, show a neutral "Insight" chip with no step
       number so the user isn't given the impression of a step regression. */
  const isAwareness = active.kind === 'awareness';
  const sectionNumber = chipMeta?.step ?? 1;
  const sectionLabel = chipMeta?.label ?? 'Conversation';

  const handleNext = () => {
    /* Route to the details page only when the user is on the last
       visible content screen AND the gate is complete. `canCompleteFlow`
       guards against the "jumps straight to final step" bug — when
       segmentation shrinks `visibleScreens` mid-flow the user could find
       themselves positionally on the last screen without having
       answered every gate question; routing in that case would jump
       them to /details before the flow was really done. */
    if (active.kind === 'content' && isLast && canCompleteFlow) {
      router.push('/conversation/details');
      return;
    }
    engine.next();
  };

  const activeKey =
    active.kind === 'awareness' ? `awareness:${active.check.id}` : active.screen.id;

  /* Dev-only: what question/screen are we on? Prefer q_refs (e.g. "Q2.1,
     Q2.2") since those are the labels used in the segmentation matrix and
     in most conversations with the client. Fall back to the screen id for
     intro / transition-style screens that have no q_refs, and to the
     awareness check id on virtual awareness screens. */
  const debugScreenLabel =
    active.kind === 'awareness'
      ? `aware:${active.check.id}`
      : (active.screen.q_refs && active.screen.q_refs.length > 0
          ? active.screen.q_refs.join(',')
          : active.screen.id);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headLeft}>
          <Logo tone="ink" />
        </div>
        <div className={styles.headRight}>
          <SlideSwap
            swapKey={isAwareness ? 'awareness' : `chip:${sectionNumber}`}
          >
            {isAwareness ? (
              <span
                className={styles.sectionChip}
                data-kind="insight"
                aria-label="Insight — interstitial"
              >
                <span className={styles.sectionLabel}>Insight</span>
              </span>
            ) : (
              <span className={styles.sectionChip} aria-label="Current section">
                <span className={styles.sectionNum}>
                  {String(sectionNumber).padStart(2, '0')}
                </span>
                <span className={styles.sectionLabel}>
                  {sectionLabel}
                </span>
              </span>
            )}
          </SlideSwap>
          <span className={styles.progressLabel}>
            {process.env.NODE_ENV === 'production'
              ? `${Math.round(progress * 100)}%`
              : `${tierParam} · ${debugScreenLabel} · ${segmentId ?? '—'}`}
          </span>
        </div>
      </header>
      {/* ProgressBar intentionally not rendered — the live realwealth.co.uk
          header has no coloured strip under it, and the teal-tinted track
          read as a distracting green bar against the new pure-white header.
          The numeric progress % in the header chip still provides the
          signal to the user. */}

      <SlideSwap swapKey={activeKey}>
        {active.kind === 'awareness' ? (
          <AwarenessScreen
            checkId={active.check.id}
            stem={active.check.headline}
            level={firedAwareness[active.check.id]}
            body={awarenessBodyFor(active.check, firedAwareness[active.check.id])}
            complianceTag={
              process.env.NODE_ENV !== 'production' &&
              active.check.compliance_status !== 'approved_to_ship'
                ? active.check.compliance_status
                : null
            }
            onChange={(level) => engine.answerAwareness(active.check.id, level)}
            onBack={engine.back}
            onNext={handleNext}
            canAdvance={canAdvance}
          />
        ) : (
          <ScreenRenderer
            screen={active.screen}
            answers={answers}
            onAnswer={engine.answer}
            onNext={handleNext}
            onBack={engine.back}
            isFirst={isFirst}
            isLast={isLast}
            canAdvance={canAdvance}
            continueLabel={'Continue →'}
            aside={
              inlineProvocations.length > 0 ? (
                <div className={styles.inlineProv}>
                  {inlineProvocations.map((p) => (
                    <ProvocationCard
                      key={p.id}
                      headline={p.headline}
                      body={p.body}
                      closing={p.cta}
                      complianceTag={
                        process.env.NODE_ENV !== 'production' &&
                        p.compliance_status !== 'approved_to_ship'
                          ? p.compliance_status
                          : null
                      }
                    />
                  ))}
                </div>
              ) : null
            }
          />
        )}
      </SlideSwap>
    </div>
  );
}

/* ================================================================ */
/* Awareness virtual screen — routes through the same QuestionShell   */
/* + ActionRow that every content screen uses so the user doesn't     */
/* feel a visual jump when an awareness interrupt fires.              */
/* ================================================================ */

interface AwarenessScreenProps {
  checkId: string;
  stem: string;
  body?: string;
  level?: 'aware' | 'partial' | 'unaware';
  complianceTag: string | null;
  onChange: (level: 'aware' | 'partial' | 'unaware') => void;
  onBack: () => void;
  onNext: () => void;
  canAdvance: boolean;
}

function AwarenessScreen({
  stem,
  body,
  level,
  complianceTag,
  onChange,
  onBack,
  onNext,
  canAdvance,
}: AwarenessScreenProps) {
  return (
    <QuestionShell kicker="Insight" stem={stem}>
      <AwarenessCheck
        value={level}
        onChange={onChange}
        body={body}
        complianceTag={complianceTag}
      />
      <ActionRow
        screen={null}
        onBack={onBack}
        onNext={onNext}
        canAdvance={canAdvance}
        why="We tune the next part of the conversation based on how familiar this idea already is — honest answers are the useful ones."
      />
    </QuestionShell>
  );
}

function awarenessBodyFor(
  check: { body_aware: string; body_partial: string; body_unaware: string },
  level: 'aware' | 'partial' | 'unaware' | undefined,
): string | undefined {
  if (!level) return undefined;
  if (level === 'aware') return check.body_aware;
  if (level === 'partial') return check.body_partial;
  return check.body_unaware;
}
