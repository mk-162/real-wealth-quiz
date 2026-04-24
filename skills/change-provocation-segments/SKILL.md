<!-- _AUDIT.md entry: 4.3 -->
---
name: change-provocation-segments
description: Expand or contract the `segments` array in a Real Wealth provocation's frontmatter. Use this skill whenever the user asks to add or remove a segment from a provocation's audience — "also fire this for S7", "drop S4 from the IHT cliff", or "this should target all segments". Triggers on phrasings referencing segments by id (S4, S6) or by name ("also fire this for pre-retirees", "restrict to HNW").
---

# Change a provocation's segments list

## What this skill does

Updates the `segments: [...]` array in a provocation's frontmatter. Preserves body, trigger, compliance fields, and every other field.

## Background

The `segments` field names which of the 9 segments (S1–S9) the provocation is meant for. Valid values: `S1`–`S9` or the literal `all`. The summary resolver intersects this list with the current user's segment before rendering — so a provocation with `segments: [S4, S6]` only fires for S4 or S6 users, even if the trigger would otherwise match.

Example from `content/provocations/iht-2m-cliff.md`:
```yaml
segments: [S4, S6, S7, S9]
```

## Inputs you need from the user

1. **Which provocation.** Path / slug / topic.
2. **The new segments.** A list (or "all"). Accept:
   - Explicit ids: `[S4, S6, S7, S9]`.
   - Plain names: "pre-retirees and retired" → `[S7, S8]`.
   - "Everyone" → `[all]`.
   - Incremental: "also add S7" → append S7 to current list.

## Workflow

1. **Locate the file.** Read current `segments` and `compliance_status`.

2. **If `approved_to_ship`, flag but don't auto-reset.** Segments list changes are audience changes — worth surfacing to the reviewer. Not a body edit; no automatic status reset.

3. **Compute the new list.** From user intent + current state. De-duplicate.

4. **Validate values.** Each entry must be `S1`–`S9` or `all`. If `all` is present, the other entries are redundant (but tolerated).

5. **Edit the frontmatter.** Preserve YAML list style — inline flow (`[S4, S6]`) vs block (one per line) — match siblings in the file.

6. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   ```

7. **Consider the trigger side.** If the new segments list includes a segment whose users will never match the trigger, the inclusion is dead — flag to the user.

8. **Summarise.** File, before → after segments, compliance implications (if any).

## Files touched

- `master_template/content/provocations/<slug>.md` — frontmatter `segments` only.

## Invariants — never break these

- **Values must be `S1`–`S9` or `all`.** No other tokens.
- **Empty list means it never fires.** `segments: []` is legal but almost always wrong — confirm.
- **Never touch body, trigger, or compliance.** Separate skills.
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — widen to include pre-retirees

**User:** "The IHT 2m cliff should also fire for S7 pre-retirees."

**Target:** `content/provocations/iht-2m-cliff.md`.

Before: `segments: [S4, S6, S7, S9]`

Wait — S7 already in. Ask for clarification. Maybe the user means S8 (retired) or S3 (high earner). Confirm before changing anything.

If the real intent is add S3:

After: `segments: [S3, S4, S6, S7, S9]`

### Example 2 — restrict to HNW only

**User:** "Limit the pension-pots-tease to S9."

Before: `segments: [all]`
After: `segments: [S9]`

Validation clean.

### Example 3 — don't do this: use lowercase

User says: `s4, s6`. Fix to uppercase — YAML preserves case, and the schema enum is `S1`–`S9`.

## When NOT to use this skill

- **Change when it fires** → `change-provocation-trigger`.
- **Change the copy** → `edit-provocation-body`.
- **Advance compliance** → `advance-compliance-status`.

## Related skills

- `change-provocation-trigger`, `edit-provocation-body`, `advance-compliance-status`.

## Gotchas

- **`[all]` short-circuits the intersection.** When `all` is listed, every segment matches. Don't mix `all` with specific ids unless you deliberately want belt + braces (harmless but confusing).
- **The summary resolver intersects, not AND.** A provocation with `segments: [S4]` and trigger match fires for S4 users. It doesn't require both to each be true of the user — the segment is the user's, the trigger is evaluated against their answers.
- **Changes here don't reset compliance automatically.** Body edits do; segment edits don't. That's a policy decision, not a bug — but surface to the reviewer if the provocation was approved.
