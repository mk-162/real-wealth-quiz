/**
 * POST /api/report/send
 *
 * Records the user's email + contact-consent at the moment they ask to
 * open the report. The report itself is browser-only — we do NOT email
 * a copy. Resend integration was removed when the flow shifted to a
 * privacy-first design (the report lives only in the user's localStorage;
 * we keep no server-side copy of the financial answers).
 *
 * The endpoint is rate-limited per IP and the body shape is validated.
 * For now, the consent record is logged to stdout — Phase 2 wires it to
 * a durable store so the marketing team has a contactable list of users
 * who opted in. Until then, treat the server log as the audit trail.
 *
 * Expected body:
 *   {
 *     email:          string,
 *     consentContact: boolean,    // "I'd like a planner to get in touch"
 *     session:        Session|null  // for context only; not retained
 *   }
 *
 * Responses:
 *   200 { ok: true }
 *   400 { ok: false, error: "..." }   — validation
 *   429 { ok: false, error: "..." }   — rate limited
 */
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/emails/rateLimit';

export const runtime = 'nodejs';

interface Body {
  email?: unknown;
  consentContact?: unknown;
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

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const consentContact = body.consentContact === true;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'A valid email address is required.' },
      { status: 400 },
    );
  }

  // Best-effort per-IP rate limit. The endpoint is unauthenticated so this
  // is the only barrier to scripted abuse.
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

  // Audit-trail log line. Picked up by whatever log aggregator the
  // hosting environment provides. Phase 2 replaces this with a durable
  // store + a marketing dashboard.
  console.info('[report/send] consent recorded', {
    email,
    consentContact,
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'anonymous';
}
