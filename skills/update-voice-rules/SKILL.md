<!-- _AUDIT.md entry: 7.3 -->
---
name: update-voice-rules
description: Add, remove, or update banned phrases and voice rules — the shared list that `voice:check` runs against. Use this skill whenever the user asks to add a word to the banned list, remove a banned phrase, tweak a voice rule, add a new voice guardrail, or otherwise modify the voice/tone constraints. Triggers on phrasings like "add 'game-changer' to the banned list", "remove 'transform' — we decided it's OK in this context", "update the voice rules about contractions", or "ban the word 'journey'".
---

# Update voice rules

## What this skill does

Updates one or both sides of the voice-rules system:

1. **`scripts/banned-phrases.json`** — the machine-checkable list that `npm run voice:check` runs against.
2. **`content/microcopy/voice-rules.md`** — the human-readable rules entries.

Plus: the admin app has a vendored copy at `admin_app/features/shared/voice.ts`. Any change to `banned-phrases.json` must also land there, or the admin's `schema-drift.test.ts` fails.

## Background

Voice is enforced in two layers:

- **Banned phrases** — literal strings in `banned-phrases.json`. `voice:check` flags any content file containing them.
- **Voice rules (prose)** — the `voice-rules.md` microcopy file, which encodes rules like "sentence case" and "prefer active voice" for authors to follow.

The admin mirrors both. Drift between `master_template/` and `admin_app/` triggers a test failure.

## Inputs you need from the user

1. **Which layer.** Banned list? Voice rules prose? Often both.
2. **Operation.** Add / remove / edit.
3. **The phrase or rule.** Verbatim.
4. **Scope exception** (optional). Some banned words are allowed as regulatory terms in specific files — e.g. "guaranteed" in "guaranteed annuity rate". These exceptions live per-phrase in the banned-phrases schema (if supported) or per-file in the voice check's ignore list.

## Workflow

1. **Read the current state.**
   - `master_template/scripts/banned-phrases.json` — the canonical list.
   - `master_template/content/microcopy/voice-rules.md` — the prose rules.
   - `master_template/admin_app/features/shared/voice.ts` — the admin's vendored copy.

2. **For an ADD to banned phrases:**
   - Append to `scripts/banned-phrases.json`.
   - Append the matching entry to `admin_app/features/shared/voice.ts`.
   - Consider whether to add a rule entry in `voice-rules.md` explaining the rationale.

3. **For a REMOVE from banned phrases:**
   - Delete from `scripts/banned-phrases.json`.
   - Delete from `admin_app/features/shared/voice.ts`.
   - Optionally update the rule in `voice-rules.md` if the rule explicitly named the removed phrase.

4. **For a voice-rule prose EDIT:**
   - Update the `entries[].value` in `content/microcopy/voice-rules.md`.
   - Same edit policy as `edit-microcopy`.
   - If the rule names specific banned words, coordinate with `banned-phrases.json`.

5. **Run both checks:**
   ```bash
   cd master_template
   npm run voice:check
   cd ../admin_app
   npm run test     # schema-drift.test.ts verifies parity
   ```

6. **Content sweep.** If you added a phrase to the banned list, `voice:check` will now flag existing content that uses it. Surface those hits — they need rewriting, and that's a follow-up job.

7. **Summarise.** Layers touched, phrases added/removed, parity with admin, any content hits surfaced by the sweep.

## Files touched

- `master_template/scripts/banned-phrases.json`
- `master_template/content/microcopy/voice-rules.md`
- `master_template/admin_app/features/shared/voice.ts` (vendored parity)

## Invariants — never break these

- **Parity between master and admin.** `scripts/banned-phrases.json` and `admin_app/features/shared/voice.ts` must stay in sync. Drift is caught by `admin_app/schema-drift.test.ts`.
- **Never add a banned phrase without grepping content for it.** Existing content may use the phrase. Surface the hits — they need rewriting or per-file exception.
- **Never edit `voice-rules.md` entries' `key` values** — that's a runtime id, same as any microcopy.
- **Voice-rule prose and the banned list should agree.** If the rule says "avoid 'transform'" and the JSON omits 'transform', fix the inconsistency.
- **Round-trip fidelity.** JSON canonical format (2-space indent, trailing newline) for the banned list. YAML AST for the microcopy file.

## Examples

### Example 1 — add 'game-changer' to the banned list

**User:** "Add 'game-changer' to the banned phrases — it's corporate hype."

Edit `scripts/banned-phrases.json`:

```json
[
  "...",
  "game-changer",
  "..."
]
```

Edit `admin_app/features/shared/voice.ts` to match.

Run `voice:check` — surfaces any existing uses. Suppose it flags one instance in `content/pages/homepage.md`. Flag to user: "Found one existing use — `homepage.md` line X. Want to rewrite now or later?"

### Example 2 — remove an over-eager ban

**User:** "Remove 'transform' from banned — compliance says 'transform your retirement' is fine in the closing CTA context."

Delete from both `scripts/banned-phrases.json` and the admin copy.

Consider: should there be a more-specific rule ("avoid 'transform' in screen headlines; acceptable in segment CTAs")? If so, encode as a scoped exception or a rule update in `voice-rules.md`. If not, straight removal is fine.

### Example 3 — update a prose rule

**User:** "The 'max 15 words per interactive element' rule should be 12 words."

Edit `content/microcopy/voice-rules.md` entry `rule_sentence_length`:

Before:
```yaml
- key: rule_sentence_length
  value: "Max 15 words per sentence on any interactive element. 25 words anywhere else unless the content is intentionally narrative."
```

After:
```yaml
- key: rule_sentence_length
  value: "Max 12 words per sentence on any interactive element. 25 words anywhere else unless the content is intentionally narrative."
```

No machine-check change (the 12 isn't enforced by `voice:check` — that's author discipline). Update in the microcopy only.

### Example 4 — don't do this: skip the admin copy

Bad: add to `scripts/banned-phrases.json`, forget `admin_app/features/shared/voice.ts`. Admin test fails on next run; the admin treats the phrase as allowed while the main app treats it as banned. Drift.

Always update both in the same commit.

## When NOT to use this skill

- **Edit a microcopy entry** that isn't in `voice-rules.md` → `edit-microcopy`.
- **Add or remove a voice-rule entry wholesale** → also this skill, but consider whether it's really a new rule or just a rephrasing.

## Related skills

- `edit-microcopy` — general microcopy edits.

## Gotchas

- **`voice:check` uses substring matching.** A banned phrase "transform" flags "transforming", "transformation", etc. If you need case-insensitive or whole-word matching, check the grep flags in `scripts/voice-grep.ts`.
- **Adding a ban has a content tail.** Every existing content file gets re-checked. Budget time to rewrite flagged instances or add per-file exceptions.
- **The admin test is the parity gate.** When you edit `banned-phrases.json`, also run `cd admin_app && npm run test` — it'll fail immediately on drift.
- **Regulatory terms are sometimes allowed.** "Guaranteed annuity rate" is a named product term; the phrase "guaranteed" in that context shouldn't fire. If the project grows a need for scoped exceptions, put them in the voice-grep config, not as file-specific overrides.
