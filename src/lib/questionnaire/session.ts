/**
 * Session persistence — load / save / clear the user's in-progress
 * questionnaire session to localStorage.
 *
 * Works only in the browser. SSR paths return a default empty session.
 * The `version` field lets us invalidate old shapes when the schema changes.
 * Sessions expire after 30 days (per brief §2.4).
 */
'use client';

import type { TierSlug } from './engine';

export const SESSION_VERSION = '1';
export const SESSION_KEY = 'real-wealth:conversation';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface Contact {
  firstName: string;
  email: string;
  phone: string;
  consentService: boolean;
  consentMarketing: boolean;
}

export type AwarenessLevel = 'aware' | 'partial' | 'unaware';

/**
 * Telemetry for the summary page — which resolver outputs rendered on a
 * given render. Written to the session each time the summary page mounts
 * so /demo/raw can display what the user actually saw.
 */
export interface SummaryRecord {
  emotionalStateVariant: string;
  compoundFlagId: string | null;
  compoundFlagTriggerAnswers: string[];
  silentGapFlags: string[];
  inlineChartIds: string[];
  ctaVariant: string;
  ctaEnhanced: boolean;
}

export interface Session {
  version: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  tier: TierSlug;
  answers: Record<string, unknown>;
  currentScreenId: string | null;
  visitedOrder: string[];
  contact?: Contact;
  /** Awareness checks the user has already responded to (id → response). */
  firedAwareness?: Record<string, AwarenessLevel>;
  /** Provocation ids the user has already had shown (sticky once fired). */
  firedProvocations?: string[];
  /** Snapshot of the summary-page resolver outputs. Written on mount. */
  summary?: SummaryRecord;
}

/** Safely read localStorage. Returns null on SSR, missing, or parse failure. */
export function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (parsed.version !== SESSION_VERSION) return null;
    if (!parsed.createdAt || !parsed.answers) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

/** Safely persist the session. No-ops on SSR. */
export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave: Session = { ...session, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(toSave));
  } catch {
    /* Quota exceeded or unavailable — silently drop. */
  }
}

/** Remove the session entirely. */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Has the session aged out of the 30-day retention window? */
export function isExpired(session: Session): boolean {
  const created = Date.parse(session.createdAt);
  if (Number.isNaN(created)) return true;
  return Date.now() - created > THIRTY_DAYS_MS;
}

/** Factory — produces a fresh, empty session for the given tier. */
export function makeSession(tier: TierSlug): Session {
  const now = new Date().toISOString();
  return {
    version: SESSION_VERSION,
    createdAt: now,
    updatedAt: now,
    tier,
    answers: {},
    currentScreenId: null,
    visitedOrder: [],
  };
}
