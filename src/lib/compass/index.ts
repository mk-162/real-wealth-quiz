/**
 * Compass library — barrel export.
 *
 * Import site:
 *   import { buildReport, FIXTURES, type CompassReport } from '@/lib/compass';
 */

export * from './types';
export * from './projection';
export * from './inputs';
export { FIXTURES, fixtureById, type Fixture } from './fixtures';
