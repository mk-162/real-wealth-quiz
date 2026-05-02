/**
 * Edge-case tests — confirm the engine renders sane reports for the
 * pathological inputs the form can produce:
 *
 *   §A. All-zero / minimal answers — the user clicks "prefer not to say" or
 *       leaves sliders at their lowest values. Engine must not NaN, must not
 *       throw, must produce a finite balance sheet and a finite gauge.
 *   §B. Very young (25, no estate) — the engine should apply age gates and
 *       grey out the tiles that don't apply.
 *   §C. Very old / well past life expectancy (95, retired) — drawdown logic
 *       handles a horizon that may already be at zero.
 *   §D. Mid-projection sanity — every projection year has finite balances,
 *       no NaN/Infinity, age strictly increasing, no negative pension/cash
 *       except where the engine has documented intent (drawdown depletion).
 *   §E. Prefer-not-to-say propagation — sensitive answers don't crash the
 *       engine when withheld.
 *
 * Run:  npx tsx scripts/test-edge-cases.ts
 */

import {
  buildProjection,
  buildReport,
  buildBalanceSheet,
  targetCoverage,
} from '../src/lib/compass/projection';
import { scoreAllTiles } from '../src/lib/compass/tile-scoring';
import type { CompassInputs, ProjectionYear } from '../src/lib/compass/types';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}\n     ${msg}`);
    console.log(`  ❌ ${name}\n     ${msg}`);
  }
}

function assertFinite(n: number, label: string): void {
  if (!Number.isFinite(n)) {
    throw new Error(`${label}: expected finite, got ${n}`);
  }
}

function assertProjectionFinite(proj: ProjectionYear[], label: string): void {
  for (const y of proj) {
    for (const k of ['balanceCash', 'balanceISA', 'balanceGIA', 'pensionAccessible', 'pensionInaccessible', 'taxPaid'] as const) {
      const v = (y as unknown as Record<string, number>)[k];
      if (!Number.isFinite(v)) {
        throw new Error(`${label}: ProjectionYear age ${y.age}.${k} is ${v}`);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------
const MINIMAL: CompassInputs = {
  currentAge: 35,
  partnerPresent: false,
  hasDependentChildren: false,
  hasElderlyParents: false,
  targetRetirementAge: 65,
  mainHomeValue: 0,
  otherPropertyValue: 0,
  totalPensionValue: 0,
  cashSavings: 0,
  isaBalance: 0,
  giaBalance: 0,
  businessValue: 0,
  otherAssets: 0,
  mainHomeMortgageBalance: 0,
  otherPropertyMortgageBalance: 0,
  personalLoans: 0,
  creditCardDebt: 0,
  householdGrossIncome: '<50k',
  householdGrossIncomeRaw: 0,
  isScottishTaxpayer: false,
  monthlySavingAmount: '<1.5k',
  monthlySavingAmountRaw: 0,
  employerPensionContribPct: '0-3',
  employerPensionContribPctRaw: 0,
  ownPensionContribPct: '0-3',
  ownPensionContribPctRaw: 0,
  salarySacrificeInUse: false,
  essentialMonthlySpend: '<1.5k',
  essentialMonthlySpendRaw: 0,
  nonEssentialMonthlySpend: '<1.5k',
  nonEssentialMonthlySpendRaw: 0,
  retirementSpendRatio: 'same',
  mortgageMonthlyPaymentRaw: 0,
  mortgageEndAge: 'renting',
  statePensionKnown: 'no',
  niQualifyingYears: '<10',
  niQualifyingYearsRaw: 0,
  totalEstate: '<25k',
  isMarriedOrCP: false,
  homeLeftToDescendants: false,
  willInPlace: false,
  lpaInPlace: false,
  riskProfile: 'balanced',
};

// =============================================================================
// §A — All-zero inputs: engine produces a finite sane report
// =============================================================================
console.log('[§A] Minimal / all-zero inputs');

test('buildBalanceSheet works with all-zero balances', () => {
  const bs = buildBalanceSheet(MINIMAL);
  assertFinite(bs.netWorth, 'netWorth');
  assertFinite(bs.assets.totalAssets, 'totalAssets');
  assertFinite(bs.liabilities.totalLiabilities, 'totalLiabilities');
  if (bs.netWorth !== 0) {
    throw new Error(`expected netWorth=0 with all-zero inputs; got ${bs.netWorth}`);
  }
});

test('buildProjection completes without NaN for all-zero inputs', () => {
  const proj = buildProjection(MINIMAL);
  if (proj.length === 0) throw new Error('empty projection');
  assertProjectionFinite(proj, 'minimal projection');
});

test('targetCoverage returns a finite integer for all-zero inputs', () => {
  const proj = buildProjection(MINIMAL);
  const cov = targetCoverage(MINIMAL, proj);
  assertFinite(cov.pct, 'pct');
  if (!Number.isInteger(cov.pct)) {
    throw new Error(`expected integer pct, got ${cov.pct}`);
  }
});

test('buildReport produces a complete report for all-zero inputs', () => {
  const r = buildReport(MINIMAL);
  if (!r.balanceSheet) throw new Error('missing balanceSheet');
  if (!r.projection) throw new Error('missing projection');
  if (!r.scores) throw new Error('missing scores');
  assertFinite(r.scores.targetCoveragePct, 'targetCoveragePct');
  assertFinite(r.scores.financialHealth, 'financialHealth');
});

test('scoreAllTiles returns 9 valid tiles for all-zero inputs', () => {
  const r = buildReport(MINIMAL);
  const map = scoreAllTiles(MINIMAL, r);
  if (Object.keys(map).length !== 9) {
    throw new Error(`expected 9 tiles, got ${Object.keys(map).length}`);
  }
  for (const [key, tile] of Object.entries(map)) {
    if (!['green', 'amber', 'red', 'grey'].includes(tile.status)) {
      throw new Error(`${key}: invalid status ${tile.status}`);
    }
  }
});

// =============================================================================
// §B — Very young (under 35)
// =============================================================================
console.log('\n[§B] Very young (age 25)');

test('Age 25 produces no errors', () => {
  const young: CompassInputs = { ...MINIMAL, currentAge: 25, targetRetirementAge: 65 };
  const proj = buildProjection(young);
  assertProjectionFinite(proj, 'age 25');
});

test('Age 25 → retirement tile is grey (not scoreable under 35)', () => {
  const young: CompassInputs = { ...MINIMAL, currentAge: 25 };
  const r = buildReport(young);
  const map = scoreAllTiles(young, r);
  if (map.retirement.status !== 'grey') {
    throw new Error(`expected grey, got ${map.retirement.status}`);
  }
  if (map.retirement.scoreable !== false) {
    throw new Error('expected scoreable=false');
  }
});

// =============================================================================
// §C — Very old / past target retirement
// =============================================================================
console.log('\n[§C] Already-retired clients');

test('Age 70, retired, finite report', () => {
  const old: CompassInputs = {
    ...MINIMAL,
    currentAge: 70,
    targetRetirementAge: 65,
    totalPensionValueRaw: 200_000,
  };
  const proj = buildProjection(old);
  assertProjectionFinite(proj, 'age 70 retired');
});

test('Age 70 → mode is "lifetime"', () => {
  const old: CompassInputs = { ...MINIMAL, currentAge: 70, targetRetirementAge: 65 };
  const cov = targetCoverage(old, buildProjection(old));
  if (cov.mode !== 'lifetime') {
    throw new Error(`expected "lifetime", got "${cov.mode}"`);
  }
});

test('Age 95 (at life expectancy) — no error', () => {
  const ancient: CompassInputs = { ...MINIMAL, currentAge: 95, targetRetirementAge: 65 };
  // Building a projection from age 95 to 95 should still produce something.
  const proj = buildProjection(ancient);
  assertProjectionFinite(proj, 'age 95');
});

// =============================================================================
// §D — Mid-projection sanity: every projection year is healthy
// =============================================================================
console.log('\n[§D] Projection sanity: ages strictly increase, no NaN');

test('Ages strictly increase by 1 each year', () => {
  const proj = buildProjection({
    ...MINIMAL,
    currentAge: 40,
    targetRetirementAge: 65,
    totalPensionValueRaw: 200_000,
    monthlySavingAmountRaw: 500,
  });
  for (let i = 1; i < proj.length; i++) {
    if (proj[i].age !== proj[i - 1].age + 1) {
      throw new Error(
        `Age delta ${proj[i].age} - ${proj[i - 1].age} != 1 at index ${i}`,
      );
    }
  }
});

test('No projection year contains NaN, null, or undefined balances', () => {
  const inputs: CompassInputs = {
    ...MINIMAL,
    currentAge: 50,
    targetRetirementAge: 65,
    householdGrossIncome: '125-200k',
    householdGrossIncomeRaw: 150_000,
    totalPensionValueRaw: 600_000,
    isaBalanceRaw: 200_000,
    monthlySavingAmountRaw: 1_500,
    employerPensionContribPctRaw: 8,
    ownPensionContribPctRaw: 8,
  };
  assertProjectionFinite(buildProjection(inputs), 'mid-career sanity');
});

test('Total wealth never negative across the projection', () => {
  // Engine policy: pots can hit zero (depletion) but total wealth shouldn't
  // go strongly negative for a simple fixture (no debt growth modelling).
  const proj = buildProjection({
    ...MINIMAL,
    currentAge: 50,
    targetRetirementAge: 65,
    totalPensionValueRaw: 100_000,
    monthlySavingAmountRaw: 200,
  });
  for (const y of proj) {
    const total = y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible + y.pensionInaccessible;
    if (total < -1) {
      throw new Error(`total wealth £${total.toFixed(0)} at age ${y.age} unexpectedly negative`);
    }
  }
});

// =============================================================================
// §E — Prefer-not-to-say / undefined propagation
// =============================================================================
console.log('\n[§E] Prefer-not-to-say propagation');

test('Empty income band still produces a finite report', () => {
  const inputs: CompassInputs = {
    ...MINIMAL,
    householdGrossIncome: '<50k',
    householdGrossIncomeRaw: undefined,
  };
  const r = buildReport(inputs);
  assertFinite(r.scores.targetCoveragePct, 'targetCoveragePct');
});

test('Undefined optional fields don\'t crash buildReport', () => {
  // Strip the optional partner/DB pension fields entirely.
  const inputs: CompassInputs = {
    ...MINIMAL,
    hasDbPension: undefined,
    dbPensionAnnualIncome: undefined,
    dbPensionStartAge: undefined,
    lifeCoverStatus: undefined,
    earningsProtectionConfidence: undefined,
  };
  const r = buildReport(inputs);
  if (!r) throw new Error('null report');
  assertFinite(r.scores.targetCoveragePct, 'targetCoveragePct');
});

test('Renting (no mortgage) — mortgage tile is grey', () => {
  const renter: CompassInputs = { ...MINIMAL, mortgageEndAge: 'renting' };
  const r = buildReport(renter);
  const map = scoreAllTiles(renter, r);
  if (map.mortgage.status !== 'grey') {
    throw new Error(`expected grey, got ${map.mortgage.status}`);
  }
});

test('No business (businessValue=0) — investment tile not red from concentration', () => {
  // With businessValue=0, the biz-concentration check shouldn't trigger red.
  const inputs: CompassInputs = {
    ...MINIMAL,
    businessValue: 0,
    totalPensionValue: '25-100k',
    totalPensionValueRaw: 60_000,
  };
  const r = buildReport(inputs);
  const tile = scoreAllTiles(inputs, r).investment;
  // Could be amber (only 1 wrapper) but not red-from-concentration.
  if (tile.status === 'red' && tile.metrics.business_pct) {
    throw new Error(`unexpected biz-concentration red: ${tile.metrics.business_pct}`);
  }
});

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${'='.repeat(70)}`);
console.log(`Edge cases: ${passed} passed, ${failed} failed`);
console.log('='.repeat(70));

if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
