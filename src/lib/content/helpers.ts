/**
 * Tiny runtime helpers for consuming the generated content catalogue from
 * React components. The catalogue is typed as Record<string, unknown> on the
 * page entries (YAML frontmatter is too variable to enforce at build time),
 * so these helpers provide narrow, intent-named accessors with safe fallbacks.
 */
import {
  pages,
  microcopy as microcopyGroups,
  segments as segmentCtas,
  provocations as provocationCatalogue,
  awareness as awarenessCatalogue,
} from './catalogue';

/** Get a page's sections by id. Throws with a clear message if missing. */
export function getPage(id: string): Record<string, unknown> {
  const entry = pages.find((p) => p.id === id);
  if (!entry) {
    throw new Error(
      `Content missing: no page with id="${id}" in content/pages/. ` +
        `Available ids: ${pages.map((p) => p.id).join(', ')}`,
    );
  }
  return entry.sections;
}

/**
 * Read a nested value off a page's sections. Accepts a dotted path, e.g.
 *   pageValue('homepage', 'hero.headline')
 * Returns the value if present, or the fallback if any step is missing.
 */
export function pageValue<T = unknown>(
  id: string,
  path: string,
  fallback?: T,
): T {
  const sections = getPage(id);
  const keys = path.split('.');
  let cursor: unknown = sections;
  for (const key of keys) {
    if (cursor && typeof cursor === 'object' && key in (cursor as object)) {
      cursor = (cursor as Record<string, unknown>)[key];
    } else {
      return fallback as T;
    }
  }
  return (cursor as T) ?? (fallback as T);
}

/** Look up a microcopy entry by group + key. Falls back to the key itself. */
export function microcopy(groupId: string, key: string, fallback?: string): string {
  const group = microcopyGroups.find((g) => g.id === groupId);
  if (!group) return fallback ?? key;
  const entry = group.entries.find((e) => e.key === key);
  return entry?.value ?? fallback ?? key;
}

/** Find the segment CTA for a given segment id (S1-S9). */
export function segmentCta(segmentId: string) {
  return segmentCtas.find((s) => s.kind === 'segment' && s.segment === segmentId);
}

/** Find the CTA overlay for advised-but-looking or urgency. */
export function overlayCta(
  overlay: 'advised_but_looking' | 'urgency_this_week',
) {
  return segmentCtas.find((s) => s.kind === 'overlay' && s.overlay === overlay);
}

/** Look up an awareness check by id. */
export function awarenessById(id: string) {
  return awarenessCatalogue.find((a) => a.id === id);
}

/** Look up a provocation by id. */
export function provocationById(id: string) {
  return provocationCatalogue.find((p) => p.id === id);
}
