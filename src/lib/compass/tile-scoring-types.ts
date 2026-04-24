import type { TileKey, TileStatus } from './types';

/**
 * Computed tile score from the engine.
 * `status` is the engine-computed classification.
 * `metrics` are the pre-formatted values available for template substitution.
 * `scoreable` = false means the engine explicitly cannot score this tile from
 * the available inputs and the content-authored fallback should be used as-is
 * (no substitution attempted).
 */
export interface TileScore {
  status: TileStatus;
  metrics: TileMetrics;
  /** True when the engine produced a meaningful score from real data. False for proxy/grey tiles. */
  scoreable: boolean;
}

/**
 * All numeric and pre-formatted string values that tile note templates may reference.
 *
 * Naming convention:
 *   - Suffix `_k`    = pre-formatted integer thousands string ("45"). Author writes `£{cash_k}k`.
 *   - Suffix `_m`    = pre-formatted integer millions string ("2.1").
 *   - Suffix `_mo`   = integer months string. Author writes `{months_mo}`.
 *   - Suffix `_pct`  = integer percentage string (no % symbol). Author writes `{contrib_pct}%`.
 *   - Suffix `_yr`   = integer years string. Author writes `{ni_yr}`.
 *   - Raw numbers used for arithmetic only are not exposed in TileMetrics.
 *
 * All values are pre-formatted strings so the template engine does zero arithmetic.
 * The engine decides rounding once; template authors use values as opaque tokens.
 */
export interface TileMetrics {
  // ---- cash tile ----
  cash_k?: string;
  cash_months?: string;

  // ---- debt tile ----
  consumer_debt_k?: string;

  // ---- mortgage tile ----
  mortgage_balance_k?: string;
  mortgage_clear_age?: string;
  mortgage_pti_pct?: string;

  // ---- pension tile ----
  contrib_pct?: string;
  age_target_pct?: string;
  pension_k?: string;
  gap_k?: string;

  // ---- state pension tile ----
  ni_yr?: string;
  sp_annual_k?: string;

  // ---- retirement tile ----
  coverage_pct?: string;
  retire_age?: string;
  shortfall_age?: string;

  // ---- investment tile ----
  wrapper_count?: string;

  // ---- tax tile ----
  income_k?: string;

  // ---- iht tile ----
  estate_k?: string;
  nil_rate_total_k?: string;
  iht_exposure_k?: string;

  // ---- twelfth tile ----
  business_pct?: string;
}

export type TileScoreMap = Record<TileKey, TileScore>;
