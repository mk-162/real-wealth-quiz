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
