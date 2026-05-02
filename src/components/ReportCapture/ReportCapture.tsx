/**
 * ReportCapture — email + consent form on /conversation/summary state 1.
 *
 * The form posts to /api/report/send. On 200 the parent flips a state
 * flag so state 2 (the "Open my report" panel) renders. The endpoint
 * records the email + consent — it does NOT send an email. The report
 * itself is browser-only; the user opens it on /conversation/report.
 *
 * Why one consent checkbox (not two)? The previous flow had a
 * service-consent + marketing-consent split because the API was
 * actually sending the report by email. Now that nothing leaves the
 * browser, the only meaningful permission is "may a planner contact
 * me about this" — that's the single tickbox.
 */
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import styles from './ReportCapture.module.css';

export interface ReportCaptureProps {
  prefillEmail?: string;
  prefillConsentContact?: boolean;
  /** Opaque payload forwarded to the API for the consent ledger. */
  sessionPayload: unknown;
  /** Called once the API returns 200. Parent uses this to advance to state 2. */
  onSuccess: () => void;
}

type Status = 'idle' | 'sending' | 'error';

export function ReportCapture({
  prefillEmail = '',
  prefillConsentContact = false,
  sessionPayload,
  onSuccess,
}: ReportCaptureProps) {
  const [email, setEmail] = useState(prefillEmail);
  const [consentContact, setConsentContact] = useState(prefillConsentContact);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Please enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('sending');
    setErrorMessage('');
    try {
      const res = await fetch('/api/report/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          consentContact,
          session: sessionPayload,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Something went wrong. Please try again.');
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
    <form className={styles.form} onSubmit={submit} noValidate>
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

      <div className={styles.consent}>
        <input
          id="capture-consent-contact"
          type="checkbox"
          checked={consentContact}
          onChange={(e) => setConsentContact(e.target.checked)}
          disabled={status === 'sending'}
        />
        <label htmlFor="capture-consent-contact">
          I&rsquo;d like a planner to get in touch about this.
        </label>
      </div>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Opening…' : 'View my report'}
        </Button>
      </div>

      {status === 'error' ? (
        <p className={styles.errorBanner} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
