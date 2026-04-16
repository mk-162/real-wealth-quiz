/**
 * SummaryHeader — branded top bar for the conversation summary page.
 *
 * The questionnaire pages render their own in-page header (with section
 * chip + progress bar). The summary page previously had no header at all,
 * which broke brand continuity with the rest of the site at the very
 * moment the user is being asked to take action. This component pins the
 * Real Wealth wordmark at the top and surfaces a Contact link to the
 * main marketing site so users who want to reach out *without* booking
 * a call have an obvious path.
 */
import { Logo } from '@/components/Logo';
import styles from './SummaryHeader.module.css';

export interface SummaryHeaderProps {
  /** Marketing-site contact page. Defaults to the canonical /contact path. */
  contactHref?: string;
}

export function SummaryHeader({
  contactHref = 'https://realwealth.co.uk/contact',
}: SummaryHeaderProps) {
  // No role="banner" here: this header renders inside <main> in
  // ConversationLayout, so an explicit banner landmark would be
  // ambiguous for assistive tech. Plain <header> is a section header.
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a
          href="https://realwealth.co.uk"
          className={styles.brand}
          aria-label="Real Wealth — home"
        >
          <Logo tone="teal" width={140} />
        </a>
        <nav className={styles.nav} aria-label="Primary">
          <a
            href={contactHref}
            className={styles.contact}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
