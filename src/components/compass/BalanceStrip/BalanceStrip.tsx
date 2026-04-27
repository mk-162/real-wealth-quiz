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

  // Build a one-line breakdown of liabilities (only shown when material).
  const liabilityParts: string[] = [];
  if (liabilities.mortgages > 0) liabilityParts.push(`mortgages ${gbp(liabilities.mortgages)}`);
  if (liabilities.personalLoans > 0) liabilityParts.push(`loans ${gbp(liabilities.personalLoans)}`);
  if (liabilities.creditCard > 0) liabilityParts.push(`cards ${gbp(liabilities.creditCard)}`);
  const liabilityBreakdown = liabilityParts.length > 0 ? liabilityParts.join(' · ') : undefined;

  return (
    <div className={styles.strip} role="group" aria-label="Balance sheet headline">
      <div className={styles.cell}>
        <div className={styles.kicker}>Total assets</div>
        <div className={styles.val}>{gbp(assets.totalAssets)}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.kicker}>Total liabilities</div>
        <div className={styles.val}>{gbp(liabilities.totalLiabilities)}</div>
        {liabilityBreakdown && (
          <div className={styles.kicker} style={{ marginTop: 4, fontSize: '0.7rem', opacity: 0.8 }}>
            {liabilityBreakdown}
          </div>
        )}
      </div>
      <div className={styles.cell}>
        <div className={styles.kicker}>Net worth</div>
        <div className={styles.val}>{gbp(netWorth)}</div>
      </div>
    </div>
  );
}
