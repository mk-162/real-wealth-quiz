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

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScreenRenderer } from '@/components/ScreenRenderer';
import { ProgressBar } from '@/components/ProgressBar';
import { Logo } from '@/components/Logo';
import { SlideSwap } from '@/components/SlideSwap';
import { Button } from '@/components/Button';
import { AwarenessCheck } from '@/components/AwarenessCheck';
import { ProvocationCard } from '@/components/ProvocationCard';
import { sectionMeta } from '@/lib/sections';
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
    currentScreen,
    answers,
    segmentId,
    progress,
    isFirst,
    isLast,
    canCompleteFlow,
    canAdvance,
    inlineProvocations,
    firedAwareness,
  } = engine;

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
     - On a content screen, show that screen's section with its step number.
     - On an awareness screen, show a neutral "Insight" chip with no step
       number so the user isn't given the impression of a step regression
       (e.g. a pension-related awareness interrupt while still inside the
       "Your life" section reading "02 Your life"). */
  const isAwareness = active.kind === 'awareness';
  const screenForChrome = active.kind === 'content' ? active.screen : currentScreen;
  const section = screenForChrome
    ? sectionMeta(screenForChrome.section as never)
    : null;
  const sectionNumber = section?.step ?? 1;

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

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headLeft}>
          <Logo tone="ink" />
        </div>
        <div className={styles.headRight}>
          <SlideSwap
            swapKey={isAwareness ? 'awareness' : section?.id ?? 'none'}
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
                  {section?.label ?? 'Conversation'}
                </span>
              </span>
            )}
          </SlideSwap>
          <span className={styles.progressLabel}>
            {process.env.NODE_ENV === 'production'
              ? `${Math.round(progress * 100)}%`
              : `${tierParam} · ${Math.round(progress * 100)}%${segmentId ? ` · ${segmentId}` : ''}`}
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
            stem={active.check.stem}
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
            continueLabel={isLast ? 'Continue to details →' : 'Continue →'}
            aside={
              inlineProvocations.length > 0 ? (
                <div className={styles.inlineProv}>
                  {inlineProvocations.map((p) => (
                    <ProvocationCard
                      key={p.id}
                      headline={p.headline}
                      body={p.body}
                      closing={p.close}
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
/* Awareness virtual screen                                          */
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
    <section style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
      <AwarenessCheck
        topic={stem}
        value={level}
        onChange={onChange}
        body={body}
        complianceTag={complianceTag}
      />
      <div
        className={styles.actions}
        style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '0 var(--space-md)' }}
      >
        <div className={styles.actionsLeft} />
        <div className={styles.actionsRight}>
          <Button variant="text" onClick={onBack}>
            ← Back
          </Button>
          <Button onClick={onNext} disabled={!canAdvance}>
            Continue →
          </Button>
        </div>
      </div>
    </section>
  );
}

function awarenessBodyFor(
  check: { aware_body: string; partial_body: string; unaware_body: string },
  level: 'aware' | 'partial' | 'unaware' | undefined,
): string | undefined {
  if (!level) return undefined;
  if (level === 'aware') return check.aware_body;
  if (level === 'partial') return check.partial_body;
  return check.unaware_body;
}
