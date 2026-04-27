/**
 * Compliance gate utility.
 *
 * Content authored under `content/` carries a `compliance_status` frontmatter
 * field with one of three values: `draft`, `in_review`, `approved_to_ship`.
 *
 * This module is a pure, reusable gate used by the user-facing PDF-report
 * loaders (see `src/lib/compass/pdf-content.ts`) and any other runtime that
 * renders authored content to end users. It does NOT apply to the
 * questionnaire engine (gating/microcopy/screens) — those loaders handle
 * their own lifecycle.
 *
 * Behaviour (opt-in enforcement):
 *   - By default, ALL content passes regardless of status or environment.
 *     This means draft content renders everywhere until enforcement is enabled.
 *   - Set `RW_ENFORCE_COMPLIANCE=1` to enable the gate. Once enabled, only
 *     `approved_to_ship` content passes. Everything else (draft, in_review,
 *     missing, or unknown string) is rejected.
 *
 * Workflow:
 *   1. Authors write and review content — it renders in all environments.
 *   2. Before going live, flip `compliance_status: draft` → `approved_to_ship`
 *      for each reviewed file.
 *   3. Set `RW_ENFORCE_COMPLIANCE=1` in the production environment to activate
 *      the gate for all future content.
 *
 * Pair `canPublishInProduction` with an explicit `requireApproved` flag on
 * single-item loaders (throw clear error on failure), and use
 * `filterApproved` to silently strip unapproved items from array loaders.
 */

/** True when compliance enforcement is explicitly opted in. */
function isComplianceEnforced(): boolean {
  const raw = process.env.RW_ENFORCE_COMPLIANCE;
  if (!raw) return false;
  const v = raw.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Returns true when a compliance_status value is safe to render to end users.
 *
 *  When enforcement is off (default), always returns true.
 *  When enforcement is on (`RW_ENFORCE_COMPLIANCE=1`), only `approved_to_ship` passes.
 */
export function canPublishInProduction(status: string | undefined): boolean {
  if (!isComplianceEnforced()) return true;
  return status === 'approved_to_ship';
}

/**
 * Filter an array of items to those whose `compliance_status` passes the gate.
 * Items without the field are dropped in production (fail-closed), kept in dev.
 */
export function filterApproved<T extends { compliance_status?: string }>(items: T[]): T[] {
  return items.filter(item => canPublishInProduction(item.compliance_status));
}
