<!-- _AUDIT.md entry: 7.1 -->
---
name: edit-microcopy
description: Change a single entry (value or note) in one of the Real Wealth microcopy files — errors, toasts, emails, ARIA, meta, loading-states, modals, progress. Use this skill whenever the user asks to soften an error message, rewrite a toast, tweak an email line, fix a specific label, reword a validation message, or otherwise modify ONE string inside `content/microcopy/*.md` without adding or removing entries. Triggers on phrasings like "soften the email-invalid message", "the session-expired toast sounds cold", "rewrite the first-name-blank error", or just "that red text under the email field".
---

# Edit a microcopy entry

## What this skill does

Updates the `value` (and optionally the `note`) of a single `entries[]` item inside one of the 8 microcopy files. Preserves the file's other entries, its frontmatter, and its body prose.

## Background — the microcopy catalogue

Files under `master_template/content/microcopy/`:

| File | Purpose |
|---|---|
| `errors.md` | Field validation and error messages — red-flag moments. |
| `toasts.md` | Ephemeral confirmations — "Session saved", "Email sent". |
| `emails.md` | Templated email bodies and subject lines. |
| `aria.md` | Screen-reader labels and ARIA attributes. |
| `meta.md` | Page titles, OG descriptions, meta tags. |
| `loading-states.md` | Spinner labels, "Preparing your report…". |
| `modals.md` | Dialog titles, body copy, button labels. |
| `progress.md` | Progress bar labels, step markers. |

Schema (from `content/schema.ts`):
```typescript
// microcopyGroupSchema
{ id, title, entries: [{ key, value, note? }] }
```

Each file is one group; each entry has a stable `key` (the runtime look-up) and a `value` (the user-facing string).

## The voice rules that govern microcopy

From `content/microcopy/voice-rules.md` and `scripts/banned-phrases.json`:

- No "error", "invalid", "wrong", "failed" in error messages.
- No exclamation marks anywhere.
- No red-and-bold shouting register.
- Single sentence. Area-normal 14px, `--ink-muted` styling.
- Error messages apologise for the system, not for the user.
- Advice-verbs ("recommend", "advise", "should", "must") are discouraged — use "consider", "worth", "you might".
- Prefer contractions: "we'll" not "we will"; "won't" not "will not".
- Max 15 words per sentence on interactive elements.

See `errors.md` body for the pattern: "error messages apologise for the system's lack of clarity, not for the user's mistake. Quiet, specific, actionable."

## Inputs you need from the user

1. **Which file.** One of the 8 microcopy files. If the user named the surface ("error", "toast", "email"), that maps. If they named only the text visible in the UI, grep for it.
2. **Which entry.** By `key` (`email_invalid`) or by the current value ("that email doesn't look quite right…"). Confirm which entry before editing.
3. **The new value** (or the intent — "soften", "make more specific", "shorter").

## Workflow

1. **Locate the file and entry.** If the user gave a phrase, grep:
   ```bash
   grep -l "that email doesn't look" master_template/content/microcopy/
   ```

2. **Read the file whole.** Understand the voice of surrounding entries — microcopy files are internally consistent, so a single edit should match the register of its neighbours.

3. **Edit the named entry.** Touch only `value` (and `note` if relevant). Leave `key`, every other entry, and the file's body prose alone.

4. **Voice check — specific to microcopy.** Before writing, read `voice-rules.md` once and mentally check:
   - No banned words (`error`, `invalid`, `wrong`, `failed`).
   - No exclamation marks.
   - Single sentence.
   - In the register of surrounding entries.

5. **Respect character budgets** (from `admin_app/shared/character-budgets.ts`):
   - `microcopy.error` — ideal 80, hard 140.
   - `microcopy.toast` — ideal 60, hard 100.
   - `microcopy.email.subject` — ideal 50, hard 70.
   - `microcopy.email.body` — ideal 500, hard 1000.
   - `microcopy.aria` — ideal 60, hard 120.
   - `microcopy.modal.title` — ideal 40, hard 60.
   - `microcopy.modal.body` — ideal 160, hard 260.
   - `microcopy.loading` — ideal 30, hard 60.
   - `microcopy.progress` — ideal 30, hard 50.
   - `microcopy.meta.title` — ideal 50, hard 70.
   - `microcopy.meta.description` — ideal 150, hard 240.

6. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   `voice:check` catches banned phrases. `content:check` validates the schema shape.

7. **Summarise.** File path, entry key, before → after.

## Files touched

- `master_template/content/microcopy/<file>.md` — one file, one entry.

## Invariants — never break these

- **Never rename a `key`.** It's the runtime foreign key; `src/` references resolve strings by key. Renaming cascades. If the user really does want to rename, grep `src/` first and surface the cascade — do not silently flip it.
- **Never add or remove entries here.** That's `add-microcopy-entry` (not yet scoped).
- **Never touch the voice-rules entries in `voice-rules.md`.** That's `update-voice-rules` — a different skill with different review implications.
- **Never use banned words.** `error`, `invalid`, `wrong`, `failed`, exclamation marks — these are in `scripts/banned-phrases.json` and will fail `voice:check`. Read `content/microcopy/errors.md`'s body for the full pattern.
- **Never break the "apologise for the system, not the user" principle** in error copy. "That email doesn't look quite right — a typo somewhere?" is right; "You entered an invalid email!" is wrong on three separate axes.
- **Round-trip fidelity.** Use YAML AST; preserve the existing quoting style.

## Examples

### Example 1 — soften an error message

**User:** "Soften the `email_invalid` error — 'doesn't look quite right' is fine but the em-dash feels abrupt."

**Target:** `content/microcopy/errors.md`. Entry `key: email_invalid`.

**Before:**
```yaml
- key: email_invalid
  value: "That email doesn't look quite right — a typo somewhere?"
```

**After:**
```yaml
- key: email_invalid
  value: "That email doesn't look quite right. A typo somewhere?"
```

Validation: 51 chars — under ideal 80. `voice:check` clean (`wrong` absent — "quite right" is safe; the banned stem is the literal word `wrong`).

### Example 2 — rewrite a toast

**User:** "The session-saved toast says 'Your progress is saved.' — make it sound less robotic."

**Target:** `content/microcopy/toasts.md`. Entry `key: session_saved` (or equivalent).

**Before:**
```yaml
- key: session_saved
  value: "Your progress is saved."
```

**After:**
```yaml
- key: session_saved
  value: "Saved. You can come back anytime."
```

Validation: 34 chars — under ideal 60. Voice: quiet, contractional, reassuring. Clean.

### Example 3 — don't do this: add a new key

**User:** "Add a toast for 'email-sent-successfully'."

Not this skill. Use `add-microcopy-entry` (not yet formalised in this batch — escalate).

### Example 4 — don't do this: use a banned word

Tempting: "That email is invalid — try again."

`voice:check` fails on `invalid`. Rewrite: "That email doesn't look quite right — a typo somewhere?"

## When NOT to use this skill

- **Adding a brand-new entry** → `add-microcopy-entry`.
- **Updating voice rules** (adding or removing banned phrases) → `update-voice-rules`.
- **Renaming a `key`** — cascade. Needs a dedicated skill that reruns `src/` references.
- **Editing a provocation or awareness check** → those files live in different folders and have tighter compliance rules.

## Related skills

- `update-voice-rules` — modify banned phrases / voice constraints themselves.
- `edit-provocation-body` — the compliance-gated commercial callouts.
- `edit-awareness-check` — the compliance-gated educational callouts.

## Gotchas

- **`note` fields are author-only.** They don't render. Editing a `note` is fine; it's documentation for whoever owns the string next. `voice:check` does not run against notes.
- **Emails can have mustache tokens** (`{{first_name}}`, `{{firm_name}}`). If editing an `emails.md` value, preserve all tokens exactly — case and braces matter. A stray `{{firstName}}` instead of `{{first_name}}` will render literal braces in the email.
- **The admin app is the preferred path.** Its microcopy editor shows the character budgets live and runs `voice:check` on each entry as you type. Hand-edit for scripted bulk passes only.
- **Tone is register-matched per file.** An error message is 14px grey, a modal title is a serif display-size heading — their voices are different. Match the file you're in, not the platonic "voice".
