/**
 * ReportCapture — email-gate banner on the summary page.
 *
 * The user has typically already passed through /conversation/details, where
 * firstName/email/consent were captured into session.contact. We pre-fill
 * from that so the banner reads as "confirm + send" rather than a fresh
 * form. If there's no contact on the session we fall back to capturing
 * from scratch here.
 *
 * Submitting POSTs to /api/report/send. On 200 we call onSuccess(), which
 * the page uses to flip the unlock flag and reveal the full report below.
 * No DB write happens client-side — the server talks to Resend and treats
 * Resend's delivery log as the compliance record (MVP trade-off; Phase 2
 * adds a proper store).
 */
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import styles from './ReportCapture.module.css';

export interface ReportCaptureProps {
  prefillFirstName?: string;
  prefillEmail?: string;
  prefillConsentMarketing?: boolean;
  /** Opaque payload forwarded to the API so it can render the email body. */
  sessionPayload: unknown;
  /** Called after a successful send. The page uses this to unlock the full report. */
  onSuccess: () => void;
}

type Status = 'idle' | 'sending' | 'error';

export function ReportCapture({
  prefillFirstName = '',
  prefillEmail = '',
  prefillConsentMarketing = false,
  sessionPayload,
  onSuccess,
}: ReportCaptureProps) {
  const [firstName, setFirstName] = useState(prefillFirstName);
  const [email, setEmail] = useState(prefillEmail);
  const [consentService, setConsentService] = useState(prefillEmail.length > 0);
  const [consentMarketing, setConsentMarketing] = useState(prefillConsentMarketing);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Please tell us your first name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Please enter a valid email address.';
    if (!consentService) next.consent = 'We need your permission to email your report.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('sending');
    setErrorMessage('');
    try {
      const res = await fetch('/api/report/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          consentService,
          consentMarketing,
          session: sessionPayload,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Something went wrong sending your report.');
      }
      onSuccess();
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    }
  }

  return (
    <section className={styles.wrap} aria-labelledby="capture-headline">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Your Wealth Report</p>
          <h2 id="capture-headline" className={styles.headline}>
            Email me my report.
          </h2>
          <p className={styles.frame}>
            We&rsquo;ll send a detailed PDF of the five areas worth a
            conversation, the gaps we noticed, and what a planner would
            talk through with you. The full report opens below once it
            lands in your inbox.
          </p>
        </div>

        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="capture-firstName">
                First name
              </label>
              <input
                id="capture-firstName"
                className={styles.input}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                placeholder="Michelle"
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? 'capture-firstName-error' : undefined}
                required
                disabled={status === 'sending'}
              />
              {errors.firstName ? (
                <p id="capture-firstName-error" className={styles.errorText}>
                  {errors.firstName}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="capture-email">
                Email
              </label>
              <input
                id="capture-email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'capture-email-error' : undefined}
                required
                disabled={status === 'sending'}
              />
              {errors.email ? (
                <p id="capture-email-error" className={styles.errorText}>
                  {errors.email}
                </p>
              ) : null}
            </div>
          </div>

          <div className={styles.consentGroup}>
            <div className={styles.consent}>
              <input
                id="capture-consent-service"
                type="checkbox"
                checked={consentService}
                onChange={(e) => setConsentService(e.target.checked)}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? 'capture-consent-error' : undefined}
                required
                disabled={status === 'sending'}
              />
              <label htmlFor="capture-consent-service">
                I&rsquo;d like Real Wealth to email me this report.
              </label>
            </div>
            {errors.consent ? (
              <p id="capture-consent-error" className={styles.errorText} role="alert">
                {errors.consent}
              </p>
            ) : null}

            <div className={styles.consent}>
              <input
                id="capture-consent-marketing"
                type="checkbox"
                checked={consentMarketing}
                onChange={(e) => setConsentMarketing(e.target.checked)}
                disabled={status === 'sending'}
              />
              <label htmlFor="capture-consent-marketing">
                I&rsquo;d also like occasional planning insights from
                Real Wealth. I can unsubscribe any time.
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send me my report'}
            </Button>
            <p className={styles.privacyLine}>
              We only use your email to send this report.{' '}
              <a className={styles.privacyLink} href="/privacy">
                See our privacy notice.
              </a>
            </p>
          </div>

          {status === 'error' ? (
            <p className={styles.errorBanner} role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
