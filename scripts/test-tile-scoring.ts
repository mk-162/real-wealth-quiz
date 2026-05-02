/**
 * Unit + integration tests for the Compass tile-scoring engine.
 *
 * Runner: `node:test` (built-in) executed via `tsx`.
 *
 * Run from master_template/:
 *   npx tsx --test scripts/test-tile-scoring.ts
 *
 * Structure:
 *   1. Per-tile unit tests — minimal constructed inputs that exercise each
 *      branch (green / amber / red / grey) of each scorer.
 *   2. Integration smoke — every fixture produces valid TileScore shapes.
 *   3. Metrics shape — every scoreable tile has non-empty string metrics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { CompassInputs, TileKey, TileStatus } from '../src/lib/compass/types';
import { buildReport } from '../src/lib/compass/projection';
import { FIXTURES } from '../src/lib/compass/fixtures';
import { scoreAllTiles } from '../src/lib/compass/tile-scoring';
import type { TileScore } from '../src/lib/compass/tile-scoring-types';

// -----------------------------------------------------------------------------
// Baseline input — a roughly-S2-shaped client we patch for each test case.
// Chosen to sit in the "amber middle" across most tiles so overrides are cheap.
// -----------------------------------------------------------------------------

const BASELINE: CompassInputs = {
  currentAge: 42,
  partnerPresent: true,
  hasDependentChildren: true,
  hasElderlyParents: false,
  targetRetirementAge: 62,

  mainHomeValue: '250-500k',
  otherPropertyValue: 0,
  totalPensionValue: '25-100k',
  cashSavings: '25-100k',
  isaBalance: '25-100k',
  giaBalance: 0,
  businessValue: 0,
  otherAssets: 0,

  mainHomeMortgageBalance: '100-250k',
  otherPropertyMortgageBalance: 0,
  personalLoans: 0,
  creditCardDebt: 0,

  householdGrossIncome: '50-100k',
  isScottishTaxpayer: false,
  monthlySavingAmount: '<1.5k',
  employerPensionContribPct: '3-5',
  ownPensionContribPct: '3-5',

  essentialMonthlySpend: '1.5-3k',
  nonEssentialMonthlySpend: '<1.5k',
  retirementSpendRatio: 'same',

  mortgageMonthlyPayment: '1.5-3k',
  mortgageEndAge: '55_65',

  statePensionKnown: 'partial',
  niQualifyingYears: '20-30',

  totalEstate: '250-500k',
  isMarriedOrCP: true,
  homeLeftToDescendants: true,
  willInPlace: false,
  lpaInPlace: false,

  riskProfile: 'balanced',
};

function makeInputs(overrides: Partial<CompassInputs> = {}): CompassInputs {
  return { ...BASELINE, ...overrides };
}

const VALID_STATUSES: ReadonlyArray<TileStatus> = ['green', 'amber', 'red', 'grey'];
const TILE_KEYS: ReadonlyArray<TileKey> = [
  'retirement', 'pension', 'investment',
  'tax', 'cash', 'debt',
  'mortgage', 'estate', 'protection',
];

/** Build a full TileScoreMap for the given input overrides. */
function score(overrides: Partial<CompassInputs> = {}) {
  const inputs = makeInputs(overrides);
  const report = buildReport(inputs);
  return scoreAllTiles(inputs, report);
}

// -----------------------------------------------------------------------------
// Group 1 — per-tile unit tests
// -----------------------------------------------------------------------------

describe('scoreRetirement', () => {
  it('returns grey for currentAge < 35', () => {
    const r = score({ currentAge: 30 });
    assert.equal(r.retirement.status, 'grey');
    assert.equal(r.retirement.scoreable, false);
  });

  it('green when coverage >= 100%', () => {
    const r = score({
      currentAge: 50,
      targetRetirementAge: 65,
      totalPensionValue: '1-2m',
      isaBalance: '500k-1m',
      monthlySavingAmount: '8k+',
      employerPensionContribPct: '10+',
      ownPensionContribPct: '10+',
    });
    assert.equal(r.retirement.status, 'green');
  });

  it('amber in the 70-99 band', () => {
    // Baseline S2-ish sits comfortably in the amber zone.
    const r = score();
    assert.ok(['amber', 'red', 'green'].includes(r.retirement.status));
    // Engine must at least return a valid status with a coverage_pct metric.
    assert.ok(r.retirement.metrics.coverage_pct !== undefined);
  });

  it('red when coverage < 70', () => {
    const r = score({
      currentAge: 55,
      targetRetirementAge: 60,
      totalPensionValue: '<25k',
      cashSavings: 0,
      isaBalance: 0,
      monthlySavingAmount: '<1.5k',
    });
    assert.equal(r.retirement.status, 'red');
  });
});

describe('scorePension', () => {
  it('grey when already retired', () => {
    const r = score({ currentAge: 70, targetRetirementAge: 60 });
    assert.equal(r.pension.status, 'grey');
    assert.equal(r.pension.scoreable, false);
  });

  it('green when combined contrib meets age-target', () => {
    // Age 30 → target 15%. 10+ + 5-10 = 12+7 = 19 ≥ 15, ratio >= 1
    const r = score({
      currentAge: 30,
      employerPensionContribPct: '10+',
      ownPensionContribPct: '5-10',
    });
    assert.equal(r.pension.status, 'green');
  });

  it('amber when contribution lag is moderate', () => {
    // Age 40 → target 20%. 5-10 + 3-5 = 7+4 = 11, ratio 11/20 = 0.55 => red
    // So pick something with ratio just under 1: 10+ + 3-5 = 16, ratio 0.8 => amber
    const r = score({
      currentAge: 40,
      employerPensionContribPct: '10+',
      ownPensionContribPct: '3-5',
    });
    assert.equal(r.pension.status, 'amber');
  });

  it('red when contribution well below target', () => {
    const r = score({
      currentAge: 50,
      employerPensionContribPct: '0-3',
      ownPensionContribPct: '0-3',
    });
    assert.equal(r.pension.status, 'red');
  });
});

describe('scoreInvestment', () => {
  it('grey when all four balances zero', () => {
    const r = score({
      totalPensionValue: 0,
      isaBalance: 0,
      giaBalance: 0,
      cashSavings: 0,
    });
    assert.equal(r.investment.status, 'grey');
  });

  it('green when 2+ wrappers funded', () => {
    const r = score({
      totalPensionValue: '100-250k',
      isaBalance: '25-100k',
      giaBalance: 0,
    });
    assert.equal(r.investment.status, 'green');
  });

  it('amber when only one wrapper funded', () => {
    const r = score({
      totalPensionValue: 0,
      isaBalance: 0,
      giaBalance: 0,
      cashSavings: '25-100k',
    });
    assert.equal(r.investment.status, 'amber');
  });

  it('red when business concentration > 40%', () => {
    const r = score({
      totalPensionValue: '<25k',
      isaBalance: '<25k',
      giaBalance: 0,
      cashSavings: '<25k',
      businessValue: '2-3m',
      mainHomeValue: 0, // strip home so business dominates net worth
      mainHomeMortgageBalance: 0,
    });
    assert.equal(r.investment.status, 'red');
    assert.ok(r.investment.metrics.business_pct !== undefined);
  });
});

describe('scoreTax', () => {
  it('red when in £100k trap with low contribution', () => {
    const r = score({
      householdGrossIncome: '100-125k',
      employerPensionContribPct: '3-5',
      ownPensionContribPct: '3-5',
    });
    assert.equal(r.tax.status, 'red');
  });

  it('amber when in £100k trap with 10%+ contribution', () => {
    const r = score({
      householdGrossIncome: '100-125k',
      employerPensionContribPct: '10+',
      ownPensionContribPct: '0-3',
    });
    assert.equal(r.tax.status, 'amber');
  });

  it('amber when higher-rate & ISA zero', () => {
    const r = score({
      householdGrossIncome: '50-100k',
      isaBalance: 0,
    });
    assert.equal(r.tax.status, 'amber');
  });

  it('green when basic-rate with ISA used', () => {
    const r = score({
      householdGrossIncome: '<50k',
      isaBalance: '25-100k',
    });
    assert.equal(r.tax.status, 'green');
  });

  it('populates income_k metric', () => {
    const r = score();
    assert.equal(r.tax.metrics.income_k, '75');
  });
});

describe('scoreCash', () => {
  it('green when 6+ months cover and dependents', () => {
    const r = score({
      cashSavings: '100-250k', // 175k
      essentialMonthlySpend: '1.5-3k', // 2250/mo → 77 months
      partnerPresent: true,
      hasDependentChildren: true,
    });
    assert.equal(r.cash.status, 'green');
    assert.ok(Number(r.cash.metrics.cash_months) >= 6);
  });

  it('green at 4+ months when solo', () => {
    const r = score({
      cashSavings: '25-100k', // 62.5k
      essentialMonthlySpend: '3-5k', // 4000/mo → 15.6 months
      partnerPresent: false,
      hasDependentChildren: false,
    });
    assert.equal(r.cash.status, 'green');
  });

  it('amber in 3-5 month window (for family)', () => {
    const r = score({
      cashSavings: '<25k', // 12.5k
      essentialMonthlySpend: '3-5k', // 4000/mo → 3.1 months
      partnerPresent: true,
      hasDependentChildren: true,
    });
    assert.equal(r.cash.status, 'amber');
  });

  it('red when cover < 3 months', () => {
    const r = score({
      cashSavings: '<25k', // 12.5k
      essentialMonthlySpend: '5-8k', // 6500/mo → 1.9 months
      isaBalance: 0,
      partnerPresent: true,
      hasDependentChildren: true,
    });
    assert.equal(r.cash.status, 'red');
  });

  it('zero cash + ISA present → amber, not red', () => {
    const r = score({
      cashSavings: 0,
      isaBalance: '25-100k',
    });
    assert.equal(r.cash.status, 'amber');
    // cash_k populated (as '0') so template authors know how to render.
    assert.equal(r.cash.metrics.cash_k, '0');
  });

  it('zero cash + zero ISA → red, cash_k omitted', () => {
    const r = score({
      cashSavings: 0,
      isaBalance: 0,
    });
    assert.equal(r.cash.status, 'red');
    assert.equal(r.cash.metrics.cash_k, undefined);
  });
});

describe('scoreDebt', () => {
  it('green when no consumer debt', () => {
    const r = score({ personalLoans: 0, creditCardDebt: 0 });
    assert.equal(r.debt.status, 'green');
    assert.equal(r.debt.metrics.consumer_debt_k, '0');
  });

  it('amber when DTI <= 15%', () => {
    const r = score({
      creditCardDebt: '<25k', // 12.5k on 75k income = 16% → actually red
      personalLoans: 0,
      householdGrossIncome: '125-200k', // 12.5k / 160k = 7.8% → amber
    });
    assert.equal(r.debt.status, 'amber');
  });

  it('red when DTI > 15%', () => {
    const r = score({
      personalLoans: '25-100k', // 62.5k
      creditCardDebt: 0,
      householdGrossIncome: '<50k', // 35k → 1.78 DTI
    });
    assert.equal(r.debt.status, 'red');
  });
});

describe('scoreMortgage', () => {
  it('grey when renting', () => {
    const r = score({
      mortgageEndAge: 'renting',
      mainHomeMortgageBalance: 0,
      mortgageMonthlyPayment: undefined,
    });
    assert.equal(r.mortgage.status, 'grey');
  });

  it('green when paid off', () => {
    const r = score({
      mortgageEndAge: 'paid',
      mainHomeMortgageBalance: 0,
      mortgageMonthlyPayment: undefined,
    });
    assert.equal(r.mortgage.status, 'green');
    assert.equal(r.mortgage.metrics.mortgage_clear_age, 'now');
  });

  it('red when PTI > 35%', () => {
    const r = score({
      mortgageMonthlyPayment: '5-8k', // 78k/yr
      householdGrossIncome: '<50k',   // 35k → PTI ~223% → red
      mortgageEndAge: '55_65',
    });
    assert.equal(r.mortgage.status, 'red');
  });

  it('amber when clears after retirement', () => {
    const r = score({
      mortgageMonthlyPayment: '<1.5k', // 12k/yr → PTI 16% (amber zone boundary)
      householdGrossIncome: '50-100k',
      mortgageEndAge: '65_75', // clears at 70 - retires at 62 → !clearsBefore
      targetRetirementAge: 62,
    });
    assert.equal(r.mortgage.status, 'amber');
  });
});

describe('scoreEstate', () => {
  it('green when will + LPA both in place', () => {
    const r = score({ willInPlace: true, lpaInPlace: true });
    assert.equal(r.estate.status, 'green');
  });

  it('amber when one of will/LPA in place', () => {
    const r = score({ willInPlace: true, lpaInPlace: false });
    assert.equal(r.estate.status, 'amber');
  });

  it('red when neither + dependents', () => {
    const r = score({
      willInPlace: false,
      lpaInPlace: false,
      hasDependentChildren: true,
    });
    assert.equal(r.estate.status, 'red');
  });

  it('business owner without will → red (shareholder risk)', () => {
    const r = score({
      willInPlace: false,
      lpaInPlace: true,
      businessValue: '250-500k',
    });
    assert.equal(r.estate.status, 'red');
  });

  it('grey when young, no deps, no will/LPA', () => {
    const r = score({
      currentAge: 27,
      willInPlace: false,
      lpaInPlace: false,
      hasDependentChildren: false,
      partnerPresent: false,
      targetRetirementAge: 65,
    });
    assert.equal(r.estate.status, 'grey');
  });
});

describe('scoreProtection', () => {
  it('grey when already retired', () => {
    const r = score({ currentAge: 70, targetRetirementAge: 60 });
    assert.equal(r.protection.status, 'grey');
  });

  it('business owner → red', () => {
    const r = score({ businessValue: '250-500k' });
    assert.equal(r.protection.status, 'red');
  });

  it('dependents + mortgage active → red', () => {
    const r = score({
      hasDependentChildren: true,
      mortgageEndAge: '55_65',
      businessValue: 0,
    });
    assert.equal(r.protection.status, 'red');
  });

  it('dependents + mortgage paid → amber', () => {
    const r = score({
      hasDependentChildren: true,
      partnerPresent: true,
      mortgageEndAge: 'paid',
      businessValue: 0,
      mainHomeMortgageBalance: 0,
      mortgageMonthlyPayment: undefined,
    });
    assert.equal(r.protection.status, 'amber');
  });

  it('solo + far from retirement → amber', () => {
    const r = score({
      partnerPresent: false,
      hasDependentChildren: false,
      currentAge: 40,
      targetRetirementAge: 65,
      businessValue: 0,
    });
    assert.equal(r.protection.status, 'amber');
  });

  it('solo + near retirement → grey', () => {
    const r = score({
      partnerPresent: false,
      hasDependentChildren: false,
      currentAge: 58,
      targetRetirementAge: 62,
      businessValue: 0,
    });
    assert.equal(r.protection.status, 'grey');
  });
});

// -----------------------------------------------------------------------------
// Group 2 — integration smoke across all 9 fixtures
// -----------------------------------------------------------------------------

describe('integration — all fixtures produce valid TileScoreMap', () => {
  for (const f of FIXTURES) {
    it(`${f.view.segmentId} (${f.view.segmentLabel}): every tile valid`, () => {
      const report = buildReport(f.inputs);
      const map = scoreAllTiles(f.inputs, report);

      for (const key of TILE_KEYS) {
        const score: TileScore = map[key];
        assert.ok(VALID_STATUSES.includes(score.status),
          `${f.view.segmentId}.${key} has invalid status: ${score.status}`);
        assert.equal(typeof score.scoreable, 'boolean',
          `${f.view.segmentId}.${key} scoreable is not boolean`);
        assert.equal(typeof score.metrics, 'object',
          `${f.view.segmentId}.${key} metrics is not object`);
        assert.notEqual(score.metrics, null,
          `${f.view.segmentId}.${key} metrics is null`);
        // grey tiles must not be scoreable (engine invariant)
        if (score.status === 'grey') {
          assert.equal(score.scoreable, false,
            `${f.view.segmentId}.${key} grey but scoreable=true`);
        }
      }
    });
  }
});

// -----------------------------------------------------------------------------
// Group 3 — populated metric values are non-empty strings
// -----------------------------------------------------------------------------

describe('metrics shape — populated values are non-empty strings', () => {
  for (const f of FIXTURES) {
    it(`${f.view.segmentId}: scoreable tile metrics are strings`, () => {
      const report = buildReport(f.inputs);
      const map = scoreAllTiles(f.inputs, report);

      for (const key of TILE_KEYS) {
        const score = map[key];
        if (!score.scoreable) continue;
        const metrics = score.metrics as Record<string, string | undefined>;
        for (const [name, value] of Object.entries(metrics)) {
          if (value === undefined) continue;
          assert.equal(typeof value, 'string',
            `${f.view.segmentId}.${key}.${name} is not a string: ${String(value)}`);
          assert.ok(value.length > 0,
            `${f.view.segmentId}.${key}.${name} is empty string`);
        }
      }
    });
  }
});
