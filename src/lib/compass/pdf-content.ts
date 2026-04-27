/**
 * PDF report content loader.
 *
 * Parses the markdown files under `content/report/` (written by the
 * content agent) into typed structures that the report components consume.
 *
 * This module uses Node `fs` and `gray-matter`, so it is server-only. Import
 * it only from server components (`generateStaticParams`, page.tsx without
 * `'use client'`) — never from client components. The parsed result is then
 * serialised and passed as props into the client component tree.
 *
 * Canonical file format (Phase 2 / S4):
 *   - YAML frontmatter with `id`, `kind` (per_segment | global), `title`,
 *     optional `description`, `compliance_status`, plus any kind-specific
 *     extras (tile thresholds, gauge zones, etc.) ride along untouched.
 *   - Body split by `# S1` … `# S9` H1 sections for `per_segment` blocks,
 *     or a single `# Body` H1 for `global` blocks.
 *   - Inside per-segment sections, the historic `key: value` micro-format
 *     (status / note / capacity / rationale) still drives tile + goal
 *     parsing. Long-form sub-sections (gauge zone variants, banner
 *     headline + supporting copy) live under H2 headings.
 *
 * Parsed results are memoised; the loader reads the filesystem once per
 * build.
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type {
  PlanningTile,
  WellbeingGoal,
  HealthZoneVariants,
  TileStatus,
  TileKey,
} from './types';
import type { TileScoreMap } from './tile-scoring-types';
import { applyTemplate } from './tile-template';
import { canPublishInProduction, filterApproved } from '../content/compliance';

/** Thrown by single-item loaders when `requireApproved` is set and content isn't cleared for production. */
function assertApproved(filePath: string, complianceStatus: string | undefined): void {
  if (!canPublishInProduction(complianceStatus)) {
    throw new Error(
      `Content not approved to ship: ${filePath} (compliance_status: ${complianceStatus}). ` +
      `Set requireApproved=false to bypass in dev.`
    );
  }
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'report');
const TILES_DIR = path.join(CONTENT_ROOT, 'planning-grid');
const GOALS_DIR = path.join(CONTENT_ROOT, 'goals');
const HEALTH_GAUGE_FILE = path.join(CONTENT_ROOT, 'health-gauge.md');
const TAKEAWAY_FILE = path.join(CONTENT_ROOT, 'takeaway-banners.md');

// ---------------------------------------------------------------------------
// Body parsing helpers
// ---------------------------------------------------------------------------

/**
 * Strip stand-alone horizontal-rule separators (lines of exactly `---`).
 *
 * The content agent uses `---` as a visual section separator inside the body
 * of multi-section files. Left in place, they contaminate section bodies and
 * throw off quote-stripping. Safely removed because the real section delimiter
 * is the H1 heading.
 */
function stripHorizontalRules(md: string): string {
  return md.replace(/^\s*---\s*$/gm, '');
}

/**
 * Split a markdown body into H1 section chunks.
 *
 * Returns a list of `{ heading, body }` pairs. The heading is the text after
 * the leading `# ` on an H1 line. The body is everything from that line's end
 * up to (but not including) the next H1. Leading/trailing whitespace trimmed.
 */
function splitByH1(md: string): { heading: string; body: string }[] {
  const stripped = stripHorizontalRules(md);
  const lines = stripped.split(/\r?\n/);
  const sections: { heading: string; body: string }[] = [];
  let current: { heading: string; body: string } | null = null;

  for (const line of lines) {
    const match = /^#\s+(.+?)\s*$/.exec(line);
    if (match && !/^#{2,}/.test(line)) {
      if (current) sections.push({ ...current, body: current.body.trim() });
      current = { heading: match[1], body: '' };
    } else {
      if (current) current.body += line + '\n';
    }
  }
  if (current) sections.push({ ...current, body: current.body.trim() });
  return sections;
}

/**
 * Split a section body into H2 sub-sections using `## ` headings.
 */
function splitByH2(body: string): { heading: string; body: string }[] {
  const lines = body.split(/\r?\n/);
  const out: { heading: string; body: string }[] = [];
  let current: { heading: string; body: string } | null = null;
  for (const line of lines) {
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (match) {
      if (current) out.push({ ...current, body: current.body.trim() });
      current = { heading: match[1], body: '' };
    } else if (current) {
      current.body += line + '\n';
    }
  }
  if (current) out.push({ ...current, body: current.body.trim() });
  return out;
}

/**
 * Parse "loose key-value lines" into a record.
 *
 * Matches lines of shape `key: value` where `value` may be a quoted string.
 * Multi-line quoted values are supported (ends at closing quote). Unquoted
 * single-line values are also supported. Other content is ignored.
 */
function parseKeyValues(body: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = body.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = /^(\w+)\s*:\s*(.*)$/.exec(line);
    if (!match) { i++; continue; }
    const [, key, rest] = match;

    if (rest.startsWith('"') && !rest.endsWith('"')) {
      // multi-line quoted value
      let acc = rest.slice(1);
      i++;
      while (i < lines.length && !lines[i].endsWith('"')) {
        acc += '\n' + lines[i];
        i++;
      }
      if (i < lines.length) {
        acc += '\n' + lines[i].slice(0, -1); // strip trailing quote
        i++;
      }
      result[key] = acc.trim();
    } else if (rest.startsWith('"') && rest.endsWith('"') && rest.length >= 2) {
      result[key] = rest.slice(1, -1);
      i++;
    } else {
      result[key] = rest.trim();
      i++;
    }
  }
  return result;
}

/**
 * Pull the segment id out of an H1 heading like "S2 — Mass-Affluent Mid-Career".
 */
function extractSegmentId(heading: string): string | null {
  const match = /^(S\d)\b/.exec(heading.trim());
  return match ? match[1] : null;
}

function extractGoalIndex(heading: string): number | null {
  const match = /^Goal\s+(\d+)/i.exec(heading.trim());
  return match ? Number(match[1]) : null;
}

function extractGoalTitle(heading: string): string {
  // "Goal 2 — Pay off the mortgage by 58" → "Pay off the mortgage by 58"
  const match = /^Goal\s+\d+\s*[—-]\s*(.+)$/i.exec(heading.trim());
  return match ? match[1].trim() : heading.trim();
}

/**
 * Normalise a status string to a TileStatus. Planning files use "red", "amber",
 * "green", "grey" for tiles and goals.
 */
function normaliseStatus(raw: string | undefined, fallback: TileStatus = 'grey'): TileStatus {
  if (!raw) return fallback;
  const v = raw.trim().toLowerCase();
  if (v === 'red' || v === 'amber' || v === 'green' || v === 'grey' || v === 'gray') {
    return v === 'gray' ? 'grey' : (v as TileStatus);
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Tile loader — content/report/planning-grid/tile-NN-*.md
// ---------------------------------------------------------------------------

export interface TileContent {
  key: TileKey;
  /** Fallback label — used when a segment didn't author a `tile_label`. */
  label: string;
  /** Fallback whatItChecks — used when the tile has a single variant. */
  whatItChecks: string;
  thresholds: Record<string, string>; // green/amber/red/grey → description
  /** `compliance_status` from tile frontmatter: draft | in_review | approved_to_ship. */
  compliance_status?: string;
  perSegment: Map<string, {
    status: TileStatus;
    note: string;
    /** Per-segment label override. Sourced from `tile_label:` or `label:` body key. */
    label?: string;
    /** Per-segment whatItChecks override (picked from owners/others variant on tile 12). */
    whatItChecks?: string;
    gaugeReframe?: string;
  }>;
}

const TILE_FILE_TO_KEY: Record<string, TileKey> = {
  'tile-01-retirement-readiness.md': 'retirement',
  'tile-02-pension-contributions.md': 'pension',
  'tile-03-state-pension.md': 'statePension',
  'tile-04-investment-strategy.md': 'investment',
  'tile-05-tax-efficiency.md': 'tax',
  'tile-06-emergency-cash.md': 'cash',
  'tile-07-debt-position.md': 'debt',
  'tile-08-mortgage.md': 'mortgage',
  'tile-09-estate-planning.md': 'estate',
  'tile-10-inheritance-tax.md': 'iht',
  'tile-11-protection.md': 'protection',
  'tile-12-business-income-mix.md': 'twelfth',
};

let _tileCache: TileContent[] | null = null;

function loadTilesOnce(): TileContent[] {
  if (_tileCache) return _tileCache;

  const out: TileContent[] = [];
  for (const [file, key] of Object.entries(TILE_FILE_TO_KEY)) {
    const full = path.join(TILES_DIR, file);
    if (!fs.existsSync(full)) continue;

    const raw = fs.readFileSync(full, 'utf8');
    const parsed = matter(raw);
    // Tile frontmatter has either a single-shape (label + what_it_checks) or a
    // dual-variant shape (label_owners/label_others + what_it_checks_owners/_others).
    // Tile 12 uses the dual-variant shape because the tile means different things
    // to owners (Business exit) vs others (Income mix).
    const fm = parsed.data as {
      label?: string;
      label_owners?: string;
      label_others?: string;
      what_it_checks?: string;
      what_it_checks_owners?: string;
      what_it_checks_others?: string;
      thresholds?: Record<string, string>;
      compliance_status?: string;
    };

    const fallbackLabel = fm.label ?? fm.label_others ?? fm.label_owners ?? String(key);
    const fallbackWhatItChecks = fm.what_it_checks ?? fm.what_it_checks_others ?? fm.what_it_checks_owners ?? '';

    /** Pick the matching whatItChecks variant for a per-segment label on a dual-variant tile. */
    function pickWhatItChecks(perSegLabel: string | undefined): string {
      if (!fm.what_it_checks_owners && !fm.what_it_checks_others) return fallbackWhatItChecks;
      if (perSegLabel && fm.label_owners && perSegLabel === fm.label_owners) {
        return fm.what_it_checks_owners ?? fallbackWhatItChecks;
      }
      return fm.what_it_checks_others ?? fallbackWhatItChecks;
    }

    const perSegment = new Map<string, {
      status: TileStatus;
      note: string;
      label?: string;
      whatItChecks?: string;
      gaugeReframe?: string;
    }>();
    for (const section of splitByH1(parsed.content)) {
      const segId = extractSegmentId(section.heading);
      if (!segId) continue;
      const kv = parseKeyValues(section.body);
      // Per-segment label key: prefer `tile_label` (dual-variant convention), fall back to `label`.
      const perSegLabel = kv.tile_label ?? kv.label;
      perSegment.set(segId, {
        status: normaliseStatus(kv.status),
        note: kv.note ?? '',
        label: perSegLabel,
        whatItChecks: pickWhatItChecks(perSegLabel),
        gaugeReframe: kv.gauge_reframe,
      });
    }

    out.push({
      key,
      label: fallbackLabel,
      whatItChecks: fallbackWhatItChecks,
      thresholds: fm.thresholds ?? {},
      compliance_status: fm.compliance_status,
      perSegment,
    });
  }

  _tileCache = out;
  return out;
}

/**
 * Returns the 12 tiles for a segment, each with its content-agent note + whatItChecks.
 *
 * The grid always renders 12 positional slots (tiles are keyed, not list items),
 * so we can't filter the array. Instead, tiles whose source file is unapproved
 * in production fall back to the neutral `grey` / `Not checked` state — the
 * same degradation used when a tile file is missing entirely.
 */
export function loadPlanningTiles(
  segmentId: string,
  tileScores?: TileScoreMap,
): PlanningTile[] {
  const tiles = loadTilesOnce();
  return tiles.map(t => {
    const approved = canPublishInProduction(t.compliance_status);
    const seg = approved ? t.perSegment.get(segmentId) : undefined;
    // Per-segment label and whatItChecks win over tile-level fallback. This is
    // what makes tile 12 flip to "Business exit" (owners) vs "Income mix" (others)
    // depending on segment.
    const label = seg?.label ?? t.label;

    const engineScore = tileScores?.[t.key];
    const contentStatus = seg?.status;
    const contentNote = seg?.note ?? 'Not checked';

    // Status precedence: engine (if scoreable) > content-authored > grey fallback.
    // If compliance gate blocks (approved === false), engine result is hidden
    // behind grey — engine still ran but we don't surface it.
    const effectiveStatus: TileStatus = !approved
      ? 'grey'
      : (engineScore?.scoreable ? engineScore.status : (contentStatus ?? 'grey'));

    // Note: if engine scored AND content is approved, run template substitution.
    // Otherwise render content note as-is (legacy static copy still works).
    const effectiveNote: string = !approved || !engineScore?.scoreable
      ? contentNote
      : applyTemplate(contentNote, engineScore.metrics);

    return {
      key: t.key,
      label,
      status: effectiveStatus,
      note: effectiveNote,
      whatItChecks: approved ? (seg?.whatItChecks || t.whatItChecks || undefined) : undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// Goals loader — content/report/goals/S[n]-*.md
// ---------------------------------------------------------------------------

interface GoalsEntry {
  compliance_status?: string;
  goals: WellbeingGoal[];
}

let _goalsCache: Map<string, GoalsEntry> | null = null;

function loadGoalsOnce(): Map<string, GoalsEntry> {
  if (_goalsCache) return _goalsCache;

  const out = new Map<string, GoalsEntry>();
  if (!fs.existsSync(GOALS_DIR)) {
    _goalsCache = out;
    return out;
  }

  for (const file of fs.readdirSync(GOALS_DIR)) {
    if (!file.endsWith('.md') || file === 'README.md') continue;
    const full = path.join(GOALS_DIR, file);
    const raw = fs.readFileSync(full, 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data as { segment?: string; id?: string; compliance_status?: string };

    // Canonical id format `report.goals.S<n>` (or legacy `pdf.goals.S<n>`)
    // is the source of truth — fall back to `segment:` for files that still
    // carry the old extra field.
    const idMatch = typeof fm.id === 'string' ? /\.(S\d)$/.exec(fm.id) : null;
    const segId = idMatch?.[1] ?? fm.segment;
    if (!segId) continue;

    // Each goals file is for ONE segment. The canonical body wraps the
    // segment's goals under a single `# S<n>` H1, with one H2 per goal.
    // `extractGoalIndex` returns null for headings that aren't `Goal N` —
    // the segment H1 is naturally skipped.
    const goals: WellbeingGoal[] = [];
    const segmentSections = splitByH1(parsed.content)
      .filter((s) => extractSegmentId(s.heading) === segId);
    const goalSections = segmentSections.length > 0
      // New canonical shape: H2 sub-sections under the segment H1.
      ? segmentSections.flatMap((s) => splitByH2(s.body))
      // Pre-migration shape: H1 `# Goal N — …` sections at the top level.
      : splitByH1(parsed.content);

    for (const section of goalSections) {
      const idx = extractGoalIndex(section.heading);
      if (idx === null) continue;
      const kv = parseKeyValues(section.body);
      goals.push({
        goal: extractGoalTitle(section.heading),
        capacity: kv.capacity ?? '',
        rationale: kv.rationale,
        alignment: normaliseStatus(kv.status, 'amber'),
      });
    }
    out.set(segId, { compliance_status: fm.compliance_status, goals });
  }

  _goalsCache = out;
  return out;
}

/**
 * Returns the goals for a segment. Goals are a per-segment *list* that can
 * be filtered wholesale: if the segment's goals file is not approved for
 * production, callers see an empty array and the fixture baseline takes over.
 */
export function loadGoals(segmentId: string): WellbeingGoal[] {
  const entry = loadGoalsOnce().get(segmentId);
  if (!entry) return [];
  if (!canPublishInProduction(entry.compliance_status)) return [];
  return entry.goals;
}

// ---------------------------------------------------------------------------
// Health-gauge loader — content/report/health-gauge.md
// ---------------------------------------------------------------------------

export interface HealthGaugeCopy {
  /** Fallback interpretation (first zone variant encountered, typically "typical"). */
  defaultInterpretation: string;
  /** Per-zone variants. */
  zoneVariants: HealthZoneVariants;
  /** Optional re-framing label for S8 ("of expected remaining lifetime covered"). */
  gaugeReframe?: string;
}

interface HealthGaugeCache {
  /** File-level `compliance_status` from health-gauge.md frontmatter. */
  compliance_status?: string;
  perSegment: Map<string, HealthGaugeCopy>;
}

let _gaugeCache: HealthGaugeCache | null = null;

function loadHealthGaugeOnce(): HealthGaugeCache {
  if (_gaugeCache) return _gaugeCache;

  const perSegment = new Map<string, HealthGaugeCopy>();
  if (!fs.existsSync(HEALTH_GAUGE_FILE)) {
    _gaugeCache = { perSegment };
    return _gaugeCache;
  }

  const raw = fs.readFileSync(HEALTH_GAUGE_FILE, 'utf8');
  const parsed = matter(raw);
  const fm = parsed.data as { compliance_status?: string };

  for (const section of splitByH1(parsed.content)) {
    const segId = extractSegmentId(section.heading);
    if (!segId) continue;

    const subs = splitByH2(section.body);
    const zoneVariants: HealthZoneVariants = {};
    let defaultInterpretation = '';

    for (const sub of subs) {
      // Heading like: "Zone: amber (typical ~88%)"
      const m = /^Zone:\s*(red|amber|green|blue)/i.exec(sub.heading);
      if (!m) continue;
      const zone = m[1].toLowerCase() as keyof HealthZoneVariants;

      // Body is the prose; take the first non-empty line (often a quoted string).
      const bodyText = sub.body.trim().replace(/^"|"$/g, '');
      zoneVariants[zone] = bodyText;
      if (!defaultInterpretation) defaultInterpretation = bodyText;
    }

    perSegment.set(segId, { defaultInterpretation, zoneVariants });
  }

  _gaugeCache = { compliance_status: fm.compliance_status, perSegment };
  return _gaugeCache;
}

/**
 * Pick the best interpretation copy for this segment + actual score.
 * Falls back to any available copy if the score's zone isn't authored.
 *
 * When `requireApproved` is true and the source file's `compliance_status`
 * is not `approved_to_ship`, this throws rather than silently returning the
 * fixture baseline — so a production build loudly fails instead of shipping
 * unreviewed copy. In non-production, everything passes (see
 * `canPublishInProduction`) so the flag is a no-op for dev/staging.
 */
export function pickHealthInterpretation(
  segmentId: string,
  score: number,
  requireApproved = false,
): { copy: string; zoneVariants: HealthZoneVariants } | null {
  const cache = loadHealthGaugeOnce();
  if (requireApproved) {
    assertApproved(HEALTH_GAUGE_FILE, cache.compliance_status);
  } else if (!canPublishInProduction(cache.compliance_status)) {
    return null;
  }

  const content = cache.perSegment.get(segmentId);
  if (!content) return null;

  const zone: keyof HealthZoneVariants =
    score < 70 ? 'red' :
    score < 90 ? 'amber' :
    score <= 115 ? 'green' : 'blue';

  return {
    copy: content.zoneVariants[zone] ?? content.defaultInterpretation,
    zoneVariants: content.zoneVariants,
  };
}

// ---------------------------------------------------------------------------
// Takeaway loader — content/report/takeaway-banners.md
// ---------------------------------------------------------------------------

export interface TakeawayContent {
  title: string;
  body: string;
}

interface TakeawayCache {
  compliance_status?: string;
  perSegment: Map<string, TakeawayContent>;
}

let _takeawayCache: TakeawayCache | null = null;

function loadTakeawayOnce(): TakeawayCache {
  if (_takeawayCache) return _takeawayCache;

  const perSegment = new Map<string, TakeawayContent>();
  if (!fs.existsSync(TAKEAWAY_FILE)) {
    _takeawayCache = { perSegment };
    return _takeawayCache;
  }

  const raw = fs.readFileSync(TAKEAWAY_FILE, 'utf8');
  const parsed = matter(raw);
  const fm = parsed.data as { compliance_status?: string };

  for (const section of splitByH1(parsed.content)) {
    const segId = extractSegmentId(section.heading);
    if (!segId) continue;

    const subs = splitByH2(section.body);
    let title = '';
    let body = '';

    for (const sub of subs) {
      if (/banner headline/i.test(sub.heading)) {
        title = sub.body.trim().replace(/^"|"$/g, '');
      } else if (/supporting copy/i.test(sub.heading)) {
        body = sub.body.trim();
      }
    }

    if (title || body) perSegment.set(segId, { title, body });
  }

  _takeawayCache = { compliance_status: fm.compliance_status, perSegment };
  return _takeawayCache;
}

/**
 * Returns the headline takeaway banner for a segment.
 *
 * With `requireApproved=true` (production render paths), throws if the source
 * file is not `approved_to_ship`. Otherwise returns `null` for non-approved
 * content in production, letting the caller fall back to fixture copy.
 */
export function loadTakeaway(segmentId: string, requireApproved = false): TakeawayContent | null {
  const cache = loadTakeawayOnce();
  if (requireApproved) {
    assertApproved(TAKEAWAY_FILE, cache.compliance_status);
  } else if (!canPublishInProduction(cache.compliance_status)) {
    return null;
  }
  return cache.perSegment.get(segmentId) ?? null;
}

// ---------------------------------------------------------------------------
// Awareness-checks-expanded loader
// content/report/awareness-checks-expanded/<slug>.md
//
// Display copy only — selection logic lives in content/awareness-checks/*.md
// and is joined back to expanded copy via the `source_id` frontmatter field.
// ---------------------------------------------------------------------------

export interface ExpandedAwarenessCheck {
  /** `pitfall.<slug>` — matches `id` on the original awareness-check file. */
  sourceId: string;
  /** H1 heading from the expanded body ("Lasting Power of Attorney — the legal gap…"). */
  title: string;
  /** Three body paragraphs: context / specifics / bridge. Length varies. */
  paragraphs: string[];
  /** Optional illustration slug → `/report-preview/assets/illustrations/<slug>.svg`. */
  imageSlug?: string;
  complianceStatus: string;
}

const EXPANDED_DIR = path.join(CONTENT_ROOT, 'awareness-checks-expanded');

let _expandedCache: Map<string, ExpandedAwarenessCheck> | null = null;

function loadExpandedOnce(): Map<string, ExpandedAwarenessCheck> {
  if (_expandedCache) return _expandedCache;

  const out = new Map<string, ExpandedAwarenessCheck>();
  if (!fs.existsSync(EXPANDED_DIR)) {
    _expandedCache = out;
    return out;
  }

  for (const file of fs.readdirSync(EXPANDED_DIR)) {
    if (!file.endsWith('.md') || file === 'README.md') continue;
    const full = path.join(EXPANDED_DIR, file);
    const raw = fs.readFileSync(full, 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data as {
      source_id?: string;
      image_slug?: string;
      compliance_status?: string;
    };
    if (!fm.source_id) continue;

    // Body: one H1 heading (the topic title) followed by 1-3 blank-line-separated paragraphs.
    const sections = splitByH1(parsed.content);
    if (sections.length === 0) continue;
    const section = sections[0];
    const paragraphs = section.body
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    out.set(fm.source_id, {
      sourceId: fm.source_id,
      title: section.heading.trim(),
      paragraphs,
      imageSlug: fm.image_slug,
      complianceStatus: fm.compliance_status ?? 'draft',
    });
  }

  _expandedCache = out;
  return out;
}

/** Returns the expanded card for a given `pitfall.<slug>` source id, or null. */
export function loadExpandedAwarenessCheck(sourceId: string): ExpandedAwarenessCheck | null {
  return loadExpandedOnce().get(sourceId) ?? null;
}

let _allChecksCache: ExpandedAwarenessCheck[] | null = null;

/**
 * Returns all expanded awareness checks, sorted by source_id, filtered through
 * the compliance gate. In dev/staging all items pass; with RW_ENFORCE_COMPLIANCE=1
 * set only `approved_to_ship` items are included.
 *
 * Used by page 06 which shows the full library unconditionally — one PageFrame
 * per check, no per-segment trigger selection. Result is memoised because the
 * sort + filter is stable across the process lifetime.
 */
export function loadAllExpandedChecks(): ExpandedAwarenessCheck[] {
  if (_allChecksCache) return _allChecksCache;
  const all = Array.from(loadExpandedOnce().values()).filter(r => canPublishInProduction(r.complianceStatus));
  all.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  _allChecksCache = all;
  return all;
}

/**
 * Batch loader for the per-segment "Five things" page.
 *
 * Takes the content-agent's expanded copy library and a segment's curated list
 * of source_ids (hand-picked in fixtures today; will come from a DSL-driven
 * resolver against content/awareness-checks/*.md once sessions produce real
 * trigger data). Returns up to 4 standard cards + 1 featured "fifth" if present.
 */
export interface FiveThingsSelection {
  standard: ExpandedAwarenessCheck[]; // up to 4
  featured: ExpandedAwarenessCheck | null;
}

export function loadFiveThings(sourceIds: string[]): FiveThingsSelection {
  const map = loadExpandedOnce();
  const resolved = sourceIds
    .map(id => map.get(id) ?? null)
    .filter((x): x is ExpandedAwarenessCheck => x !== null);
  // Gate each expanded card on its own `compliance_status`. In production any
  // card that is still `draft` or `in_review` is dropped from the selection,
  // so the list silently shrinks rather than exposing unreviewed copy. Dev
  // and staging pass everything through.
  const items = filterApproved(
    resolved.map(r => ({ ...r, compliance_status: r.complianceStatus })),
  );
  return {
    standard: items.slice(0, 4),
    featured: items.length > 4 ? items[4] : null,
  };
}

// ---------------------------------------------------------------------------
// Methodology loader — content/report/methodology.md
// ---------------------------------------------------------------------------

export interface MethodologyContent {
  title: string;
  pageHeading: string;
  openingParagraph: string;
  sections: { heading: string; body: string }[];
  /** `compliance_status` from methodology.md frontmatter. */
  compliance_status?: string;
}

let _methodologyCache: MethodologyContent | null = null;

function loadMethodologyOnce(): MethodologyContent | null {
  if (_methodologyCache) return _methodologyCache;

  const file = path.join(CONTENT_ROOT, 'methodology.md');
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const fm = parsed.data as { title?: string; compliance_status?: string };

  // Canonical shape: a single `# Body` H1 with H2 sub-sections inside.
  // Pre-migration shape used H1 sub-sections directly. We accept both so
  // the loader stays compatible across the migration boundary.
  const h1Sections = splitByH1(parsed.content);
  const bodyH1 = h1Sections.find((s) => /^body$/i.test(s.heading));
  const innerSections = bodyH1 ? splitByH2(bodyH1.body) : h1Sections;

  let pageHeading = '';
  let openingParagraph = '';
  const sections: { heading: string; body: string }[] = [];

  for (const s of innerSections) {
    if (/^page heading/i.test(s.heading)) {
      pageHeading = s.body.trim();
    } else if (/^opening paragraph/i.test(s.heading)) {
      openingParagraph = s.body.trim();
    } else if (/^section\s*\d/i.test(s.heading)) {
      sections.push(s);
    }
  }

  _methodologyCache = {
    title: fm.title ?? 'Methodology',
    pageHeading,
    openingParagraph,
    sections,
    compliance_status: fm.compliance_status,
  };
  return _methodologyCache;
}

/**
 * Returns the methodology page content.
 *
 * With `requireApproved=true` (production render paths), throws if the file's
 * `compliance_status` is not `approved_to_ship` — methodology copy carries
 * regulatory disclaimers and must never ship unreviewed. With the flag off
 * (or in non-production), draft copy is visible so authors can preview.
 *
 * In production without the flag, this returns `null` for non-approved
 * content rather than throwing — the call site decides whether absence is
 * tolerable (placeholder shown) or fatal (explicit `requireApproved=true`).
 */
export function loadMethodology(requireApproved = false): MethodologyContent | null {
  const content = loadMethodologyOnce();
  if (!content) return null;
  if (requireApproved) {
    assertApproved('content/report/methodology.md', content.compliance_status);
  } else if (!canPublishInProduction(content.compliance_status)) {
    return null;
  }
  return content;
}

// ---------------------------------------------------------------------------
// Convenience — enrich a SegmentView with content-agent data
// ---------------------------------------------------------------------------

import type { SegmentView } from './types';

/**
 * Merge a fixture's SegmentView with the latest content-agent markdown.
 *
 * Priority: content files win where present; fixture values fill the gaps.
 * Safe to call at SSG time — this module is server-only.
 *
 * `requireApproved=true` propagates to the single-item loaders (health-gauge,
 * takeaway, and downstream methodology callers) so a draft markdown file
 * fails the build loudly rather than silently shipping fixture fallbacks.
 * Planning-grid tiles and goals degrade gracefully (fixture baseline) instead
 * of throwing, because the grid is positional and goals are a per-segment
 * list — silent fallback is safer there than a hard crash.
 */
export function enrichSegmentView(
  base: SegmentView,
  actualScore: number,
  requireApproved = false,
  tileScores?: TileScoreMap,
): SegmentView {
  const tiles = loadPlanningTiles(base.segmentId, tileScores);
  const goals = loadGoals(base.segmentId);
  const gauge = pickHealthInterpretation(base.segmentId, actualScore, requireApproved);
  const takeaway = loadTakeaway(base.segmentId, requireApproved);

  return {
    ...base,
    grid: tiles.length > 0 ? tiles : base.grid,
    goals: goals.length > 0 ? goals : base.goals,
    healthInterpretation: gauge?.copy ?? base.healthInterpretation,
    healthZoneVariants: gauge?.zoneVariants ?? base.healthZoneVariants,
    headline: takeaway
      ? { tone: base.headline.tone, title: takeaway.title, body: takeaway.body }
      : base.headline,
  };
}
