/**
 * content-compile-md.ts — concatenate every file under content/ into a single
 * human-readable document at the project root: `Content Brief — Compiled.md`.
 *
 * The output is a courtesy artefact — a read-only document that mirrors the
 * original content brief's linear reading experience but always reflects
 * whatever's currently in the content/ folder.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const CONTENT_DIR = join(ROOT, 'content');
const OUT_PATH = join(ROOT, 'Content Brief — Compiled.md');

function listMd(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.startsWith('README'))
    .map((f) => join(dir, f))
    .sort();
}

function renderFile(file: string) {
  const raw = matter(readFileSync(file, 'utf8'));
  const id = raw.data.id ?? basename(file, '.md');
  const fm = Object.entries(raw.data)
    .map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`)
    .join('\n');
  return `\n### ${id}\n\n${fm}\n\n${raw.content.trim()}\n`;
}

function renderSection(title: string, dir: string) {
  const files = listMd(dir);
  if (files.length === 0) return `\n## ${title}\n\n*(No entries yet.)*\n`;
  const body = files.map(renderFile).join('\n---\n');
  return `\n## ${title}\n\n*${files.length} ${files.length === 1 ? 'entry' : 'entries'}.*\n${body}`;
}

const header =
  `# Content Brief — Compiled\n\n` +
  `*Auto-generated from the \`content/\` folder by \`npm run content:compile\`. Read-only — ` +
  `edit the per-file sources under \`content/\` rather than this document.*\n\n` +
  `*Last compiled: ${new Date().toISOString().slice(0, 10)}*\n\n` +
  `---\n`;

const sections = [
  renderSection('Pages', join(CONTENT_DIR, 'pages')),
  renderSection('Screens', join(CONTENT_DIR, 'screens')),
  renderSection('Awareness checks', join(CONTENT_DIR, 'awareness-checks')),
  renderSection('Provocations', join(CONTENT_DIR, 'provocations')),
  renderSection('Segment CTAs', join(CONTENT_DIR, 'segments')),
  renderSection('Microcopy', join(CONTENT_DIR, 'microcopy')),
].join('\n');

writeFileSync(OUT_PATH, header + sections, 'utf8');
console.log(`✓ Compiled master doc → ${OUT_PATH.replace(ROOT + '\\', '').replace(ROOT + '/', '')}`);
