/**
 * Assumptions — published methodology footer.
 *
 * Uses the engine's `buildAssumptions()` output to produce a one-paragraph
 * block. Every chart page carries a version of this.
 */

import type { CompassReport } from '@/lib/compass/types';
import styles from './Assumptions.module.css';

export interface AssumptionsProps {
  assumptions: CompassReport['assumptions'];
  /** Additional "not modelled" trailing clause. Already defaulted to sensible list. */
  notModelled?: string;
}

export function Assumptions({
  assumptions,
  notModelled = 'Not modelled: long-term care costs, sequence-of-return variations, lifetime gifts, business relief, divorce, future tax-rule changes.',
}: AssumptionsProps) {
  const incomeGrowth = assumptions.incomeGrowthRate ?? '2.5% real';
  const taxResidence = assumptions.taxResidence ?? 'rest of UK';
  const risk = assumptions.riskProfile ?? 'balanced';
  const sacrifice = assumptions.salarySacrificeApplied === 'yes' ? ' · salary sacrifice applied' : '';
  return (
    <p className={styles.block}>
      <strong>Assumptions</strong>{' '}
      · Risk profile {risk} (growth {assumptions.investmentGrowthRate})
      · Cash {assumptions.cashGrowthRate}
      · Inflation {assumptions.inflation}
      · Real income growth {incomeGrowth}
      · State pension £{assumptions.statePensionFullRate} full rate from age {assumptions.statePensionAge}
      · DC pension access from age {assumptions.pensionAccessAge}
      · NI years assumed {assumptions.niYearsAssumed}
      · Tax residence {taxResidence}{sacrifice}
      · Life expectancy {assumptions.lifeExpectancy}
      · Tax year {assumptions.taxYear}.
      {' '}{notModelled}
    </p>
  );
}
