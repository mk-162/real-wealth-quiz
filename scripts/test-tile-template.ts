/**
 * Unit tests for the tile note template substitution utility.
 *
 * Runner: `node:test` (built-in) executed via `tsx`. No extra devDeps.
 *
 * Run from master_template/:
 *   npx tsx --test scripts/test-tile-template.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { applyTemplate } from '../src/lib/compass/tile-template';
import type { TileMetrics } from '../src/lib/compass/tile-scoring-types';

describe('applyTemplate', () => {
  it('fast-path: template without `{` returns unchanged', () => {
    const input = 'Your cash cushion looks healthy.';
    const result = applyTemplate(input, { cash_k: '45' });
    assert.equal(result, input);
  });

  it('substitutes a single known token', () => {
    const result = applyTemplate('£{cash_k}k', { cash_k: '45' });
    assert.equal(result, '£45k');
  });

  it('substitutes multiple tokens in one string', () => {
    const result = applyTemplate(
      '£{cash_k}k for {cash_months} months',
      { cash_k: '45', cash_months: '9' },
    );
    assert.equal(result, '£45k for 9 months');
  });

  it('leaves an unknown token as a literal', () => {
    const result = applyTemplate('{mystery}', {} as TileMetrics);
    assert.equal(result, '{mystery}');
  });

  it('leaves a known-name token literal when metrics is empty', () => {
    const result = applyTemplate('{cash_k}', {} as TileMetrics);
    assert.equal(result, '{cash_k}');
  });

  it('returns empty template unchanged', () => {
    const result = applyTemplate('', { cash_k: '45' });
    assert.equal(result, '');
  });

  it('does not double-substitute — nested tokens in values stay literal', () => {
    const result = applyTemplate('{cash_k}', { cash_k: '{nested}' });
    assert.equal(result, '{nested}');
  });

  it('does not match tokens containing non-word characters (\\w+ contract)', () => {
    // Author typed a hyphenated token; regex requires \w+, so it stays literal
    // even if a metric with that literal key were somehow present.
    const metrics = { 'cash-k': '45' } as unknown as TileMetrics;
    const result = applyTemplate('{cash-k}', metrics);
    assert.equal(result, '{cash-k}');
  });

  it('substitutes multiple occurrences of the same token', () => {
    const result = applyTemplate('{cash_k} vs {cash_k}', { cash_k: '45' });
    assert.equal(result, '45 vs 45');
  });

  it('mixed: known tokens substitute, unknown stays literal', () => {
    const result = applyTemplate(
      '{cash_k} and {unknown}',
      { cash_k: '45' } as TileMetrics,
    );
    assert.equal(result, '45 and {unknown}');
  });
});
