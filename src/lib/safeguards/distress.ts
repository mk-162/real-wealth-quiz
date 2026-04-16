/**
 * Distress-indicator client-side safeguard for the Q2.4 "happy place" free-text
 * input. Detects phrases that suggest the user may be in crisis and routes them
 * to the sensitive-path support page instead of the commercial summary.
 *
 * Conservative by design — false positives here are fine (a user reading the
 * support page is harmless); a missed indicator is not.
 *
 * IMPORTANT — production hardening:
 *   This is a UX-level safeguard only. A production deployment MUST also
 *   include:
 *     - server-side moderation (e.g. an API call to a moderation provider)
 *       on form submission so a regex bypass can't sneak through, AND
 *     - a human review queue for any submission that trips either layer, with
 *       a documented escalation path to a Vulnerable Customer Specialist
 *       under Consumer Duty.
 *   Treat this regex purely as the first net, not the only one.
 */

export interface Signpost {
  name: string;
  phone: string;
  url: string;
  hours: string;
}

export const SIGNPOSTS: Signpost[] = [
  {
    name: 'Samaritans',
    phone: '116 123',
    url: 'https://www.samaritans.org',
    hours: '24 hours, every day',
  },
  {
    name: 'MoneyHelper',
    phone: '0800 138 7777',
    url: 'https://www.moneyhelper.org.uk',
    hours: 'Mon–Fri, 8am–6pm',
  },
  {
    name: 'NHS 111',
    phone: '111',
    url: 'https://111.nhs.uk',
    hours: '24 hours',
  },
];

/**
 * The phrases below are matched case-insensitively. Word-boundary anchoring is
 * used where it makes sense (single keywords); short multi-word phrases are
 * matched as substrings so common variants ("don't want to be here any more")
 * still trip the check.
 */
const DISTRESS_PATTERNS: RegExp[] = [
  /\bsuicide\b/i,
  /\bsuicidal\b/i,
  /\bkill(?:ing)?\s+myself\b/i,
  /\bend\s+my\s+life\b/i,
  /\bend\s+it\s+all\b/i,
  /\b(?:do\s+not|don'?t|not)\s+want\s+to\s+be\s+here\b/i,
  /\bno\s+point\b/i,
  /\bhopeless\b/i,
  /\bnothing\s+left\b/i,
  /\bcan'?t\s+cope\b/i,
  /\bcannot\s+cope\b/i,
  /\bharm(?:ing)?\s+myself\b/i,
  /\bself[-\s]?harm\b/i,
  /\bcrisis\b/i,
  /\bemergency\b/i,
];

/**
 * Returns true if the supplied free-text input contains a phrase that suggests
 * the user may be in crisis. Always returns false for empty / non-string input.
 */
export function containsDistressIndicator(text: unknown): boolean {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  return DISTRESS_PATTERNS.some((pattern) => pattern.test(trimmed));
}
