/**
 * Compass — shared number formatters.
 */

export function gbp(v: number): string {
  if (!isFinite(v)) return '£0';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `£${(v / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}m`;
  if (abs >= 10_000) return `£${Math.round(v / 1000)}k`;
  return `£${Math.round(v).toLocaleString('en-GB')}`;
}
