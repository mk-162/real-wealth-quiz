/**
 * Unit tests for the compliance gate utility.
 *
 * Runner: `node:test` (built-in) executed via `tsx`. No extra devDeps.
 *
 * Run from master_template/:
 *   node --import tsx --test src/lib/content/__tests__/compliance.test.ts
 *
 * These tests manipulate `process.env.NODE_ENV` to verify both dev and
 * production behaviour, saving and restoring the value around each case so
 * tests stay hermetic.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { canPublishInProduction, filterApproved } from '../compliance';

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_BYPASS = process.env.RW_BYPASS_COMPLIANCE;

// Next.js types `process.env.NODE_ENV` as a readonly union ('development' |
// 'production' | 'test'), so direct assignment is a type error. Cast once
// through `Record<string, string | undefined>` to mutate it in tests.
function setNodeEnv(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = value;
  }
}

function setBypass(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env.RW_BYPASS_COMPLIANCE;
  } else {
    env.RW_BYPASS_COMPLIANCE = value;
  }
}

describe('canPublishInProduction', () => {
  beforeEach(() => {
    setNodeEnv(ORIGINAL_NODE_ENV);
    setBypass(undefined);
  });
  afterEach(() => {
    setNodeEnv(ORIGINAL_NODE_ENV);
    setBypass(ORIGINAL_BYPASS);
  });

  it('returns true for approved_to_ship in production', () => {
    setNodeEnv('production');
    assert.equal(canPublishInProduction('approved_to_ship'), true);
  });

  it('returns true for approved_to_ship in development', () => {
    setNodeEnv('development');
    assert.equal(canPublishInProduction('approved_to_ship'), true);
  });

  it('returns false for draft in production', () => {
    setNodeEnv('production');
    assert.equal(canPublishInProduction('draft'), false);
  });

  it('returns true for draft in development', () => {
    setNodeEnv('development');
    assert.equal(canPublishInProduction('draft'), true);
  });

  it('returns true for draft in test', () => {
    setNodeEnv('test');
    assert.equal(canPublishInProduction('draft'), true);
  });

  it('returns false for in_review in production', () => {
    setNodeEnv('production');
    assert.equal(canPublishInProduction('in_review'), false);
  });

  it('returns true for in_review in development', () => {
    setNodeEnv('development');
    assert.equal(canPublishInProduction('in_review'), true);
  });

  it('returns false for undefined status in production (fail-closed)', () => {
    setNodeEnv('production');
    assert.equal(canPublishInProduction(undefined), false);
  });

  it('returns true for undefined status in development (permissive for WIP authoring)', () => {
    setNodeEnv('development');
    assert.equal(canPublishInProduction(undefined), true);
  });

  it('returns false for unknown status values in production', () => {
    setNodeEnv('production');
    assert.equal(canPublishInProduction('pending_sign_off'), false);
    assert.equal(canPublishInProduction(''), false);
  });

  it('bypass "1" + production + draft returns true', () => {
    setNodeEnv('production');
    setBypass('1');
    assert.equal(canPublishInProduction('draft'), true);
  });

  it('bypass "true" + production + in_review returns true', () => {
    setNodeEnv('production');
    setBypass('true');
    assert.equal(canPublishInProduction('in_review'), true);
  });

  it('bypass "yes" + production + undefined status returns true', () => {
    setNodeEnv('production');
    setBypass('yes');
    assert.equal(canPublishInProduction(undefined), true);
  });

  it('bypass unset + production + draft returns false (existing behaviour)', () => {
    setNodeEnv('production');
    setBypass(undefined);
    assert.equal(canPublishInProduction('draft'), false);
  });
});

describe('filterApproved', () => {
  beforeEach(() => {
    setNodeEnv(ORIGINAL_NODE_ENV);
    setBypass(undefined);
  });
  afterEach(() => {
    setNodeEnv(ORIGINAL_NODE_ENV);
    setBypass(ORIGINAL_BYPASS);
  });

  const mixed = [
    { id: 'a', compliance_status: 'approved_to_ship' },
    { id: 'b', compliance_status: 'draft' },
    { id: 'c', compliance_status: 'in_review' },
    { id: 'd', compliance_status: 'approved_to_ship' },
    { id: 'e' }, // missing field
  ];

  it('keeps only approved_to_ship items in production', () => {
    setNodeEnv('production');
    const result = filterApproved(mixed);
    assert.deepEqual(result.map(r => r.id), ['a', 'd']);
  });

  it('keeps every item in development', () => {
    setNodeEnv('development');
    const result = filterApproved(mixed);
    assert.deepEqual(result.map(r => r.id), ['a', 'b', 'c', 'd', 'e']);
  });

  it('returns an empty array when nothing is approved (production)', () => {
    setNodeEnv('production');
    const result = filterApproved([
      { id: 'x', compliance_status: 'draft' },
      { id: 'y', compliance_status: 'in_review' },
    ]);
    assert.deepEqual(result, []);
  });

  it('preserves item order', () => {
    setNodeEnv('production');
    const result = filterApproved([
      { id: '1', compliance_status: 'approved_to_ship' },
      { id: '2', compliance_status: 'draft' },
      { id: '3', compliance_status: 'approved_to_ship' },
      { id: '4', compliance_status: 'approved_to_ship' },
    ]);
    assert.deepEqual(result.map(r => r.id), ['1', '3', '4']);
  });

  it('bypass ON in production keeps every mixed item (bypass propagates)', () => {
    setNodeEnv('production');
    setBypass('1');
    const result = filterApproved(mixed);
    assert.deepEqual(result.map(r => r.id), ['a', 'b', 'c', 'd', 'e']);
  });
});
