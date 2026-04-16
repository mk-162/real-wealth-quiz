/**
 * visibility.ts — a tiny, pure helper for evaluating conditional-reveal
 * predicates on questionnaire inputs.
 *
 * Two flavours of conditional reveal are honoured:
 *
 *   1. Input-level `conditional_reveal` (a predicate string on the input):
 *        - "only when <inputId> == <value>"
 *        - "only when <inputId> != <value>"
 *        - "only when <inputId> in [<v1>, <v2>, ...]"
 *        - "only when <inputId> includes <value>"          // multi_select containment
 *        - "only when <inputId> >= <value>"                // string/number compare
 *        - "only when <inputId> <= <value>"
 *
 *   2. Option-level `conditional_reveal` (a sibling input id on an option):
 *        - "<targetInputId>" — shown iff the owning input's current answer
 *          equals the option's value.
 *
 * Any predicate that doesn't match one of the supported forms falls back to
 * "always show" and logs a dev-only console warning. Visibility is a pure
 * function of (input, allInputsOnScreen, answers) — no React, no hooks.
 */

import type { Input, Option } from '../../../content/schema';

/* A sibling option may carry a `conditional_reveal` even though the stock
   Zod `optionSchema` only declared `reveal`. We read both shapes defensively
   so this helper is resilient to schema drift. */
type LooseOption = Option & { conditional_reveal?: string };

const warned = new Set<string>();
function warnOnce(key: string, msg: string) {
  if (warned.has(key)) return;
  warned.add(key);
  if (typeof console !== 'undefined') console.warn(`[visibility] ${msg}`);
}

/* ---------------- predicate parsing ---------------- */

interface Predicate {
  inputId: string;
  op: 'eq' | 'neq' | 'in' | 'includes' | 'gte' | 'lte';
  value: string | string[];
}

function stripOnlyWhen(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('only when ')) return trimmed.slice('only when '.length).trim();
  return trimmed;
}

function parsePredicate(raw: string): Predicate | null {
  const body = stripOnlyWhen(raw);

  // "<id> in [a, b, c]"
  const inMatch = body.match(/^([A-Za-z_][\w]*)\s+in\s+\[([^\]]*)\]\s*$/);
  if (inMatch) {
    const [, inputId, list] = inMatch;
    const values = list
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    return { inputId, op: 'in', value: values };
  }

  // "<id> includes <value>"
  const includesMatch = body.match(/^([A-Za-z_][\w]*)\s+includes\s+(.+?)\s*$/);
  if (includesMatch) {
    const [, inputId, v] = includesMatch;
    return { inputId, op: 'includes', value: stripQuotes(v) };
  }

  // "<id> == <value>" / "<id> != <value>" / "<id> >= <value>" / "<id> <= <value>"
  const cmpMatch = body.match(/^([A-Za-z_][\w]*)\s*(==|!=|>=|<=)\s*(.+?)\s*$/);
  if (cmpMatch) {
    const [, inputId, opRaw, v] = cmpMatch;
    const op =
      opRaw === '==' ? 'eq' : opRaw === '!=' ? 'neq' : opRaw === '>=' ? 'gte' : 'lte';
    return { inputId, op, value: stripQuotes(v) };
  }

  return null;
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/* ---------------- predicate evaluation ---------------- */

function evaluate(pred: Predicate, answers: Record<string, unknown>): boolean {
  const answer = answers[pred.inputId];

  switch (pred.op) {
    case 'eq':
      return String(answer ?? '') === String(pred.value);
    case 'neq':
      /* A `!=` clause should behave gracefully when the parent has not been
         answered yet: the rule is "show only when X is not Y", which is only
         meaningful once X has a value. */
      if (answer === undefined || answer === null || answer === '') return false;
      return String(answer) !== String(pred.value);
    case 'in': {
      const list = Array.isArray(pred.value) ? pred.value : [pred.value];
      return list.includes(String(answer ?? ''));
    }
    case 'includes': {
      if (!Array.isArray(answer)) return false;
      return (answer as unknown[]).map(String).includes(String(pred.value));
    }
    case 'gte':
    case 'lte': {
      const target = String(pred.value);
      const actual = String(answer ?? '');
      if (actual === '') return false;
      /* Try numeric compare first; fall back to lexicographic. */
      const na = Number(actual);
      const nt = Number(target);
      if (Number.isFinite(na) && Number.isFinite(nt)) {
        return pred.op === 'gte' ? na >= nt : na <= nt;
      }
      return pred.op === 'gte' ? actual >= target : actual <= target;
    }
    default:
      return true;
  }
}

/* ---------------- public API ---------------- */

/**
 * Decide whether an input should render on the current screen.
 *
 * The helper is pure: identical inputs → identical output. It never throws;
 * any unrecognised predicate defaults to "visible" and logs once.
 */
export function shouldShowInput(
  input: Input,
  allInputsOnScreen: readonly Input[],
  answers: Record<string, unknown>,
): boolean {
  /* 1) Input-level predicate */
  if (input.conditional_reveal) {
    const pred = parsePredicate(input.conditional_reveal);
    if (pred) {
      return evaluate(pred, answers);
    }
    /* Also accept the option-name shorthand: an input-level value equal to
       a sibling input id or option value is meaningful when paired with a
       parent option that cites this input id. Handled below. */
    const optionOwned = findOptionOwner(input.id, allInputsOnScreen, answers);
    if (optionOwned !== null) return optionOwned;

    warnOnce(
      `unknown-input-predicate:${input.conditional_reveal}`,
      `Unrecognised conditional_reveal on input "${input.id}": "${input.conditional_reveal}". Defaulting to visible.`,
    );
    return true;
  }

  /* 2) Option-level predicate (parent option points at this input id) */
  const optionOwned = findOptionOwner(input.id, allInputsOnScreen, answers);
  if (optionOwned !== null) return optionOwned;

  /* No rule applies — always visible. */
  return true;
}

/**
 * Look across every OTHER input on the screen for an option whose
 * `conditional_reveal` (or legacy `reveal` string) names the given target
 * input id. If found, the target is visible iff that option is selected.
 *
 * Returns `null` when no parent option references `targetId` — lets the
 * caller fall through to the default "visible" branch.
 */
function findOptionOwner(
  targetId: string,
  allInputsOnScreen: readonly Input[],
  answers: Record<string, unknown>,
): boolean | null {
  for (const parent of allInputsOnScreen) {
    if (parent.id === targetId) continue;
    const opts = (parent.options ?? []) as LooseOption[];
    for (const opt of opts) {
      const revealName = opt.conditional_reveal;
      if (!revealName || typeof revealName !== 'string') continue;
      if (revealName.trim() !== targetId) continue;

      /* Found: this parent option mentions targetId.
         Target is visible iff the parent's current answer is this option. */
      const parentAnswer = answers[parent.id];
      if (Array.isArray(parentAnswer)) {
        return (parentAnswer as unknown[]).map(String).includes(opt.value);
      }
      return String(parentAnswer ?? '') === String(opt.value);
    }
  }
  return null;
}
