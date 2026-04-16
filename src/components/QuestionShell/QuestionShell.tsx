/**
 * QuestionShell — the two-column layout for every questionnaire screen.
 *
 * On desktop: serif display stem + kicker + optional pullquote + lifestyle image
 * live on the LEFT; the interaction panel (sliders, option grids, text input)
 * lives on the RIGHT inside a white card that floats above a paper surface.
 *
 * On mobile: the columns stack — narrative first, then panel — and the image
 * is hidden to keep the scroll tight.
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
  /** A lifestyle image shown below the text on the left column. */
  imageSrc?: string;
  imageAlt?: string;
  /** Optional left-column extension — typically the section side-nav. */
  leftExtras?: ReactNode;
  /** The right-column panel content — sliders, option grids, etc. */
  children: ReactNode;
  /** Footer row (back / continue / reassurance tiles). */
  footer?: ReactNode;
  /**
   * Optional content that should appear under the left column on
   * desktop (below the image) and fall to the foot of the screen on
   * narrow viewports. Used on the questionnaire to surface inline
   * provocation cards without breaking the question→panel flow. */
  aside?: ReactNode;
}

export function QuestionShell({
  kicker,
  stem,
  pullquote,
  imageSrc,
  imageAlt = '',
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
          {imageSrc ? (
            <figure className={styles.figure}>
              <img src={imageSrc} alt={imageAlt} loading="lazy" className={styles.img} />
            </figure>
          ) : null}
          {leftExtras ? <div className={styles.leftExtras}>{leftExtras}</div> : null}
        </section>

        <section className={styles.right} aria-label="Answer">
          <div className={styles.panel}>{children}</div>
          {/* Mobile-only image below the panel — a quiet visual rest.
              Desktop hides this via CSS and shows the one in the left column. */}
          {imageSrc ? (
            <figure className={styles.figureBelow} aria-hidden="true">
              <img src={imageSrc} alt="" loading="lazy" />
            </figure>
          ) : null}
        </section>

        {/* Aside slot — occupies a new grid row at column 1 on desktop so
            the content sits directly under the image. On narrow viewports
            the grid collapses to a single column and the aside naturally
            lands below the panel. */}
        {aside ? <aside className={styles.aside}>{aside}</aside> : null}
      </div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
