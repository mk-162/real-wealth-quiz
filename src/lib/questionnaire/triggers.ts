/**
 * triggers.ts — pragmatic predicate parser/evaluator for the trigger strings
 * used in content/awareness-checks/*.md and content/provocations/*.md.
 *
 * Triggers are short DSL strings authored in markdown frontmatter, e.g.
 *   "estate >= 2_000_000 AND rnrb_taper_awareness_did_not_fire"
 *   "income_band == '100to125k'"
 *   "household includes dependent_children"
 *   "work_status == 'self_employed' AND income >= 75_000 AND pension_pots <= 1"
 *
 * The grammar is flat (left-to-right AND/OR, no nested parentheses). Anything
 * we can't parse falls back to false and warns once in dev.
 *
 * Supported atoms:
 *   age >= N | age <= N | age between N and M
 *   income >= N | income == 'band' | income_band == 'band' | income_band in [a, b]
 *   estate >= N | estate == 'not_sure' | estate in [..]
 *   pension_pots >= N
 *   household includes dependent_children | household includes elderly_parent
 *   work_status == 'x' | work_status in ['x', 'y']
 *   business_owner | has_dependants | has_mortgage | currently_advised
 *   succession == 'x' | role == 'x'
 *   life_cover == 'x' | money_mindset == 'x' | retirement_feel == 'x'
 *   one_thing == 'x' | tradeoff == 'x' | urgency == 'x' | current_adviser == 'x'
 *   <bare_token>            -- looks up answers[token] truthiness; warns if unknown
 *   NOT <atom>              -- negation
 *
 * Combinators: AND, OR (case-insensitive). Evaluated strictly left-to-right.
 */

import type { SegmentId } from '../segmentation';

const dev = process.env.NODE_ENV !== 'production';
const warned = new Set<string>();
function warnOnce(key: string, msg: string): void {
  if (!dev) return;
  if (warned.has(key)) return;
  warned.add(key);
  if (typeof console !== 'undefined') console.warn(`[triggers] ${msg}`);
}

/* ------------------------------------------------------------------ */
/* Income / estate band coercion — string bands → comparable numbers   */
/* ------------------------------------------------------------------ */

/* Lower-bound midpoints for income bands (used for `income >= N`). */
const INCOME_BAND_LOWER: Record<string, number> = {
  lt50k: 0,
  '50to100k': 50_000,
  '100to125k': 100_000,
  '125to200k': 125_000,
  gt200k: 200_000,
  prefer_not: -1,
  prefer_not_to_say: -1,
};

const ESTATE_BAND_LOWER: Record<string, number> = {
  lt500k: 0,
  '500k_to_1m': 500_000,
  '1m_to_2m': 1_000_000,
  '2m_to_3m': 2_000_000,
  '3m_to_5m': 3_000_000,
  gt5m: 5_000_000,
  not_sure: -1,
};

/** pension_pots option strings → numeric lower bound. */
const PENSION_POT_LOWER: Record<string, number> = {
  none: 0,
  one: 1,
  two_three: 2,
  four_six: 4,
  more_than_six: 7,
};

function incomeAtLeast(value: unknown, n: number): boolean {
  if (typeof value === 'number') return value >= n;
  if (typeof value === 'string') {
    const lo = INCOME_BAND_LOWER[value];
    if (lo === undefined) return false;
    if (lo < 0) return false; /* prefer_not_to_say never satisfies */
    return lo >= n;
  }
  return false;
}

function estateAtLeast(value: unknown, n: number): boolean {
  if (typeof value === 'number') return value >= n;
  if (typeof value === 'string') {
    const lo = ESTATE_BAND_LOWER[value];
    if (lo === undefined) return false;
    if (lo < 0) return false;
    return lo >= n;
  }
  return false;
}

function pensionPotsAtLeast(value: unknown, n: number): boolean {
  if (typeof value === 'number') return value >= n;
  if (typeof value === 'string') {
    const lo = PENSION_POT_LOWER[value];
    if (lo === undefined) return false;
    return lo >= n;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Tokeniser — splits "a AND b OR NOT c" into atoms + operators        */
/* ------------------------------------------------------------------ */

type Op = 'AND' | 'OR';

interface Tokens {
  atoms: string[]; /* may be prefixed with NOT space */
  ops: Op[]; /* atoms.length - 1 operators */
}

function tokenise(trigger: string): Tokens {
  /* "age between N and M" embeds an "and" that is part of the atom rather
     than a combinator. Mask those before splitting on AND/OR, then unmask. */
  const MASK = '\u0001AND\u0001';
  const masked = trigger.replace(
    /\b(age\s+between\s+[\d_kKmM.]+)\s+and\s+([\d_kKmM.]+)/gi,
    (_, a, b) => `${a}${MASK}${b}`,
  );

  /* Split on AND/OR but preserve content. We use a regex with capture so we
     get the operators back. */
  const parts = masked
    .split(/\s+(AND|OR)\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const atoms: string[] = [];
  const ops: Op[] = [];
  parts.forEach((p, i) => {
    if (i % 2 === 0) {
      atoms.push(p.replace(new RegExp(MASK, 'g'), ' and '));
    } else {
      ops.push(p.toUpperCase() === 'OR' ? 'OR' : 'AND');
    }
  });
  return { atoms, ops };
}

/* ------------------------------------------------------------------ */
/* Atom evaluation                                                     */
/* ------------------------------------------------------------------ */

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/** Parse "1_000_000" / "100k" / "1.5m" as a number. */
function parseNumberLiteral(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/_/g, '');
  if (!s) return null;
  const mK = s.match(/^([\d.]+)k$/);
  if (mK) return Number(mK[1]) * 1_000;
  const mM = s.match(/^([\d.]+)m$/);
  if (mM) return Number(mM[1]) * 1_000_000;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseList(raw: string): string[] {
  const m = raw.trim().match(/^\[(.*)\]$/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((v) => stripQuotes(v.trim()))
    .filter(Boolean);
}

function householdIncludes(answers: Record<string, unknown>, tag: string): boolean {
  const v = answers.household;
  if (!Array.isArray(v)) return false;
  return (v as unknown[]).map(String).includes(tag);
}

function hasDependants(answers: Record<string, unknown>): boolean {
  return (
    householdIncludes(answers, 'dependent_children') ||
    householdIncludes(answers, 'elderly_parent')
  );
}

function workStatusEq(answers: Record<string, unknown>, value: string): boolean {
  return String(answers.work_status ?? '') === value;
}

function workStatusIn(answers: Record<string, unknown>, list: string[]): boolean {
  const v = String(answers.work_status ?? '');
  return list.includes(v);
}

/** Bare-token shorthands documented in the brief. */
function evaluateBareToken(
  token: string,
  answers: Record<string, unknown>,
): boolean | null {
  const t = token.trim();

  /* Shorthand booleans. */
  if (t === 'business_owner') {
    return workStatusIn(answers, ['business_owner', 'self_employed']);
  }
  if (t === 'has_dependants') return hasDependants(answers);
  if (t === 'has_mortgage') return String(answers.main_home ?? '') === 'own_mortgage';
  if (t === 'currently_advised') {
    return String(answers.current_adviser ?? '').startsWith('yes_');
  }
  if (t === 'no_will') return String(answers.has_will ?? '') === 'no';
  if (t === 'has_will') return String(answers.has_will ?? '').startsWith('yes');

  /* "rnrb_taper_awareness_did_not_fire" and similar awareness-fire references
     are computed by the engine, not by this parser. Default to false here so
     the engine's own selector adds them as overlays separately. */

  /* Otherwise: not recognised. */
  return null;
}

function evaluateAtomInner(
  atom: string,
  answers: Record<string, unknown>,
  segmentId: SegmentId | null,
): boolean {
  const a = atom.trim();

  /* age between N and M */
  const ageBetween = a.match(/^age\s+between\s+([\d_]+)\s+and\s+([\d_]+)$/i);
  if (ageBetween) {
    const lo = parseNumberLiteral(ageBetween[1]);
    const hi = parseNumberLiteral(ageBetween[2]);
    const age = typeof answers.age === 'number' ? answers.age : Number(answers.age);
    if (lo === null || hi === null || !Number.isFinite(age)) return false;
    return age >= lo && age <= hi;
  }

  /* age >= N | age <= N | age == N */
  const ageCmp = a.match(/^age\s*(>=|<=|==|>|<)\s*([\d_]+)$/i);
  if (ageCmp) {
    const op = ageCmp[1];
    const n = parseNumberLiteral(ageCmp[2]);
    const age = typeof answers.age === 'number' ? answers.age : Number(answers.age);
    if (n === null || !Number.isFinite(age)) return false;
    if (op === '>=') return age >= n;
    if (op === '<=') return age <= n;
    if (op === '>') return age > n;
    if (op === '<') return age < n;
    return age === n;
  }

  /* income >= N */
  const incomeNum = a.match(/^income\s*(>=|<=|>|<)\s*([\d_kKmM.]+)$/i);
  if (incomeNum) {
    const n = parseNumberLiteral(incomeNum[2]);
    if (n === null) return false;
    if (incomeNum[1] === '>=') return incomeAtLeast(answers.income_band, n);
    /* For < we accept the band whose lower bound is strictly less than n. */
    const v = answers.income_band;
    if (typeof v !== 'string') return false;
    const lo = INCOME_BAND_LOWER[v];
    if (lo === undefined || lo < 0) return false;
    if (incomeNum[1] === '<=') return lo <= n;
    if (incomeNum[1] === '>') return lo > n;
    return lo < n;
  }

  /* income == 'band' / income == band — direct band literal check. */
  const incomeEq = a.match(/^income\s*==\s*(.+)$/i);
  if (incomeEq) {
    return String(answers.income_band ?? '') === stripQuotes(incomeEq[1]);
  }

  /* income_band == 'x' | income_band in [..] | income_band != 'x' */
  const incomeBandIn = a.match(/^income_band\s+in\s+(\[.*\])$/i);
  if (incomeBandIn) {
    const list = parseList(incomeBandIn[1]);
    return list.includes(String(answers.income_band ?? ''));
  }
  const incomeBandCmp = a.match(/^income_band\s*(==|!=)\s*(.+)$/i);
  if (incomeBandCmp) {
    const target = stripQuotes(incomeBandCmp[2]);
    const actual = String(answers.income_band ?? '');
    return incomeBandCmp[1] === '==' ? actual === target : actual !== target;
  }

  /* estate >= N */
  const estateNum = a.match(/^estate\s*(>=|<=|>|<)\s*([\d_kKmM.]+)$/i);
  if (estateNum) {
    const n = parseNumberLiteral(estateNum[2]);
    if (n === null) return false;
    if (estateNum[1] === '>=') return estateAtLeast(answers.estate_band, n);
    const v = answers.estate_band;
    if (typeof v !== 'string') return false;
    const lo = ESTATE_BAND_LOWER[v];
    if (lo === undefined || lo < 0) return false;
    if (estateNum[1] === '<=') return lo <= n;
    if (estateNum[1] === '>') return lo > n;
    return lo < n;
  }

  /* estate == 'not_sure' | estate in [..] */
  const estateIn = a.match(/^estate\s+in\s+(\[.*\])$/i);
  if (estateIn) {
    const list = parseList(estateIn[1]);
    return list.includes(String(answers.estate_band ?? ''));
  }
  const estateEq = a.match(/^estate\s*(==|!=)\s*(.+)$/i);
  if (estateEq) {
    const target = stripQuotes(estateEq[2]);
    const actual = String(answers.estate_band ?? '');
    return estateEq[1] === '==' ? actual === target : actual !== target;
  }

  /* pension_pots >= N */
  const pensionNum = a.match(/^pension_pots\s*(>=|<=|>|<)\s*([\d_]+)$/i);
  if (pensionNum) {
    const n = parseNumberLiteral(pensionNum[2]);
    if (n === null) return false;
    if (pensionNum[1] === '>=') return pensionPotsAtLeast(answers.pension_pots, n);
    const v = answers.pension_pots;
    if (typeof v === 'number') {
      if (pensionNum[1] === '<=') return v <= n;
      if (pensionNum[1] === '>') return v > n;
      return v < n;
    }
    if (typeof v === 'string') {
      const lo = PENSION_POT_LOWER[v];
      if (lo === undefined) return false;
      if (pensionNum[1] === '<=') return lo <= n;
      if (pensionNum[1] === '>') return lo > n;
      return lo < n;
    }
    return false;
  }

  /* household includes <tag> */
  const hhInc = a.match(/^household\s+includes\s+(.+)$/i);
  if (hhInc) {
    return householdIncludes(answers, stripQuotes(hhInc[1]));
  }

  /* work_status == 'x' / work_status in [..] */
  const workIn = a.match(/^work_status\s+in\s+(\[.*\])$/i);
  if (workIn) {
    return workStatusIn(answers, parseList(workIn[1]));
  }
  const workEq = a.match(/^work_status\s*(==|!=)\s*(.+)$/i);
  if (workEq) {
    const target = stripQuotes(workEq[2]);
    return workEq[1] === '==' ? workStatusEq(answers, target) : !workStatusEq(answers, target);
  }

  /* segment == 'Sx' / segment in [..] */
  const segEq = a.match(/^segment\s*(==|!=)\s*(.+)$/i);
  if (segEq) {
    const target = stripQuotes(segEq[2]);
    return segEq[1] === '==' ? segmentId === target : segmentId !== target;
  }

  /* Generic <field> == '<value>' / <field> != '<value>' / <field> in [..] */
  const genIn = a.match(/^([A-Za-z_][\w]*)\s+in\s+(\[.*\])$/);
  if (genIn) {
    const list = parseList(genIn[2]);
    return list.includes(String(answers[genIn[1]] ?? ''));
  }
  const genCmp = a.match(/^([A-Za-z_][\w]*)\s*(==|!=)\s*(.+)$/);
  if (genCmp) {
    const target = stripQuotes(genCmp[3]);
    const actual = String(answers[genCmp[1]] ?? '');
    return genCmp[2] === '==' ? actual === target : actual !== target;
  }

  /* Generic <field> >= N / <= N */
  const genNum = a.match(/^([A-Za-z_][\w]*)\s*(>=|<=|>|<)\s*([\d_kKmM.]+)$/);
  if (genNum) {
    const n = parseNumberLiteral(genNum[3]);
    if (n === null) return false;
    const av = answers[genNum[1]];
    if (typeof av !== 'number') return false;
    if (genNum[2] === '>=') return av >= n;
    if (genNum[2] === '<=') return av <= n;
    if (genNum[2] === '>') return av > n;
    return av < n;
  }

  /* Bare token (shorthand or unknown). */
  const bare = evaluateBareToken(a, answers);
  if (bare !== null) return bare;

  warnOnce(
    `unknown-atom:${a}`,
    `Unknown trigger atom "${a}" — defaulting to false. Treat as not-fired.`,
  );
  return false;
}

function evaluateAtom(
  atom: string,
  answers: Record<string, unknown>,
  segmentId: SegmentId | null,
): boolean {
  let raw = atom.trim();
  let negated = false;
  if (/^not\s+/i.test(raw)) {
    negated = true;
    raw = raw.replace(/^not\s+/i, '');
  }
  /* Strip surrounding parens — we don't support nested groups but a single
     wrapping pair is harmless. */
  if (raw.startsWith('(') && raw.endsWith(')')) {
    raw = raw.slice(1, -1).trim();
  }
  const value = evaluateAtomInner(raw, answers, segmentId);
  return negated ? !value : value;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function evaluateTrigger(
  trigger: string,
  answers: Record<string, unknown>,
  segmentId: SegmentId | null,
): boolean {
  if (!trigger || typeof trigger !== 'string') return false;
  const { atoms, ops } = tokenise(trigger);
  if (atoms.length === 0) return false;

  /* Left-to-right evaluation, no operator precedence. */
  let result = evaluateAtom(atoms[0], answers, segmentId);
  for (let i = 0; i < ops.length; i += 1) {
    const next = evaluateAtom(atoms[i + 1], answers, segmentId);
    if (ops[i] === 'AND') result = result && next;
    else result = result || next;
  }
  return result;
}

/** Test hook: dump the parsed structure of a trigger string for debugging. */
export function explainTrigger(trigger: string): { atoms: string[]; ops: string[] } {
  const t = tokenise(trigger);
  return { atoms: t.atoms, ops: t.ops };
}
