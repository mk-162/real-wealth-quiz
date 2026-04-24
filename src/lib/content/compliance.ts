/**
 * Compliance gate utility.
 *
 * Content authored under `content/` carries a `compliance_status` frontmatter
 * field with one of three values: `draft`, `in_review`, `approved_to_ship`.
 * Only `approved_to_ship` is cleared for production end-user display.
 *
 * This module is a pure, reusable gate used by the user-facing PDF-report
 * loaders (see `src/lib/compass/pdf-content.ts`) and any other runtime that
 * renders authored content to end users. It does NOT apply to the
 * questionnaire engine (gating/microcopy/screens) — those loaders handle
 * their own lifecycle.
 *
 * Behaviour:
 *   - In production (`NODE_ENV === 'production'`): only `approved_to_ship`
 *     content passes the gate. Anything else (draft, in_review, missing, or
 *     unknown string) is rejected.
 *   - In non-production (dev, staging, test, etc.): everything passes, so
 *     authors can preview draft content locally.
 *
 * Escape hatch — `RW_BYPASS_COMPLIANCE`:
 *   When the env var `RW_BYPASS_COMPLIANCE` is set to any truthy value
 *   (`"1"`, `"true"`, `"yes"`), the gate unconditionally returns `true` for
 *   every input, regardless of `NODE_ENV` or `compliance_status`. This exists
 *   so demo and staging deploys can render draft content end-to-end without
 *   flipping every tile to `approved_to_ship`.
 *
 *   Usage:   `RW_BYPASS_COMPLIANCE=1 npm run build`
 *
 *   WARNING: Never set this in a real production environment. Doing so ships
 *   unapproved, unreviewed content to end users and defeats the whole point
 *   of the gate. Intended only for internal previews.
 *
 * Pair `canPublishInProduction` with an explicit `requireApproved` flag on
 * single-item loaders (throw clear error on failure), and use
 * `filterApproved` to silently strip unapproved items from array loaders.
 */

/** True when `RW_BYPASS_COMPLIANCE` is set to a truthy value (demo/staging only). */
function isComplianceBypassed(): boolean {
  const raw = process.env.RW_BYPASS_COMPLIANCE;
  if (!raw) return false;
  const v = raw.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Returns true when a compliance_status value is safe to render to end users. */
export function canPublishInProduction(status: string | undefined): boolean {
  if (isComplianceBypassed()) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return status === 'approved_to_ship';
}

/**
 * Filter an array of items to those whose `compliance_status` passes the gate.
 * Items without the field are dropped in production (fail-closed), kept in dev.
 */
export function filterApproved<T extends { compliance_status?: string }>(items: T[]): T[] {
  return items.filter(item => canPublishInProduction(item.compliance_status));
}
