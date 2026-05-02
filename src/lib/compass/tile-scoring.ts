/**
 * Compass tile-scoring engine.
 *
 * Pure-function engine that turns a client's `CompassInputs` + `CompassReport`
 * into 12 per-tile `{ status, metrics, scoreable }` objects. `status` drives
 * the tile colour; `metrics` are pre-formatted strings the template
 * substitution layer consumes to render personalised note text.
 *
 * Invariants:
 *   - No I/O; no randomness; deterministic per-input.
 *   - All metric values are strings (pre-formatted, rounded once at this
 *     boundary). Downstream consumers do zero arithmetic.
 *   - Every tile returns `scoreable: false` when the engine cannot produce a
 *     meaningful score from the available inputs (falls back to authored copy).
 *
 * Thresholds, constants, and per-tile algorithms are sourced from the tile
 * scoring specification.
 */

import type {
  CompassInputs,
  CompassReport,
  WealthBand,
  TileKey,
  TileStatus,
} from './types';
import type { TileScore, TileScoreMap, TileMetrics } from './tile-scoring-types';
import {
  WEALTH_MID,
  INCOME_MID,
  SPEND_MID_MONTHLY,
  CONTRIB_PCT_MID,
  mortgageEndAgeToNumber,
} from './projection';
import {
  TAX_TRAP_LOWER,
  TAX_TRAP_UPPER,
  BASIC_RATE_LIMIT as TAX_BASIC_RATE_THRESHOLD,
} from './tax-year-2025-26';

// -----------------------------------------------------------------------------
// Constants — tile-scoring thresholds (regulatory figures live in tax-year-2025-26.ts)
// -----------------------------------------------------------------------------

const RETIREMENT_MIN_AGE = 35;
const RETIREMENT_GREEN_PCT = 100;
const RETIREMENT_AMBER_PCT = 70;

const PENSION_GREEN_RATIO = 1.0;
const PENSION_AMBER_RATIO = 0.60;

const INV_BUSINESS_CONCENTRATION_RED = 0.40;
const INV_MIN_TOTAL_INVESTABLE = 5_000;

const TAX_TRAP_CONTRIB_PCT = 10;

const CASH_GREEN_MONTHS_DEPENDENT = 6;
const CASH_GREEN_MONTHS_SINGLE = 4;
const CASH_AMBER_MONTHS = 3;

const DEBT_AMBER_MAX_DTI = 0.15;

const MORTGAGE_RED_PTI_PCT = 35;
const MORTGAGE_AMBER_PTI_PCT = 25;

const ESTATE_YOUNG_AGE = 30;
const ESTATE_MIDDLE_AGE = 50;

const PROTECTION_YEARS_TO_RETIREMENT_AMBER = 10;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Safe WEALTH_MID lookup for the `0 | WealthBand` union. */
function wealthMid(v: WealthBand | 0): number {
  return v === 0 ? 0 : WEALTH_MID[v];
}

/** Round a number to a nearest integer and stringify — the house format for all metrics. */
function fmt(n: number): string {
  return Math.round(n).toString();
}

/** Guarded division; returns 0 when denominator is zero or not finite. */
function safeDiv(num: number, denom: number): number {
  if (!isFinite(num) || !isFinite(denom) || denom === 0) return 0;
  return num / denom;
}

/** Convenience factory for grey (not-scoreable) tile results. */
function grey(): TileScore {
  return { status: 'grey', scoreable: false, metrics: {} };
}

// -----------------------------------------------------------------------------
// Per-tile scorers
// -----------------------------------------------------------------------------

function scoreRetirement(inputs: CompassInputs, report: CompassReport): TileScore {
  if (inputs.currentAge < RETIREMENT_MIN_AGE) return grey();

  const { targetCoveragePct, shortfallAge } = report.scores;
  let status: TileStatus;
  if (targetCoveragePct >= RETIREMENT_GREEN_PCT) status = 'green';
  else if (targetCoveragePct >= RETIREMENT_AMBER_PCT) status = 'amber';
  else status = 'red';

  const metrics: TileMetrics = {
    coverage_pct: fmt(targetCoveragePct),
    retire_age: inputs.targetRetirementAge.toString(),
  };
  if (status === 'red' && typeof shortfallAge === 'number') {
    metrics.shortfall_age = shortfallAge.toString();
  }

  return { status, scoreable: true, metrics };
}

function scorePension(inputs: CompassInputs, _report: CompassReport): TileScore {
  const alreadyRetired = inputs.currentAge >= inputs.targetRetirementAge;
  if (alreadyRetired) return grey();

  const combinedPct =
    CONTRIB_PCT_MID[inputs.employerPensionContribPct] +
    CONTRIB_PCT_MID[inputs.ownPensionContribPct];
  const ageTargetPct = Math.round(inputs.currentAge / 2);
  const ratio = ageTargetPct > 0 ? combinedPct / ageTargetPct : 0;

  let status: TileStatus;
  if (ratio >= PENSION_GREEN_RATIO) status = 'green';
  else if (ratio >= PENSION_AMBER_RATIO) status = 'amber';
  else status = 'red';

  const pensionValue = wealthMid(inputs.totalPensionValue);
  const income = INCOME_MID[inputs.householdGrossIncome];
  const yearsToRetirement = Math.max(0, inputs.targetRetirementAge - inputs.currentAge);
  const targetPot = (ageTargetPct / 100) * income * yearsToRetirement;
  const gap = Math.max(0, targetPot - pensionValue);

  return {
    status,
    scoreable: true,
    metrics: {
      contrib_pct: fmt(combinedPct),
      age_target_pct: fmt(ageTargetPct),
      pension_k: fmt(pensionValue / 1000),
      gap_k: fmt(gap / 1000),
    },
  };
}

function scoreInvestment(inputs: CompassInputs, report: CompassReport): TileScore {
  const pension = wealthMid(inputs.totalPensionValue);
  const isa = wealthMid(inputs.isaBalance);
  const gia = wealthMid(inputs.giaBalance);
  const cash = wealthMid(inputs.cashSavings);
  const business = wealthMid(inputs.businessValue);

  // All four investable balances zero → not scoreable.
  if (pension === 0 && isa === 0 && gia === 0 && cash === 0) return grey();

  const wrapperCount = [
    inputs.totalPensionValue !== 0,
    inputs.isaBalance !== 0,
    inputs.giaBalance !== 0,
  ].filter(Boolean).length;

  const netWorth = report.balanceSheet.netWorth;
  const bizConc = netWorth > 0 ? business / netWorth : 0;
  const totalInvestable = pension + isa + gia + cash;

  let status: TileStatus;
  if (business !== 0 && bizConc > INV_BUSINESS_CONCENTRATION_RED) {
    status = 'red';
  } else if (wrapperCount >= 2) {
    status = 'green';
  } else if (wrapperCount === 1) {
    status = 'amber';
  } else if (wrapperCount === 0 && totalInvestable < INV_MIN_TOTAL_INVESTABLE) {
    status = 'red';
  } else {
    status = 'amber';
  }

  const metrics: TileMetrics = { wrapper_count: wrapperCount.toString() };
  if (business !== 0) metrics.business_pct = fmt(bizConc * 100);

  return { status, scoreable: true, metrics };
}

function scoreTax(inputs: CompassInputs, _report: CompassReport): TileScore {
  const income = INCOME_MID[inputs.householdGrossIncome];
  const combinedContrib =
    CONTRIB_PCT_MID[inputs.employerPensionContribPct] +
    CONTRIB_PCT_MID[inputs.ownPensionContribPct];
  const isa = wealthMid(inputs.isaBalance);

  let status: TileStatus;
  if (income >= TAX_TRAP_LOWER && income < TAX_TRAP_UPPER && combinedContrib < TAX_TRAP_CONTRIB_PCT) {
    status = 'red';
  } else if (income >= TAX_TRAP_LOWER && income < TAX_TRAP_UPPER && combinedContrib >= TAX_TRAP_CONTRIB_PCT) {
    status = 'amber';
  } else if (income >= TAX_BASIC_RATE_THRESHOLD && isa === 0) {
    status = 'amber';
  } else if (income < TAX_BASIC_RATE_THRESHOLD && isa !== 0) {
    status = 'green';
  } else if (income < TAX_BASIC_RATE_THRESHOLD && isa === 0) {
    status = 'amber';
  } else {
    status = 'amber';
  }

  return {
    status,
    scoreable: true,
    metrics: { income_k: fmt(income / 1000) },
  };
}

function scoreCash(inputs: CompassInputs, _report: CompassReport): TileScore {
  const cash = wealthMid(inputs.cashSavings);
  const monthly = SPEND_MID_MONTHLY[inputs.essentialMonthlySpend];
  const coverageMonths = monthly > 0 ? cash / monthly : 0;
  const hasDependents = inputs.partnerPresent || inputs.hasDependentChildren;
  const greenThreshold = hasDependents ? CASH_GREEN_MONTHS_DEPENDENT : CASH_GREEN_MONTHS_SINGLE;
  const isa = wealthMid(inputs.isaBalance);

  // Zero-cash special cases — ISA is accessible fallback softens red to amber.
  if (inputs.cashSavings === 0) {
    if (inputs.isaBalance !== 0) {
      return {
        status: 'amber',
        scoreable: true,
        metrics: {
          cash_k: '0',
          cash_months: '0',
        },
      };
    }
    // No cash, no ISA — red and deliberately no cash_k token so authored prose
    // doesn't leave a "£0k" artifact in the note.
    return {
      status: 'red',
      scoreable: true,
      metrics: { cash_months: '0' },
    };
  }

  let status: TileStatus;
  if (coverageMonths >= greenThreshold) status = 'green';
  else if (coverageMonths >= CASH_AMBER_MONTHS) status = 'amber';
  else status = 'red';

  // If cash is truly tiny but ISA is substantial, same soften-to-amber logic.
  if (status === 'red' && isa !== 0) status = 'amber';

  return {
    status,
    scoreable: true,
    metrics: {
      cash_k: fmt(cash / 1000),
      cash_months: Math.floor(coverageMonths).toString(),
    },
  };
}

function scoreDebt(inputs: CompassInputs, _report: CompassReport): TileScore {
  const consumerDebt = wealthMid(inputs.personalLoans) + wealthMid(inputs.creditCardDebt);
  const income = INCOME_MID[inputs.householdGrossIncome];

  let status: TileStatus;
  if (consumerDebt === 0) {
    status = 'green';
  } else {
    const dti = safeDiv(consumerDebt, income);
    status = dti <= DEBT_AMBER_MAX_DTI ? 'amber' : 'red';
  }

  return {
    status,
    scoreable: true,
    metrics: { consumer_debt_k: fmt(consumerDebt / 1000) },
  };
}

function scoreMortgage(inputs: CompassInputs, _report: CompassReport): TileScore {
  if (inputs.mortgageEndAge === 'renting') return grey();

  if (inputs.mortgageEndAge === 'paid') {
    return {
      status: 'green',
      scoreable: true,
      metrics: {
        mortgage_balance_k: '0',
        mortgage_clear_age: 'now',
        mortgage_pti_pct: '0',
      },
    };
  }

  const balance = wealthMid(inputs.mainHomeMortgageBalance);
  const paymentAnnual = inputs.mortgageMonthlyPayment
    ? SPEND_MID_MONTHLY[inputs.mortgageMonthlyPayment] * 12
    : 0;
  const income = INCOME_MID[inputs.householdGrossIncome];
  const pti = income > 0 ? (paymentAnnual / income) * 100 : 0;
  const clearAge = mortgageEndAgeToNumber(inputs.mortgageEndAge, inputs.currentAge);
  const clearsBefore = clearAge <= inputs.targetRetirementAge;

  let status: TileStatus;
  if (pti > MORTGAGE_RED_PTI_PCT) status = 'red';
  else if (pti > MORTGAGE_AMBER_PTI_PCT || !clearsBefore) status = 'amber';
  else status = 'green';

  return {
    status,
    scoreable: true,
    metrics: {
      mortgage_balance_k: fmt(balance / 1000),
      mortgage_clear_age: clearAge.toString(),
      mortgage_pti_pct: fmt(pti),
    },
  };
}

function scoreEstate(inputs: CompassInputs, _report: CompassReport): TileScore {
  const hasBiz = inputs.businessValue !== 0;
  const { willInPlace, lpaInPlace, hasDependentChildren, currentAge } = inputs;

  // Business owner without a will is a material shareholder risk.
  if (hasBiz && !willInPlace) {
    return { status: 'red', scoreable: true, metrics: {} };
  }

  let status: TileStatus;
  if (willInPlace && lpaInPlace) {
    status = 'green';
  } else if ((willInPlace && !lpaInPlace) || (!willInPlace && lpaInPlace)) {
    status = 'amber';
  } else if (!willInPlace && !lpaInPlace && hasDependentChildren) {
    status = 'red';
  } else if (!willInPlace && !lpaInPlace && !hasDependentChildren && currentAge >= ESTATE_MIDDLE_AGE) {
    status = 'amber';
  } else if (!willInPlace && !lpaInPlace && currentAge < ESTATE_YOUNG_AGE) {
    return grey();
  } else {
    status = 'amber';
  }

  return { status, scoreable: true, metrics: {} };
}

function scoreProtection(inputs: CompassInputs, _report: CompassReport): TileScore {
  const alreadyRetired = inputs.currentAge >= inputs.targetRetirementAge;
  if (alreadyRetired) return grey();

  // Business owner — key-person risk flagged red regardless of personal cover.
  if (inputs.businessValue !== 0) {
    return { status: 'red', scoreable: true, metrics: {} };
  }

  const { hasDependentChildren, partnerPresent, mortgageEndAge, lifeCoverStatus } = inputs;
  const mortgageActive = mortgageEndAge !== 'paid' && mortgageEndAge !== 'renting';
  const hasExposure = hasDependentChildren || partnerPresent;

  // ---- Use real protection signal when the screen fired ----
  if (lifeCoverStatus !== undefined) {
    if (!hasExposure) {
      // No dependants + no partner: check income protection confidence only.
      const yearsToRetirement = inputs.targetRetirementAge - inputs.currentAge;
      if (lifeCoverStatus === 'no' && yearsToRetirement > PROTECTION_YEARS_TO_RETIREMENT_AMBER) {
        return { status: 'amber', scoreable: true, metrics: {} };
      }
      return grey();
    }
    // Has dependants or partner — score from actual cover.
    if (lifeCoverStatus === 'no') {
      return { status: 'red', scoreable: true, metrics: {} };
    }
    if (lifeCoverStatus === 'through_work_only') {
      // Work-only cover stops at job change. Amber — still a gap worth a conversation.
      return { status: 'amber', scoreable: true, metrics: {} };
    }
    if (lifeCoverStatus === 'unknown') {
      // Chose "not sure" — treat as amber, awareness is the goal.
      return { status: 'amber', scoreable: true, metrics: {} };
    }
    // personal_policy or both — cover is in place.
    // Flag amber only if low earnings-protection confidence despite having life cover.
    const conf = inputs.earningsProtectionConfidence;
    if (conf !== undefined && conf <= 2) {
      return { status: 'amber', scoreable: true, metrics: {} };
    }
    return { status: 'green', scoreable: true, metrics: {} };
  }

  // ---- Fallback: proxy signals when screen 4.B.3 didn't fire ----
  if (hasExposure) {
    const status: TileStatus = mortgageActive ? 'red' : 'amber';
    return { status, scoreable: true, metrics: {} };
  }

  const yearsToRetirement = inputs.targetRetirementAge - inputs.currentAge;
  if (yearsToRetirement > PROTECTION_YEARS_TO_RETIREMENT_AMBER) {
    return { status: 'amber', scoreable: true, metrics: {} };
  }
  return grey();
}

// -----------------------------------------------------------------------------
// Top-level entry point
// -----------------------------------------------------------------------------

/**
 * Score all 9 planning-grid tiles for the given client.
 *
 * Returns a `TileScoreMap` keyed by `TileKey` — every tile is present; `grey` /
 * `scoreable: false` entries mean the engine chose not to score (downstream
 * should render the authored fallback copy as-is).
 */
export function scoreAllTiles(inputs: CompassInputs, report: CompassReport): TileScoreMap {
  const map: Record<TileKey, TileScore> = {
    retirement: scoreRetirement(inputs, report),
    pension:    scorePension(inputs, report),
    investment: scoreInvestment(inputs, report),
    tax:        scoreTax(inputs, report),
    cash:       scoreCash(inputs, report),
    debt:       scoreDebt(inputs, report),
    mortgage:   scoreMortgage(inputs, report),
    estate:     scoreEstate(inputs, report),
    protection: scoreProtection(inputs, report),
  };
  return map;
}
