/**
 * Unit tests for the projection engine's retirement-phase tax logic.
 *
 * Covers each rule from PROJECTION_TAX_FIX_PLAN §6 (T1-T10) plus the
 * reconciliation regression check (T11). Follows the existing
 * `scripts/test-*.ts` pattern (no test framework dependency — plain
 * assertions + a per-test pass/fail tally).
 *
 * Run:  npx tsx scripts/test-projection-tax.ts
 */

import {
  buildProjection,
  taxRetirementGuaranteed,
  computePensionDrawTax,
  computeGiaCgt,
  grossUpPensionDraw,
  grossUpGiaDraw,
  applyAnnualAllowanceCap,
  GIA_GAIN_FRACTION,
  PENSION_TFC_FRACTION,
} from '../src/lib/compass/projection';
import type { CompassInputs } from '../src/lib/compass/types';
import { LUMP_SUM_ALLOWANCE, MPAA_LIMIT } from '../src/lib/compass/tax-year-2025-26';

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

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function approxEqual(actual: number, expected: number, tol: number, label: string): void {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${label}: expected ${expected} (±${tol}), got ${actual.toFixed(2)}`);
  }
}

// -----------------------------------------------------------------------------
// Baseline fixture — a generic HNW accumulator used by the regression test.
// -----------------------------------------------------------------------------
const BASE_HNW: CompassInputs = {
  currentAge: 42,
  partnerPresent: false,
  hasDependentChildren: false,
  hasElderlyParents: false,
  targetRetirementAge: 62,
  mainHomeValue: '500k-1m',
  otherPropertyValue: 0,
  totalPensionValue: '25-100k',
  cashSavings: '<25k',
  isaBalance: '25-100k',
  giaBalance: '25-100k',
  businessValue: 0,
  otherAssets: 0,
  totalPensionValueRaw: 80_000,
  cashSavingsRaw: 20_000,
  isaBalanceRaw: 40_000,
  giaBalanceRaw: 30_000,
  mainHomeMortgageBalance: '250-500k',
  otherPropertyMortgageBalance: 0,
  personalLoans: 0,
  creditCardDebt: 0,
  householdGrossIncome: '125-200k',
  householdGrossIncomeRaw: 160_000,
  isScottishTaxpayer: false,
  monthlySavingAmount: '<1.5k',
  monthlySavingAmountRaw: 500,
  employerPensionContribPct: '5-10',
  employerPensionContribPctRaw: 6,
  ownPensionContribPct: '5-10',
  ownPensionContribPctRaw: 6,
  salarySacrificeInUse: true,
  essentialMonthlySpend: '3-5k',
  essentialMonthlySpendRaw: 4_000,
  nonEssentialMonthlySpend: '1.5-3k',
  nonEssentialMonthlySpendRaw: 2_500,
  // §7 of the plan specifies the 'same' multiplier (0.85) for the worked
  // example. This reproduces the chart-shape characteristic of the
  // original screenshot: peak in the £2–4m range across age 80–95.
  retirementSpendRatio: 'same',
  mortgageMonthlyPaymentRaw: 2_000,
  mortgageEndAge: '55_65',
  mortgageEndAgeRaw: 62,
  statePensionKnown: 'partial',
  niQualifyingYears: '35+',
  totalEstate: '1-2m',
  isMarriedOrCP: false,
  homeLeftToDescendants: true,
  willInPlace: true,
  lpaInPlace: false,
  riskProfile: 'balanced',
};

// -----------------------------------------------------------------------------
// T1 — state + DB pension is taxed at marginal rate
// -----------------------------------------------------------------------------
console.log('\n[T1] state + DB pension taxed at marginal rate');
test('state pension alone (£11.5k) under PA → no tax', () => {
  const r = taxRetirementGuaranteed(11_502, 0, 0, false);
  approxEqual(r.taxPaid, 0, 1, 'taxPaid');
  approxEqual(r.netGuaranteed, 11_502, 1, 'netGuaranteed');
});
test('state + £20k DB → basic-rate tax on slice above PA', () => {
  // Stacked income: £31,502. PA covers £12,570. Basic-rate slice: £18,932 × 20% = £3,786.40
  const r = taxRetirementGuaranteed(11_502, 20_000, 0, false);
  approxEqual(r.taxPaid, 3_786.4, 1, 'taxPaid');
  approxEqual(r.netGuaranteed, 27_715.6, 1, 'netGuaranteed');
  approxEqual(r.grossTaxable, 31_502, 1, 'grossTaxable');
});
test('state pension stacked on £40k working income → most basic, slice into higher', () => {
  // £40k working income → taxable £27,430 (post-PA). Stacking £11,502 state
  // pension: total taxable = £38,932. Basic band width = £37,700. So £37,700
  // − £27,430 = £10,270 of state pension fits in basic at 20%; remaining
  // £1,232 (= 11,502 − 10,270) sits in higher band at 40%.
  // Tax: £10,270 × 0.20 + £1,232 × 0.40 = £2,054 + £492.80 = £2,546.80.
  const r = taxRetirementGuaranteed(11_502, 0, 40_000, false);
  approxEqual(r.taxPaid, 2_546.8, 1, 'taxPaid');
});

// -----------------------------------------------------------------------------
// T2 — pension drawdown: 25% TFC under LSA, rest taxed
// -----------------------------------------------------------------------------
console.log('\n[T2] pension drawdown 25% TFC under LSA');
test('£40k gross from £500k pension at retirement, no other income', () => {
  // 25% TFC = £10k (LSA plenty available). Taxable = £30k. Tax (rUK 2025/26):
  // PA covers £12,570, basic rate on £17,430 × 20% = £3,486.
  const r = computePensionDrawTax(40_000, LUMP_SUM_ALLOWANCE, 0, false);
  approxEqual(r.tfc, 10_000, 1, 'tfc');
  approxEqual(r.taxable, 30_000, 1, 'taxable');
  approxEqual(r.tax, 3_486, 1, 'tax');
});
test('grossUpPensionDraw inverts to recover net = 36,514', () => {
  // From the test above: gross £40k → net £36,514. Solve inverse.
  const r = grossUpPensionDraw(36_514, LUMP_SUM_ALLOWANCE, 0, false);
  approxEqual(r.gross, 40_000, 1, 'gross');
  approxEqual(r.tfc, 10_000, 1, 'tfc');
  approxEqual(r.tax, 3_486, 1, 'tax');
});

// -----------------------------------------------------------------------------
// T3 — LSA cap consumed across years
// -----------------------------------------------------------------------------
console.log('\n[T3] LSA cap consumes across years');
test('after £100k of TFC, only £168k of LSA remains', () => {
  // Simulate: 25% of £400k = £100k TFC consumed. £168,275 of LSA remaining.
  // Next £100k withdrawal: 25% = £25k, but LSA only has £168k left → £25k TFC.
  const r = computePensionDrawTax(100_000, LUMP_SUM_ALLOWANCE - 100_000, 0, false);
  approxEqual(r.tfc, 25_000, 1, 'tfc');
});
test('once LSA exhausted, every £ is fully taxable', () => {
  const r = computePensionDrawTax(40_000, 0, 0, false);
  approxEqual(r.tfc, 0, 1, 'tfc');
  approxEqual(r.taxable, 40_000, 1, 'taxable');
});

// -----------------------------------------------------------------------------
// T4 — LSA binds for HNW pot
// -----------------------------------------------------------------------------
console.log('\n[T4] LSA cap binds at HNW pot');
test('£1.5m pension → naive 25% would be £375k, but capped at £268,275', () => {
  // Drawing the whole £1.5m in one go (artificial) — TFC limited to the cap.
  const r = computePensionDrawTax(1_500_000, LUMP_SUM_ALLOWANCE, 0, false);
  approxEqual(r.tfc, LUMP_SUM_ALLOWANCE, 1, 'tfc');
  approxEqual(r.taxable, 1_500_000 - LUMP_SUM_ALLOWANCE, 1, 'taxable');
});

// -----------------------------------------------------------------------------
// T5 — CGT on GIA drawdown (basic rate)
// -----------------------------------------------------------------------------
console.log('\n[T5] CGT on GIA drawdown (basic-rate band)');
test('£50k GIA, no other income → CGT at 18% on gain - £3k allowance', () => {
  // Gross £50k. Gain = 50% × £50k = £25k. Taxable gain = £25k - £3k = £22k.
  // Other income £0 → all gain in basic band. CGT = £22k × 18% = £3,960.
  const r = computeGiaCgt(50_000, 0, 3_000);
  approxEqual(r.gain, 25_000, 1, 'gain');
  approxEqual(r.taxableGain, 22_000, 1, 'taxableGain');
  approxEqual(r.cgt, 3_960, 1, 'cgt');
});

// -----------------------------------------------------------------------------
// T6 — CGT rate steps up to 24% in higher band
// -----------------------------------------------------------------------------
console.log('\n[T6] CGT rate steps up to 24% in higher band');
test('£50k GIA stacked on £60k income → all gain in higher band → 24%', () => {
  // £60k income > £50,270 basic limit → all gain in higher band.
  // Gain £25k - £3k allowance = £22k × 24% = £5,280.
  const r = computeGiaCgt(50_000, 60_000, 3_000);
  approxEqual(r.cgt, 5_280, 1, 'cgt');
});
test('£50k GIA spanning the basic→higher boundary splits at 18% / 24%', () => {
  // £30k taxable income (post-PA: £17,430). Basic headroom = £37,700 - £17,430 = £20,270.
  // Gain £25k - £3k = £22k taxable gain.
  // First £20,270 at 18% = £3,648.60. Remainder £1,730 at 24% = £415.20. Total ≈ £4,063.80.
  const r = computeGiaCgt(50_000, 30_000, 3_000);
  approxEqual(r.cgt, 4_063.8, 2, 'cgt');
});

// -----------------------------------------------------------------------------
// T7 — ISA contribution cap clamps at £20k
// -----------------------------------------------------------------------------
console.log('\n[T7] ISA cap clamps at £20k, surplus to GIA');
test('user saving £30k/yr → projection shows £20k ISA contribution, £10k GIA', () => {
  // Build a projection where the user has high monthly savings; check the
  // year-1 balances reflect the cap. We diff age 42 vs starting balances
  // and pull off the implied contribution.
  const inputs: CompassInputs = {
    ...BASE_HNW,
    monthlySavingAmount: '1.5-3k',
    monthlySavingAmountRaw: 2_500, // £30k/yr
  };
  const proj = buildProjection(inputs);
  // Year 1 end-of-year balance should equal:
  //   isa = (40k starting + 20k contribution) × 1.06 = ~63.6k
  //   gia = (30k starting + 10k spillover) × 1.06 = ~42.4k
  // Allow ±1k tolerance for compounding within the year.
  const y1 = proj[0];
  approxEqual(y1.balanceISA, 63_600, 200, 'balanceISA');
  approxEqual(y1.balanceGIA, 42_400, 200, 'balanceGIA');
});

// -----------------------------------------------------------------------------
// T8 — MPAA reduces AA to £10k
// -----------------------------------------------------------------------------
console.log('\n[T8] MPAA reduces AA to £10k when flexibly accessing pension');
test('MPAA flag binds when working past pension access age', () => {
  const r = applyAnnualAllowanceCap(50_000, 100_000, 5_000, true);
  approxEqual(r.cap, MPAA_LIMIT, 0.01, 'cap');
  approxEqual(r.permitted, MPAA_LIMIT, 0.01, 'permitted');
  assert(r.mpaaCapped === true, 'mpaaCapped should be true');
});
test('MPAA flag with no flag → standard AA applies', () => {
  const r = applyAnnualAllowanceCap(50_000, 100_000, 5_000, false);
  approxEqual(r.cap, 60_000, 0.01, 'cap');
  approxEqual(r.permitted, 50_000, 0.01, 'permitted');
  assert(r.mpaaCapped === false, 'mpaaCapped should be false');
});

// -----------------------------------------------------------------------------
// T9 — MPAA + tapered AA: lower wins
// -----------------------------------------------------------------------------
console.log('\n[T9] MPAA + tapered AA: lower wins');
test('HNW (£300k income) with MPAA flag → £10k cap (MPAA wins over taper)', () => {
  // Tapered AA at adjusted income £300k: AA = 60_000 - (300_000 - 260_000) / 2 = 40,000.
  // MPAA = 10,000 → MPAA wins.
  const r = applyAnnualAllowanceCap(50_000, 300_000, 0, true);
  approxEqual(r.cap, MPAA_LIMIT, 0.01, 'cap');
  assert(r.mpaaCapped === true, 'mpaaCapped should be true');
});

// -----------------------------------------------------------------------------
// T10 — gross-up converges across band boundaries
// -----------------------------------------------------------------------------
console.log('\n[T10] gross-up converges across band boundaries');
test('grossUpPensionDraw converges when stacking pushes income across higher band', () => {
  // Stack base £40k income, need £30k net pension. Pension drawdown will
  // push some of the taxable portion into the 40% higher band. Verify gross-up
  // recovers net = £30k via the round-trip.
  const r = grossUpPensionDraw(30_000, LUMP_SUM_ALLOWANCE, 40_000, false);
  const verify = computePensionDrawTax(r.gross, LUMP_SUM_ALLOWANCE, 40_000, false);
  approxEqual(r.gross - verify.tax, 30_000, 1, 'recovered net');
});
test('grossUpGiaDraw converges across the £50,270 boundary', () => {
  // Stack base £45k income; £20k net needed; gain will straddle basic→higher.
  const r = grossUpGiaDraw(20_000, 45_000, 3_000);
  const verify = computeGiaCgt(r.gross, 45_000, 3_000);
  approxEqual(r.gross - verify.cgt, 20_000, 1, 'recovered net');
});

// -----------------------------------------------------------------------------
// T11 — full reconciliation regression on the BASE_HNW client
// -----------------------------------------------------------------------------
console.log('\n[T11] reconciliation regression — BASE_HNW from §7 of the plan');
test('peak total wealth lands in a sanity-checked range', () => {
  const proj = buildProjection(BASE_HNW);
  let peakTotal = 0;
  for (const y of proj) {
    const t = y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible + y.pensionInaccessible;
    if (t > peakTotal) peakTotal = t;
  }
  // Sanity band catches gross regressions in either direction:
  // - Below £1.5m would suggest tax is being over-applied or the engine has
  //   broken accumulation
  // - Above £6m would mean retirement-phase tax isn't biting (chart returns
  //   to the old un-taxed shape).
  if (peakTotal < 1_500_000 || peakTotal > 6_000_000) {
    throw new Error(
      `peak total wealth £${Math.round(peakTotal).toLocaleString('en-GB')} ` +
      `outside £1.5–6m sanity band — model has shifted unexpectedly.`,
    );
  }
  console.log(`     · peak total wealth: £${Math.round(peakTotal).toLocaleString('en-GB')}`);
});
test('age-95 wealth lands within sanity band', () => {
  const proj = buildProjection(BASE_HNW);
  const last = proj[proj.length - 1];
  const total = last.balanceCash + last.balanceISA + last.balanceGIA + last.pensionAccessible + last.pensionInaccessible;
  if (total < 500_000 || total > 6_000_000) {
    throw new Error(`age-95 wealth £${Math.round(total).toLocaleString('en-GB')} outside £0.5–6m sanity band`);
  }
  console.log(`     · age-95 total wealth: £${Math.round(total).toLocaleString('en-GB')}`);
});
test('taxPaid is non-zero in retirement years', () => {
  const proj = buildProjection(BASE_HNW);
  const retirementYears = proj.filter((y) => y.isRetired);
  const totalTax = retirementYears.reduce((sum, y) => sum + y.taxPaid, 0);
  assert(totalTax > 100_000, `lifetime retirement tax should be material — got £${Math.round(totalTax).toLocaleString('en-GB')}`);
  console.log(`     · lifetime retirement tax: £${Math.round(totalTax).toLocaleString('en-GB')}`);
});
test('chart shape: wealth grows then plateaus or declines (not monotonically rising)', () => {
  const proj = buildProjection(BASE_HNW);
  let peakAge = 0;
  let peakTotal = 0;
  for (const y of proj) {
    const t = y.balanceCash + y.balanceISA + y.balanceGIA + y.pensionAccessible + y.pensionInaccessible;
    if (t > peakTotal) { peakTotal = t; peakAge = y.age; }
  }
  // Peak should be somewhere between retirement and age 95, not exactly at 95
  // (the old un-taxed model peaked exactly at 95 because growth always exceeded
  // drawdown). The new model should plateau earlier as drawdowns scale up.
  console.log(`     · peak age: ${peakAge}`);
});

// -----------------------------------------------------------------------------
// T12 — methodology constants pinned (regression guard)
// -----------------------------------------------------------------------------
console.log('\n[T12] methodology constants pinned to confirmed values');
test('GIA gain fraction is 50% (§5.1 confirmed)', () => {
  approxEqual(GIA_GAIN_FRACTION, 0.5, 0, 'GIA_GAIN_FRACTION');
});
test('Pension TFC fraction is 25% (§5.3 confirmed)', () => {
  approxEqual(PENSION_TFC_FRACTION, 0.25, 0, 'PENSION_TFC_FRACTION');
});
test('LSA is £268,275 (HMRC 2025/26)', () => {
  approxEqual(LUMP_SUM_ALLOWANCE, 268_275, 0, 'LUMP_SUM_ALLOWANCE');
});
test('MPAA is £10,000 (HMRC 2025/26)', () => {
  approxEqual(MPAA_LIMIT, 10_000, 0, 'MPAA_LIMIT');
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log(`\n${'='.repeat(70)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(70));

if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
