/**
 * Aggregator script — runs every test-* file in `scripts/` and reports a
 * single pass/fail summary. Used by `npm run test:audit`.
 *
 * Each test script either exits 0 (all pass) or non-zero (with per-test
 * detail printed by that script). This aggregator just chains them and
 * tallies the result.
 *
 * Run:  npm run test:audit
 * Or:   npx tsx scripts/test-audit-suite.ts
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

interface SuiteEntry {
  label: string;
  script: string;
  description: string;
}

const SUITES: SuiteEntry[] = [
  {
    label: 'Tax constants',
    script: 'scripts/test-tax-constants.ts',
    description: 'Pin every UK 2025/26 tax constant with gov.uk citation',
  },
  {
    label: 'Methodology doc consistency',
    script: 'scripts/audit-tax-docs.ts',
    description: 'Cross-check every worked example in methodology.md against the engine',
  },
  {
    label: 'Projection tax math (existing)',
    script: 'scripts/test-projection-tax.ts',
    description: '25 tests: rUK income tax, NI, AA, MPAA, LSA, CGT, gross-up, BASE_HNW regression',
  },
  {
    label: 'Additional tax & spend',
    script: 'scripts/test-additional-tax.ts',
    description: 'Scottish, PA taper, retirement-spend multiplier, state-pension pro-rating, target coverage',
  },
  {
    label: 'Segmentation rules',
    script: 'scripts/test-segmentation.ts',
    description: 'First-match-wins, S5→S6 upgrade, boundary edges, rule integrity',
  },
  {
    label: 'Tile scoring (existing)',
    script: 'scripts/test-tile-scoring.ts',
    description: '59 unit tests across all 9 tile scorers',
    // node:test runs need --test flag. Detected and added automatically below.
  },
  {
    label: 'Tile scoring (full fixtures)',
    script: 'scripts/test-tile-scoring-full.ts',
    description: '9 segments × 9 tiles = 81 tile-level checks per fixture',
  },
  {
    label: 'Trigger DSL',
    script: 'scripts/test-triggers.ts',
    description: '50 triggers parse, fire/don\'t-fire on representative inputs, robustness',
  },
  {
    label: 'Edge cases',
    script: 'scripts/test-edge-cases.ts',
    description: 'All-zero, very young, very old, prefer-not-to-say, projection sanity',
  },
  {
    label: 'Compass-inputs fixtures',
    script: 'scripts/test-compass-inputs.ts',
    description: 'All 9 segment fixtures produce a valid CompassReport',
  },
  {
    label: 'Tile template (existing)',
    script: 'scripts/test-tile-template.ts',
    description: 'Tile-template token resolution',
  },
  {
    label: 'Assumptions footer (existing)',
    script: 'scripts/test-assumptions.ts',
    description: 'Assumptions footer publishes the values the engine actually uses',
  },
];

const repoRoot = join(__dirname, '..');

interface SuiteResult {
  label: string;
  status: 'pass' | 'fail' | 'missing';
  durationMs: number;
}

const results: SuiteResult[] = [];
let aggregateExitCode = 0;

console.log('\n' + '='.repeat(70));
console.log('Real Wealth — full audit test suite');
console.log('='.repeat(70));

for (const suite of SUITES) {
  const path = join(repoRoot, suite.script);
  if (!existsSync(path)) {
    console.log(`\n[SKIP] ${suite.label} — file not found at ${suite.script}`);
    results.push({ label: suite.label, status: 'missing', durationMs: 0 });
    aggregateExitCode = 1;
    continue;
  }

  console.log(`\n[ ${suite.label} ]  ${suite.script}`);
  console.log(`        ${suite.description}`);

  const start = Date.now();
  // node:test runner files (test-tile-scoring.ts, test-tile-scoring-full.ts,
  // test-tile-template.ts, test-assumptions.ts, src/lib/content/__tests__/*.test.ts)
  // need `--test`. Plain script files (test-projection-tax.ts, etc.) just run.
  // Heuristic: try `--test` first; fall back if exit code suggests a non-test file.
  const useNodeTest = /\b(test-tile-scoring|test-tile-template|test-assumptions)\b/.test(
    suite.script,
  );

  const args = useNodeTest
    ? ['--import', 'tsx', '--test', '--test-reporter=dot', suite.script]
    : ['--import', 'tsx', suite.script];

  const result = spawnSync('node', args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });
  const durationMs = Date.now() - start;
  const status: 'pass' | 'fail' = result.status === 0 ? 'pass' : 'fail';
  results.push({ label: suite.label, status, durationMs });
  if (status === 'fail') aggregateExitCode = 1;
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log('Audit summary');
console.log('='.repeat(70));

const widthLabel = Math.max(...results.map((r) => r.label.length));
for (const r of results) {
  const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️ ';
  const time = `${r.durationMs} ms`.padStart(8);
  console.log(`  ${icon}  ${r.label.padEnd(widthLabel)}  ${time}`);
}

const passCount = results.filter((r) => r.status === 'pass').length;
const failCount = results.filter((r) => r.status === 'fail').length;
const missingCount = results.filter((r) => r.status === 'missing').length;

console.log('\n' + '-'.repeat(70));
console.log(
  `${passCount}/${results.length} suites passed` +
    (failCount ? `  •  ${failCount} failed` : '') +
    (missingCount ? `  •  ${missingCount} missing` : ''),
);
console.log('-'.repeat(70) + '\n');

process.exit(aggregateExitCode);
