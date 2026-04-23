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
  notModelled = 'Not modelled: one-off events, career breaks, long-term care, tax rule changes, market sequence-of-return variations.',
}: AssumptionsProps) {
  return (
    <p className={styles.block}>
      <strong>Assumptions</strong>{' '}
      · Growth {assumptions.investmentGrowthRate} balanced (4% cautious / 8% adventurous)
      · Inflation {assumptions.inflation}
      · Cash {assumptions.cashGrowthRate}
      · State pension £{assumptions.statePensionFullRate} full rate from age {assumptions.statePensionAge}
      · Life expectancy {assumptions.lifeExpectancy}
      · Tax year {assumptions.taxYear}.
      {' '}{notModelled}
    </p>
  );
}
