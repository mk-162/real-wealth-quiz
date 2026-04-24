/**
 * POST /api/report/send
 *
 * Validates a submission, rate-limits per IP, and delivers the Wealth
 * Report email via Resend. The compliance record for MVP is Resend's
 * own delivery log — we do not persist anything server-side. Phase 2
 * adds a DB-backed consent log + magic-link verification.
 *
 * Expected body:
 *   {
 *     firstName:        string,
 *     email:            string,
 *     consentService:   true,        // required
 *     consentMarketing: boolean,
 *     session:          Session|null // for deriving summaryIntro
 *   }
 *
 * Responses:
 *   200 { ok: true }
 *   400 { ok: false, error: "..." }   — validation
 *   429 { ok: false, error: "..." }   — rate limited
 *   500 { ok: false, error: "..." }   — send failed / config missing
 */
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/emails/rateLimit';
import {
  renderReportEmailHtml,
  renderReportEmailText,
} from '@/lib/emails/reportEmail';
import { buildSummaryInputs, selectEmotionalIntro } from '@/lib/summary';
import type { Session } from '@/lib/questionnaire/session';
import {
  segment as runSegmentation,
  upgradeSegment,
  type GatingAnswers,
  type HouseholdTag,
} from '@/lib/segmentation';

export const runtime = 'nodejs';

interface Body {
  firstName?: unknown;
  email?: unknown;
  consentService?: unknown;
  consentMarketing?: unknown;
  session?: unknown;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const RATE_LIMIT_PER_IP = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body.' },
      { status: 400 },
    );
  }

  const firstName =
    typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const consentService = body.consentService === true;
  const consentMarketing = body.consentMarketing === true;

  if (!firstName) {
    return NextResponse.json(
      { ok: false, error: 'First name is required.' },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'A valid email address is required.' },
      { status: 400 },
    );
  }
  if (!consentService) {
    return NextResponse.json(
      {
        ok: false,
        error: 'We need your permission to email your report.',
      },
      { status: 400 },
    );
  }

  // Rate limit by client IP (best-effort — see rateLimit.ts for trade-offs).
  const ip = clientIp(req);
  const rl = checkRateLimit(ip, RATE_LIMIT_PER_IP, RATE_LIMIT_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Too many requests. Please try again in a bit.',
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  // Config check.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[report/send] RESEND_API_KEY missing');
    return NextResponse.json(
      { ok: false, error: 'Email sending is not configured.' },
      { status: 500 },
    );
  }
  const from =
    process.env.RESEND_FROM_EMAIL ?? 'Real Wealth <reports@realwealth.co.uk>';

  // Derive the summary intro from the session so the email copy is
  // personalised to the segment the user landed on. If the session
  // isn't usable we fall back to a neutral line.
  const session = (body.session ?? null) as Session | null;
  const summaryIntro = deriveSummaryIntro(session);

  const origin = new URL(req.url).origin;
  const reportUrl = `${origin}/conversation/summary`;
  const unsubscribeUrl = `${origin}/privacy?email=${encodeURIComponent(email)}`;
  const privacyUrl = `${origin}/privacy`;

  try {
    const resend = new Resend(apiKey);
    const tags = [
      { name: 'consent_marketing', value: consentMarketing ? 'yes' : 'no' },
      { name: 'consent_version', value: '2026-04' },
    ];
    const result = await resend.emails.send({
      from,
      to: email,
      subject: `${firstName}, your Real Wealth Report is ready`,
      html: renderReportEmailHtml({
        firstName,
        summaryIntro,
        reportUrl,
        unsubscribeUrl,
        privacyUrl,
      }),
      text: renderReportEmailText({
        firstName,
        summaryIntro,
        reportUrl,
        unsubscribeUrl,
        privacyUrl,
      }),
      tags,
      headers: {
        // RFC 2369 / 8058 one-click unsubscribe for Gmail/Outlook list
        // hygiene. Honouring this is enforced by an endpoint we add in
        // the privacy/unsubscribe task.
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (result.error) {
      console.error('[report/send] Resend error', result.error);
      return NextResponse.json(
        { ok: false, error: 'Could not send the email right now.' },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[report/send] unexpected error', err);
    return NextResponse.json(
      { ok: false, error: 'Could not send the email right now.' },
      { status: 500 },
    );
  }
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'anonymous';
}

function deriveSummaryIntro(session: Session | null): string {
  const fallback =
    'A few areas stood out in what you told us — the sort of thing worth a planner putting 30 minutes into with you.';
  if (!session) return fallback;
  try {
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
    const gateReady =
      gating.age !== undefined &&
      gating.household !== undefined &&
      gating.workStatus !== undefined &&
      gating.income !== undefined &&
      gating.estate !== undefined;
    let segmentId = 'S2';
    if (gateReady) {
      const { segmentId: base } = runSegmentation(gating as GatingAnswers);
      const q53 =
        typeof answers.succession === 'string' ? answers.succession : undefined;
      segmentId = upgradeSegment(base, q53);
    }
    const inputs = buildSummaryInputs(session, segmentId, {
      urgency: typeof answers.urgency === 'string' ? answers.urgency : null,
      currentAdviser:
        typeof answers.current_adviser === 'string'
          ? answers.current_adviser
          : null,
      happyPlace:
        typeof answers.happy_place === 'string' ? answers.happy_place : null,
    });
    const intro = selectEmotionalIntro(inputs);
    return intro?.copy?.trim() || fallback;
  } catch (err) {
    console.error('[report/send] deriveSummaryIntro failed', err);
    return fallback;
  }
}
