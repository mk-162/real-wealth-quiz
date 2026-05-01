/**
 * Segmentation rules — first-match-wins ordering and S5→S6 stage-2 upgrade.
 *
 * Verifies every one of the nine segment rules in
 * `src/lib/segmentation/rules.ts` for:
 *   1. The intended user lands in the intended segment.
 *   2. First-match-wins ordering: a user who could match multiple rules
 *      lands in the highest-priority one.
 *   3. The S6 provisional-then-upgrade pattern works correctly.
 *   4. The default fallback (S1) catches anyone who doesn't match anything.
 *
 * Each segment is described in `src/lib/segmentation/types.ts`:
 *   S1 Early Accumulator              under 35, under £50k, under £250k estate
 *   S2 Mass-Affluent Mid-Career       35–50, £50–100k, £250k–£1m
 *   S3 High-Earner Mid-Career         35–55, £100–200k, £500k–£2m
 *   S4 Senior Professional/Partner    40–60, £200k+, £1–3m
 *   S5 Business Owner — Growth        30–55, business owner, £500k–£3m
 *   S6 Business Owner — Exit-minded   50–65, business owner, £1–5m
 *   S7 Pre-Retiree Affluent           55–65, employed/SE, £1–3m
 *   S8 Retired / In Decumulation      60+, retired, £500k–£3m
 *   S9 HNW / Multi-Generational       any age, £3m+ estate
 *
 * The actual rule order in rules.ts is rank-based (NOT segment-id order):
 *   1. S9 (estate ≥ 3m)
 *   2. S6 (business owner, age ≥ 50) → returns S5 provisional, upgraded later
 *   3. S5 (business owner, age < 50)
 *   4. S8 (retired, age ≥ 60)
 *   5. S7 (employed/SE, age 55–65)
 *   6. S4 (income ≥ 200k AND estate ≥ 1m)
 *   7. S3 (income 100k–200k)
 *   8. S2 (income 50k–100k AND estate ≥ 250k)
 *   9. S1 (default)
 *
 * Run:  npx tsx scripts/test-segmentation.ts
 */

import {
  assignSegment,
  upgradeSegment,
  rules,
} from '../src/lib/segmentation/rules';
import type { GatingAnswers, SegmentId } from '../src/lib/segmentation/types';

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

function assertSegment(
  inputs: GatingAnswers,
  expectedId: SegmentId,
  expectedProvisional: boolean,
  context: string,
): void {
  const r = assignSegment(inputs);
  if (r.segmentId !== expectedId) {
    throw new Error(`${context}: expected ${expectedId}, got ${r.segmentId}`);
  }
  if (r.provisional !== expectedProvisional) {
    throw new Error(
      `${context}: expected provisional=${expectedProvisional}, got ${r.provisional}`,
    );
  }
}

const baseGating: GatingAnswers = {
  age: 35,
  household: [],
  workStatus: 'employed',
  income: 'lt50k',
  estate: 'lt500k',
};

// =============================================================================
// §A — Each rule fires for a representative input
// =============================================================================
console.log('\n[§A] Each segment fires for a representative input');

test('S1 — default: 28yo, employed, low income, low estate', () => {
  assertSegment(
    { ...baseGating, age: 28, income: 'lt50k', estate: 'lt500k' },
    'S1',
    false,
    'S1 default',
  );
});

test('S2 — 42yo, employed, £50k-£100k, £500k-£1m estate', () => {
  assertSegment(
    { ...baseGating, age: 42, income: '50to100k', estate: '500k_to_1m' },
    'S2',
    false,
    'S2',
  );
});

test('S3 — 45yo, employed, £100k-£125k, £1-2m estate', () => {
  assertSegment(
    { ...baseGating, age: 45, income: '100to125k', estate: '1m_to_2m' },
    'S3',
    false,
    'S3',
  );
});

test('S3 — 45yo, employed, £125k-£200k', () => {
  assertSegment(
    { ...baseGating, age: 45, income: '125to200k', estate: '500k_to_1m' },
    'S3',
    false,
    'S3 (high band)',
  );
});

test('S4 — 50yo, employed, £200k+, £1-2m estate (clear of S7 age range)', () => {
  // Note: at age 55+ the S7 (rank 5) rule fires before S4 (rank 6) and routes
  // the same person to "Pre-Retiree Affluent" instead of "Senior Professional".
  // That overlap is verified explicitly in §B; here we use age 50 to land in S4.
  assertSegment(
    { ...baseGating, age: 50, income: 'gt200k', estate: '1m_to_2m' },
    'S4',
    false,
    'S4',
  );
});

test('S4/S7 overlap (age 55, gt200k, £1-2m): S7 wins by rank', () => {
  // Documents the intentional age-driven preference: at 55+ the user is
  // routed to "Pre-Retiree Affluent" framing rather than "Senior Professional",
  // even when they technically fit both segment definitions.
  assertSegment(
    { ...baseGating, age: 55, income: 'gt200k', estate: '1m_to_2m' },
    'S7',
    false,
    'S7 wins overlap with S4',
  );
});

test('S5 — 40yo, business owner, any income/estate (under £3m)', () => {
  assertSegment(
    {
      ...baseGating,
      age: 40,
      workStatus: 'business_owner',
      income: '100to125k',
      estate: '1m_to_2m',
    },
    'S5',
    false,
    'S5 (under 50, owner)',
  );
});

test('S6 (provisional → S5, age 55, business owner) before Q5.3', () => {
  // Stage 1 returns S5 provisional. Stage 2 (upgradeSegment) will resolve.
  assertSegment(
    {
      ...baseGating,
      age: 55,
      workStatus: 'business_owner',
      income: '125to200k',
      estate: '1m_to_2m',
    },
    'S5',
    true,
    'S6 provisional',
  );
});

test('S7 — 60yo, employed, £125-200k, £1-2m estate', () => {
  assertSegment(
    {
      ...baseGating,
      age: 60,
      workStatus: 'employed',
      income: '125to200k',
      estate: '1m_to_2m',
    },
    'S7',
    false,
    'S7',
  );
});

test('S8 — 70yo, fully retired, any estate (under £3m)', () => {
  assertSegment(
    {
      ...baseGating,
      age: 70,
      workStatus: 'fully_retired',
      income: '50to100k',
      estate: '1m_to_2m',
    },
    'S8',
    false,
    'S8 fully retired',
  );
});

test('S8 — 65yo, partly retired', () => {
  assertSegment(
    {
      ...baseGating,
      age: 65,
      workStatus: 'partly_retired',
      income: '50to100k',
      estate: '500k_to_1m',
    },
    'S8',
    false,
    'S8 partly retired',
  );
});

test('S9 — any age, £3m+ estate', () => {
  // Try several ages with estate at the £3m+ threshold; all should land in S9.
  for (const age of [30, 50, 70]) {
    assertSegment(
      { ...baseGating, age, estate: '3m_to_5m' },
      'S9',
      false,
      `S9 age ${age}`,
    );
  }
});

test('S9 — even at £5m+ estate', () => {
  assertSegment({ ...baseGating, age: 60, estate: 'gt5m' }, 'S9', false, 'S9 gt5m');
});

// =============================================================================
// §B — First-match-wins ordering: S9 dominates other rules
// =============================================================================
console.log('\n[§B] First-match-wins: S9 outranks every later rule');

test('S9 outranks S4 (HNW high earner): £3m+ estate beats £200k+ income', () => {
  // A user who matches S4 by income (gt200k) AND has £3m+ estate (would also match S9)
  // should land in S9 because it has the lowest rank (highest priority).
  assertSegment(
    {
      ...baseGating,
      age: 50,
      income: 'gt200k',
      estate: '3m_to_5m',
    },
    'S9',
    false,
    'S9 over S4',
  );
});

test('S9 outranks S5 (business owner with HNW estate)', () => {
  // Business owner with £3m+ would match S5 OR S9 — should land in S9.
  assertSegment(
    {
      ...baseGating,
      age: 45,
      workStatus: 'business_owner',
      estate: '3m_to_5m',
    },
    'S9',
    false,
    'S9 over S5',
  );
});

test('S9 outranks S8 (HNW retired)', () => {
  // 65yo retired with £4m estate should land in S9 not S8.
  assertSegment(
    {
      ...baseGating,
      age: 65,
      workStatus: 'fully_retired',
      estate: '3m_to_5m',
    },
    'S9',
    false,
    'S9 over S8',
  );
});

test('S6-provisional path beats S7: 60yo business owner not retired', () => {
  // 60yo, business owner. S6 (rank 2) fires before S7 (rank 5). Should land
  // in S5 provisional (not S7).
  assertSegment(
    {
      ...baseGating,
      age: 60,
      workStatus: 'business_owner',
      income: '125to200k',
      estate: '1m_to_2m',
    },
    'S5',
    true,
    'S6 provisional over S7',
  );
});

test('S5 (rank 3) beats S4 (rank 6): owner under 50 with £200k+ income', () => {
  assertSegment(
    {
      ...baseGating,
      age: 45,
      workStatus: 'business_owner',
      income: 'gt200k',
      estate: '1m_to_2m',
    },
    'S5',
    false,
    'S5 over S4',
  );
});

// =============================================================================
// §C — Stage-2 upgrade (S5 → S6 when Q5.3 indicates exit-intent)
// =============================================================================
console.log('\n[§C] Stage-2 upgrade: S5 → S6 on exit-intent Q5.3');

test('S5 + Q5.3 = exit_5_years → S6', () => {
  const r = upgradeSegment('S5', 'exit_5_years');
  if (r !== 'S6') throw new Error(`expected S6, got ${r}`);
});

test('S5 + Q5.3 = no_plan_thinking → S6', () => {
  const r = upgradeSegment('S5', 'no_plan_thinking');
  if (r !== 'S6') throw new Error(`expected S6, got ${r}`);
});

test('S5 + Q5.3 = documented (not exit-intent) → stays S5', () => {
  const r = upgradeSegment('S5', 'documented');
  if (r !== 'S5') throw new Error(`expected S5, got ${r}`);
});

test('S5 + Q5.3 unanswered → stays S5', () => {
  const r = upgradeSegment('S5', undefined);
  if (r !== 'S5') throw new Error(`expected S5, got ${r}`);
});

test('Non-S5 segments are never upgraded by Q5.3', () => {
  // Even if Q5.3 = exit_5_years, an S3 user shouldn't become S6.
  for (const id of ['S1', 'S2', 'S3', 'S4', 'S6', 'S7', 'S8', 'S9'] as SegmentId[]) {
    const r = upgradeSegment(id, 'exit_5_years');
    if (r !== id) throw new Error(`${id} got upgraded to ${r}`);
  }
});

// =============================================================================
// §D — Edge cases and boundaries
// =============================================================================
console.log('\n[§D] Boundary edges');

test('Income = prefer_not_to_say does not match S2 / S3 / S4', () => {
  // prefer_not_to_say should fall through income-based rules; with £600k estate
  // → S2 fails (income not 50-100k), S3 fails, S4 fails → S1 default.
  assertSegment(
    { ...baseGating, age: 42, income: 'prefer_not_to_say', estate: '500k_to_1m' },
    'S1',
    false,
    'prefer_not_to_say falls through',
  );
});

test('Estate = not_sure does not match S2/S3/S4 estate floors', () => {
  // not_sure is treated as no signal, so estate-based predicates fail.
  assertSegment(
    { ...baseGating, age: 50, income: 'gt200k', estate: 'not_sure' },
    'S1',
    false,
    'not_sure estate falls through S4',
  );
});

test('S7 lower boundary: age 55 employed', () => {
  assertSegment(
    {
      ...baseGating,
      age: 55,
      workStatus: 'employed',
      income: '125to200k',
      estate: '500k_to_1m',
    },
    'S7',
    false,
    'S7 age 55 lower edge',
  );
});

test('S7 upper boundary: age 65 employed', () => {
  assertSegment(
    {
      ...baseGating,
      age: 65,
      workStatus: 'employed',
      income: '50to100k',
      estate: '500k_to_1m',
    },
    'S7',
    false,
    'S7 age 65 upper edge',
  );
});

test('S5 boundary: age 49 business owner → S5 not S6', () => {
  // S6 rule requires age ≥ 50; age 49 should land in S5 directly (rank 3).
  assertSegment(
    {
      ...baseGating,
      age: 49,
      workStatus: 'business_owner',
      income: '125to200k',
      estate: '1m_to_2m',
    },
    'S5',
    false,
    'S5 age 49 (just under S6 age cut)',
  );
});

test('S6 boundary: age 50 business owner → S5 provisional', () => {
  assertSegment(
    {
      ...baseGating,
      age: 50,
      workStatus: 'business_owner',
      income: '125to200k',
      estate: '1m_to_2m',
    },
    'S5',
    true,
    'S6 provisional age 50 lower edge',
  );
});

test('S8 boundary: age 60 fully retired', () => {
  assertSegment(
    {
      ...baseGating,
      age: 60,
      workStatus: 'fully_retired',
      income: '50to100k',
      estate: '500k_to_1m',
    },
    'S8',
    false,
    'S8 age 60 lower edge',
  );
});

test('S8 not fired when age 59 fully retired (would fall to S2)', () => {
  // Age 59 fully retired with low estate falls through to S1; not S8 (age cut).
  // With £500k-£1m estate it's still S1 because retirement rule needs ≥ 60.
  // (S2 requires income 50-100k AND estate ≥ 250k — also fails income-wise here.)
  assertSegment(
    {
      ...baseGating,
      age: 59,
      workStatus: 'fully_retired',
      income: 'lt50k',
      estate: 'lt500k',
    },
    'S1',
    false,
    'no segment matches → S1',
  );
});

// =============================================================================
// §E — Rule integrity: rank order is what we expect
// =============================================================================
console.log('\n[§E] Rule integrity: rank order is rules.json-driven');

test('Nine rules total, ranks 1–9 in order', () => {
  if (rules.length !== 9) throw new Error(`expected 9 rules, got ${rules.length}`);
  const ranks = rules.map((r) => r.rank);
  for (let i = 0; i < ranks.length; i++) {
    if (ranks[i] !== i + 1) {
      throw new Error(`rule[${i}].rank = ${ranks[i]}, expected ${i + 1}`);
    }
  }
});

test('First rule is S9 (highest priority)', () => {
  if (rules[0].id !== 'S9') throw new Error(`rules[0] is ${rules[0].id}, expected S9`);
});

test('Last rule is S1 (default fallback)', () => {
  if (rules[rules.length - 1].id !== 'S1') {
    throw new Error(`rules[last] is ${rules[rules.length - 1].id}, expected S1`);
  }
});

test('Every rule has a non-empty predicate string and description', () => {
  for (const r of rules) {
    if (!r.predicate || r.predicate.length === 0) {
      throw new Error(`${r.id} missing predicate`);
    }
    if (!r.description || r.description.length === 0) {
      throw new Error(`${r.id} missing description`);
    }
  }
});

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${'='.repeat(70)}`);
console.log(`Segmentation rules: ${passed} passed, ${failed} failed`);
console.log('='.repeat(70));

if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
