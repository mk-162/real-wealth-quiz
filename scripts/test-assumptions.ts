/**
 * Unit tests for the assumptions footer:
 *   - The on-disk `content/report/assumptions.md` parses cleanly.
 *   - Token substitution fills every placeholder for a representative
 *     `assumptions` block.
 *   - `applyAssumptionTokens` leaves unknown tokens literal.
 *   - The default body template (fallback) and the markdown body template
 *     produce identical output for the same `assumptions` input.
 *
 * Runner: `node:test` via `tsx`.
 *
 * Run from master_template/:
 *   npx tsx --test scripts/test-assumptions.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAssumptionTokens,
  applyAssumptionTokens,
  DEFAULT_BODY_TEMPLATE,
} from '../src/components/compass/Assumptions/tokens';
import { loadAssumptionsContent } from '../src/lib/compass/pdf-content';
import type { CompassReport } from '../src/lib/compass/types';

const FIXTURE: CompassReport['assumptions'] = {
  inflation: '2.5%',
  cashGrowthRate: '2.5%',
  investmentGrowthRate: '6.0%',
  riskProfile: 'balanced',
  incomeGrowthRate: '2.5% real',
  statePensionFullRate: 11_502,
  statePensionAge: 67,
  pensionAccessAge: 57,
  niYearsAssumed: 35,
  taxResidence: 'rest of UK',
  salarySacrificeApplied: 'no',
  lifeExpectancy: 95,
  taxYear: '2025/26',
};

const NOT_MODELLED =
  'Not modelled: long-term care costs, sequence-of-return variations, lifetime gifts, business relief, divorce, future tax-rule changes.';

describe('buildAssumptionTokens', () => {
  it('produces a string for every required placeholder', () => {
    const tokens = buildAssumptionTokens(FIXTURE, NOT_MODELLED);
    const required = [
      'risk_profile',
      'investment_growth_rate',
      'cash_growth_rate',
      'inflation',
      'income_growth_rate',
      'state_pension_full_rate',
      'state_pension_age',
      'pension_access_age',
      'ni_years_assumed',
      'tax_residence',
      'salary_sacrifice_clause',
      'life_expectancy',
      'tax_year',
      'not_modelled',
    ];
    for (const key of required) {
      assert.equal(typeof tokens[key], 'string', `expected token ${key} to be a string`);
    }
  });

  it('emits an empty salary-sacrifice clause when not applied', () => {
    const tokens = buildAssumptionTokens(FIXTURE, NOT_MODELLED);
    assert.equal(tokens.salary_sacrifice_clause, '');
  });

  it('emits the salary-sacrifice clause when applied', () => {
    const tokens = buildAssumptionTokens({ ...FIXTURE, salarySacrificeApplied: 'yes' }, NOT_MODELLED);
    assert.equal(tokens.salary_sacrifice_clause, ' · salary sacrifice applied');
  });

  it('falls back to defaults when optional fields are missing', () => {
    const lean: CompassReport['assumptions'] = { ...FIXTURE };
    delete lean.riskProfile;
    delete lean.incomeGrowthRate;
    delete lean.taxResidence;
    const tokens = buildAssumptionTokens(lean, NOT_MODELLED);
    assert.equal(tokens.risk_profile, 'balanced');
    assert.equal(tokens.income_growth_rate, '2.5% real');
    assert.equal(tokens.tax_residence, 'rest of UK');
  });
});

describe('applyAssumptionTokens', () => {
  it('substitutes every {token} into the template', () => {
    const tokens = buildAssumptionTokens(FIXTURE, NOT_MODELLED);
    const template = 'Risk {risk_profile} · Inflation {inflation}';
    const out = applyAssumptionTokens(template, tokens);
    assert.equal(out, 'Risk balanced · Inflation 2.5%');
  });

  it('leaves unknown tokens literal so the typo is visible', () => {
    const out = applyAssumptionTokens('{not_a_real_token} OK', { real: 'value' });
    assert.equal(out, '{not_a_real_token} OK');
  });

  it('handles a body template that includes the salary_sacrifice_clause concatenation', () => {
    const tokens = buildAssumptionTokens({ ...FIXTURE, salarySacrificeApplied: 'yes' }, NOT_MODELLED);
    const out = applyAssumptionTokens('residence {tax_residence}{salary_sacrifice_clause} ·', tokens);
    assert.equal(out, 'residence rest of UK · salary sacrifice applied ·');
  });
});

describe('loadAssumptionsContent — round-trip with the on-disk file', () => {
  it('finds and parses content/report/assumptions.md', () => {
    const content = loadAssumptionsContent();
    assert.notEqual(content, null, 'expected assumptions.md to exist and load');
    assert.equal(typeof content!.body, 'string');
    assert.ok(content!.body.length > 0, 'expected non-empty body');
  });

  it('body contains every {token} the renderer expects', () => {
    const content = loadAssumptionsContent();
    assert.notEqual(content, null);
    const body = content!.body;
    const expectedTokens = [
      '{risk_profile}',
      '{investment_growth_rate}',
      '{cash_growth_rate}',
      '{inflation}',
      '{income_growth_rate}',
      '{state_pension_full_rate}',
      '{state_pension_age}',
      '{pension_access_age}',
      '{ni_years_assumed}',
      '{tax_residence}',
      '{salary_sacrifice_clause}',
      '{life_expectancy}',
      '{tax_year}',
      '{not_modelled}',
    ];
    for (const token of expectedTokens) {
      assert.ok(body.includes(token), `expected body to contain ${token}`);
    }
  });

  it('substituting fixture tokens leaves no unfilled {tokens} except known-literal text', () => {
    const content = loadAssumptionsContent();
    assert.notEqual(content, null);
    const tokens = buildAssumptionTokens(FIXTURE, NOT_MODELLED);
    const filled = applyAssumptionTokens(content!.body, tokens);
    // The body itself contains no `{` chars in literal copy, so any remaining
    // `{...}` after substitution would indicate an unknown token.
    const stragglers = filled.match(/\{[a-z_]+\}/gi);
    assert.equal(stragglers, null, `unexpected unfilled tokens: ${stragglers?.join(', ')}`);
  });

  it('substituted body matches the hardcoded fallback template (visual parity)', () => {
    const content = loadAssumptionsContent();
    assert.notEqual(content, null);
    const tokens = buildAssumptionTokens(FIXTURE, NOT_MODELLED);
    const filledMarkdown = applyAssumptionTokens(content!.body, tokens);
    const filledFallback = applyAssumptionTokens(DEFAULT_BODY_TEMPLATE, tokens);
    assert.equal(filledMarkdown, filledFallback);
  });
});
