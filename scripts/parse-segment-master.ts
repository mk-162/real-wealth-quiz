/**
 * ARCHIVED — 2026-04-27.
 *
 * This script used to parse `Question Segment Master.xlsx` into
 * `content/generated/matrix.json`. Both inputs and outputs are gone:
 *
 * - The xlsx pipeline was retired during phase S2 of the simplification plan
 *   (see `docs/SIMPLIFICATION_PLAN_2026-04-27.md`).
 * - `content/generated/matrix.json` was deleted during phase S1; audience
 *   now lives on each screen file in frontmatter and is assembled by
 *   `src/lib/questions/matrix.ts`.
 *
 * The script is no longer wired into any npm script or CI. It is kept here
 * solely as a reference for the original xlsx → JSON parsing approach and
 * may be deleted once nobody needs to look at it.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

type SegmentId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9';
type MatrixValue = 'Y' | 'C' | 'N';
type MatrixRow = { questionId: string } & Record<SegmentId, MatrixValue>;
type RuleRow = {
  rank: number;
  segmentId: SegmentId;
  label: string;
  predicate: string;
  description: string;
};

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

type SheetRow = {
  rowNumber: number;
  values: string[];
};

type LoadedSheet = {
  name: string;
  rows: SheetRow[];
};

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const CONTENT_DIR = join(ROOT, 'content');
const OUTPUT_DIR = join(CONTENT_DIR, 'generated');
const SCREENS_DIR = join(CONTENT_DIR, 'screens');
const WORKBOOK_PATH = join(ROOT, '..', 'Question Segment Master.xlsx');

const SEGMENTS: SegmentId[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];
const QUESTION_ID_RE = /^Q\d+(?:\.\d+)+[A-Za-z]?$/;
const QUESTION_ID_GLOBAL_RE = /\bQ\d+(?:\.\d+)+[A-Za-z]?\b/g;

function findEndOfCentralDirectory(buffer: Buffer): number {
  const signature = 0x06054b50;
  const minOffset = Math.max(0, buffer.length - 22 - 0xffff);

  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }

  throw new Error('Could not find ZIP end-of-central-directory record.');
}

function readZipEntries(buffer: Buffer): Map<string, ZipEntry> {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let offset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map<string, ZipEntry>();

  for (let index = 0; index < totalEntries; index += 1) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x02014b50) {
      throw new Error(`Invalid ZIP central-directory header at byte ${offset}.`);
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf8');

    entries.set(name, { name, compressionMethod, compressedSize, localHeaderOffset });
    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readZipText(buffer: Buffer, entries: Map<string, ZipEntry>, name: string): string {
  const entry = entries.get(name);
  if (!entry) throw new Error(`Missing workbook part: ${name}`);

  const offset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error(`Invalid ZIP local header for ${name}.`);
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressed.toString('utf8');
  if (entry.compressionMethod === 8) return inflateRawSync(compressed).toString('utf8');

  throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${name}.`);
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_match, decimal: string) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseAttributes(input: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe = /([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = attrRe.exec(input)) !== null) {
    attrs[match[1]] = decodeXml(match[2] ?? match[3] ?? '');
  }

  return attrs;
}

function normalizeZipPath(path: string): string {
  const parts: string[] = [];

  for (const part of path.replace(/\\/g, '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }

  return parts.join('/');
}

function relationshipTarget(target: string): string {
  if (target.startsWith('/')) return normalizeZipPath(target.slice(1));
  return normalizeZipPath(`xl/${target}`);
}

function parseTextRuns(xml: string): string {
  const texts: string[] = [];
  const textRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
  let match: RegExpExecArray | null;

  while ((match = textRe.exec(xml)) !== null) {
    texts.push(decodeXml(match[1] ?? ''));
  }

  return texts.join('');
}

function parseSharedStrings(xml: string | null): string[] {
  if (!xml) return [];

  const shared: string[] = [];
  const itemRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(xml)) !== null) {
    shared.push(parseTextRuns(match[1] ?? ''));
  }

  return shared;
}

function firstTagValue(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(xml);
  return match ? decodeXml(match[1] ?? '') : null;
}

function columnIndex(cellRef: string): number {
  const letters = cellRef.match(/^[A-Za-z]+/)?.[0];
  if (!letters) throw new Error(`Invalid cell reference: ${cellRef}`);

  let value = 0;
  for (const char of letters.toUpperCase()) {
    value = value * 26 + (char.charCodeAt(0) - 'A'.charCodeAt(0) + 1);
  }

  return value - 1;
}

function parseCellValue(attrs: Record<string, string>, body: string, sharedStrings: string[]): string {
  if (attrs.t === 's') {
    const indexText = firstTagValue(body, 'v');
    if (indexText === null) return '';
    return sharedStrings[Number(indexText)] ?? '';
  }

  if (attrs.t === 'inlineStr') return parseTextRuns(body);

  const value = firstTagValue(body, 'v');
  if (value !== null) return value;

  return parseTextRuns(body);
}

function parseWorksheet(xml: string, sharedStrings: string[]): SheetRow[] {
  const rows: SheetRow[] = [];
  const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const rowAttrs = parseAttributes(rowMatch[1] ?? '');
    const rowNumber = Number(rowAttrs.r);
    const cells: Record<number, string> = {};
    const cellRe = /<c\b([^>]*)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let maxIndex = -1;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRe.exec(rowMatch[2] ?? '')) !== null) {
      const attrText = cellMatch[1] ?? cellMatch[2] ?? '';
      const attrs = parseAttributes(attrText);
      if (!attrs.r) continue;

      const index = columnIndex(attrs.r);
      cells[index] = parseCellValue(attrs, cellMatch[3] ?? '', sharedStrings).trim();
      maxIndex = Math.max(maxIndex, index);
    }

    const values: string[] = [];
    for (let index = 0; index <= maxIndex; index += 1) {
      values.push(cells[index] ?? '');
    }

    rows.push({ rowNumber: Number.isFinite(rowNumber) ? rowNumber : rows.length + 1, values });
  }

  return rows;
}

function loadWorkbookSheets(workbookPath: string): LoadedSheet[] {
  const buffer = readFileSync(workbookPath);
  const entries = readZipEntries(buffer);
  const workbookXml = readZipText(buffer, entries, 'xl/workbook.xml');
  const relsXml = readZipText(buffer, entries, 'xl/_rels/workbook.xml.rels');
  const sharedStrings = parseSharedStrings(entries.has('xl/sharedStrings.xml') ? readZipText(buffer, entries, 'xl/sharedStrings.xml') : null);

  const rels = new Map<string, string>();
  const relRe = /<Relationship\b([^>]*?)\/?>/g;
  let relMatch: RegExpExecArray | null;
  while ((relMatch = relRe.exec(relsXml)) !== null) {
    const attrs = parseAttributes(relMatch[1] ?? '');
    if (attrs.Id && attrs.Target) rels.set(attrs.Id, relationshipTarget(attrs.Target));
  }

  const sheets: LoadedSheet[] = [];
  const sheetRe = /<sheet\b([^>]*?)\/?>/g;
  let sheetMatch: RegExpExecArray | null;
  while ((sheetMatch = sheetRe.exec(workbookXml)) !== null) {
    const attrs = parseAttributes(sheetMatch[1] ?? '');
    const id = attrs['r:id'];
    if (!attrs.name || !id) continue;

    const target = rels.get(id);
    if (!target) throw new Error(`No relationship target found for worksheet ${attrs.name}.`);

    sheets.push({
      name: attrs.name,
      rows: parseWorksheet(readZipText(buffer, entries, target), sharedStrings),
    });
  }

  return sheets;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function findColumn(row: SheetRow, header: string): number {
  const wanted = normalizeHeader(header);
  const index = row.values.findIndex((value) => normalizeHeader(value) === wanted);
  if (index === -1) {
    throw new Error(`Could not find "${header}" column in row ${row.rowNumber}.`);
  }
  return index;
}

function rowHasHeaders(row: SheetRow, headers: string[]): boolean {
  return headers.every((header) => row.values.some((value) => normalizeHeader(value) === normalizeHeader(header)));
}

function findSheetByHeaders(sheets: LoadedSheet[], headers: string[]): LoadedSheet {
  const sheet = sheets.find((candidate) => candidate.rows.some((row) => rowHasHeaders(row, headers)));
  if (!sheet) throw new Error(`Could not find a sheet with headers: ${headers.join(', ')}`);
  return sheet;
}

function findHeaderRow(sheet: LoadedSheet, headers: string[]): SheetRow {
  const row = sheet.rows.find((candidate) => rowHasHeaders(candidate, headers));
  if (!row) throw new Error(`Could not find header row in sheet "${sheet.name}".`);
  return row;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeMatrixCell(rawValue: string, context: string, invalidCells: string[]): MatrixValue {
  const value = normalizeWhitespace(rawValue);
  if (!value || value === '-' || value === '–' || value === '—') return 'N';
  if (/^y$/i.test(value)) return 'Y';
  if (/^c$/i.test(value)) return 'C';
  if (/^n$/i.test(value)) return 'N';

  invalidCells.push(`${context}: "${value}" emitted as "N"`);
  return 'N';
}

function parseMatrix(sheet: LoadedSheet): { rows: MatrixRow[]; invalidCells: string[]; allY: string[]; allC: string[]; allN: string[] } {
  const header = findHeaderRow(sheet, ['QID', ...SEGMENTS]);
  const qidColumn = findColumn(header, 'QID');
  const segmentColumns = Object.fromEntries(SEGMENTS.map((segment) => [segment, findColumn(header, segment)])) as Record<SegmentId, number>;
  const invalidCells: string[] = [];
  const rows: MatrixRow[] = [];
  const allY: string[] = [];
  const allC: string[] = [];
  const allN: string[] = [];

  for (const row of sheet.rows) {
    if (row.rowNumber <= header.rowNumber) continue;

    const questionId = normalizeWhitespace(row.values[qidColumn] ?? '');
    if (!QUESTION_ID_RE.test(questionId)) continue;

    const parsed = { questionId } as MatrixRow;
    const rowValues: MatrixValue[] = [];

    for (const segment of SEGMENTS) {
      const value = normalizeMatrixCell(row.values[segmentColumns[segment]] ?? '', `${questionId} ${segment}`, invalidCells);
      parsed[segment] = value;
      rowValues.push(value);
    }

    if (rowValues.every((value) => value === 'Y')) allY.push(questionId);
    if (rowValues.every((value) => value === 'C')) allC.push(questionId);
    if (rowValues.every((value) => value === 'N')) allN.push(questionId);

    rows.push(parsed);
  }

  return { rows, invalidCells, allY, allC, allN };
}

function parseCatalogueIds(sheet: LoadedSheet): string[] {
  const header = findHeaderRow(sheet, ['QID', 'Question text', 'Input type']);
  const qidColumn = findColumn(header, 'QID');
  const ids: string[] = [];

  for (const row of sheet.rows) {
    if (row.rowNumber <= header.rowNumber) continue;

    const questionId = normalizeWhitespace(row.values[qidColumn] ?? '');
    if (QUESTION_ID_RE.test(questionId)) ids.push(questionId);
  }

  return ids;
}

function parseSegmentAssignment(value: string): { segmentId: SegmentId; label: string } {
  const match = normalizeWhitespace(value).match(/^(S[1-9])\s+(.+)$/);
  if (!match) throw new Error(`Could not parse segment assignment: ${value}`);

  return {
    segmentId: match[1] as SegmentId,
    label: match[2],
  };
}

function parseRules(sheet: LoadedSheet): RuleRow[] {
  const header = findHeaderRow(sheet, ['Rank', 'Rule', 'Assigns', 'Notes']);
  const rankColumn = findColumn(header, 'Rank');
  const ruleColumn = findColumn(header, 'Rule');
  const assignsColumn = findColumn(header, 'Assigns');
  const notesColumn = findColumn(header, 'Notes');
  const rules: RuleRow[] = [];

  for (const row of sheet.rows) {
    if (row.rowNumber <= header.rowNumber) continue;

    const rank = Number(row.values[rankColumn]);
    if (!Number.isInteger(rank)) continue;

    const predicate = normalizeWhitespace(row.values[ruleColumn] ?? '');
    const assignment = parseSegmentAssignment(row.values[assignsColumn] ?? '');
    const description = normalizeWhitespace(row.values[notesColumn] ?? '');

    rules.push({
      rank,
      segmentId: assignment.segmentId,
      label: assignment.label,
      predicate,
      description,
    });
  }

  return rules.sort((a, b) => a.rank - b.rank);
}

function readScreenQuestionIds(): Set<string> {
  const ids = new Set<string>();
  if (!existsSync(SCREENS_DIR)) return ids;

  for (const fileName of readdirSync(SCREENS_DIR)) {
    if (!fileName.endsWith('.md')) continue;

    const markdown = readFileSync(join(SCREENS_DIR, fileName), 'utf8');
    for (const match of markdown.matchAll(QUESTION_ID_GLOBAL_RE)) {
      ids.add(match[0]);
    }
  }

  return ids;
}

function formatList(values: string[]): string {
  if (values.length === 0) return '- None';
  return values.map((value) => `- ${value}`).join('\n');
}

function formatReport(input: {
  catalogueSheetName: string;
  matrixSheetName: string;
  rulesSheetName: string;
  missingScreenIds: string[];
  invalidCells: string[];
  allY: string[];
  allC: string[];
  allN: string[];
  matrixCount: number;
  ruleCount: number;
  catalogueCount: number;
}): string {
  return [
    '# Catalogue Changes',
    '',
    'Generated from `Question Segment Master.xlsx`.',
    '',
    '## Tabs Read',
    '',
    `- Catalogue: \`${input.catalogueSheetName}\``,
    `- Matrix: \`${input.matrixSheetName}\``,
    `- Rules: \`${input.rulesSheetName}\``,
    '',
    '## Row Counts',
    '',
    `- Catalogue question ids: ${input.catalogueCount}`,
    `- Matrix rows emitted: ${input.matrixCount}`,
    `- Routing rules emitted: ${input.ruleCount}`,
    '',
    '## Spreadsheet Question IDs Missing From `content/screens/*.md`',
    '',
    formatList(input.missingScreenIds),
    '',
    '## Segment Matrix Warnings',
    '',
    'Rows where every segment value is `Y`:',
    '',
    formatList(input.allY),
    '',
    'Rows where every segment value is `C`:',
    '',
    formatList(input.allC),
    '',
    'Rows where every segment value is `N`:',
    '',
    formatList(input.allN),
    '',
    'Source segment cells outside `Y`, `C`, blank, or a dash-like skipped marker:',
    '',
    formatList(input.invalidCells),
    '',
  ].join('\n');
}

function writeJson(fileName: string, value: unknown) {
  writeFileSync(join(OUTPUT_DIR, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function main() {
  if (!existsSync(WORKBOOK_PATH)) {
    throw new Error(`Workbook not found: ${WORKBOOK_PATH}`);
  }

  const sheets = loadWorkbookSheets(WORKBOOK_PATH);
  const catalogueSheet = findSheetByHeaders(sheets, ['QID', 'Question text', 'Input type']);
  const matrixSheet = findSheetByHeaders(sheets, ['QID', ...SEGMENTS]);
  const rulesSheet = findSheetByHeaders(sheets, ['Rank', 'Rule', 'Assigns', 'Notes']);

  const catalogueIds = parseCatalogueIds(catalogueSheet);
  const matrix = parseMatrix(matrixSheet);
  const rules = parseRules(rulesSheet);
  const screenIds = readScreenQuestionIds();
  const missingScreenIds = catalogueIds.filter((questionId) => !screenIds.has(questionId));

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeJson('matrix.json', matrix.rows);
  writeJson('rules.json', rules);
  writeFileSync(
    join(OUTPUT_DIR, 'CATALOGUE_CHANGES.md'),
    formatReport({
      catalogueSheetName: catalogueSheet.name,
      matrixSheetName: matrixSheet.name,
      rulesSheetName: rulesSheet.name,
      missingScreenIds,
      invalidCells: matrix.invalidCells,
      allY: matrix.allY,
      allC: matrix.allC,
      allN: matrix.allN,
      matrixCount: matrix.rows.length,
      ruleCount: rules.length,
      catalogueCount: catalogueIds.length,
    }),
    'utf8',
  );

  console.log(`Wrote ${relative(ROOT, join(OUTPUT_DIR, 'matrix.json'))} (${matrix.rows.length} rows)`);
  console.log(`Wrote ${relative(ROOT, join(OUTPUT_DIR, 'rules.json'))} (${rules.length} rows)`);
  console.log(`Wrote ${relative(ROOT, join(OUTPUT_DIR, 'CATALOGUE_CHANGES.md'))}`);
  console.log(`Tabs read: ${catalogueSheet.name}, ${matrixSheet.name}, ${rulesSheet.name}`);

  if (missingScreenIds.length > 0) {
    console.log(`Missing screen ids: ${missingScreenIds.join(', ')}`);
  }
  if (matrix.invalidCells.length > 0) {
    console.log(`Invalid matrix cells: ${matrix.invalidCells.length}`);
  }
}

main();
