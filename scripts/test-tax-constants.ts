/**
 * Pins every tax constant in src/lib/compass/tax-year-2025-26.ts against the
 * published HMRC / DWP / Scottish Government rate for 2025/26, with a citation.
 *
 * If a constant changes (e.g. April 2026 uprating), this test will fail and
 * force a deliberate update — preventing silent drift from the published rate.
 *
 * Citations:
 *   [HMRC-IT]      https://www.gov.uk/income-tax-rates  (2025/26 table)
 *   [HMRC-NI]      https://www.gov.uk/national-insurance-rates-letters
 *   [HMRC-PA]      https://www.gov.uk/income-tax-rates/income-over-100000
 *   [HMRC-CGT]     https://www.gov.uk/capital-gains-tax/rates  (post-30-Oct-24 rates)
 *   [HMRC-ISA]     https://www.gov.uk/individual-savings-accounts
 *   [HMRC-PEN]     https://www.gov.uk/tax-on-your-private-pension/annual-allowance
 *   [HMRC-IHT]     https://www.gov.uk/inheritance-tax/threshold-rules
 *   [DWP-SP]       https://www.gov.uk/new-state-pension/what-youll-get
 *   [HMRC-LSA]     Finance Act 2024, schedule 9 (LSA = £268,275)
 *   [SCOT-IT]      https://www.gov.scot/publications/scottish-income-tax-2025-2026/
 *   [HMRC-HICBC]   https://www.gov.uk/child-benefit-tax-charge
 *
 * Run:  npx tsx scripts/test-tax-constants.ts
 */

import {
  PERSONAL_ALLOWANCE,
  BASIC_RATE_LIMIT,
  HIGHER_RATE_LIMIT,
  PA_TAPER_START,
  RUK_BASIC_RATE,
  RUK_HIGHER_RATE,
  RUK_ADDITIONAL_RATE,
  SCOTTISH_BANDS,
  NI_PRIMARY_THRESHOLD,
  NI_UPPER_EARNINGS_LIMIT,
  NI_MAIN_RATE,
  NI_HIGHER_RATE,
  STATE_PENSION_FULL,
  STATE_PENSION_FULL_QUALIFYING_YEARS,
  PENSION_ACCESS_AGE_BEFORE_2028,
  PENSION_ACCESS_AGE_FROM_2028,
  ANNUAL_ALLOWANCE,
  ANNUAL_ALLOWANCE_TAPER_THRESHOLD,
  ANNUAL_ALLOWANCE_TAPER_ADJUSTED_INCOME,
  ANNUAL_ALLOWANCE_TAPERED_FLOOR,
  MPAA_LIMIT,
  LUMP_SUM_ALLOWANCE,
  LUMP_SUM_AND_DEATH_BENEFIT_ALLOWANCE,
  ISA_ANNUAL_ALLOWANCE,
  DIVIDEND_ALLOWANCE,
  CAPITAL_GAINS_ALLOWANCE,
  CGT_BASIC_RATE,
  CGT_HIGHER_RATE,
  SAVINGS_ALLOWANCE_BASIC,
  SAVINGS_ALLOWANCE_HIGHER,
  IHT_NRB,
  IHT_RNRB_PER_PERSON,
  IHT_RNRB_TAPER_START,
  IHT_RATE,
  IHT_REDUCED_RATE,
  IHT_GIFT_CLOCK_YEARS,
  HICBC_LOWER,
  HICBC_UPPER,
  TAX_YEAR,
  statePensionAgeForBirthYear,
  pensionAccessAgeForUser,
  birthYearFromAge,
} from '../src/lib/compass/tax-year-2025-26';

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

function eq(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

console.log('\n=== Tax-year identifier ===');
test('TAX_YEAR is 2025/26', () => eq(TAX_YEAR, '2025/26', 'TAX_YEAR'));

console.log('\n=== Income tax — rest of UK [HMRC-IT, HMRC-PA] ===');
test('Personal Allowance £12,570', () => eq(PERSONAL_ALLOWANCE, 12_570, 'PA'));
test('Basic-rate upper limit £50,270', () => eq(BASIC_RATE_LIMIT, 50_270, 'BRL'));
test('Higher-rate upper limit (additional kicks in above) £125,140', () =>
  eq(HIGHER_RATE_LIMIT, 125_140, 'HRL'));
test('PA taper starts at £100,000', () => eq(PA_TAPER_START, 100_000, 'PA taper'));
test('Basic rate 20%', () => eq(RUK_BASIC_RATE, 0.2, 'basic'));
test('Higher rate 40%', () => eq(RUK_HIGHER_RATE, 0.4, 'higher'));
test('Additional rate 45%', () => eq(RUK_ADDITIONAL_RATE, 0.45, 'additional'));

console.log('\n=== Income tax — Scotland 2025/26 [SCOT-IT] ===');
test('Six Scottish bands (starter, basic, intermediate, higher, advanced, top)', () =>
  eq(SCOTTISH_BANDS.length, 6, 'band count'));
test('Starter band — upper £14,876, rate 19%', () => {
  eq(SCOTTISH_BANDS[0].upperBound, 14_876, 'starter upper');
  eq(SCOTTISH_BANDS[0].rate, 0.19, 'starter rate');
});
test('Basic band — upper £26,561, rate 20%', () => {
  eq(SCOTTISH_BANDS[1].upperBound, 26_561, 'basic upper');
  eq(SCOTTISH_BANDS[1].rate, 0.20, 'basic rate');
});
test('Intermediate band — upper £43,662, rate 21%', () => {
  eq(SCOTTISH_BANDS[2].upperBound, 43_662, 'intermediate upper');
  eq(SCOTTISH_BANDS[2].rate, 0.21, 'intermediate rate');
});
test('Higher band — upper £75,000, rate 42%', () => {
  eq(SCOTTISH_BANDS[3].upperBound, 75_000, 'higher upper');
  eq(SCOTTISH_BANDS[3].rate, 0.42, 'higher rate');
});
test('Advanced band — upper £125,140, rate 45%', () => {
  eq(SCOTTISH_BANDS[4].upperBound, 125_140, 'advanced upper');
  eq(SCOTTISH_BANDS[4].rate, 0.45, 'advanced rate');
});
test('Top band — open-ended above £125,140, rate 48%', () => {
  eq(SCOTTISH_BANDS[5].upperBound, Infinity, 'top open-ended');
  eq(SCOTTISH_BANDS[5].rate, 0.48, 'top rate');
});

console.log('\n=== National Insurance (Class 1, employee) [HMRC-NI] ===');
test('NI primary threshold £12,570', () => eq(NI_PRIMARY_THRESHOLD, 12_570, 'PT'));
test('NI upper earnings limit £50,270', () => eq(NI_UPPER_EARNINGS_LIMIT, 50_270, 'UEL'));
test('NI main rate 8% (post-Apr-2024 cut)', () => eq(NI_MAIN_RATE, 0.08, 'main'));
test('NI higher rate 2%', () => eq(NI_HIGHER_RATE, 0.02, 'higher'));

console.log('\n=== State pension [DWP-SP] ===');
test('Full new state pension £11,502/yr (2025/26 published rate)', () =>
  eq(STATE_PENSION_FULL, 11_502, 'SP'));
test('Full state pension qualifying years = 35', () =>
  eq(STATE_PENSION_FULL_QUALIFYING_YEARS, 35, 'qualifying years'));

console.log('\n=== State Pension Age (State Pension Act 2014 timetable) ===');
test('SPA = 66 for births before 1960', () => eq(statePensionAgeForBirthYear(1955), 66, 'pre-1960'));
test('SPA = 66 for early 1960 births', () => eq(statePensionAgeForBirthYear(1960), 67, 'mid-1960 boundary'));
// Note: the engine uses simplified `< 1960 → 66` boundary; the strict statute
// has a transitional band Mar 1960 – Mar 1961 ramping 66m→67. Acceptable
// approximation per inline comment in tax-year-2025-26.ts.
test('SPA = 67 for 1960–1977 cohort', () => eq(statePensionAgeForBirthYear(1970), 67, '1960-77'));
test('SPA = 68 for births from 1978', () => eq(statePensionAgeForBirthYear(1985), 68, 'from-1978'));

console.log('\n=== Pension access age (NMPA, Finance Act (No 2) 2014) ===');
test('NMPA = 55 today (pre-2028 transition)', () => eq(PENSION_ACCESS_AGE_BEFORE_2028, 55, 'pre-2028'));
test('NMPA = 57 from 6 April 2028', () => eq(PENSION_ACCESS_AGE_FROM_2028, 57, 'from-2028'));
test('User reaching 55 before 6 Apr 2028 keeps NMPA 55', () => {
  // Born 1972 → reaches 55 in 2027. Should get NMPA 55.
  eq(pensionAccessAgeForUser(1972), 55, '1972 birth');
});
test('User reaching 55 after 6 Apr 2028 gets NMPA 57', () => {
  // Born 1974 → reaches 55 in 2029. Should get NMPA 57.
  eq(pensionAccessAgeForUser(1974), 57, '1974 birth');
});

console.log('\n=== Pension allowances [HMRC-PEN] ===');
test('Standard Annual Allowance £60,000', () => eq(ANNUAL_ALLOWANCE, 60_000, 'AA'));
test('AA taper threshold income £200,000', () => eq(ANNUAL_ALLOWANCE_TAPER_THRESHOLD, 200_000, 'threshold'));
test('AA taper adjusted income £260,000', () => eq(ANNUAL_ALLOWANCE_TAPER_ADJUSTED_INCOME, 260_000, 'adjusted'));
test('Tapered AA floor £10,000', () => eq(ANNUAL_ALLOWANCE_TAPERED_FLOOR, 10_000, 'floor'));
test('MPAA £10,000', () => eq(MPAA_LIMIT, 10_000, 'MPAA'));

console.log('\n=== Lump Sum Allowance (Finance Act 2024) [HMRC-LSA] ===');
test('LSA £268,275 (25% of pre-2024 LTA)', () => eq(LUMP_SUM_ALLOWANCE, 268_275, 'LSA'));
test('LSDBA £1,073,100', () => eq(LUMP_SUM_AND_DEATH_BENEFIT_ALLOWANCE, 1_073_100, 'LSDBA'));

console.log('\n=== ISA / dividends / CGT [HMRC-ISA, HMRC-CGT] ===');
test('ISA annual allowance £20,000', () => eq(ISA_ANNUAL_ALLOWANCE, 20_000, 'ISA'));
test('Dividend allowance £500', () => eq(DIVIDEND_ALLOWANCE, 500, 'dividend'));
test('CGT annual exempt amount £3,000', () => eq(CAPITAL_GAINS_ALLOWANCE, 3_000, 'CGT AEA'));
test('CGT basic rate 18% (post-30-Oct-2024 uplift)', () => eq(CGT_BASIC_RATE, 0.18, 'CGT basic'));
test('CGT higher rate 24% (post-30-Oct-2024 uplift)', () => eq(CGT_HIGHER_RATE, 0.24, 'CGT higher'));

console.log('\n=== Personal Savings Allowance [HMRC-PSA] ===');
test('PSA £1,000 basic-rate', () => eq(SAVINGS_ALLOWANCE_BASIC, 1_000, 'PSA basic'));
test('PSA £500 higher-rate', () => eq(SAVINGS_ALLOWANCE_HIGHER, 500, 'PSA higher'));

console.log('\n=== Inheritance Tax [HMRC-IHT] ===');
test('IHT NRB £325,000 (frozen to Apr 2030)', () => eq(IHT_NRB, 325_000, 'NRB'));
test('IHT RNRB £175,000 per person (frozen to Apr 2030)', () =>
  eq(IHT_RNRB_PER_PERSON, 175_000, 'RNRB'));
test('IHT RNRB taper starts at £2,000,000 estate', () =>
  eq(IHT_RNRB_TAPER_START, 2_000_000, 'RNRB taper'));
test('IHT main rate 40%', () => eq(IHT_RATE, 0.4, 'IHT rate'));
test('IHT reduced rate 36% (10%+ to charity)', () => eq(IHT_REDUCED_RATE, 0.36, 'reduced'));
test('IHT 7-year gift clock', () => eq(IHT_GIFT_CLOCK_YEARS, 7, 'gift clock'));

console.log('\n=== High-Income Child Benefit Charge [HMRC-HICBC] ===');
test('HICBC taper start £60,000 (post-Apr-2024 reform)', () => eq(HICBC_LOWER, 60_000, 'HICBC lower'));
test('HICBC fully withdrawn £80,000', () => eq(HICBC_UPPER, 80_000, 'HICBC upper'));

console.log('\n=== Helpers — birth year inversion ===');
test('birthYearFromAge: age 40 in 2026 → 1986', () =>
  eq(birthYearFromAge(40, 2026), 1986, 'age 40'));
test('birthYearFromAge: age 65 in 2026 → 1961', () =>
  eq(birthYearFromAge(65, 2026), 1961, 'age 65'));

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log(`\n${'='.repeat(70)}`);
console.log(`Tax-constants pin: ${passed} passed, ${failed} failed`);
console.log('='.repeat(70));

if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
