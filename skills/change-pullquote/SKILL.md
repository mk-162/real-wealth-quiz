<!-- _AUDIT.md entry: 1.6 -->
---
name: change-pullquote
description: Add, edit, suppress, or remove the per-screen pullquote override on a Real Wealth questionnaire screen. Use this skill whenever the user asks to change the left-column quote on a specific screen, override the section default quote, silence the inherited quote on one question, write a new pullquote, or ask a screen to "just show nothing" in the quote slot. Tri-state: absent → inherits the section default; present-but-empty → suppresses the default; present-with-text → overrides. Triggers on phrasings like "add a pullquote to 3.4", "suppress the inherited quote on the working-life screen", "override the pullquote for Q4.A.3", or "the quote on this screen is wrong".
---

# Change a pullquote

## What this skill does

Manages the optional `# Pullquote` body section on a screen's markdown file, using the tri-state contract documented in `Lead Magnet App/ADMIN_APP_UPDATE_pullquote-per-screen.md`. Preserves every other section, the frontmatter, and YAML key order.

## Background — the tri-state contract

Pullquotes default per-section via `src/lib/sections/sections.ts`. Each screen can override that default using a `# Pullquote` body section. The renderer's priority chain:

1. **Section absent from file** → inherits the section default.
2. **Section present but empty** → suppresses the default on this screen only (nothing shown).
3. **Section present with text** → renders that text instead of the section default.

The difference between (1) "never written" and (2) "written but empty" is what powers suppression without a magic word. Both look like "no quote" to the renderer of a section-less page, but (2) overrides the section default while (1) does not.

Full contract: `Lead Magnet App/ADMIN_APP_UPDATE_pullquote-per-screen.md`.

Schema binding: `content/schema.ts` — `screenSchema.pullquote: z.string().optional()`.

## Inputs you need from the user

1. **Which screen.** File path (`content/screens/3.4-working-life.md`), screen_number (`3.4`), or concept. Glob on the number if needed.
2. **Which operation.**
   - "Add" / "override" / "use this quote instead" → write a non-empty section.
   - "Suppress" / "silence" / "hide the inherited quote" / "show nothing" → write an empty section.
   - "Restore" / "use the section default" / "remove the override" → delete the section entirely.
3. **The new text** (for override only). Verbatim or described.

## Workflow

1. **Locate the file.** `master_template/content/screens/`.

2. **Read the existing state.** One of three:
   - No `# Pullquote` section → currently inheriting.
   - `# Pullquote` section with text → currently overriding.
   - `# Pullquote` section with nothing after the header → currently suppressing.

3. **Decide the target state** from the user's intent, matching it against the tri-state table:

   | Intent | Target state | File action |
   |---|---|---|
   | Add a custom quote | section present with text | insert `# Pullquote\n<text>\n` |
   | Change the custom quote | section present with text | update the text under the existing header |
   | Silence the inherited quote | section present, empty | insert `# Pullquote\n\n` (header + blank line) |
   | Return to section default | section absent | delete the `# Pullquote` section |

4. **Edit the body.** Body sections are delimited by `# <Title>` headings. Work section-by-section, not by line offset — other sections may reorder on save.

5. **Character budget.** `screen.pullquote` — ideal 100, hard 160. The quote is short by design; one sentence is the norm.

6. **Voice.** Quiet, plain, in the respondent's voice. Real Wealth pullquotes often echo a client observation — not marketing copy. Banned phrases in `scripts/banned-phrases.json`: "unlock", "transform", "empower", "maximise", etc. No exclamation marks.

7. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   `content:check` verifies `pullquote` is a string when present. `voice:check` catches banned phrases.

8. **Summarise.** Report: which screen, which operation (add / edit / suppress / remove override), before → after state, and whether the new text is within budget.

## Files touched

- `master_template/content/screens/<section>.<n>-<slug>.md` — one file, one body section.

## Invariants — never break these

- **Tri-state fidelity.** Treat "section absent" and "section present but empty" as distinct. Never normalise one to the other silently — the renderer behaviour differs.
- **Never touch frontmatter.** This skill is body-only. Frontmatter changes belong to the field-specific skills.
- **Never merge the pullquote into another section.** It's a separate top-level body section.
- **Never change `id` or `screen_number`.** Immutable ids principle.
- **Round-trip fidelity.** Use gray-matter-aware editing. A naive "find `# Pullquote` line and delete it" can leave trailing blank lines or eat an adjacent section's heading. The safe pattern: parse body, manipulate sections, re-emit.

## Examples

### Example 1 — suppress an inherited quote

**User:** "Suppress the pullquote on 3.4 — the section default is about people but the screen asks about work."

**Target:** `content/screens/3.4-working-life.md`.

**Before (body):**
```markdown
# Headline
What does working life look like right now?

# Sub
A sense of the picture today — hours, energy, pace.
```

**After:**
```markdown
# Headline
What does working life look like right now?

# Sub
A sense of the picture today — hours, energy, pace.

# Pullquote
```

(Note the empty `# Pullquote` section — header with no text. This suppresses the section default.)

Validation: `content:check` clean; empty string is a valid `z.string().optional()` value.

### Example 2 — add a custom override

**User:** "Add a pullquote to the happy-place screen: 'A plan lives inside a life, not the other way around.'"

**Target:** `content/screens/4.A.5-happy-place.md`.

**Before:** no `# Pullquote` section.

**After:**
```markdown
# Pullquote
A plan lives inside a life, not the other way around.
```

Validation: 54 chars — under ideal 100. `voice:check` clean.

### Example 3 — remove an override to restore the section default

**User:** "The custom pullquote I added to 4.A.3 last week — let's drop it and go back to the section default."

**Target:** `content/screens/4.A.3-assets-at-a-glance.md`.

**Before:**
```markdown
# Pullquote
Your numbers are private. The shape of them is what we work with.
```

**After:** section entirely removed.

Validation: `content:check` clean. The renderer now falls back to `sections.ts`.

### Example 4 — don't do this: editing the section default

**User:** "Change the pullquote that shows on all the money-today questions."

Not this skill. That's the section-level default in `src/lib/sections/sections.ts` — a code change. Stop and say so.

## When NOT to use this skill

- **Change the section-wide default pullquote** → `src/lib/sections/sections.ts` edit (code change, not content).
- **Change the screen's headline or sub** → `change-question-wording`.
- **Change any other body section on the screen** — this skill is pullquote-only.
- **The admin app is already editing it.** The admin's screen editor has a dedicated Pullquote field that handles tri-state correctly; hand-edit only when bulk-scripting.

## Related skills

- `change-question-wording` — headline / sub / body edits.
- `change-answer-option` — per-option tweaks.

## Gotchas

- **Suppression looks like a no-op in `git diff`.** An empty `# Pullquote` section is 13 chars. If you're reviewing a PR and the only change is "added a blank pullquote section" — that's doing real work: it silences the inherited quote.
- **Body parsers differ.** The admin and the content-build script both parse `# Title`-delimited sections, but a heading with no content under it must still be emitted. If you hand-roll the save, check the re-parse round-trips.
- **The screen `3.4-working-life.md` is the canonical example.** It was the first screen to ship with the empty-pullquote-suppresses pattern. When in doubt, compare against it.
