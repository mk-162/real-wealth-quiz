/**
 * Full-stack integration smoke test for the Compass tile-scoring system.
 *
 * For every fixture (S1..S9) this test runs the full pipeline that the PDF
 * report renders at SSG time:
 *
 *   buildReport(inputs)          — projection engine
 *   scoreAllTiles(inputs, report) — tile-scoring engine
 *   loadPlanningTiles(segmentId, tileScores)
 *                                 — content loader + per-tile template
 *                                   substitution via applyTemplate
 *
 * Then for each of the 12 resulting PlanningTile objects it asserts:
 *   1. `status` is one of 'green' | 'amber' | 'red' | 'grey'
 *   2. `label` is a non-empty string
 *   3. `note`  is a non-empty string
 *   4. `note`  contains NO unresolved `{token}` substrings — a literal `{`
 *              in the output means the content referenced a metric name the
 *              engine never populates. This is the most valuable assertion;
 *              it catches content/engine mismatches when tile markdown is
 *              rewritten to use templates.
 *
 * That's 9 segments × 12 tiles = 108 tile checks, each carrying all four
 * assertions. Layout: one outer describe per segment (9), one `it` per tile
 * (12), with the 4 assertions inside each `it`.
 *
 * Runner: `node:test` (built-in) via `tsx`. Matches scripts/test-tile-scoring.ts.
 *
 * Run from master_template/:
 *   npx tsx --test scripts/test-tile-scoring-full.ts
 *
 * Compliance gate:
 *   Most tile markdown carries `compliance_status: draft`, which would be
 *   blocked in production by `canPublishInProduction`. The gate treats any
 *   `NODE_ENV` other than `'production'` as permissive, and `node:test`
 *   defaults to leaving `NODE_ENV` unset. We set `NODE_ENV = 'test'` in a
 *   `before()` hook (and restore it in `after()`) so the whole test is
 *   deterministic regardless of the shell's ambient env.
 */

import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { TileStatus } from '../src/lib/compass/types';
import { buildReport } from '../src/lib/compass/projection';
import { FIXTURES } from '../src/lib/compass/fixtures';
import { scoreAllTiles } from '../src/lib/compass/tile-scoring';
import { loadPlanningTiles } from '../src/lib/compass/pdf-content';

// -----------------------------------------------------------------------------
// Compliance bypass — NODE_ENV !== 'production' passes the gate.
// -----------------------------------------------------------------------------

let _prevNodeEnv: string | undefined;

before(() => {
  _prevNodeEnv = process.env.NODE_ENV;
  // NODE_ENV is readonly-typed (@types/node); cast to any to assign in test.
  (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
});

after(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = _prevNodeEnv;
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const VALID_STATUSES: ReadonlyArray<TileStatus> = ['green', 'amber', 'red', 'grey'];

/**
 * Regex for unresolved template tokens.
 *
 * Matches what `applyTemplate` leaves behind when a metric name is missing:
 * `{identifier}` where identifier is \w+ (same contract as applyTemplate's
 * substitution regex). Does not match bare `{` followed by non-word chars.
 */
const UNRESOLVED_TOKEN_RE = /\{(\w+)\}/g;

function findUnresolvedTokens(note: string): string[] {
  const matches = note.match(UNRESOLVED_TOKEN_RE);
  return matches ? Array.from(new Set(matches)) : [];
}

// -----------------------------------------------------------------------------
// One describe block per fixture, one `it` per tile (12 per fixture).
// 9 × 12 = 108 tile-level tests, each with 4 assertions.
// -----------------------------------------------------------------------------

for (const f of FIXTURES) {
  describe(`${f.view.segmentId} (${f.view.segmentLabel}): 12 tiles render cleanly`, () => {
    // Build once per fixture, reuse across tile-level tests.
    const report = buildReport(f.inputs);
    const tileScores = scoreAllTiles(f.inputs, report);
    const tiles = loadPlanningTiles(f.view.segmentId, tileScores);

    // Defensive: the grid is always 12 positional slots.
    it(`${f.view.segmentId}: loader returns exactly 12 tiles`, () => {
      assert.equal(
        tiles.length,
        12,
        `${f.view.segmentId}: expected 12 tiles, got ${tiles.length}`,
      );
    });

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      // Use `key` in the test name so failures read like:
      //   "S4 / mortgage: note contains unresolved token: {mortgage_clear_age_ERROR_TYPO}"
      it(`${f.view.segmentId} / ${tile.key}: status, label, note, no unresolved tokens`, () => {
        // 1. status is a valid enum value.
        assert.ok(
          VALID_STATUSES.includes(tile.status),
          `${f.view.segmentId} / ${tile.key}: invalid status ${String(tile.status)}`,
        );

        // 2. label is a non-empty string.
        assert.equal(
          typeof tile.label,
          'string',
          `${f.view.segmentId} / ${tile.key}: label is not a string`,
        );
        assert.ok(
          tile.label.length > 0,
          `${f.view.segmentId} / ${tile.key}: label is empty`,
        );

        // 3. note is a non-empty string.
        assert.equal(
          typeof tile.note,
          'string',
          `${f.view.segmentId} / ${tile.key}: note is not a string`,
        );
        assert.ok(
          tile.note.length > 0,
          `${f.view.segmentId} / ${tile.key}: note is empty`,
        );

        // 4. note contains NO unresolved `{token}` substrings. This is the
        //    load-bearing assertion: catches the case where content markdown
        //    references a metric the engine never populates for this fixture.
        const unresolved = findUnresolvedTokens(tile.note);
        assert.equal(
          unresolved.length,
          0,
          `${f.view.segmentId} / ${tile.key}: note contains unresolved token${unresolved.length === 1 ? '' : 's'} ${unresolved.join(', ')}: ${JSON.stringify(tile.note)}`,
        );
      });
    }

    // Clean summary log per segment — the task spec asks for lines like
    //   "S2: 12/12 tiles rendered ok"
    // We emit this after the `it` definitions; `node:test` runs `it`s in
    // order within a `describe` but logs synchronously, so we use a final
    // synchronous `it` that prints the roll-up. This keeps the log clean
    // while still respecting the test-reporter's flow.
    it(`${f.view.segmentId}: summary`, () => {
      let ok = 0;
      const failures: string[] = [];
      for (const tile of tiles) {
        const hasValidStatus = VALID_STATUSES.includes(tile.status);
        const hasLabel = typeof tile.label === 'string' && tile.label.length > 0;
        const hasNote = typeof tile.note === 'string' && tile.note.length > 0;
        const unresolved = findUnresolvedTokens(tile.note);
        if (hasValidStatus && hasLabel && hasNote && unresolved.length === 0) {
          ok++;
        } else {
          const why: string[] = [];
          if (!hasValidStatus) why.push(`status=${String(tile.status)}`);
          if (!hasLabel) why.push('empty label');
          if (!hasNote) why.push('empty note');
          if (unresolved.length > 0) why.push(`unresolved ${unresolved.join(',')}`);
          failures.push(`${tile.key} (${why.join('; ')})`);
        }
      }
      // Log for visibility. Using assert.ok with a rich message means the
      // summary appears in the test output regardless of pass/fail mode.
      // When ok === 12 this always passes; when < 12 the earlier per-tile
      // `it`s will have already surfaced the exact failures.
      console.log(
        `${f.view.segmentId}: ${ok}/${tiles.length} tiles rendered ok` +
          (failures.length > 0 ? ` — issues: ${failures.join(' | ')}` : ''),
      );
      // The per-tile `it`s are the source of truth; this summary `it` passes
      // whenever it ran (the log is the deliverable).
      assert.ok(true);
    });
  });
}
