/**
 * Data-capture screen. One page: first name, email, optional phone, consent tick.
 * No account creation. Copy sourced from content/pages/data-capture.md and
 * content/microcopy/errors.md. See Voice and Tone.md "Consent and data copy".
 */
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { microcopy, pageValue } from '@/lib/content';
import { loadSession, saveSession } from '@/lib/questionnaire/session';
import { containsDistressIndicator } from '@/lib/safeguards/distress';
import styles from './page.module.css';

interface CaptureField {
  id: string;
  label?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export default function DetailsPage() {
  const router = useRouter();

  /* Copy sourced from content/pages/data-capture.md. */
  const headline = pageValue<string>('data-capture', 'headline', 'Nearly there.');
  const sub = pageValue<string>('data-capture', 'sub', '');
  const fields = pageValue<CaptureField[]>('data-capture', 'fields', []);
  const consentServiceLabel = pageValue<string>(
    'data-capture',
    'consent_service.label',
    "I'd like Real Wealth to contact me about this conversation.",
  );
  const consentMarketingLabel = pageValue<string>(
    'data-capture',
    'consent_marketing.label',
    "I'd also like occasional planning insights from Real Wealth. I can unsubscribe any time.",
  );
  const consentDetailLabel = pageValue<string>(
    'data-capture',
    'consent_detail_link_label',
    'See our privacy notice.',
  );
  const consentDetailHref = pageValue<string>(
    'data-capture',
    'consent_detail_link_href',
    '/privacy',
  );
  const primaryButton = pageValue<string>(
    'data-capture',
    'primary_button',
    'See your picture →',
  );
  const honestyLine = pageValue<string>('data-capture', 'honesty_line', '');

  /* Error strings sourced from content/microcopy/errors.md. */
  const firstName = fields.find((f) => f.id === 'first_name');
  const emailField = fields.find((f) => f.id === 'email');
  const phoneField = fields.find((f) => f.id === 'phone');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentService, setConsentService] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = microcopy('errors', 'first_name_blank');
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = microcopy('errors', 'email_invalid');
    if (!consentService) next.consent = microcopy('errors', 'consent_unchecked');
    setErrors(next);
    if (Object.keys(next).length === 0) {
      /* Persist contact into the session so the summary page can read it.
         In production this ALSO POSTs to a capture endpoint with the
         consentMarketing flag as a distinct optional field. */
      const existing = loadSession();
      if (existing) {
        saveSession({
          ...existing,
          contact: {
            firstName: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            consentService,
            consentMarketing,
          },
        });
      }

      /* Consumer-Duty / vulnerable-customer safeguard.
         If the Q2.4 free-text answer contains a distress indicator, route to
         the sensitive-path support page (signposts only — no commercial copy)
         instead of the sales-y summary. See src/lib/safeguards/distress.ts
         for the regex list and the production-hardening note (server-side
         moderation + human review queue still required). */
      const happyPlace = existing?.answers?.happy_place;
      if (containsDistressIndicator(happyPlace)) {
        router.push('/conversation/support');
        return;
      }

      router.push('/conversation/summary');
    }
  };

  return (
    <div className={styles.shell}>
      <section className={styles.intro}>
        <h1>{headline}</h1>
        <p>{sub}</p>
      </section>

      <form className={styles.form} onSubmit={submit} noValidate>
        {firstName ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              {firstName.label}
            </label>
            <input
              id="name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              placeholder={firstName.placeholder}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              required
            />
            {errors.name ? (
              <p id="name-error" className={styles.errorText}>
                {errors.name}
              </p>
            ) : null}
          </div>
        ) : null}

        {emailField ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              {emailField.label}
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder={emailField.placeholder}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              required
            />
            {errors.email ? (
              <p id="email-error" className={styles.errorText}>
                {errors.email}
              </p>
            ) : null}
          </div>
        ) : null}

        {phoneField ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              {phoneField.label}
              <span className={styles.optional}>optional</span>
            </label>
            <input
              id="phone"
              type="tel"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder={phoneField.placeholder}
            />
          </div>
        ) : null}

        <div className={styles.consentGroup}>
          <div className={styles.consent}>
            <input
              id="consent-service"
              type="checkbox"
              checked={consentService}
              onChange={(e) => setConsentService(e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
              required
            />
            <label htmlFor="consent-service">{consentServiceLabel}</label>
          </div>
          {errors.consent ? (
            <p id="consent-error" className={styles.errorText} role="alert">
              {errors.consent}
            </p>
          ) : null}

          <div className={styles.consent}>
            <input
              id="consent-marketing"
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
            />
            <label htmlFor="consent-marketing">{consentMarketingLabel}</label>
          </div>
        </div>

        <p className={styles.privacyLinkLine}>
          <a href={consentDetailHref} className={styles.detailLink}>
            {consentDetailLabel}
          </a>
        </p>

        <div className={styles.actions}>
          <Button type="button" variant="text" onClick={() => router.back()}>
            Back
          </Button>
          <Button type="submit">{primaryButton}</Button>
        </div>

        {honestyLine ? <p className={styles.honesty}>{honestyLine}</p> : null}
      </form>
    </div>
  );
}
