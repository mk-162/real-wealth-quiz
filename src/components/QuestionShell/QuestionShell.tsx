/**
 * QuestionShell — the two-column layout for every questionnaire screen.
 *
 * On desktop: serif display stem + kicker + optional pullquote live on
 * the LEFT; the interaction panel (sliders, option grids, text input)
 * lives on the RIGHT inside a white card that floats above a paper
 * surface.
 *
 * On mobile: the columns stack — narrative first, then panel.
 *
 * Lifestyle imagery was removed in the consistency pass — it added ~280px
 * of scroll per screen on desktop (repeated beneath the panel on mobile)
 * without adding information the kicker + pullquote don't already carry.
 */
import type { ReactNode } from 'react';
import { SectionKicker } from '@/components/SectionKicker';
import styles from './QuestionShell.module.css';

export interface QuestionShellProps {
  /** The short uppercase-letter-spaced section marker, e.g. "STEP 04 — ASSETS". */
  kicker: string;
  /** The serif display-size question stem. */
  stem: string;
  /** A short italic pullquote below the stem. Optional. */
  pullquote?: string;
  /** Optional left-column extension — typically the section side-nav. */
  leftExtras?: ReactNode;
  /** The right-column panel content — sliders, option grids, etc. */
  children: ReactNode;
  /** Footer row (back / continue / reassurance tiles). */
  footer?: ReactNode;
  /**
   * Optional content that should appear under the left column on
   * desktop and fall to the foot of the screen on narrow viewports.
   * Used on the questionnaire to surface inline provocation cards
   * without breaking the question→panel flow. */
  aside?: ReactNode;
}

export function QuestionShell({
  kicker,
  stem,
  pullquote,
  leftExtras,
  children,
  footer,
  aside,
}: QuestionShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.grid}>
        <section className={styles.left} aria-label="Section context">
          <SectionKicker>{kicker}</SectionKicker>
          <h1 className={styles.stem}>{stem}</h1>
          {pullquote ? <p className={styles.pullquote}>{pullquote}</p> : null}
          {leftExtras ? <div className={styles.leftExtras}>{leftExtras}</div> : null}
          {/* Aside slot — rendered inside the left column so inline
              provocations sit directly under the pullquote. Previously
              this lived in a second grid row, which pushed it to the
              bottom of the page because row 1's height was stretched by
              the tall right-hand panel. */}
          {aside ? <aside className={styles.aside}>{aside}</aside> : null}
        </section>

        <section className={styles.right} aria-label="Answer">
          <div className={styles.panel}>{children}</div>
        </section>
      </div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
