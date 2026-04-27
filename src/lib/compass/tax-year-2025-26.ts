/**
 * UK tax-year constants — 2025/26.
 *
 * Single source of truth for every regulated number used by the projection
 * engine and tile-scoring rules. When April rolls around, this is the only
 * file that needs touching.
 *
 * Sources:
 *   - HMRC rates and allowances (April 2025)
 *   - DWP state pension (full new state pension, 2025/26: £230.25/week → £11,973
 *     once the next uprating lands; we use the published 2025/26 rate of £11,502)
 *   - State Pension Act 2014 + Pensions Act 2007 timetables for SPA changes
 */

import type { RiskProfile } from './types';

// -----------------------------------------------------------------------------
// Tax year identifier
// -----------------------------------------------------------------------------

export const TAX_YEAR = '2025/26' as const;

// -----------------------------------------------------------------------------
// Income tax — rest of UK (rUK)
// -----------------------------------------------------------------------------

export const PERSONAL_ALLOWANCE = 12_570;
export const BASIC_RATE_LIMIT = 50_270;        // upper end of the basic rate band
export const HIGHER_RATE_LIMIT = 125_140;      // additional rate kicks in above this
export const PA_TAPER_START = 100_000;         // £1 of PA lost for every £2 over this

export const RUK_BASIC_RATE = 0.20;
export const RUK_HIGHER_RATE = 0.40;
export const RUK_ADDITIONAL_RATE = 0.45;

// -----------------------------------------------------------------------------
// Income tax — Scotland (2025/26)
// -----------------------------------------------------------------------------
//
// Scottish bands sit on top of the rUK Personal Allowance (PA is reserved by
// Westminster). Order matters; the engine walks them in sequence.
// -----------------------------------------------------------------------------

export interface ScottishBand {
  /** Upper bound of this band (inclusive of taxable amount, exclusive of next). */
  upperBound: number;
  rate: number;
  label: string;
}

export const SCOTTISH_BANDS: readonly ScottishBand[] = [
  { upperBound: 14_876,  rate: 0.19, label: 'starter' },     // £12,571–£14,876
  { upperBound: 26_561,  rate: 0.20, label: 'basic' },       // £14,877–£26,561
  { upperBound: 43_662,  rate: 0.21, label: 'intermediate' },// £26,562–£43,662
  { upperBound: 75_000,  rate: 0.42, label: 'higher' },      // £43,663–£75,000
  { upperBound: 125_140, rate: 0.45, label: 'advanced' },    // £75,001–£125,140
  { upperBound: Infinity, rate: 0.48, label: 'top' },        // above £125,140
] as const;

// -----------------------------------------------------------------------------
// National Insurance (Class 1, employee)
// -----------------------------------------------------------------------------

export const NI_PRIMARY_THRESHOLD = 12_570;
export const NI_UPPER_EARNINGS_LIMIT = 50_270;
export const NI_MAIN_RATE = 0.08;
export const NI_HIGHER_RATE = 0.02;

// -----------------------------------------------------------------------------
// State pension — 2025/26 full new state pension
// -----------------------------------------------------------------------------

export const STATE_PENSION_FULL = 11_502;
export const STATE_PENSION_FULL_QUALIFYING_YEARS = 35;

/**
 * State Pension Age (SPA) lookup — returns the SPA for someone born in `year`.
 *
 * Reflects the State Pension Act 2014 timetable:
 *   - Born before 6 Apr 1960: SPA 66 (already crystallised, treat as 66)
 *   - Born 6 Apr 1960 – 5 Mar 1961: SPA 66 + N months (we approximate as 66)
 *   - Born 6 Mar 1961 – 5 Apr 1977: SPA 67
 *   - Born 6 Apr 1977 onwards: SPA 68 (under current legislation, may shift earlier)
 *
 * The form collects age, not DOB, so we infer birth year from `currentAge` and
 * the current tax year. Edge accuracy of ±1 year is acceptable here.
 */
export function statePensionAgeForBirthYear(birthYear: number): number {
  if (birthYear < 1960) return 66;
  if (birthYear <= 1977) return 67;
  return 68;
}

// -----------------------------------------------------------------------------
// Pension access — normal minimum pension age (NMPA)
// -----------------------------------------------------------------------------
//
// NMPA rises from 55 to 57 on 6 April 2028. After that, anyone reaching 55
// after that date can't access until 57. We expose a function so this is
// future-proof.
// -----------------------------------------------------------------------------

export const PENSION_ACCESS_AGE_BEFORE_2028 = 55;
export const PENSION_ACCESS_AGE_FROM_2028 = 57;

/**
 * Returns the age at which the user can first access their DC pension.
 * `currentYear` defaults to the live calendar year.
 */
export function pensionAccessAgeForUser(birthYear: number, currentYear: number = new Date().getFullYear()): number {
  // If they reach 55 before 6 April 2028, they keep the old NMPA.
  const reaches55In = birthYear + 55;
  if (reaches55In < 2028) return PENSION_ACCESS_AGE_BEFORE_2028;
  return PENSION_ACCESS_AGE_FROM_2028;
}

// -----------------------------------------------------------------------------
// Pension allowances
// -----------------------------------------------------------------------------

/** Standard Annual Allowance — gross contributions (incl. employer + tax relief). */
export const ANNUAL_ALLOWANCE = 60_000;

/** Threshold income above which tapering kicks in. */
export const ANNUAL_ALLOWANCE_TAPER_THRESHOLD = 200_000;

/** Adjusted income above which AA tapers down. */
export const ANNUAL_ALLOWANCE_TAPER_ADJUSTED_INCOME = 260_000;

/** Minimum tapered AA (floor). */
export const ANNUAL_ALLOWANCE_TAPERED_FLOOR = 10_000;

/** Lump Sum Allowance (replaces 25% of LTA cap from 6 Apr 2024). */
export const LUMP_SUM_ALLOWANCE = 268_275;

/** Lump Sum and Death Benefit Allowance. */
export const LUMP_SUM_AND_DEATH_BENEFIT_ALLOWANCE = 1_073_100;

// -----------------------------------------------------------------------------
// Investment / dividend / CGT allowances
// -----------------------------------------------------------------------------

export const ISA_ANNUAL_ALLOWANCE = 20_000;
export const DIVIDEND_ALLOWANCE = 500;
export const CAPITAL_GAINS_ALLOWANCE = 3_000;
export const CGT_BASIC_RATE = 0.18;
export const CGT_HIGHER_RATE = 0.24;
export const SAVINGS_ALLOWANCE_BASIC = 1_000;
export const SAVINGS_ALLOWANCE_HIGHER = 500;

// -----------------------------------------------------------------------------
// Inheritance Tax
// -----------------------------------------------------------------------------

export const IHT_NRB = 325_000;                  // Nil-Rate Band
export const IHT_RNRB_PER_PERSON = 175_000;      // Residence Nil-Rate Band
export const IHT_RNRB_TAPER_START = 2_000_000;   // Taper £1 per £2 above this
export const IHT_RATE = 0.40;
export const IHT_REDUCED_RATE = 0.36;            // Where 10%+ of estate left to charity
export const IHT_GIFT_CLOCK_YEARS = 7;

// -----------------------------------------------------------------------------
// Income trap (loss of personal allowance £100k–£125,140)
// -----------------------------------------------------------------------------

export const TAX_TRAP_LOWER = PA_TAPER_START;       // £100,000
export const TAX_TRAP_UPPER = HIGHER_RATE_LIMIT;    // £125,140

// -----------------------------------------------------------------------------
// High-Income Child Benefit Charge (HICBC) — taper £60k–£80k from 2024/25
// -----------------------------------------------------------------------------

export const HICBC_LOWER = 60_000;
export const HICBC_UPPER = 80_000;

// -----------------------------------------------------------------------------
// Long-run model assumptions (real, after inflation)
// -----------------------------------------------------------------------------
//
// These are the engine's assumed long-run rates. They're disclosed in the
// Assumptions footer and can be overridden at report-render time.
// -----------------------------------------------------------------------------

export const INFLATION = 0.025;
export const CASH_GROWTH = 0.025;

/**
 * Real income growth (above inflation). 2.5% is a long-run UK average for
 * private-sector earnings; conservative for a younger user, generous for
 * someone near the end of their career.
 */
export const INCOME_GROWTH = 0.025;

export const GROWTH_BY_RISK: Record<RiskProfile, number> = {
  cautious: 0.04,
  balanced: 0.06,
  adventurous: 0.08,
};

/** Default planning horizon (life expectancy). */
export const LIFE_EXPECTANCY = 95;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Approximate birth year from current age and current calendar year.
 * Used when the form collects age but not DOB.
 */
export function birthYearFromAge(currentAge: number, currentYear: number = new Date().getFullYear()): number {
  return currentYear - currentAge;
}
