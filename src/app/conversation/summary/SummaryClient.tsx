/**
 * SummaryClient — the slim "your report is ready" confirmation page.
 *
 * Two states, controlled by a single `unlocked` flag persisted in
 * localStorage:
 *   1. Capture — headline + privacy explainer + ReportCapture form.
 *   2. View    — confirmation copy + cover thumbnail + "Open my report"
 *                button that routes to /conversation/report.
 *
 * The report itself never embeds here. /conversation/report owns the
 * full report surface and the privacy banner around it.
 *
 * Incomplete-session path: if the user lands on /conversation/summary
 * without a resolved segment (skipped the gate, or hit a dev-nav
 * shortcut), we show a polite "finish the form first" nudge instead
 * of silently rendering the capture for an empty session.
 */
'use client';

import { Suspense, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { ReportCapture } from '@/components/ReportCapture';
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
import styles from './page.module.css';

const UNLOCK_KEY = 'real-wealth:report-unlocked';

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

function getUnlockedSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

function getServerUnlockedSnapshot(): boolean {
  return false;
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

export default function SummaryClient() {
  return (
    <Suspense fallback={null}>
      <Summary />
    </Suspense>
  );
}

function Summary() {
  const router = useRouter();
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
  const persistedUnlocked = useSyncExternalStore(
    subscribeBrowserStorage,
    getUnlockedSnapshot,
    getServerUnlockedSnapshot,
  );

  const segmentId = deriveSegmentFromSession(session);
  const prefillEmail = session?.contact?.email?.trim() ?? '';

  // After capture submit (or on a return visit where the unlock flag is
  // already set), go straight to /conversation/report. There's no
  // intermediate "ready to open" panel — the privacy banner at the top
  // of the report carries the same "this is your only copy" message.
  function handleUnlock() {
    try {
      window.localStorage.setItem(UNLOCK_KEY, 'true');
    } catch {
      /* storage disabled — navigation still proceeds */
    }
    router.push('/conversation/report');
  }

  // Pre-mount placeholder so SSR and initial client render match.
  if (!clientReady) {
    return <div className={styles.shell} aria-hidden="true" />;
  }

  // Returning user — already unlocked. Bounce to the report directly.
  if (persistedUnlocked && segmentId) {
    if (typeof window !== 'undefined') {
      router.replace('/conversation/report');
    }
    return <div className={styles.shell} aria-hidden="true" />;
  }

  // No segment — user landed here without finishing the conversation.
  if (!segmentId) {
    return (
      <div className={styles.shell}>
        <SummaryHeader />
        <main className={styles.main}>
          <section className={styles.panel}>
            <h1 className={styles.headline}>
              We need a little more from you first.
            </h1>
            <p className={styles.body}>
              Pick up the conversation where you left off and we&rsquo;ll
              bring you back here when your report is ready.
            </p>
            <div className={styles.actions}>
              <Button onClick={() => router.push('/conversation')}>
                Continue the conversation
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Capture form — submitting routes to /conversation/report.
  return (
    <div className={styles.shell}>
      <SummaryHeader />
      <main className={styles.main}>
        <section className={styles.panel}>
          <h1 className={styles.headline}>Your Wealth Report is ready.</h1>
          <p className={styles.body}>
            It&rsquo;s saved in your browser, not with us. Add your email
            to open it. We won&rsquo;t send the report — we don&rsquo;t
            keep a copy.
          </p>
          <ReportCapture
            prefillEmail={prefillEmail}
            sessionPayload={session}
            onSuccess={handleUnlock}
          />
        </section>
      </main>
    </div>
  );
}
