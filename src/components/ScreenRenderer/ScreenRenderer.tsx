'use client';

/**
 * ScreenRenderer — renders any Screen from the content catalogue by
 * dispatching on its layout type (intro / centred / asymmetric) and its
 * inputs.
 *
 * Every content layout (centred + asymmetric) now routes through the
 * single QuestionShell — the two diverged in the past (centred had its
 * own panel/headline, asymmetric had a two-column shell with lifestyle
 * image) which made each question feel like its own design. One shell
 * now means one stem style, one panel, one kicker, one action row.
 *
 * The `transition` layout is kept as a type so old content files still
 * parse, but the engine already filters transition screens out of the
 * flow (engine.ts:171); we render nothing rather than the old full-bleed
 * interstitial.
 */


import { useCallback, useRef, type ReactNode } from 'react';
import type { Input, Screen } from '../../../content/schema';
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
  /**
   * Optional content rendered under the left column of QuestionShell on
   * desktop, and beneath the panel on narrow viewports. Used for inline
   * provocation cards so the two-column grid reclaims the whitespace on
   * the left. */
  aside?: ReactNode;
}

export function ScreenRenderer(props: ScreenRendererProps) {
  const { screen } = props;

  switch (screen.layout) {
    case 'intro':
      return <IntroLayout {...props} />;
    case 'transition':
      /* Interstitials are filtered out by the engine; render nothing in
         the unlikely case one reaches this component. */
      return null;
    case 'centred':
    case 'asymmetric':
    default:
      return <QuestionLayout {...props} />;
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
/* Question layout — the single shell used for every question screen  */
/* regardless of whether the content file declares centred or         */
/* asymmetric. Kicker + stem + optional pullquote on the left;        */
/* inputs + ActionRow inside a single panel on the right.             */
/* ================================================================ */

function QuestionLayout(props: ScreenRendererProps) {
  const { screen, answers, onAnswer, aside } = props;
  const section = sectionMeta(screen.section as never);

  /* Refs for each input slot + the action row. After the user picks an
     answer for a discrete-pick control (card_select / radio / pair_picker
     / likert_5) we smoothly scroll to the next visible slot — or to the
     action row when this was the last. Multi-select and sliders/currency
     are deliberately excluded: they don't have a single "I'm done" moment.

     prefers-reduced-motion is respected via scroll-behavior CSS, but we
     also skip the scroll entirely for users who set it. */
  const slotRefs = useRef(new Map<string, HTMLDivElement | null>());
  const actionsRef = useRef<HTMLDivElement | null>(null);

  const isAutoAdvanceControl = (input: Input | undefined): boolean => {
    if (!input) return false;
    return (
      input.control === 'card_select' ||
      input.control === 'radio' ||
      input.control === 'pair_picker' ||
      input.control === 'likert_5'
    );
  };

  const scrollNextInto = useCallback(
    (answeredId: string, visibleIds: readonly string[]) => {
      if (typeof window === 'undefined') return;
      const reduce = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (reduce) return;
      const idx = visibleIds.indexOf(answeredId);
      if (idx === -1) return;
      const nextId = visibleIds[idx + 1];
      const target =
        (nextId ? slotRefs.current.get(nextId) : null) ?? actionsRef.current;
      if (!target) return;
      /* Wait one frame so SlideSwap / conditional reveals have a chance
         to mount before we measure their position. */
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [],
  );

  const kicker = section?.kicker ?? `STEP ${screen.screen_number}`;
  /*
   * Pullquote resolution — three-level priority chain:
   *   1. screen.pullquote is a non-empty string  → use it (per-screen override)
   *   2. screen.pullquote is ""                  → suppress (empty string = no quote,
   *                                                even when the section has one)
   *   3. screen.pullquote is undefined           → fall back to section default,
   *                                                then screen.sub as last resort
   *
   * The `|| undefined` coercion on the truthy branch converts an explicit empty
   * string to undefined so QuestionShell renders nothing rather than a blank <p>.
   */
  const pullquote: string | undefined =
    screen.pullquote !== undefined
      ? screen.pullquote || undefined
      : section?.pullquote ?? screen.sub;
  /* Grouped asymmetric screens historically used screen.title as the
     stem (the section-level line) when headline was absent. Preserve
     that fallback. */
  const stem = screen.headline ?? screen.title;

  return (
    <QuestionShell
      kicker={kicker}
      stem={stem}
      pullquote={pullquote}
      aside={aside}
    >
      {screen.sub && screen.sub !== pullquote ? (
        <p className={styles.panelSub}>{screen.sub}</p>
      ) : null}

      {(() => {
        const inputs = screen.inputs ?? [];
        const visibleIds = inputs
          .filter((i) => shouldShowInput(i, inputs, answers))
          .map((i) => i.id);
        const lastVisibleId = visibleIds[visibleIds.length - 1];
        return inputs.map((input) => {
          const visible = shouldShowInput(input, inputs, answers);
          const isConditional = isConditionalInput(input, inputs);
          const isLastVisible = input.id === lastVisibleId;
          const handleChange = (v: unknown) => {
            onAnswer(input.id, v);
            /* Auto-scroll rules:
               - Mid-screen on a discrete-pick control → next slot.
               - On the LAST visible input, scroll the action row into
                 view for any pick-style interaction (including
                 multi_select) so Continue is reachable without manual
                 scrolling. Sliders / currency / text are still excluded
                 because their onChange fires continuously while the user
                 is still entering a value. */
            const isPickControl =
              isAutoAdvanceControl(input) || input.control === 'multi_select';
            if (isLastVisible && isPickControl) {
              scrollNextInto(input.id, visibleIds);
            } else if (isAutoAdvanceControl(input)) {
              scrollNextInto(input.id, visibleIds);
            }
          };
          const rendered = visible ? (
            <InputRenderer
              input={input}
              value={answers[input.id]}
              onChange={handleChange}
            />
          ) : null;
          return (
            <div
              key={input.id}
              className={styles.inputSlot}
              ref={(el) => {
                slotRefs.current.set(input.id, el);
              }}
            >
              {isConditional ? (
                <SlideSwap swapKey={visible ? 'shown' : 'hidden'}>{rendered}</SlideSwap>
              ) : (
                rendered
              )}
            </div>
          );
        });
      })()}

      <div ref={actionsRef}>
        <ActionRow {...props} />
      </div>
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
/* Action row — Why we ask / Back / Continue. Exported so the         */
/* awareness-check wrapper in conversation/page.tsx can share it      */
/* instead of rebuilding its own row.                                 */
/* ================================================================ */

export interface ActionRowProps {
  /** The current Screen — used to pick the conditional_logic line for WhyAsk. */
  screen?: Pick<Screen, 'conditional_logic'> | null;
  onNext: () => void;
  onBack: () => void;
  isFirst?: boolean;
  canAdvance: boolean;
  continueLabel?: string;
  /** Override for the WhyAsk body when there's no screen to read from. */
  why?: string;
}

export function ActionRow({
  screen,
  onNext,
  onBack,
  isFirst,
  canAdvance,
  continueLabel,
  why,
}: ActionRowProps) {
  /* Pick a conditional_logic line for WhyAsk if the screen has one.
     Otherwise fall back to a generic one. */
  const whyText = why ??
    screen?.conditional_logic ??
    'Your answer shapes the rest of the conversation — we ask because it changes what a planner would talk about.';

  return (
    <div className={styles.actions}>
      <div className={styles.actionsLeft}>
        <WhyAskToggle>{whyText}</WhyAskToggle>
      </div>
      <div className={styles.actionsRight}>
        <Button variant="text" onClick={onBack} disabled={!!isFirst}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canAdvance}>
          {continueLabel ?? 'Continue →'}
        </Button>
      </div>
    </div>
  );
}

/** Convenience wrapper so ScreenRenderer can be a top-level default export too. */
export default ScreenRenderer;

/* Not strictly needed, but keeps TS happy if we re-export. */
export type { ReactNode };
