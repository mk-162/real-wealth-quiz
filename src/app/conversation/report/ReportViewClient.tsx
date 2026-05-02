/**
 * ReportViewClient — the client surface at /conversation/report.
 *
 * Wraps the embedded 9-page Compass report with the privacy banner
 * (Save as PDF / Print / How to clear it from my browser) and the
 * accompanying modal.
 *
 * Reads the persisted session from localStorage to:
 *   1. Compute the user's segmentId (so the correct pre-rendered
 *      report is selected from `reportSectionsBySegment`).
 *   2. Drive the live `renderUserCompassReport` server action so the
 *      report's chart numbers, tile scoring, and gauge use the user's
 *      real answers (when available). When the session is incomplete,
 *      we fall back to the segment's pre-rendered fixture variant.
 *
 * If the user navigates here without a resolved session, we show a
 * gentle "finish the conversation first" message rather than rendering
 * a generic fallback report. Mirrors the summary page's incomplete path.
 *
 * Note: the session-reading helpers and segment derivation duplicate
 * the logic in SummaryClient.tsx. Worth extracting into a shared hook
 * (`useSessionAndSegment`) on a follow-up — the duplication is small
 * but real.
 */
'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { renderUserCompassReport } from '../summary/actions';
import { ReportViewBanner } from '@/components/ReportViewBanner';
import { PrivacyClearModal } from '@/components/PrivacyClearModal';
import { Button } from '@/components/Button';
import { SummaryHeader } from '@/components/SummaryHeader';
import {
  loadSession,
  SESSION_KEY,
  type Session,
} from '@/lib/questionnaire/session';
import {
  segment as runSegmentation,
  upgradeSegment,
  type GatingAnswers,
  type HouseholdTag,
} from '@/lib/segmentation';
import styles from './ReportViewClient.module.css';

let cachedSessionRaw: string | null | undefined;
let cachedSession: Session | null = null;

function subscribeBrowserStorage(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function getClientReadySnapshot(): boolean { return true; }
function getServerReadySnapshot(): boolean { return false; }

function getSessionSnapshot(): Session | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
  if (raw === cachedSessionRaw) return cachedSession;
  cachedSessionRaw = raw;
  cachedSession = loadSession();
  return cachedSession;
}

function getServerSessionSnapshot(): Session | null {
  return null;
}

function deriveSegmentFromSession(session: Session | null): string | null {
  if (!session) return null;
  const answers = (session.answers ?? {}) as Record<string, unknown>;
  const gating: Partial<GatingAnswers> = {
    age: typeof answers.age === 'number' ? answers.age : undefined,
    household: Array.isArray(answers.household)
      ? (answers.household as HouseholdTag[])
      : undefined,
    workStatus:
      typeof answers.work_status === 'string'
        ? (answers.work_status as GatingAnswers['workStatus'])
        : undefined,
    income:
      typeof answers.income_band === 'string'
        ? (answers.income_band as GatingAnswers['income'])
        : undefined,
    estate:
      typeof answers.estate_band === 'string'
        ? (answers.estate_band as GatingAnswers['estate'])
        : undefined,
  };
  const ready =
    gating.age !== undefined &&
    gating.household !== undefined &&
    gating.workStatus !== undefined &&
    gating.income !== undefined &&
    gating.estate !== undefined;
  if (!ready) return null;
  const { segmentId: base } = runSegmentation(gating as GatingAnswers);
  const q53 = typeof answers.succession === 'string' ? answers.succession : undefined;
  return upgradeSegment(base, q53);
}

export interface ReportViewClientProps {
  reportSectionsBySegment: Record<string, ReactNode>;
}

export function ReportViewClient({
  reportSectionsBySegment,
}: ReportViewClientProps) {
  const router = useRouter();
  const [showClearModal, setShowClearModal] = useState(false);

  const clientReady = useSyncExternalStore(
    subscribeBrowserStorage,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );
  const session = useSyncExternalStore(
    subscribeBrowserStorage,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  const segmentId = deriveSegmentFromSession(session);
  const firstName = session?.contact?.firstName?.trim() ?? '';

  // User-driven render via server action — once the segment is known
  // and the session has answers, ask the server to render a report
  // shaped by the user's real numbers. Falls through to the fixture
  // variant if the action fails or the session is incomplete.
  const [userReport, setUserReport] = useState<ReactNode | null>(null);
  useEffect(() => {
    if (!session?.answers || !segmentId) {
      setUserReport(null);
      return;
    }
    let cancelled = false;
    const recipientName = firstName || 'your plan';
    renderUserCompassReport({
      answers: session.answers,
      segmentId,
      recipientName,
    })
      .then((node) => {
        if (!cancelled) setUserReport(node);
      })
      .catch(() => {
        if (!cancelled) setUserReport(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session, segmentId, firstName]);

  // SSR / pre-mount placeholder so initial HTML matches the first
  // client render. Same trick as SummaryClient.
  if (!clientReady) {
    return <div className={styles.shell} aria-hidden="true" />;
  }

  // No segment yet — the user hit /conversation/report without
  // completing the conversation. Send them back to summary, which
  // already handles the "incomplete" nudge gracefully.
  if (!segmentId) {
    return (
      <div className={styles.shell}>
        <SummaryHeader />
        <section className={styles.incomplete}>
          <h1 className={styles.incompleteTitle}>
            We need a little more from you first.
          </h1>
          <p className={styles.incompleteBody}>
            Pick up the conversation where you left off and we&rsquo;ll
            bring you back here when your report is ready.
          </p>
          <Button onClick={() => router.push('/conversation')}>
            Continue the conversation
          </Button>
        </section>
      </div>
    );
  }

  const reportNode = userReport ?? reportSectionsBySegment[segmentId];

  return (
    <div className={styles.shell}>
      <ReportViewBanner onClearClick={() => setShowClearModal(true)} />
      <main className={styles.reportFrame}>{reportNode}</main>
      {showClearModal ? (
        <PrivacyClearModal onClose={() => setShowClearModal(false)} />
      ) : null}
    </div>
  );
}
