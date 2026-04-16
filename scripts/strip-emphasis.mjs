#!/usr/bin/env node
/**
 * strip-emphasis — one-off cleanup that removes Markdown emphasis
 * (`*foo*`) from the prose bodies of content files. The renderer
 * treats screen.sub / awareness body / provocation body / etc. as
 * plain text, so any asterisks were rendering literally on the site.
 *
 * Rules:
 *   - `*"quoted phrase"*` → `"quoted phrase"`  (quotes already carry
 *     the inflection; the italics were redundant)
 *   - `*singleWord*`      → `singleWord`       (drop the asterisks)
 *   - Code fences and frontmatter are left alone.
 *
 * Scope: content/{screens,awareness-checks,provocations,segments,pages}/*.md
 * plus any other .md file whose frontmatter declares `id:` and lives
 * under content/. `content/README.md` and `content/microcopy/*.md` are
 * deliberately excluded (neither surfaces its body in the UI).
 *
 * Run once, review the diff, commit. Safe to re-run — idempotent.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = [
  'content/screens',
  'content/awareness-checks',
  'content/provocations',
  'content/segments',
  'content/pages',
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

/** Split a markdown file into frontmatter + body.
 *  Returns [frontmatter, body] where frontmatter includes the leading
 *  and trailing `---` delimiters if present. */
function splitFrontmatter(src) {
  if (!src.startsWith('---\n')) return ['', src];
  const end = src.indexOf('\n---\n', 4);
  if (end === -1) return ['', src];
  return [src.slice(0, end + 5), src.slice(end + 5)];
}

function stripEmphasis(body) {
  // Skip code fences so we don't touch anything inside ```...```.
  const parts = body.split(/(```[\s\S]*?```)/g);
  return parts
    .map((chunk, i) => {
      if (i % 2 === 1) return chunk; // code fence — untouched
      let out = chunk;
      // Quoted italic → plain quote.
      out = out.replace(/\*("[^"]+?")\*/g, '$1');
      // Plain italic emphasis. Requires at least one letter inside and
      // a word boundary around the asterisks so we don't eat anything
      // legitimately starred (bullet lists, etc.).
      out = out.replace(
        /(^|[\s(])\*([A-Za-z][^*\n]{0,80}?)\*(?=$|[\s.,;:!?)'"—–-])/gm,
        '$1$2',
      );
      return out;
    })
    .join('');
}

let changed = 0;
let total = 0;
for (const root of ROOTS) {
  try {
    statSync(root);
  } catch {
    continue;
  }
  for (const path of walk(root)) {
    total++;
    const src = readFileSync(path, 'utf8');
    const [fm, body] = splitFrontmatter(src);
    const newBody = stripEmphasis(body);
    if (newBody !== body) {
      writeFileSync(path, fm + newBody);
      changed++;
      console.log(`  updated  ${path}`);
    }
  }
}
console.log(`\nStripped emphasis in ${changed} of ${total} files.`);
