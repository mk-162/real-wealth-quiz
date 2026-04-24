import type { TileMetrics } from './tile-scoring-types';

/**
 * Replace `{token}` placeholders in a tile note template with pre-formatted metric values.
 *
 * Rules:
 *   - `{token}` is replaced with `metrics[token]` if present and non-empty.
 *   - If `metrics[token]` is undefined, the placeholder is LEFT IN PLACE (e.g. literal
 *     `{token}` appears in output). This surfaces missing tokens as visible strings
 *     in dev so authors notice immediately; in production the tile still renders
 *     but the note will look wrong — monitored via log.
 *   - If the note contains no `{`, it is returned unchanged (fast path for legacy static copy).
 *   - Substitution is single-pass (no recursive token resolution).
 *   - All values in TileMetrics are already strings — no number formatting happens here.
 *
 * @param template - Raw note text from tile markdown, may or may not contain `{tokens}`.
 * @param metrics  - Pre-formatted values from the scoring engine.
 * @returns        Note with tokens substituted; unknown tokens left as literal.
 */
export function applyTemplate(template: string, metrics: TileMetrics): string {
  if (!template.includes('{')) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = (metrics as Record<string, string | undefined>)[key];
    return value !== undefined ? value : match;
  });
}
