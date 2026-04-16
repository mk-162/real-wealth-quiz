/**
 * ScreenRenderer — renders any Screen from the content catalogue by
 * dispatching on its layout type (intro / transition / centred / asymmetric)
 * and its inputs.
 *
 * Keeps the layout decisions out of the page component and out of the engine.
 * The page component renders the sticky header and progress bar; this
 * component renders the stem + panel + inputs + reassurance strip.
 */
'use client';

import type { ReactNode } from 'react';
import type { Screen } from '../../../content/schema';
import { Button } from '@/components/Button';
import { QuestionShell } from '@/components/QuestionShell';
import { WhyAskToggle } from '@/components/WhyAskToggle';
import { SectionKicker } from '@/components/SectionKicker';
import { SlideSwap } from '@/components/SlideSwap';
import { sectionMeta } from '@/lib/sections';
import { shouldShowInput } from '@/lib/questionnaire/visibility';
import { InputRenderer } from './InputRenderer';
import styles from './ScreenRenderer.module.css';

export interface ScreenRendererProps {
  screen: Screen;
  answers: Record<string, unknown>;
  onAnswer: (inputId: string, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  canAdvance: boolean;
  /** Text shown inside the Continue button. */
  continueLabel?: string;
}

export function ScreenRenderer(props: ScreenRendererProps) {
  const { screen } = props;

  switch (screen.layout) {
    case 'intro':
      return <IntroLayout {...props} />;
    case 'transition':
      return <TransitionLayout {...props} />;
    case 'centred':
      return <CentredLayout {...props} />;
    case 'asymmetric':
    default:
      return <AsymmetricLayout {...props} />;
  }
}

/* ================================================================ */
/* Intro layout — single centred column with a big CTA.               */
/* ================================================================ */

function IntroLayout({ screen, onNext }: ScreenRendererProps) {
  return (
    <section className={styles.intro}>
      <div className={styles.introInner}>
        <SectionKicker>Before we start</SectionKicker>
        {screen.headline ? (
          <h1 className={styles.introHeadline}>{screen.headline}</h1>
        ) : null}
        {screen.sub ? <p className={styles.introSub}>{screen.sub}</p> : null}
        <Button onClick={onNext}>Begin →</Button>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Transition layout — full-bleed teal; auto-advances.                */
/* ================================================================ */

function TransitionLayout({ screen, onNext }: ScreenRendererProps) {
  return (
    <section
      className={styles.transition}
      onClick={onNext}
      role="status"
      aria-live="polite"
    >
      <div className={styles.transitionInner}>
        <p className={styles.transitionKicker}>{screen.title}</p>
        <p className={styles.transitionBody}>{screen.body ?? 'Continuing…'}</p>
        <Button variant="outline-on-dark" onClick={onNext}>
          Continue →
        </Button>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Centred layout — single column, all inputs below the stem.         */
/* ================================================================ */

function CentredLayout(props: ScreenRendererProps) {
  const { screen, answers, onAnswer } = props;
  const inputs = screen.inputs ?? [];
  return (
    <div className={styles.centred}>
      <div className={styles.centredHead}>
        {screen.headline ? <h1 className={styles.centredHeadline}>{screen.headline}</h1> : null}
        {screen.sub ? <p className={styles.centredSub}>{screen.sub}</p> : null}
      </div>

      <div className={styles.centredPanel}>
        {inputs.map((input) => {
          const visible = shouldShowInput(input, inputs, answers);
          const isConditional = isConditionalInput(input, inputs);
          const rendered = visible ? (
            <InputRenderer
              input={input}
              value={answers[input.id]}
              onChange={(v) => onAnswer(input.id, v)}
            />
          ) : null;
          return (
            <div key={input.id} className={styles.inputSlot}>
              {isConditional ? (
                <SlideSwap swapKey={visible ? 'shown' : 'hidden'}>{rendered}</SlideSwap>
              ) : (
                rendered
              )}
            </div>
          );
        })}
        <ActionRow {...props} />
      </div>
    </div>
  );
}

/* ================================================================ */
/* Asymmetric layout — two-column with lifestyle image left.          */
/* ================================================================ */

function AsymmetricLayout(props: ScreenRendererProps) {
  const { screen, answers, onAnswer } = props;
  const section = sectionMeta(screen.section as never);

  const imageSrc =
    section?.image ??
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80';
  const imageAlt = screen.image_direction ?? '';
  const kicker = section?.kicker ?? `STEP ${screen.screen_number}`;
  const pullquote = section?.pullquote;

  /* The grouped-screen title sits inside the panel for two-column screens,
     so the stem on the left column is the section-level line, not the card
     headline. If we don't have a section pullquote, fall back to the sub. */
  const stem = screen.headline ?? screen.title;

  return (
    /* Reassurance copy ("Your answers stay with you" / "A real planner
       reads every answer") was previously rendered here as a tile strip
       beneath every question. It now lives in the global FCAFooter so
       the form itself stays focused on the next action. */
    <QuestionShell
      kicker={kicker}
      stem={stem}
      pullquote={pullquote ?? screen.sub}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
    >
      {screen.sub && screen.sub !== pullquote ? (
        <p className={styles.panelSub}>{screen.sub}</p>
      ) : null}

      {(() => {
        const inputs = screen.inputs ?? [];
        return inputs.map((input) => {
          const visible = shouldShowInput(input, inputs, answers);
          const isConditional = isConditionalInput(input, inputs);
          const rendered = visible ? (
            <InputRenderer
              input={input}
              value={answers[input.id]}
              onChange={(v) => onAnswer(input.id, v)}
            />
          ) : null;
          return (
            <div key={input.id} className={styles.inputSlot}>
              {isConditional ? (
                <SlideSwap swapKey={visible ? 'shown' : 'hidden'}>{rendered}</SlideSwap>
              ) : (
                rendered
              )}
            </div>
          );
        });
      })()}

      <ActionRow {...props} />
    </QuestionShell>
  );
}

/* Helper: is this input referenced by any conditional-reveal rule? */
function isConditionalInput(
  input: { id: string; conditional_reveal?: string; options?: readonly unknown[] },
  allInputs: readonly { id: string; options?: readonly unknown[] }[],
): boolean {
  if (input.conditional_reveal) return true;
  for (const other of allInputs) {
    if (other.id === input.id) continue;
    const opts = (other.options ?? []) as Array<{ conditional_reveal?: string }>;
    if (opts.some((o) => o && typeof o.conditional_reveal === 'string' && o.conditional_reveal.trim() === input.id)) {
      return true;
    }
  }
  return false;
}

/* ================================================================ */
/* Action row — Why we ask / Back / Continue. Consistent across       */
/* centred and asymmetric layouts.                                    */
/* ================================================================ */

function ActionRow({
  screen,
  onNext,
  onBack,
  isFirst,
  isLast,
  canAdvance,
  continueLabel,
}: ScreenRendererProps) {
  /* Pick a conditional_logic line for WhyAsk if the screen has one.
     Otherwise fall back to a generic one based on the section. */
  const why = screen.conditional_logic ??
    'Your answer shapes the rest of the conversation — we ask because it changes what a planner would talk about.';

  return (
    <div className={styles.actions}>
      <div className={styles.actionsLeft}>
        <WhyAskToggle>{why}</WhyAskToggle>
      </div>
      <div className={styles.actionsRight}>
        <Button variant="text" onClick={onBack} disabled={isFirst}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canAdvance}>
          {continueLabel ?? (isLast ? 'Continue to details →' : 'Continue →')}
        </Button>
      </div>
    </div>
  );
}

/** Convenience wrapper so ScreenRenderer can be a top-level default export too. */
export default ScreenRenderer;

/* Not strictly needed, but keeps TS happy if we re-export. */
export type { ReactNode };
