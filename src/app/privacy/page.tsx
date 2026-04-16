/**
 * /privacy — Privacy notice.
 *
 * Copy lives in content/pages/privacy.md. The body is rendered as a single
 * markdown string (frontmatter is stripped at build time by content-build.ts).
 * We split the body on `## ` subheadings and on blank lines to render
 * subheadings, paragraphs, and bullet lists without pulling in a markdown
 * runtime dependency.
 *
 * Layout mirrors the homepage chrome — sticky paper-warm header with the
 * teal logo, no nav, FCA footer at the bottom.
 */
import { Logo } from '@/components/Logo';
import { FCAFooter } from '@/components/FCAFooter';
import { pageValue } from '@/lib/content';
import { renderProse } from './renderProse';
import styles from './page.module.css';

export const metadata = {
  title: 'Privacy — Real Wealth',
  description:
    'How Real Wealth Partners Ltd handles the information you share through the Wealth Conversation.',
};

export default function PrivacyPage() {
  const title = pageValue<string>(
    'privacy',
    'title',
    'Privacy — How we handle your information',
  );
  const lastUpdated = pageValue<string>('privacy', 'last_updated', '');
  const body = pageValue<string>('privacy', 'body', '');

  return (
    <>
      <header className={styles.topnav}>
        <Logo tone="ink" width={200} />
      </header>

      <main className={styles.main}>
        <article className={styles.article}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {lastUpdated ? (
            <p className={styles.lastUpdated}>Last updated {lastUpdated}</p>
          ) : null}
          <div className={styles.body}>{renderProse(body)}</div>
        </article>
      </main>

      <FCAFooter />
    </>
  );
}
