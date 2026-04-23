/**
 * BalanceStrip — compact 3-cell balance-sheet headline.
 *
 * Total assets / Total liabilities / Net worth (teal-highlight last cell).
 * The full line-by-line balance sheet lives on a later page.
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
        <div className={styles.val}>{gbp(assets.totalAssets)}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.kicker}>Total liabilities</div>
        <div className={styles.val}>{gbp(liabilities.totalLiabilities)}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.kicker}>Net worth</div>
        <div className={styles.val}>{gbp(netWorth)}</div>
      </div>
    </div>
  );
}
