/**
 * useQuestionnaireEngine — the state + navigation behind the real form.
 *
 * Walks the content-sourced screen catalogue. Applies tier + segment filters.
 * Builds up the five gating answers and runs segmentation after Q4.5.
 * Supports the S6 two-stage assignment: an initial gate-based assignment is
 * provisional; when Q5.3 is answered in the business branch the segment is
 * upgraded.
 *
 * Also drives:
 *   - Provocation eligibility (selector returns those whose triggers match
 *     under current answers / segment / tier / compliance).
 *   - Awareness check eligibility, with rate-limiting per tier (5/4/2 for
 *     A/B/C respectively).
 *   - "Virtual" awareness-check screens that interleave between regular
 *     content screens. The active screen is now a discriminated union.
 *
 * This hook does not know anything about UI — it returns state and actions
 * for the conversation page to consume.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Screen,
  Provocation,
  AwarenessCheck,
  Tier,
} from '../../../content/schema';
import {
  screens as allScreens,
  awareness as allAwareness,
  provocations as allProvocations,
} from '../content';
import { matrix } from '../questions/matrix';
import {
  segment as runSegmentation,
  upgradeSegment,
  type SegmentId,
  type GatingAnswers,
  type HouseholdTag,
} from '../segmentation';
import { shouldShowInput } from './visibility';
import {
  loadSession,
  saveSession,
  isExpired,
  SESSION_VERSION,
  type AwarenessLevel,
} from './session';
import { evaluateTrigger } from './triggers';
import { isCompliancePublishable } from '../provocations/catalogue';

export type TierSlug = 'quick' | 'standard' | 'thorough';

/** Map the URL tier slug to the content-schema tier letter. */
function tierLetter(slug: TierSlug): Tier {
  switch (slug) {
    case 'thorough':
      return 'A';
    case 'quick':
      return 'C';
    case 'standard':
    default:
      return 'B';
  }
}

/** Per-tier cap on the number of awareness checks shown in a session. */
const AWARENESS_TIER_CAP: Record<Tier, number> = {
  A: 5,
  B: 4,
  C: 2,
};

/** A screen position in the current flow — either a real content screen
    or a virtual awareness-check screen interleaved by the engine. */
export type ActiveScreen =
  | { kind: 'content'; screen: Screen }
  | { kind: 'awareness'; check: AwarenessCheck };

export interface EngineState {
  active: ActiveScreen | null;
  /** Backwards-compatible alias for the active content screen, if any. */
  currentScreen: Screen | null;
  answers: Record<string, unknown>;
  segmentId: SegmentId | null;
  provisional: boolean;
  progress: number; /* 0..1 */
  isFirst: boolean;
  isLast: boolean;
  /** True once every gate answer is in place — a prerequisite for
      routing to the details/summary pages. */
  canCompleteFlow: boolean;
  canAdvance: boolean;
  tier: TierSlug;
  /** Provocations to render inline below the current content screen. */
  inlineProvocations: Provocation[];
  /** Awareness checks the user has already answered. */
  firedAwareness: Record<string, AwarenessLevel>;
  /** Provocation ids that have appeared in this session (sticky). */
  firedProvocations: string[];
}

export interface EngineActions {
  answer: (inputId: string, value: unknown) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  /** Record the user's response to the currently-active awareness screen. */
  answerAwareness: (id: string, level: AwarenessLevel) => void;
}

export function useQuestionnaireEngine(tier: TierSlug): EngineState & EngineActions {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [visitedOrder, setVisitedOrder] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [firedAwareness, setFiredAwareness] = useState<Record<string, AwarenessLevel>>({});
  const [firedProvocations, setFiredProvocations] = useState<string[]>([]);
  /** Awareness checks queued to render before the next content screen. */
  const [awarenessQueue, setAwarenessQueue] = useState<string[]>([]);
  /** The awareness-check id currently being shown (drained from the queue). */
  const [activeAwarenessId, setActiveAwarenessId] = useState<string | null>(null);

  const tierCode = tierLetter(tier);

  /* Hydrate from localStorage on mount. Runs once; if the session has expired
     or versions don't match, we start fresh. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const existing = loadSession();
      if (existing && !isExpired(existing)) {
        setAnswers(existing.answers);
        setVisitedOrder(existing.visitedOrder ?? []);
        setCurrentId(existing.currentScreenId);
        setFiredAwareness(existing.firedAwareness ?? {});
        setFiredProvocations(existing.firedProvocations ?? []);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  /* Persist any state change back to localStorage. Only runs after we've
     hydrated so we don't overwrite a valid saved session with an empty one. */
  useEffect(() => {
    if (!hydrated) return;
    saveSession({
      version: SESSION_VERSION,
      createdAt: loadSession()?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tier,
      answers,
      currentScreenId: currentId,
      visitedOrder,
      firedAwareness,
      firedProvocations,
    });
  }, [hydrated, tier, answers, currentId, visitedOrder, firedAwareness, firedProvocations]);

  /* Filter the full screen list down to the ones this tier can ever show.
     Also drop full-page `transition` interstitials — they made the form
     feel longer without adding information that the always-visible
     section chip + section pullquote don't already convey. The editorial
     copy that lived on those screens has been migrated into section meta. */
  const screensForTier = useMemo(
    () =>
      allScreens.filter(
        (s) =>
          s.layout !== 'transition' &&
          (!s.tier_limit || s.tier_limit.includes(tierCode)),
      ),
    [tierCode],
  );

  /* Dev-only sanity check: if the current tier shares its entire screen
     set with the next tier down, the three-length UX is a lie. The
     client brief asks for a "quick / standard / thorough" progression;
     if content authors haven't added tier-A-only screens we want a
     visible warning in the console rather than silent equivalence
     between standard and thorough. */
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (tierCode !== 'A') return;
    const tierBCount = allScreens.filter(
      (s) =>
        s.layout !== 'transition' && (!s.tier_limit || s.tier_limit.includes('B')),
    ).length;
    if (screensForTier.length === tierBCount) {
      console.warn(
        '[engine] Tier A (thorough) contains the same screen set as Tier B (standard). ' +
          'No screen declares tier_limit: [A] only — the "thorough" experience reads as ' +
          'identical to "standard". Add deeper questions for Tier A in content/screens/*.md.',
      );
    }
  }, [tierCode, screensForTier.length]);

  /* Derive the currently-assigned segment from the collected gating answers. */
  const gating: Partial<GatingAnswers> = useMemo(() => {
    return {
      age: toNumber(answers.age),
      household: toHouseholdTags(answers.household),
      workStatus: toStr(answers.work_status) as GatingAnswers['workStatus'] | undefined,
      income: toStr(answers.income_band) as GatingAnswers['income'] | undefined,
      estate: toStr(answers.estate_band) as GatingAnswers['estate'] | undefined,
    };
  }, [answers]);

  const gateReady =
    gating.age !== undefined &&
    gating.household !== undefined &&
    gating.workStatus !== undefined &&
    gating.income !== undefined &&
    gating.estate !== undefined;

  const segmentResult = useMemo(() => {
    if (!gateReady) return null;
    return runSegmentation(gating as GatingAnswers);
  }, [gateReady, gating]);

  /* Apply the S6 upgrade if Q5.3 has been answered. */
  const upgradedSegmentId: SegmentId | null = useMemo(() => {
    if (!segmentResult) return null;
    const q53 = typeof answers.succession === 'string' ? answers.succession : undefined;
    return upgradeSegment(segmentResult.segmentId, q53);
  }, [segmentResult, answers.succession]);

  /* The list of screens this user will see, in order. */
  const visibleScreens = useMemo(() => {
    return screensForTier.filter((s) => {
      if (!upgradedSegmentId) return true;
      const qRefs = s.q_refs ?? [];
      if (qRefs.length === 0) {
        const served = s.segments_served ?? ['all'];
        return served.includes('all') || served.includes(upgradedSegmentId);
      }
      const anyVisible = qRefs.some((qid) => {
        const row = matrix[qid];
        if (!row) return false;
        const cell = row[upgradedSegmentId];
        return cell === 'Y' || cell === 'C';
      });
      if (!anyVisible && process.env.NODE_ENV !== 'production') {
        console.warn(
          `[engine] screen ${s.id} hidden — all q_refs (${qRefs.join(', ')}) are N for ${upgradedSegmentId}`,
        );
      }
      return anyVisible;
    });
  }, [screensForTier, upgradedSegmentId]);

  /* Start position: the first visible screen.
     Stale-session guard: if the persisted currentId is no longer in the
     visible-screens list (e.g. the matrix changed after the session was
     saved, the user's answers narrowed the set, or interstitial
     transition screens were removed from the flow), rebase forward.
     CRITICAL: we only ever scan FORWARD. Scanning backward (as the old
     implementation did) caused returning users to be teleported to an
     earlier screen they'd already answered ("goes backwards" bug). If
     nothing forward is visible we fall back to the first visible screen;
     that happens only when the user finished the flow on an old tier and
     the new tier has zero screens after their last position. */
  const currentIdIsValid =
    currentId !== null && visibleScreens.some((s) => s.id === currentId);

  const effectiveCurrentId = useMemo(() => {
    if (currentIdIsValid) return currentId;
    if (visibleScreens.length === 0) return null;

    if (currentId !== null) {
      const visibleIds = new Set(visibleScreens.map((s) => s.id));
      const originalIndex = allScreens.findIndex((s) => s.id === currentId);
      if (originalIndex !== -1) {
        /* Forward-only scan — never regress the user. */
        for (let i = originalIndex + 1; i < allScreens.length; i++) {
          if (visibleIds.has(allScreens[i].id)) return allScreens[i].id;
        }
      }
    }
    return visibleScreens[0].id;
  }, [currentIdIsValid, currentId, visibleScreens]);

  useEffect(() => {
    if (hydrated && currentId !== null && !currentIdIsValid && effectiveCurrentId) {
      const timer = window.setTimeout(() => {
        /* When the rebase skips over the user's old currentId we treat
           that id as "visited" — otherwise Back is a no-op until they
           answer at least one more screen. Keep visitedOrder deduped. */
        setVisitedOrder((prev) =>
          currentId && !prev.includes(currentId) ? [...prev, currentId] : prev,
        );
        setCurrentId(effectiveCurrentId);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [hydrated, currentId, currentIdIsValid, effectiveCurrentId]);

  /* findIndex may return -1 if effectiveCurrentId briefly falls outside
     visibleScreens (transient race between the hydrate timer and the
     visibleScreens memo). Detect explicitly rather than silently
     remapping to index 0 (the old Math.max(0, …) pattern collapsed the
     failure into a screen-0 teleport). When -1, render nothing this
     tick; the guard effect above will rebase on the next frame. */
  const rawIndex = visibleScreens.findIndex((s) => s.id === effectiveCurrentId);
  const currentIndex = rawIndex >= 0 ? rawIndex : 0;
  const currentScreen = rawIndex >= 0 ? visibleScreens[rawIndex] : null;

  /* Progress — the position in the visible list. Virtual awareness screens
     don't add to the denominator; they just slow the bar between steps. */
  const total = Math.max(1, visibleScreens.length);
  const progress = Math.min(1, (currentIndex + 1) / total);

  const isFirst = currentIndex === 0;
  /* Positional "last screen" indicator — true whenever the user is on the
     last visible screen. The conversation page uses this alongside a
     `canCompleteFlow` guard before routing to /conversation/details, so
     that sudden mid-flow shrinkage of `visibleScreens` (e.g. an
     aggressive segment hides several downstream screens) doesn't fire
     the completion route before the user has actually answered the
     gate. */
  const isLast = currentIndex === visibleScreens.length - 1;
  /* Guard: the gate (age, household, work_status, income, estate) must
     be complete for the flow to be considered finished. */
  const canCompleteFlow = gateReady;

  /* Eligibility selectors -------------------------------------------- */

  const eligibleProvocations = useMemo<Provocation[]>(() => {
    return allProvocations
      .filter((p) => isCompliancePublishable(p.compliance_status))
      .filter((p) => {
        const segs = p.segments ?? [];
        if (segs.length > 0 && !segs.includes('all') && upgradedSegmentId) {
          if (!segs.includes(upgradedSegmentId)) return false;
        }
        return evaluateTrigger(p.trigger, answers, upgradedSegmentId);
      });
  }, [answers, upgradedSegmentId]);

  /* Sticky firing for provocations: anything currently eligible gets added
     to the fired list (and stays fired even once answers change). */
  useEffect(() => {
    if (!hydrated) return;
    const incoming = eligibleProvocations.map((p) => p.id);
    const timer = window.setTimeout(() => {
      setFiredProvocations((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const id of incoming) {
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        }
        return changed ? Array.from(next) : prev;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, eligibleProvocations]);

  /** Awareness checks currently eligible: trigger fires, tier_limit ok,
      compliance ok, and not already answered. Sorted by priority. */
  const eligibleAwarenessChecks = useMemo<AwarenessCheck[]>(() => {
    const cap = AWARENESS_TIER_CAP[tierCode];
    const alreadyShown = new Set(Object.keys(firedAwareness));

    const candidates = allAwareness
      .filter((c) => isCompliancePublishable(c.compliance_status))
      .filter((c) => (c.tier_limit ?? ['A', 'B', 'C']).includes(tierCode))
      .filter((c) => !alreadyShown.has(c.id))
      .filter((c) => evaluateTrigger(c.trigger, answers, upgradedSegmentId));

    /* Priority: explicit numeric rank ascending, then core: true, then by
       file order. */
    candidates.sort((a, b) => {
      const ra = a.rank ?? Number.POSITIVE_INFINITY;
      const rb = b.rank ?? Number.POSITIVE_INFINITY;
      if (ra !== rb) return ra - rb;
      const ca = a.core ? 0 : 1;
      const cb = b.core ? 0 : 1;
      if (ca !== cb) return ca - cb;
      return 0;
    });

    /* Cap by remaining budget — already-shown count goes against the cap. */
    const remaining = Math.max(0, cap - Object.keys(firedAwareness).length);
    return candidates.slice(0, remaining);
  }, [answers, upgradedSegmentId, tierCode, firedAwareness]);

  /* Track a snapshot of which awareness ids were eligible BEFORE the most
     recent answer change. When the set grows after an answer, the new ones
     get queued for the next position in the flow. */
  const prevEligibleIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!hydrated) return;
    const current = new Set(eligibleAwarenessChecks.map((c) => c.id));
    const prev = prevEligibleIdsRef.current;
    const newlyEligible: string[] = [];
    for (const id of current) {
      if (!prev.has(id)) newlyEligible.push(id);
    }
    prevEligibleIdsRef.current = current;
    if (newlyEligible.length > 0) {
      const timer = window.setTimeout(() => {
        setAwarenessQueue((q) => {
          const seen = new Set(q);
          if (activeAwarenessId) seen.add(activeAwarenessId);
          const additions = newlyEligible.filter((id) => !seen.has(id));
          return additions.length > 0 ? [...q, ...additions] : q;
        });
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [hydrated, eligibleAwarenessChecks, activeAwarenessId]);

  /* Active screen — virtual awareness takes precedence over content. */
  const activeAwareness = useMemo<AwarenessCheck | null>(() => {
    if (!activeAwarenessId) return null;
    const found = allAwareness.find((a) => a.id === activeAwarenessId);
    return found ?? null;
  }, [activeAwarenessId]);

  const active = useMemo<ActiveScreen | null>(() => {
    if (activeAwareness) return { kind: 'awareness', check: activeAwareness };
    if (currentScreen) return { kind: 'content', screen: currentScreen };
    return null;
  }, [activeAwareness, currentScreen]);

  /* Inline provocations: only when on a content screen, and only the top one
     for now to avoid overwhelming the user (per brief). */
  const inlineProvocations = useMemo<Provocation[]>(() => {
    if (!currentScreen || activeAwareness) return [];
    return eligibleProvocations.slice(0, 1);
  }, [currentScreen, activeAwareness, eligibleProvocations]);

  /* A screen is "advanceable" if every required + visible input has a value,
     OR if it's a transition / intro screen that has no inputs. Hidden inputs
     (those gated by a conditional_reveal whose predicate is currently false)
     never block advancement. Awareness screens advance once a level is chosen. */
  const canAdvance = useMemo(() => {
    if (active?.kind === 'awareness') {
      return Boolean(firedAwareness[active.check.id]);
    }
    if (!currentScreen) return false;
    if (currentScreen.layout === 'intro' || currentScreen.layout === 'transition') {
      return true;
    }
    const allInputs = currentScreen.inputs ?? [];
    const required = allInputs.filter(
      (i) => i.required && shouldShowInput(i, allInputs, answers),
    );
    return required.every((i) => {
      const v = answers[i.id];
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') return v.trim().length > 0;
      return v !== undefined && v !== null;
    });
  }, [active, currentScreen, answers, firedAwareness]);

  /* Navigation ---------------------------------------------------- */

  const scrollTop = () =>
    typeof window !== 'undefined' &&
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

  const next = useCallback(() => {
    /* Awareness screen → finish it, then either show the next queued
       awareness or advance to the next content screen. */
    if (activeAwarenessId) {
      setActiveAwarenessId(null);
      const [head, ...rest] = awarenessQueue;
      if (head) {
        setAwarenessQueue(rest);
        setActiveAwarenessId(head);
      }
      scrollTop();
      return;
    }

    /* If there's a queued awareness check, drain one before moving on. */
    const [head, ...rest] = awarenessQueue;
    if (head) {
      setAwarenessQueue(rest);
      setActiveAwarenessId(head);
      scrollTop();
      return;
    }

    /* Otherwise advance to the next content screen. */
    const nextScreen = visibleScreens[currentIndex + 1];
    if (!nextScreen) return;
    setVisitedOrder((prev) =>
      effectiveCurrentId && !prev.includes(effectiveCurrentId)
        ? [...prev, effectiveCurrentId]
        : prev,
    );
    setCurrentId(nextScreen.id);
    scrollTop();
  }, [
    activeAwarenessId,
    awarenessQueue,
    visibleScreens,
    currentIndex,
    effectiveCurrentId,
  ]);

  const back = useCallback(() => {
    /* Cancel an in-progress awareness screen by returning to the prior
       content screen. (Don't pop the awareness response — keep what user
       gave us, but allow navigation back.) */
    if (activeAwarenessId) {
      setActiveAwarenessId(null);
      return;
    }
    const prev = visitedOrder[visitedOrder.length - 1];
    if (!prev) return;
    setVisitedOrder((p) => p.slice(0, -1));
    setCurrentId(prev);
    scrollTop();
  }, [activeAwarenessId, visitedOrder]);

  const answer = useCallback((inputId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [inputId]: value }));
  }, []);

  const answerAwareness = useCallback(
    (id: string, level: AwarenessLevel) => {
      setFiredAwareness((prev) => ({ ...prev, [id]: level }));
    },
    [],
  );

  const reset = useCallback(() => {
    setAnswers({});
    setVisitedOrder([]);
    setCurrentId(null);
    setFiredAwareness({});
    setFiredProvocations([]);
    setAwarenessQueue([]);
    setActiveAwarenessId(null);
  }, []);

  return {
    active,
    currentScreen,
    answers,
    segmentId: upgradedSegmentId,
    provisional: segmentResult?.provisional ?? false,
    progress,
    isFirst,
    isLast,
    canCompleteFlow,
    canAdvance,
    tier,
    inlineProvocations,
    firedAwareness,
    firedProvocations,
    answer,
    answerAwareness,
    next,
    back,
    reset,
  };
}

/* ================================================================ */
/* tiny coercion helpers — bridge unknown input values to the        */
/* GatingAnswers types without forcing the engine into a full DSL.   */
/* ================================================================ */

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function toStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function toHouseholdTags(v: unknown): HouseholdTag[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const valid = new Set<HouseholdTag>([
    'partner',
    'dependent_children',
    'adult_children',
    'elderly_parent',
    'solo',
  ]);
  return (v as string[]).filter((x): x is HouseholdTag => valid.has(x as HouseholdTag));
}
