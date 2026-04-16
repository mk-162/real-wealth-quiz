/**
 * /consumer-duty — How we meet our Consumer Duty obligations.
 *
 * Same structure as /privacy. Copy lives in content/pages/consumer-duty.md.
 * Reuses the renderProse helper colocated with the privacy route.
 */
import { Logo } from '@/components/Logo';
import { FCAFooter } from '@/components/FCAFooter';
import { pageValue } from '@/lib/content';
import { renderProse } from '../privacy/renderProse';
import styles from './page.module.css';

export const metadata = {
  title: 'Consumer Duty — Real Wealth',
  description:
    'How Real Wealth Partners Ltd meets the FCA Consumer Duty obligations across products, price, understanding, and support.',
};

export default function ConsumerDutyPage() {
  const title = pageValue<string>(
    'consumer-duty',
    'title',
    'How we meet our Consumer Duty obligations',
  );
  const lastUpdated = pageValue<string>('consumer-duty', 'last_updated', '');
  const body = pageValue<string>('consumer-duty', 'body', '');

  return (
    <>
      <header className={styles.topnav}>
        <Logo tone="ink" />
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
