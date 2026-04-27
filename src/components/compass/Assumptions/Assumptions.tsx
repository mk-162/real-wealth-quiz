/**
 * Assumptions — published methodology footer.
 *
 * Renders a compact "ASSUMPTIONS · Risk profile X · Cash Y · …" line at the
 * bottom of every chart page.
 *
 * Source of truth for the prose lives in `content/report/assumptions.md`
 * (canonical `kind: global` shape, `# Body` section). Engine-derived values
 * flow in via `assumptions` and substitute into the body's `{token}`
 * placeholders. If `bodyTemplate` is not supplied (because the call site
 * couldn't load the markdown, or for tests), we fall back to a hardcoded
 * string identical to the markdown's default — visual parity guaranteed.
 *
 * Loading the markdown is the caller's responsibility — this component is a
 * pure renderer so it stays usable from any client/server context. Pure
 * helpers live in `./tokens.ts` to keep them testable without React or CSS.
 */

import type { CompassReport } from '@/lib/compass/types';
import {
  buildAssumptionTokens,
  applyAssumptionTokens,
  DEFAULT_BODY_TEMPLATE,
  DEFAULT_NOT_MODELLED,
} from './tokens';
import styles from './Assumptions.module.css';

export interface AssumptionsProps {
  assumptions: CompassReport['assumptions'];
  /**
   * Body template loaded from `content/report/assumptions.md`. May be `null`
   * (gating blocked publication, file missing, or test bypass) — in that case
   * the component falls back to the hardcoded default.
   */
  bodyTemplate?: string | null;
  /** Additional "not modelled" trailing clause. Defaulted to a sensible list. */
  notModelled?: string;
}

export function Assumptions({
  assumptions,
  bodyTemplate,
  notModelled = DEFAULT_NOT_MODELLED,
}: AssumptionsProps) {
  const tokens = buildAssumptionTokens(assumptions, notModelled);
  const template = bodyTemplate?.trim() || DEFAULT_BODY_TEMPLATE;
  const filled = applyAssumptionTokens(template, tokens);
  return (
    <p className={styles.block}>
      {renderAssumptionLine(filled)}
    </p>
  );
}

/**
 * Render the substituted line, handling the single bit of inline markdown
 * we use: `**ASSUMPTIONS**` → <strong>ASSUMPTIONS</strong>. Anything else is
 * treated as literal text.
 */
function renderAssumptionLine(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const m = part.match(/^\*\*(.+)\*\*$/);
    if (m) {
      return (
        <strong key={index}>
          {m[1]}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
