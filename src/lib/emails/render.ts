/**
 * Email template loader.
 *
 * Node-only. Do NOT import this from any file that runs in the browser — it
 * relies on `fs` and `path` and resolves templates from the project root.
 *
 * The production email sender calls `loadEmailTemplate('confirmation')` (or
 * 'nudge') to get the raw HTML, text, subject and preview strings. Handlebars-
 * style placeholders ({{first_name}}, {{booking_url}}, etc.) are intentionally
 * left intact — substitution is the responsibility of the downstream email
 * engine at send time so that per-recipient values never touch this file.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { microcopy } from '../content';

export type EmailKind = 'confirmation' | 'nudge';

export interface EmailTemplate {
  html: string;
  text: string;
  subject: string;
  preview: string;
}

/**
 * Load a raw email template from `templates/emails/`. No substitution is
 * performed — the returned strings still contain `{{placeholder}}` tokens.
 */
export function loadEmailTemplate(kind: EmailKind): EmailTemplate {
  const dir = join(process.cwd(), 'templates', 'emails');
  const html = readFileSync(join(dir, `${kind}.html`), 'utf8');
  const text = readFileSync(join(dir, `${kind}.txt`), 'utf8');

  const subjectKey = kind === 'confirmation' ? 'email1_subject' : 'email2_subject';
  const previewKey = kind === 'confirmation' ? 'email1_preview' : 'email2_preview';

  return {
    html,
    text,
    subject: microcopy('emails', subjectKey),
    preview: microcopy('emails', previewKey),
  };
}
