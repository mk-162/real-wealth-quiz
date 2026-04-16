/**
 * voice-grep.ts — BLOCKING voice-and-tone gate for CI.
 *
 * Scans every markdown + YAML content file under content/ (recursively) for
 * banned hype phrases defined in scripts/banned-phrases.json. Skips the
 * single source-of-truth file content/microcopy/voice-rules.md, which
 * legitimately references the banned list.
 *
 * Usage:
 *   tsx scripts/voice-grep.ts          # exits 0 clean / 1 on hits
 *
 * Unlike scripts/content-build.ts (which runs the scan as an advisory
 * warning), this script is designed to fail the build on any hit so CI can
 * block merges that reintroduce banned phrasing.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const CONTENT_DIR = join(ROOT, 'content');
const CONFIG_PATH = join(here, 'banned-phrases.json');

/** The single file that legitimately references the banned list. Skip it. */
const SKIP_PATHS = new Set<string>([
  join(CONTENT_DIR, 'microcopy', 'voice-rules.md'),
]);

/** Match only authored content — not generated artefacts. */
const SCAN_EXTENSIONS = new Set<string>(['.md', '.yml', '.yaml']);

/** Directories under content/ to exclude from the scan. */
const SKIP_DIRS = new Set<string>(['generated']);

interface BannedConfig {
  deny: string[];
  allow_contexts: string[];
}

interface Hit {
  file: string;
  lineNumber: number;
  phrase: string;
  snippet: string;
}

function loadConfig(): BannedConfig {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`✗ banned-phrases.json not found at ${CONFIG_PATH}`);
    process.exit(1);
  }
  const raw = readFileSync(CONFIG_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Partial<BannedConfig>;
  return {
    deny: Array.isArray(parsed.deny) ? parsed.deny : [],
    allow_contexts: Array.isArray(parsed.allow_contexts) ? parsed.allow_contexts : [],
  };
}

function collectFiles(dir: string, acc: string[]): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      collectFiles(full, acc);
      continue;
    }
    if (!stat.isFile()) continue;
    if (SKIP_PATHS.has(full)) continue;
    const dot = entry.lastIndexOf('.');
    if (dot === -1) continue;
    const ext = entry.slice(dot).toLowerCase();
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    acc.push(full);
  }
}

function scanFile(file: string, config: BannedConfig): Hit[] {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const denyLower = config.deny.map((d) => ({ original: d, lower: d.toLowerCase() }));
  const allowLower = config.allow_contexts.map((a) => a.toLowerCase());
  const hits: Hit[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    for (const { original, lower } of denyLower) {
      if (!lowerLine.includes(lower)) continue;
      /* If the banned phrase appears inside a whitelisted context phrase on
         the same line (e.g. "guaranteed annuity rates" wraps "guaranteed"),
         treat the hit as a false positive and skip. */
      const falsePositive = allowLower.some(
        (ctx) => ctx.includes(lower) && lowerLine.includes(ctx),
      );
      if (falsePositive) continue;
      hits.push({
        file,
        lineNumber: i + 1,
        phrase: original,
        snippet: line.trim(),
      });
    }
  }
  return hits;
}

function main(): void {
  const config = loadConfig();
  const files: string[] = [];
  collectFiles(CONTENT_DIR, files);

  const allHits: Hit[] = [];
  for (const file of files) {
    allHits.push(...scanFile(file, config));
  }

  if (allHits.length === 0) {
    console.log(`\u2713 Voice-and-tone check: clean (${files.length} files scanned)`);
    process.exit(0);
  }

  console.error('\u2717 Voice-and-tone check: banned phrases found\n');
  for (const hit of allHits) {
    const rel = relative(ROOT, hit.file).split(sep).join('/');
    console.error(`  ${rel}:${hit.lineNumber}  [${hit.phrase}]`);
    console.error(`    ${hit.snippet}`);
  }
  console.error(`\nTotal hits: ${allHits.length} across ${files.length} scanned files.`);
  process.exit(1);
}

main();
