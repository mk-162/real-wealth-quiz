---
name: change-question-wording
description: Rewrite the headline, sub-copy, or body of an existing questionnaire screen in the Real Wealth Wealth Conversation. Use this skill whenever the user asks to soften a question, reword a prompt, change the framing, adjust the supporting text beneath a headline, tweak a screen's body, or otherwise modify the WORDING of an existing question without changing its structure, its answer options, or which segments see it. Triggers even when the user just names the screen ("Q1.1") or the concept ("the question about what brought them here") — treat any ambiguous-rewording request about a specific screen as this skill's job.
---

# Change question wording

## What this skill does

Updates one or more of the `# Headline`, `# Sub`, or `# Body` sections in a single questionnaire screen's markdown file. Preserves every piece of structure (frontmatter, inputs, options, conditional reveals). Runs the voice check and the content validator before handing back.

## Inputs you need from the user

1. **Which screen.** Either the file path (`content/screens/3.1-what-brought-you.md`), the screen_number (`3.1`), the `id` (`screen.3.1.intent`), or a clear description of the concept. Ask if ambiguous.
2. **Which section.** `Headline`, `Sub`, or `Body`. If the user didn't specify, look at the current text and what they want and make an educated guess — usually headline for one-liner changes, sub for 1-2 sentence adjustments, body for longer rewrites.
3. **The new text.** Either verbatim, or a description of the intent ("soften it", "make it punchier", "lead with curiosity not achievement").

## Workflow

1. **Locate the file.** Screens live under `master_template/content/screens/`. Filename pattern: `<section>.<n>-<slug>.md`. If the user gave a screen_number like `3.1`, glob for `3.1-*.md`.

2. **Read it whole.** Understand the current wording, the question's purpose (`logged_as`, `q_refs`), and the surrounding context. Don't rewrite in a vacuum.

3. **Edit the named section.** Edit ONLY the body prose under `# Headline`, `# Sub`, or `# Body`. Never touch frontmatter for a wording change.

4. **Respect the character budgets.** Soft limits live in `admin_app/shared/character-budgets.ts`:
   - `screen.headline` — ideal 50, hard 80
   - `screen.sub` — ideal 120, hard 180
   - `screen.pullquote` (separate skill) — ideal 100, hard 160
   Over-budget writes still save, but the integrity tray flashes a warning. If your proposed text is over hard, either trim it or flag to the user.

5. **Voice.** Real Wealth's voice is quiet, plain, grown-up. Avoid: "unlock", "supercharge", "transform your", "revolutionary", "proven", "guaranteed" (unless a precise regulatory term), "secret", "amazing", "empowers you", "maximises", exclamation marks, second-person imperatives that come across as commands. The full list lives in `scripts/banned-phrases.json`.

6. **Save.** Write the file back. Preserve line endings, trailing newlines, and YAML key order — use `gray-matter` + `yaml` AST mode if you're writing a script, not a naive string replace.

7. **Validate.** From `master_template/`:
   ```bash
   npm run content:check    # Zod shape + body-section integrity
   npm run voice:check      # banned phrases
   ```
   Both must pass. If `voice:check` flags a phrase, either rewrite or confirm with the user it's an acceptable exception (e.g. "guaranteed annuity rate" is a technical term allowed in specific contexts).

8. **Confirm.** Summarise the change: file path, section, before → after. Don't commit — the user does that.

## Files touched

- `master_template/content/screens/<section>.<n>-<slug>.md` (one file, one section)

## Invariants — never break these

- **Never change `id`.** The runtime finds the screen by `id`. Renaming breaks every matrix row, every `q_refs` in other files, and every code reference. If the user genuinely wants to rename, use the separate `rename-question-id` skill.
- **Never change `screen_number`.** Same reasoning — drives ordering and some references.
- **Never change `q_refs`, `segments_served`, `tier_limit`, `logged_as`, `layout`, `section`, `grouped`, or `gate_critical`.** Those are structural. Separate skills cover each.
- **Never touch the `inputs:` block** when only the wording is changing. Input changes belong to `change-answer-option`, `add-answer-option`, `remove-answer-option`.
- **Never alter the `# Pullquote` section** — that's handled by `change-pullquote`.
- **Never add new body sections** — if you think the screen needs a new section, say so and stop.

## Round-trip fidelity

If using the admin app's save path, round-trip is handled (the admin's test suite proves body-only edits are byte-identical on re-save). If writing a script directly, verify:

```bash
# After edit, no-op re-parse should produce identical bytes
node -e "const gm=require('gray-matter'); const fs=require('fs'); const p='<file>'; const raw=fs.readFileSync(p,'utf8'); fs.writeFileSync(p, gm.stringify(gm(raw).content, gm(raw).data));"
# Then: git diff <file> — only your wording change should appear
```

## Examples

### Example 1 — soften the tone

**User:** "Soften the headline on Q1.1 — it feels too direct."

**Target file:** `content/screens/3.1-what-brought-you.md`.

**Before:**
```markdown
# Headline
What brought you here today?
```

**After:**
```markdown
# Headline
What's on your mind today?
```

Validation: `screen.headline` counter 27 chars — well under ideal 50. `voice:check` clean.

### Example 2 — lengthen the sub-copy

**User:** "The sub on the happy-place screen needs more reassurance — make it clearer there's no wrong answer."

**Target file:** `content/screens/4.A.5-happy-place.md`.

**Before:**
```markdown
# Sub
Free-form — whatever comes to mind.
```

**After:**
```markdown
# Sub
Free-form. There's no wrong answer — a sentence is plenty, and you can come back to it later if you want.
```

Validation: `screen.sub` 103 chars — under ideal 120. `voice:check` clean.

### Example 3 — rewording that tempts you to change structure (DON'T)

**User:** "Change Q3.1 so it asks about household income as a range, not a single number."

This is NOT a wording change — it's an input-control change (single number → band selector). Stop and say so. The correct skill is `change-input-control` or `add-answer-option` + `remove-answer-option` depending on the target shape.

## When NOT to use this skill

- The user wants to change `id`, `screen_number`, or any frontmatter field → use the specific skill for that field.
- The user wants to add, remove, or rename an answer option → use `add-answer-option` / `remove-answer-option` / `change-answer-option`.
- The user wants to change who sees the screen → `change-matrix-cell`.
- The user wants to add a new screen entirely → `add-question-screen`.
- The user wants to reword the pullquote — a separate body section with tri-state semantics → `change-pullquote`.

## Related skills

- `change-pullquote` — per-screen quote override.
- `change-answer-option` — tweak an option's label or value.
- `change-matrix-cell` — adjust which segments see this screen.
- `rename-question-id` — if you really do need to rename (high-risk, cascades everywhere).

## Gotchas

- **The admin app already does this well.** If the user is in the admin app, point them at the Questions editor → pick the screen → edit the Headline or Sub field → Save. This skill is for bulk / scripted edits.
- **`# Body` is only used on `layout: transition | intro` screens.** On `asymmetric` / `centred` layouts, leave `# Body` alone — it's usually absent.
- **Don't assume the file exists.** If the glob returns nothing, ask the user for clarification — never invent a filename.
- **Screens with `layout: transition` often have no `# Sub`.** Skip it; don't add one.
