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
export { scoreAllTiles } from './tile-scoring';
export type { TileScore, TileMetrics, TileScoreMap } from './tile-scoring-types';
export { applyTemplate } from './tile-template';
