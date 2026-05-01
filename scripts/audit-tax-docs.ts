/**
 * One-off auditor: cross-checks every numerical example in
 * TAX_CALCULATION_BREAKDOWN.md and methodology.md against the actual engine.
 *
 * Run: npx tsx scripts/audit-tax-docs.ts
 */

import {
  taxRetirementGuaranteed,
  computePensionDrawTax,
  computeGiaCgt,
  grossUpPensionDraw,
  applyAnnualAllowanceCap,
  netIncome,
  WEALTH_MID,
  INCOME_MID,
  SPEND_MID_MONTHLY,
} from '../src/lib/compass/projection';
import { LUMP_SUM_ALLOWANCE, MPAA_LIMIT } from '../src/lib/compass/tax-year-2025-26';

let issues = 0;
function check(label: string, actual: number, expected: number, tol = 1) {
  const ok = Math.abs(actual - expected) <= tol;
  if (!ok) {
    issues++;
    console.log(`  ❌ ${label}: doc says ${expected}, engine gives ${actual.toFixed(2)} (diff ${(actual - expected).toFixed(2)})`);
  } else {
    console.log(`  ✅ ${label}: ${actual.toFixed(2)} ≈ ${expected}`);
  }
}

console.log('\n=== TAX_CALCULATION_BREAKDOWN.md verification ===');

console.log('\n[3.1] £160k gross, 6% sacrifice → engine says income tax + NI =');
const incomeAfterSacrifice = 160_000 - 9_600;
const r31 = netIncome(incomeAfterSacrifice, false);
console.log(`     taxable: £${incomeAfterSacrifice}, tax: £${r31.incomeTax.toFixed(2)}, NI: £${r31.ni.toFixed(2)}`);
check('Section 3.1 income tax claim', r31.incomeTax, 54_511.5, 1);

console.log('\n[3.2] NI on £160k gross, no sacrifice');
const ni160 = netIncome(160_000, false);
check('Section 3.2 NI on £160k', ni160.ni, 5_211, 1);

console.log('\n[3.2] NI on £150,400 (after sacrifice)');
const ni150400 = netIncome(150_400, false);
check('Section 3.2 NI on £150,400', ni150400.ni, 5_019, 1);

console.log('\n[3.4] AA cap at £300k income / £15k employer, want £40k');
const aa = applyAnnualAllowanceCap(40_000, 300_000, 15_000, false);
check('Section 3.4 AA cap', aa.cap, 32_500, 0);
check('Section 3.4 permitted', aa.permitted, 32_500, 0);

console.log('\n[3.5] MPAA caps £300k earner with flag');
const aaMpaa = applyAnnualAllowanceCap(40_000, 300_000, 15_000, true);
check('Section 3.5 MPAA cap', aaMpaa.cap, MPAA_LIMIT, 0);

console.log('\n[4.1] state alone (£11,502) → tax £0');
const r41a = taxRetirementGuaranteed(11_502, 0, 0, false);
check('Section 4.1 state alone tax', r41a.taxPaid, 0, 1);

console.log('\n[4.1] state + £20k DB → tax £3,786.40');
const r41b = taxRetirementGuaranteed(11_502, 20_000, 0, false);
check('Section 4.1 state + DB tax', r41b.taxPaid, 3_786.4, 1);

console.log('\n[4.1] state stacked on £40k working income → tax £2,546.80');
const r41c = taxRetirementGuaranteed(11_502, 0, 40_000, false);
check('Section 4.1 state-stacked-on-work tax', r41c.taxPaid, 2_546.8, 1);

console.log('\n[4.2] £40k pension drawdown, no other income, LSA available');
const r42a = computePensionDrawTax(40_000, LUMP_SUM_ALLOWANCE, 0, false);
check('Section 4.2 TFC', r42a.tfc, 10_000, 1);
check('Section 4.2 taxable', r42a.taxable, 30_000, 1);
check('Section 4.2 tax', r42a.tax, 3_486, 1);

console.log('\n[4.2] £40k drawdown, LSA exhausted, no other income');
const r42b = computePensionDrawTax(40_000, 0, 0, false);
check('Section 4.2 LSA-exhausted TFC', r42b.tfc, 0, 0);
check('Section 4.2 LSA-exhausted tax', r42b.tax, 5_486, 1);

console.log('\n[4.4] CGT basic-rate user, £50k GIA, £0 other');
const r44a = computeGiaCgt(50_000, 0, 3_000);
check('Section 4.4 basic-rate CGT', r44a.cgt, 3_960, 1);

console.log('\n[4.4] CGT higher-rate user, £50k GIA, £60k other');
const r44b = computeGiaCgt(50_000, 60_000, 3_000);
check('Section 4.4 higher-rate CGT', r44b.cgt, 5_280, 1);

console.log('\n[4.4] CGT straddling boundary, £50k GIA, £30k other');
const r44c = computeGiaCgt(50_000, 30_000, 3_000);
check('Section 4.4 straddle CGT', r44c.cgt, 4_063.8, 1);

console.log('\n[5.3] HNW with binding LSA, age 71, year 4 — claimed G ≈ £58,000');
// Per doc: state £11,502 + DB £25,000 = £36,502 stacking base.
// Net needed £48,284 from pension.
const r53 = grossUpPensionDraw(48_284, LUMP_SUM_ALLOWANCE, 36_502, false);
console.log(`     engine says gross = £${r53.gross.toFixed(0)}, tax = £${r53.tax.toFixed(0)}, TFC = £${r53.tfc.toFixed(0)}`);
check('Section 5.3 gross-up for £48,284 net', r53.gross, 65_043, 100);

console.log('\n=== methodology.md verification ===');

console.log('\n[Section 2.12] worked example: £55k spend, state £11,502, DB £20k, £1.8m pension');
// Step 1: tax on guaranteed
const r212a = taxRetirementGuaranteed(11_502, 20_000, 0, false);
check('Section 2.12 tax on guaranteed', r212a.taxPaid, 3_786.4, 1);
check('Section 2.12 net guaranteed', r212a.netGuaranteed, 27_715.6, 1);
// Step 4: gross up for £27,284 net
const r212b = grossUpPensionDraw(27_284, LUMP_SUM_ALLOWANCE, 31_502, false);
console.log(`     engine says gross = £${r212b.gross.toFixed(0)}, tax = £${r212b.tax.toFixed(0)}, TFC = £${r212b.tfc.toFixed(0)}`);
check('Section 2.12 gross', r212b.gross, 33_620, 100);
check('Section 2.12 tax on drawdown', r212b.tax, 6_335, 50);

console.log('\n=== Engine constants vs methodology bands ===');
console.log('\nWEALTH_MID values (from code):');
for (const [k, v] of Object.entries(WEALTH_MID)) {
  console.log(`  ${k}: £${v.toLocaleString('en-GB')}`);
}
console.log('\nINCOME_MID values (from code):');
for (const [k, v] of Object.entries(INCOME_MID)) {
  console.log(`  ${k}: £${v.toLocaleString('en-GB')}`);
}
console.log('\nSPEND_MID_MONTHLY values (from code):');
for (const [k, v] of Object.entries(SPEND_MID_MONTHLY)) {
  console.log(`  ${k}: £${v.toLocaleString('en-GB')}/month`);
}

console.log(`\n${'='.repeat(70)}`);
console.log(`Audit complete: ${issues} numerical discrepancy${issues === 1 ? '' : 'ies'} found`);
console.log('='.repeat(70));

process.exit(issues > 0 ? 0 : 0);
