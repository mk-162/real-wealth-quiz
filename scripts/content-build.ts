/**
 * content-build.ts — parse every markdown file under content/, validate it
 * against the Zod schemas in content/schema.ts, and emit typed TS catalogues
 * into src/lib/content/.
 *
 * Usage:
 *   tsx scripts/content-build.ts              # validate + write
 *   tsx scripts/content-build.ts --check-only # validate only, do not write
 *
 * Fails the process with a non-zero exit code on any validation error.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

import {
  provocationFrontmatter,
  awarenessFrontmatter,
  segmentCtaFrontmatter,
  screenFrontmatter,
  microcopyGroupSchema,
  pageSchema,
  reportBlockFrontmatter,
  type Provocation,
  type AwarenessCheck,
  type SegmentCta,
  type Screen,
  type Page,
  type MicrocopyGroup,
  type ContentCatalogue,
} from '../content/schema';

/* -------------------------------------------------------------- */
/* Paths                                                           */
/* -------------------------------------------------------------- */

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const CONTENT_DIR = join(ROOT, 'content');
const OUT_DIR = join(ROOT, 'src', 'lib', 'content');

const checkOnly = process.argv.includes('--check-only');

/* -------------------------------------------------------------- */
/* Tiny helpers                                                    */
/* -------------------------------------------------------------- */

const errors: Array<{ file: string; message: string }> = [];

function recordError(file: string, message: string) {
  errors.push({ file, message });
}

function listMd(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.startsWith('README'))
    .map((f) => join(dir, f));
}

/**
 * Split a markdown body into H1-level sections. Each `# Title` on its own line
 * starts a new section. Returns a map of lower-snake-case title → content.
 */
function splitBodySections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = body.split(/\r?\n/);
  let currentKey: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey) {
      out[currentKey] = buffer.join('\n').trim();
    }
    buffer = [];
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+?)\s*$/);
    if (h1) {
      flush();
      currentKey = h1[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    } else {
      buffer.push(line);
    }
  }
  flush();
  return out;
}

/* -------------------------------------------------------------- */
/* Loaders, one per content type                                   */
/* -------------------------------------------------------------- */

function loadProvocations(): Provocation[] {
  const files = listMd(join(CONTENT_DIR, 'provocations'));
  const items: Provocation[] = [];
  for (const file of files) {
    const raw = matter(readFileSync(file, 'utf8'));
    const fm = provocationFrontmatter.safeParse(raw.data);
    if (!fm.success) {
      recordError(file, fm.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
      continue;
    }
    const body = splitBodySections(raw.content);
    if (!body.headline || !body.body || !body.close) {
      recordError(file, 'provocation body must have # Headline, # Body, and # Close sections');
      continue;
    }
    items.push({ ...fm.data, headline: body.headline, body: body.body, close: body.close });
  }
  return items;
}

function loadAwareness(): AwarenessCheck[] {
  const files = listMd(join(CONTENT_DIR, 'awareness-checks'));
  const items: AwarenessCheck[] = [];
  for (const file of files) {
    const raw = matter(readFileSync(file, 'utf8'));
    const fm = awarenessFrontmatter.safeParse(raw.data);
    if (!fm.success) {
      recordError(file, fm.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
      continue;
    }
    const body = splitBodySections(raw.content);
    if (!body.stem || !body.aware_body || !body.partial_body || !body.unaware_body) {
      recordError(
        file,
        'awareness body must have # Stem, # Aware body, # Partial body, and # Unaware body sections',
      );
      continue;
    }
    items.push({
      ...fm.data,
      stem: body.stem,
      aware_body: body.aware_body,
      partial_body: body.partial_body,
      unaware_body: body.unaware_body,
    });
  }
  return items;
}

function loadSegments(): SegmentCta[] {
  const files = listMd(join(CONTENT_DIR, 'segments'));
  const items: SegmentCta[] = [];
  for (const file of files) {
    const raw = matter(readFileSync(file, 'utf8'));
    const fm = segmentCtaFrontmatter.safeParse(raw.data);
    if (!fm.success) {
      recordError(file, fm.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
      continue;
    }
    const body = splitBodySections(raw.content);
    if (!body.headline || !body.body || !body.button || !body.helper) {
      recordError(file, 'segment CTA body must have # Headline, # Body, # Button, and # Helper');
      continue;
    }
    items.push({
      ...fm.data,
      headline: body.headline,
      body: body.body,
      button: body.button,
      helper: body.helper,
    });
  }
  return items;
}

function loadScreens(): Screen[] {
  const files = listMd(join(CONTENT_DIR, 'screens'));
  const items: Screen[] = [];
  for (const file of files) {
    const raw = matter(readFileSync(file, 'utf8'));
    const fm = screenFrontmatter.safeParse(raw.data);
    if (!fm.success) {
      recordError(file, fm.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
      continue;
    }
    const body = splitBodySections(raw.content);
    items.push({
      ...fm.data,
      headline: body.headline,
      sub: body.sub,
      pullquote: body.pullquote,
      body: body.body,
    });
  }
  // Sort by screen_number so downstream consumers get a predictable order.
  items.sort((a, b) => a.screen_number.localeCompare(b.screen_number, 'en', { numeric: true }));
  return items;
}

function loadPages(): Page[] {
  const files = listMd(join(CONTENT_DIR, 'pages'));
  const items: Page[] = [];
  for (const file of files) {
    const raw = matter(readFileSync(file, 'utf8'));
    const parsed = pageSchema.safeParse({
      id: raw.data.id ?? basename(file, '.md'),
      title: raw.data.title ?? 'Untitled',
      sections: { ...raw.data, body: raw.content.trim() },
    });
    if (!parsed.success) {
      recordError(file, parsed.error.issues.map((i) => i.message).join('; '));
      continue;
    }
    items.push(parsed.data);
  }
  return items;
}

/**
 * Validate every file under content/report/ against the canonical
 * `reportBlockFrontmatter` schema. This loader does not emit anything into
 * the catalogue — `pdf-content.ts` reads these files directly at SSG time —
 * but `content:check` should fail loudly if a report file's frontmatter
 * drifts from the canonical shape.
 */
function validateReportBlocks(): void {
  const reportDir = join(CONTENT_DIR, 'report');
  if (!existsSync(reportDir)) return;

  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name === 'README.md') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...walk(full));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        out.push(full);
      }
    }
    return out;
  };

  for (const file of walk(reportDir)) {
    const raw = matter(readFileSync(file, 'utf8'));
    const fm = reportBlockFrontmatter.safeParse(raw.data);
    if (!fm.success) {
      recordError(file, fm.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    }
  }
}

function loadMicrocopy(): MicrocopyGroup[] {
  const files = listMd(join(CONTENT_DIR, 'microcopy'));
  const items: MicrocopyGroup[] = [];
  for (const file of files) {
    const raw = matter(readFileSync(file, 'utf8'));
    const entries = Array.isArray(raw.data.entries) ? raw.data.entries : [];
    const parsed = microcopyGroupSchema.safeParse({
      id: raw.data.id ?? basename(file, '.md'),
      title: raw.data.title ?? 'Microcopy',
      entries,
    });
    if (!parsed.success) {
      recordError(file, parsed.error.issues.map((i) => i.message).join('; '));
      continue;
    }
    items.push(parsed.data);
  }
  return items;
}

/* -------------------------------------------------------------- */
/* Banned-phrase scanner (advisory — does not fail the build)      */
/* -------------------------------------------------------------- */

interface BannedPhraseConfig {
  deny: string[];
  allow_contexts: string[];
  notes?: string;
}

interface BannedPhraseWarning {
  file: string;
  phrase: string;
  line: string;
}

/**
 * Map each top-level catalogue key to the relative content directory that
 * produced its entries. Used purely for reporting — warnings point at the
 * directory rather than the synthesised catalogue location.
 */
const CATALOGUE_SOURCE_DIRS: Record<keyof ContentCatalogue, string> = {
  screens: 'content/screens',
  awareness: 'content/awareness-checks',
  provocations: 'content/provocations',
  segments: 'content/segments',
  pages: 'content/pages',
  microcopy: 'content/microcopy',
};

function loadBannedPhraseConfig(): BannedPhraseConfig | null {
  const path = join(here, 'banned-phrases.json');
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BannedPhraseConfig>;
    return {
      deny: Array.isArray(parsed.deny) ? parsed.deny : [],
      allow_contexts: Array.isArray(parsed.allow_contexts) ? parsed.allow_contexts : [],
      notes: typeof parsed.notes === 'string' ? parsed.notes : undefined,
    };
  } catch (err) {
    console.warn(
      `  Could not parse ${relative(ROOT, path)}: ${(err as Error).message}`,
    );
    return null;
  }
}

/**
 * Recursively walk any content value (object, array, or primitive) and invoke
 * `visit` for every string leaf encountered.
 */
function walkStrings(value: unknown, visit: (str: string) => void): void {
  if (value == null) return;
  if (typeof value === 'string') {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, visit);
    return;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      walkStrings(v, visit);
    }
  }
}

function extractLineContaining(haystack: string, needle: string): string {
  const lowerHay = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const idx = lowerHay.indexOf(lowerNeedle);
  if (idx === -1) return haystack.trim();
  const before = haystack.lastIndexOf('\n', idx - 1);
  const afterRaw = haystack.indexOf('\n', idx + needle.length);
  const start = before === -1 ? 0 : before + 1;
  const end = afterRaw === -1 ? haystack.length : afterRaw;
  return haystack.slice(start, end).trim();
}

function scanCatalogueForBannedPhrases(
  catalogue: ContentCatalogue,
  config: BannedPhraseConfig,
): BannedPhraseWarning[] {
  const warnings: BannedPhraseWarning[] = [];
  const denyLower = config.deny.map((d) => ({ original: d, lower: d.toLowerCase() }));
  const allowLower = config.allow_contexts.map((a) => a.toLowerCase());

  for (const key of Object.keys(catalogue) as Array<keyof ContentCatalogue>) {
    const items = catalogue[key];
    const sourceDir = CATALOGUE_SOURCE_DIRS[key] ?? String(key);
    walkStrings(items, (str) => {
      const lowerStr = str.toLowerCase();
      for (const { original, lower } of denyLower) {
        if (!lowerStr.includes(lower)) continue;
        const falsePositive = allowLower.some(
          (ctx) => ctx.includes(lower) && lowerStr.includes(ctx),
        );
        if (falsePositive) continue;
        warnings.push({
          file: sourceDir,
          phrase: original,
          line: extractLineContaining(str, original),
        });
      }
    });
  }
  return warnings;
}

function reportBannedPhraseWarnings(warnings: BannedPhraseWarning[]): void {
  if (warnings.length === 0) {
    console.log('\n  ✓ Voice-and-tone scan: 0 warnings');
    return;
  }
  console.warn('\n  ⚠ Voice-and-tone scan found phrases for review:');
  for (const w of warnings) {
    console.warn(`    [${w.file}] "${w.phrase}" — ${w.line}`);
  }
  console.warn(`\n  Total voice-and-tone warnings: ${warnings.length}`);
}

/* -------------------------------------------------------------- */
/* Emitter                                                         */
/* -------------------------------------------------------------- */

function emit(name: string, contents: string) {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, name), contents, 'utf8');
}

function formatCatalogue(catalogue: ContentCatalogue): string {
  const banner = `/**\n * Auto-generated by scripts/content-build.ts. Do not edit by hand.\n * Source: content/*.md (authored by the client).\n * Run: npm run content:build\n */\n\n`;
  return (
    banner +
    `import type {\n  Provocation,\n  AwarenessCheck,\n  SegmentCta,\n  Screen,\n  Page,\n  MicrocopyGroup,\n} from '../../../content/schema';\n\n` +
    `export const screens: Screen[] = ${JSON.stringify(catalogue.screens, null, 2)};\n\n` +
    `export const awareness: AwarenessCheck[] = ${JSON.stringify(catalogue.awareness, null, 2)};\n\n` +
    `export const provocations: Provocation[] = ${JSON.stringify(catalogue.provocations, null, 2)};\n\n` +
    `export const segments: SegmentCta[] = ${JSON.stringify(catalogue.segments, null, 2)};\n\n` +
    `export const pages: Page[] = ${JSON.stringify(catalogue.pages, null, 2)};\n\n` +
    `export const microcopy: MicrocopyGroup[] = ${JSON.stringify(catalogue.microcopy, null, 2)};\n`
  );
}

/* -------------------------------------------------------------- */
/* Main                                                            */
/* -------------------------------------------------------------- */

function main() {
  const catalogue: ContentCatalogue = {
    screens: loadScreens(),
    awareness: loadAwareness(),
    provocations: loadProvocations(),
    segments: loadSegments(),
    pages: loadPages(),
    microcopy: loadMicrocopy(),
  };

  // Validate report blocks (canonical shape — Phase 2/S4).
  validateReportBlocks();

  if (errors.length > 0) {
    console.error('\n✗ Content build failed — fix the files below and rerun.\n');
    for (const e of errors) {
      console.error(`  ${relative(ROOT, e.file)}`);
      console.error(`    · ${e.message}\n`);
    }
    process.exit(1);
  }

  /* Advisory voice-and-tone scan. Warnings never fail the build. */
  const bannedConfig = loadBannedPhraseConfig();
  const bannedWarnings = bannedConfig
    ? scanCatalogueForBannedPhrases(catalogue, bannedConfig)
    : [];

  if (checkOnly) {
    summary(catalogue, 'check');
    reportBannedPhraseWarnings(bannedWarnings);
    return;
  }

  emit('catalogue.ts', formatCatalogue(catalogue));
  emit('generated-order.ts', formatGeneratedOrder());
  emit(
    'index.ts',
    [
      '/**',
      ' * Auto-generated catalogues + hand-written helpers for consuming',
      ' * them from React components. Regenerated by scripts/content-build.ts.',
      ' */',
      "export * from './catalogue';",
      "export * from './generated-order';",
      "export type * from '../../../content/schema';",
      'export {',
      '  getPage,',
      '  pageValue,',
      '  microcopy,',
      '  segmentCta,',
      '  overlayCta,',
      '  awarenessById,',
      '  provocationById,',
      "} from './helpers';",
      '',
    ].join('\n'),
  );
  summary(catalogue, 'emit');
  reportBannedPhraseWarnings(bannedWarnings);
}

/**
 * Emit `src/lib/content/generated-order.ts` with the authoritative question
 * order sourced from `content/generated/matrix.json`. This is the single source
 * of truth for which questions exist and what order the engine iterates them.
 * `content/generated/matrix.json` is produced by scripts/parse-segment-master.ts
 * when the client's spreadsheet updates.
 */
function formatGeneratedOrder(): string {
  const matrixPath = join(ROOT, 'content', 'generated', 'matrix.json');
  let ids: string[] = [];
  if (existsSync(matrixPath)) {
    try {
      const raw = readFileSync(matrixPath, 'utf8');
      const rows = JSON.parse(raw) as Array<{ questionId: string }>;
      ids = rows.map((r) => r.questionId).filter(Boolean);
    } catch (err) {
      console.warn(
        `  Could not parse matrix.json: ${(err as Error).message}`,
      );
    }
  }
  return (
    `/**\n` +
    ` * Auto-generated from content/generated/matrix.json on content:build.\n` +
    ` * Do not edit by hand — update the source spreadsheet, re-run the parser,\n` +
    ` * then run \`npm run content:build\`.\n` +
    ` */\n\n` +
    `export const questionOrder: readonly string[] = ${JSON.stringify(ids, null, 2)} as const;\n`
  );
}

function summary(catalogue: ContentCatalogue, mode: 'check' | 'emit') {
  const { screens, awareness, provocations, segments, pages, microcopy } = catalogue;
  const counts = [
    ['screens', screens.length],
    ['awareness', awareness.length],
    ['provocations', provocations.length],
    ['segments', segments.length],
    ['pages', pages.length],
    ['microcopy', microcopy.length],
  ] as const;
  const label = mode === 'check' ? '✓ Content valid' : '✓ Content built';
  console.log(label);
  for (const [k, v] of counts) {
    console.log(`    ${String(v).padStart(3)} ${k}`);
  }
  if (mode === 'emit') {
    console.log(`\n  Wrote to ${relative(ROOT, OUT_DIR)}/catalogue.ts`);
  }
}

main();
