/**
 * BalanceStrip — compact 3-cell balance-sheet headline.
 *
 * Replaces the full line-by-line balance sheet on Page 1. Detail moves to a
 * later page in the PDF. Intentionally quiet — this is a "receipt at the
 * bottom of the page" element, not a hero.
 */

import type { BalanceSheet } from '@/lib/compass/types';
import { gbp } from '@/lib/compass/format';
import styles from './BalanceStrip.module.css';

export interface BalanceStripProps {
  balanceSheet: BalanceSheet;
}

export function BalanceStrip({ balanceSheet }: BalanceStripProps) {
  const { assets, liabilities, netWorth } = balanceSheet;
  return (
    <div className={styles.strip} role="group" aria-label="Balance sheet headline">
      <div className={styles.cell}>
        <div className={styles.kicker}>Total assets</div>
        <div className={`${styles.num} ${styles.numAssets}`}>{gbp(assets.totalAssets)}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.kicker}>Total liabilities</div>
        <div className={`${styles.num} ${styles.numLiabilities}`}>{gbp(liabilities.totalLiabilities)}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.kicker}>Net worth</div>
        <div className={styles.num}>{gbp(netWorth)}</div>
      </div>
    </div>
  );
}
