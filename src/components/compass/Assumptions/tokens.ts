/**
 * Assumptions footer — token build + substitution.
 *
 * Pure functions split out of `Assumptions.tsx` so they can be unit-tested
 * without dragging the React component (and its CSS-module import) into the
 * Node test runner.
 */

import type { CompassReport } from '@/lib/compass/types';

export type AssumptionTokens = Record<string, string>;

export const DEFAULT_NOT_MODELLED =
  'Not modelled: long-term care costs, sequence-of-return variations, lifetime gifts, business relief, divorce, future tax-rule changes.';

/**
 * Default body — kept in lockstep with `content/report/assumptions.md`'s
 * `# Body` section as a fallback. If you change one, change both.
 */
export const DEFAULT_BODY_TEMPLATE =
  '**ASSUMPTIONS** · Risk profile {risk_profile} (growth {investment_growth_rate}) · Cash {cash_growth_rate} · Inflation {inflation} · Real income growth {income_growth_rate} · State pension £{state_pension_full_rate} full rate from age {state_pension_age} · DC pension access from age {pension_access_age} · NI years assumed {ni_years_assumed} · Tax residence {tax_residence}{salary_sacrifice_clause} · Retirement income (state, DB, 75% of pension drawdowns) taxed at marginal rate; 25% pension tax-free portion capped lifetime at £268,275; CGT applied to GIA drawdowns · Life expectancy {life_expectancy} · Tax year {tax_year}. {not_modelled}';

/**
 * Map an engine `assumptions` block + the optional notModelled clause into the
 * `{token}` substitution map the markdown body expects.
 *
 * Engine assumptions are `Record<string, string | number>`; we stringify
 * everything here so the substitution layer doesn't have to care.
 */
export function buildAssumptionTokens(
  assumptions: CompassReport['assumptions'],
  notModelled: string,
): AssumptionTokens {
  const get = (key: string, fallback = ''): string => {
    const v = assumptions[key];
    if (v === undefined || v === null) return fallback;
    return String(v);
  };
  const sacrifice = get('salarySacrificeApplied') === 'yes' ? ' · salary sacrifice applied' : '';
  return {
    risk_profile: get('riskProfile', 'balanced'),
    investment_growth_rate: get('investmentGrowthRate'),
    cash_growth_rate: get('cashGrowthRate'),
    inflation: get('inflation'),
    income_growth_rate: get('incomeGrowthRate', '2.5% real'),
    state_pension_full_rate: get('statePensionFullRate'),
    state_pension_age: get('statePensionAge'),
    pension_access_age: get('pensionAccessAge'),
    ni_years_assumed: get('niYearsAssumed'),
    tax_residence: get('taxResidence', 'rest of UK'),
    salary_sacrifice_clause: sacrifice,
    life_expectancy: get('lifeExpectancy'),
    tax_year: get('taxYear'),
    not_modelled: notModelled,
  };
}

/**
 * Single-pass `{token}` substitution. Unknown tokens are left literal so any
 * typo in the body markdown is loudly visible in the rendered output.
 */
export function applyAssumptionTokens(template: string, tokens: AssumptionTokens): string {
  return template.replace(/\{(\w+)\}/g, (literal, key: string) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      return tokens[key];
    }
    return literal;
  });
}
