/**
 * PDF report content loader.
 *
 * Parses the markdown files under `content/pdf-report/` (written by the
 * content agent) into typed structures that the report components consume.
 *
 * This module uses Node `fs` and `gray-matter`, so it is server-only. Import
 * it only from server components (`generateStaticParams`, page.tsx without
 * `'use client'`) — never from client components. The parsed result is then
 * serialised and passed as props into the client component tree.
 *
 * File format (content agent's convention):
 *   - One YAML frontmatter block at the top
 *   - Body split by `# …` headings into per-segment or per-goal sections
 *   - Each section has `key: value` lines (not YAML; loose key-value lines),
 *     where values may be quoted and may span multiple lines
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'pdf-report');
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
// Tile loader — content/pdf-report/planning-grid/tile-NN-*.md
// ---------------------------------------------------------------------------

export interface TileContent {
  key: TileKey;
  /** Fallback label — used when a segment didn't author a `tile_label`. */
  label: string;
  /** Fallback whatItChecks — used when the tile has a single variant. */
  whatItChecks: string;
  thresholds: Record<string, string>; // green/amber/red/grey → description
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
      perSegment,
    });
  }

  _tileCache = out;
  return out;
}

/** Returns the 12 tiles for a segment, each with its content-agent note + whatItChecks. */
export function loadPlanningTiles(segmentId: string): PlanningTile[] {
  const tiles = loadTilesOnce();
  return tiles.map(t => {
    const seg = t.perSegment.get(segmentId);
    // Per-segment label and whatItChecks win over tile-level fallback. This is
    // what makes tile 12 flip to "Business exit" (owners) vs "Income mix" (others)
    // depending on segment.
    const label = seg?.label ?? t.label;
    const whatItChecks = seg?.whatItChecks || t.whatItChecks || undefined;
    return {
      key: t.key,
      label,
      status: seg?.status ?? 'grey',
      note: seg?.note ?? 'Not checked',
      whatItChecks,
    };
  });
}

// ---------------------------------------------------------------------------
// Goals loader — content/pdf-report/goals/S[n]-*.md
// ---------------------------------------------------------------------------

let _goalsCache: Map<string, WellbeingGoal[]> | null = null;

function loadGoalsOnce(): Map<string, WellbeingGoal[]> {
  if (_goalsCache) return _goalsCache;

  const out = new Map<string, WellbeingGoal[]>();
  if (!fs.existsSync(GOALS_DIR)) {
    _goalsCache = out;
    return out;
  }

  for (const file of fs.readdirSync(GOALS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const full = path.join(GOALS_DIR, file);
    const raw = fs.readFileSync(full, 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data as { segment?: string };
    const segId = fm.segment;
    if (!segId) continue;

    const goals: WellbeingGoal[] = [];
    for (const section of splitByH1(parsed.content)) {
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
    out.set(segId, goals);
  }

  _goalsCache = out;
  return out;
}

export function loadGoals(segmentId: string): WellbeingGoal[] {
  return loadGoalsOnce().get(segmentId) ?? [];
}

// ---------------------------------------------------------------------------
// Health-gauge loader — content/pdf-report/health-gauge.md
// ---------------------------------------------------------------------------

export interface HealthGaugeCopy {
  /** Fallback interpretation (first zone variant encountered, typically "typical"). */
  defaultInterpretation: string;
  /** Per-zone variants. */
  zoneVariants: HealthZoneVariants;
  /** Optional re-framing label for S8 ("of expected remaining lifetime covered"). */
  gaugeReframe?: string;
}

let _gaugeCache: Map<string, HealthGaugeCopy> | null = null;

function loadHealthGaugeOnce(): Map<string, HealthGaugeCopy> {
  if (_gaugeCache) return _gaugeCache;

  const out = new Map<string, HealthGaugeCopy>();
  if (!fs.existsSync(HEALTH_GAUGE_FILE)) {
    _gaugeCache = out;
    return out;
  }

  const raw = fs.readFileSync(HEALTH_GAUGE_FILE, 'utf8');
  const parsed = matter(raw);

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

    out.set(segId, { defaultInterpretation, zoneVariants });
  }

  _gaugeCache = out;
  return out;
}

/**
 * Pick the best interpretation copy for this segment + actual score.
 * Falls back to any available copy if the score's zone isn't authored.
 */
export function pickHealthInterpretation(segmentId: string, score: number): { copy: string; zoneVariants: HealthZoneVariants } | null {
  const content = loadHealthGaugeOnce().get(segmentId);
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
// Takeaway loader — content/pdf-report/takeaway-banners.md
// ---------------------------------------------------------------------------

export interface TakeawayContent {
  title: string;
  body: string;
}

let _takeawayCache: Map<string, TakeawayContent> | null = null;

function loadTakeawayOnce(): Map<string, TakeawayContent> {
  if (_takeawayCache) return _takeawayCache;

  const out = new Map<string, TakeawayContent>();
  if (!fs.existsSync(TAKEAWAY_FILE)) {
    _takeawayCache = out;
    return out;
  }

  const raw = fs.readFileSync(TAKEAWAY_FILE, 'utf8');
  const parsed = matter(raw);

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

    if (title || body) out.set(segId, { title, body });
  }

  _takeawayCache = out;
  return out;
}

export function loadTakeaway(segmentId: string): TakeawayContent | null {
  return loadTakeawayOnce().get(segmentId) ?? null;
}

// ---------------------------------------------------------------------------
// Awareness-checks-expanded loader
// content/pdf-report/awareness-checks-expanded/<slug>.md
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
  const items = sourceIds
    .map(id => map.get(id) ?? null)
    .filter((x): x is ExpandedAwarenessCheck => x !== null);
  return {
    standard: items.slice(0, 4),
    featured: items.length > 4 ? items[4] : null,
  };
}

// ---------------------------------------------------------------------------
// Methodology loader — content/pdf-report/methodology.md
// ---------------------------------------------------------------------------

export interface MethodologyContent {
  title: string;
  pageHeading: string;
  openingParagraph: string;
  sections: { heading: string; body: string }[];
}

let _methodologyCache: MethodologyContent | null = null;

export function loadMethodology(): MethodologyContent | null {
  if (_methodologyCache) return _methodologyCache;

  const file = path.join(CONTENT_ROOT, 'methodology.md');
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const fm = parsed.data as { title?: string };

  const h1Sections = splitByH1(parsed.content);
  let pageHeading = '';
  let openingParagraph = '';
  const sections: { heading: string; body: string }[] = [];

  for (const s of h1Sections) {
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
  };
  return _methodologyCache;
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
 */
export function enrichSegmentView(base: SegmentView, actualScore: number): SegmentView {
  const tiles = loadPlanningTiles(base.segmentId);
  const goals = loadGoals(base.segmentId);
  const gauge = pickHealthInterpretation(base.segmentId, actualScore);
  const takeaway = loadTakeaway(base.segmentId);

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
