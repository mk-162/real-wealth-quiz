/**
 * Dev-only smoke test for `buildCompassInputs()` + `buildReport()`.
 *
 * Constructs 9 fake session.answers maps — one per segment S1-S9 — matching
 * realistic persona profiles, then:
 *   1. Runs `buildCompassInputs()` to convert the raw answers into CompassInputs.
 *   2. Pipes that through `buildReport()` and captures `targetCoveragePct`.
 *   3. Asserts the coverage comes out in a sensible 0-300 range.
 *
 * Run:  npx tsx scripts/test-compass-inputs.ts
 */

import { buildCompassInputs, missingFields } from '../src/lib/compass/inputs';
import { buildReport } from '../src/lib/compass/projection';
import type { PartialAnswersMap } from '../src/lib/compass/inputs';

interface FakeCase {
  segment: string;
  label: string;
  answers: PartialAnswersMap;
}

const CASES: FakeCase[] = [
  // ---------- S1 Early Accumulator ----------
  {
    segment: 'S1',
    label: 'Early Accumulator — 28, solo, renting, light savings',
    answers: {
      age: 28,
      household: ['solo'],
      work_status: 'employed',
      income_band: 'lt50k',
      estate_band: 'lt500k',
      main_home: 'rent',
      pension_pots: 'one',
      pension_total_value: 'lt25k',
      cash_savings_band: 'lt25k',
      isa_balance_band: 'lt25k',
      gia_balance_band: 'none',
      investments_band: 'lt50k',
      essential_monthly_spend: '2to3_5k',
      non_essential_monthly_spend: 'lt500',
      monthly_saving_band: 'lt1500',
      employer_pension_pct_band: '3to5',
      will_and_lpa_status: ['no_will'],
      target_retirement_age: 65,
      state_pension_awareness: 'not_relevant_yet',
      state_pension_amount_band: 'no_idea',
      ni_qualifying_years_band: 'lt10',
      retirement_spend_ratio: 'same',
    },
  },

  // ---------- S2 Mass-Affluent Mid-Career ----------
  {
    segment: 'S2',
    label: 'Mass-Affluent Mid-Career — 42, partner + kids, mortgaged',
    answers: {
      age: 42,
      household: ['partner', 'dependent_children'],
      work_status: 'employed',
      income_band: '50to100k',
      estate_band: '500k_to_1m',
      main_home: 'own_mortgage',
      mortgage_balance: '100k_to_250k',
      pension_pots: 'two_three',
      pension_total_value: '25to100k',
      cash_savings_band: 'lt25k',
      isa_balance_band: '25to100k',
      gia_balance_band: 'none',
      investments_band: '50k_to_250k',
      essential_monthly_spend: '3_5to5k',
      non_essential_monthly_spend: '1k_to_2k',
      monthly_saving_band: 'lt1500',
      employer_pension_pct_band: '5to10',
      mortgage_monthly_payment_band: '1500to3000',
      mortgage_end_age_band: '55_65',
      will_and_lpa_status: ['no_will'],
      target_retirement_age: 62,
      state_pension_awareness: 'roughly',
      state_pension_amount_band: 'partial',
      ni_qualifying_years_band: '20to30',
      retirement_spend_ratio: 'same',
      passing_on_intent: 'max_family',
    },
  },

  // ---------- S3 High-Earner Mid-Career ----------
  {
    segment: 'S3',
    label: 'High-Earner Mid-Career — 45, £150k, 100k tax trap',
    answers: {
      age: 45,
      household: ['partner', 'dependent_children'],
      work_status: 'employed',
      income_band: '125to200k',
      estate_band: '1m_to_2m',
      earners_one_or_two: 'one',
      main_home: 'own_mortgage',
      mortgage_balance: '250k_to_500k',
      pension_pots: 'four_six',
      pension_total_value: '100to250k',
      cash_savings_band: '25to100k',
      isa_balance_band: '100to250k',
      gia_balance_band: '25to100k',
      essential_monthly_spend: '3_5to5k',
      non_essential_monthly_spend: '1k_to_2k',
      monthly_saving_band: 'lt1500',
      employer_pension_pct_band: '10plus',
      mortgage_monthly_payment_band: '1500to3000',
      mortgage_end_age_band: '55_65',
      will_and_lpa_status: ['will_fresh'],
      target_retirement_age: 60,
      state_pension_awareness: 'roughly',
      state_pension_amount_band: 'partial',
      ni_qualifying_years_band: '20to30',
      retirement_spend_ratio: 'same',
      passing_on_intent: 'max_family',
    },
  },

  // ---------- S4 Senior Professional ----------
  {
    segment: 'S4',
    label: 'Senior Professional — 55, £200k, 5 years from exit',
    answers: {
      age: 55,
      household: ['partner', 'elderly_parent'],
      work_status: 'employed',
      income_band: '125to200k',
      estate_band: '2m_to_3m',
      main_home: 'own_mortgage',
      mortgage_balance: '100k_to_250k',
      pension_pots: 'four_six',
      pension_total_value: '500kto1m',
      cash_savings_band: '25to100k',
      isa_balance_band: '100to250k',
      gia_balance_band: '25to100k',
      essential_monthly_spend: '3_5to5k',
      non_essential_monthly_spend: '2k_to_4k',
      monthly_saving_band: '1500to3000',
      employer_pension_pct_band: '10plus',
      mortgage_monthly_payment_band: '1500to3000',
      mortgage_end_age_band: '55_65',
      will_and_lpa_status: ['will_fresh'],
      target_retirement_age: 60,
      state_pension_awareness: 'yes_checked',
      state_pension_amount_band: 'full_rate',
      ni_qualifying_years_band: '30to35',
      retirement_spend_ratio: 'same',
      passing_on_intent: 'max_family',
    },
  },

  // ---------- S5 Business Owner Growth ----------
  {
    segment: 'S5',
    label: 'Business Owner Growth — 48, business ~£500k, no exit plan',
    answers: {
      age: 48,
      household: ['partner', 'dependent_children'],
      work_status: 'business_owner',
      income_band: '50to100k',
      estate_band: '1m_to_2m',
      main_home: 'own_mortgage',
      mortgage_balance: '100k_to_250k',
      pension_pots: 'two_three',
      pension_total_value: '100to250k',
      cash_savings_band: '25to100k',
      isa_balance_band: '25to100k',
      gia_balance_band: 'none',
      essential_monthly_spend: '3_5to5k',
      non_essential_monthly_spend: '1k_to_2k',
      monthly_saving_band: 'lt1500',
      employer_pension_pct_band: 'not_applicable',
      mortgage_monthly_payment_band: '1500to3000',
      mortgage_end_age_band: '55_65',
      will_and_lpa_status: ['no_will'],
      target_retirement_age: 60,
      state_pension_awareness: 'roughly',
      state_pension_amount_band: 'partial',
      ni_qualifying_years_band: '20to30',
      retirement_spend_ratio: 'same',
      role: 'sole_director',
      extraction_mix: ['salary', 'dividends', 'pension'],
      succession: 'no_plan_thinking',
      passing_on_intent: 'max_family',
    },
  },

  // ---------- S6 Business Owner Exit ----------
  {
    segment: 'S6',
    label: 'Business Owner Exit — 58, exiting in ~3 years',
    answers: {
      age: 58,
      household: ['partner'],
      work_status: 'business_owner',
      income_band: '100to125k',
      estate_band: '2m_to_3m',
      main_home: 'own_mortgage',
      mortgage_balance: 'lt100k',
      pension_pots: 'four_six',
      pension_total_value: '250to500k',
      cash_savings_band: '100to250k',
      isa_balance_band: '100to250k',
      gia_balance_band: 'none',
      essential_monthly_spend: '3_5to5k',
      non_essential_monthly_spend: '2k_to_4k',
      monthly_saving_band: '1500to3000',
      employer_pension_pct_band: '10plus',
      mortgage_monthly_payment_band: 'lt1500',
      mortgage_end_age_band: '55_65',
      will_and_lpa_status: ['will_fresh', 'lpa_health', 'lpa_finance'],
      target_retirement_age: 61,
      state_pension_awareness: 'yes_checked',
      state_pension_amount_band: 'full_rate',
      ni_qualifying_years_band: '30to35',
      retirement_spend_ratio: 'same',
      role: 'majority_shareholder',
      extraction_mix: ['salary', 'dividends', 'pension'],
      succession: 'exit_5_years',
      passing_on_intent: 'max_family',
    },
  },

  // ---------- S7 Pre-Retiree Affluent ----------
  {
    segment: 'S7',
    label: 'Pre-Retiree Affluent — 63, 18 months to retirement',
    answers: {
      age: 63,
      household: ['partner'],
      work_status: 'employed',
      income_band: '50to100k',
      estate_band: '1m_to_2m',
      main_home: 'own_outright',
      pension_pots: 'four_six',
      pension_total_value: '250to500k',
      cash_savings_band: '100to250k',
      isa_balance_band: '100to250k',
      gia_balance_band: '25to100k',
      essential_monthly_spend: '3_5to5k',
      non_essential_monthly_spend: '1k_to_2k',
      monthly_saving_band: '1500to3000',
      employer_pension_pct_band: '10plus',
      will_and_lpa_status: ['will_fresh'],
      target_retirement_age: 65,
      state_pension_awareness: 'yes_checked',
      state_pension_amount_band: 'full_rate',
      ni_qualifying_years_band: 'gte35',
      retirement_spend_ratio: 'less',
      passing_on_intent: 'boost',
    },
  },

  // ---------- S8 Retired (drawdown) ----------
  {
    segment: 'S8',
    label: 'Retired — 70, drawing down, £45k/yr spend',
    answers: {
      age: 70,
      household: ['solo'],
      work_status: 'fully_retired',
      income_band: 'lt50k',
      estate_band: '500k_to_1m',
      main_home: 'own_outright',
      pension_pots: 'two_three',
      pension_total_value: '250to500k',
      cash_savings_band: '25to100k',
      isa_balance_band: '100to250k',
      gia_balance_band: 'none',
      essential_monthly_spend: '2to3_5k',
      non_essential_monthly_spend: '1k_to_2k',
      monthly_saving_band: 'lt1500',
      employer_pension_pct_band: 'not_applicable',
      will_and_lpa_status: ['will_old'],
      target_retirement_age: 60,
      state_pension_awareness: 'yes_checked',
      state_pension_amount_band: 'full_rate',
      ni_qualifying_years_band: 'gte35',
      retirement_spend_ratio: 'same',
      passing_on_intent: 'boost',
    },
  },

  // ---------- S9 HNW Multi-Generational ----------
  {
    segment: 'S9',
    label: 'HNW Multi-Generational — 68, £6m estate, IHT exposed',
    answers: {
      age: 68,
      household: ['partner'],
      work_status: 'partly_retired',
      income_band: '125to200k',
      estate_band: 'gt5m',
      main_home: 'own_outright',
      other_property: 'one_other',
      pension_pots: 'four_six',
      pension_total_value: '1to2m',
      cash_savings_band: '100to250k',
      isa_balance_band: '250to500k',
      gia_balance_band: '250to500k',
      essential_monthly_spend: '5to7_5k',
      non_essential_monthly_spend: '2k_to_4k',
      monthly_saving_band: '3000to5000',
      employer_pension_pct_band: '5to10',
      will_and_lpa_status: ['will_fresh', 'lpa_health', 'lpa_finance'],
      target_retirement_age: 72,
      state_pension_awareness: 'yes_checked',
      state_pension_amount_band: 'full_rate',
      ni_qualifying_years_band: 'gte35',
      retirement_spend_ratio: 'same',
      passing_on_intent: 'max_family',
    },
  },
];

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 1 });
}

function run() {
  let allPass = true;
  const rows: Array<{
    segment: string;
    coverage: number;
    mode: string;
    netWorth: number;
    missing: number;
    ok: boolean;
    label: string;
  }> = [];

  for (const c of CASES) {
    let ok = true;
    let coverage = 0;
    let mode = 'target';
    let netWorth = 0;
    let missing = 0;
    try {
      const inputs = buildCompassInputs(c.answers);
      const report = buildReport(inputs);
      coverage = report.scores.targetCoveragePct;
      mode = report.scores.targetCoverageMode;
      netWorth = report.balanceSheet.netWorth;
      missing = missingFields(c.answers).length;

      if (!Number.isFinite(coverage)) {
        console.error(`[${c.segment}] FAIL — coverage is not finite (${coverage})`);
        ok = false;
      }
      if (coverage < 0 || coverage > 300) {
        console.error(`[${c.segment}] FAIL — coverage out of 0-300 range (${coverage})`);
        ok = false;
      }
      if (!Number.isFinite(netWorth)) {
        console.error(`[${c.segment}] FAIL — netWorth is not finite (${netWorth})`);
        ok = false;
      }
    } catch (err) {
      console.error(`[${c.segment}] FAIL — threw:`, err);
      ok = false;
    }
    rows.push({
      segment: c.segment,
      coverage,
      mode,
      netWorth,
      missing,
      ok,
      label: c.label,
    });
    allPass = allPass && ok;
  }

  // Pretty-print table
  console.log('');
  console.log('Segment  Coverage%  Mode       NetWorth        Missing  Label');
  console.log('-------  ---------  --------   -------------   -------  -----');
  for (const r of rows) {
    const cov = fmt(r.coverage).padStart(9);
    const mode = r.mode.padEnd(8);
    const nw = `£${fmt(r.netWorth)}`.padStart(13);
    const miss = String(r.missing).padStart(7);
    console.log(`${r.segment.padEnd(7)}  ${cov}  ${mode}   ${nw}   ${miss}  ${r.label}`);
  }
  console.log('');
  if (allPass) {
    console.log('PASS — all 9 segments produced a valid CompassReport with coverage in 0-300.');
    process.exit(0);
  } else {
    console.log('FAIL — one or more segments did not pass.');
    process.exit(1);
  }
}

run();
