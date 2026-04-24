<!-- _AUDIT.md entry: 4.6 -->
---
name: advance-compliance-status
description: Walk a Real Wealth provocation or awareness check through the draft → cfp_signed → compliance_signed → approved_to_ship workflow, setting the matching signoff date(s). Use this skill ONLY when a human reviewer has confirmed their sign-off and is asking you to record it. Triggers on phrasings like "mark the IHT provocation as CFP-signed", "the compliance team approved the protection-gap callout", "advance this to approved_to_ship", or "record today's sign-off on these awareness checks". This is the gate that lets compliance-controlled content render in production.
---

# Advance compliance status

## What this skill does

Updates the `compliance_status` field and the matching `cfp_signoff_date` / `compliance_signoff_date` fields in a provocation's or awareness check's frontmatter. This is the gate that controls production rendering — a provocation at `draft` does not ship; at `approved_to_ship` it does. **This skill never advances status on behalf of the reviewer** — it only records an advancement the reviewer has authorised.

## Background — the four-stage workflow

```
draft  →  cfp_signed  →  compliance_signed  →  approved_to_ship
```

Advance rules (from `content/schema.ts` + admin integrity checks `provocations:compliance-signoff-date-present` and `provocations:approved-needs-both-signoffs`):

- **`draft` → `cfp_signed`** requires `cfp_signoff_date` be set (ISO date string, e.g. `2026-04-24`).
- **`cfp_signed` → `compliance_signed`** requires `compliance_signoff_date` be set.
- **`compliance_signed` → `approved_to_ship`** requires BOTH signoff dates remain set. (There is no separate "approval" date — approval is the culmination of both prior reviews.)
- Skipping stages is disallowed. Going directly `draft → approved_to_ship` fails the integrity check.

Reset rules (see `edit-provocation-body` skill):

- Any edit to a provocation's or awareness check's body resets `compliance_status` to `draft` and clears both signoff dates. This skill is only about advancing; resets happen automatically from other skills.

## Who owns this decision

- CFP sign-off: the firm's certified financial planner. Their sign-off gates `cfp_signed`.
- Compliance sign-off: the firm's compliance reviewer. Their sign-off gates `compliance_signed`.
- Approved-to-ship: the content lead, confirming both reviews are in hand.

**The authoring agent is never the author of sign-off.** This skill's contract is to record a decision the reviewer has already made, not to make it.

## Human confirm gate — always required

Before advancing `compliance_status` on any file:

1. **Name the file and current status.** "`content/provocations/iht-2m-cliff.md` is currently `draft`."
2. **Name the proposed target** and the signoff date(s) being recorded. "Advancing to `cfp_signed` with `cfp_signoff_date: 2026-04-24`."
3. **Name the human authorising.** "Matt, confirming you've had CFP sign-off for this — ready to record it?"
4. **Wait for an explicit "yes" / "proceed" / equivalent.** No inferred consent. If the user's phrasing is ambiguous ("can you mark these as done"), ask who signed off, on what date, at which stage.
5. Only after explicit confirmation, proceed with the edit.

## Inputs you need from the user

1. **Which file(s).** One or more paths — `content/provocations/<slug>.md` or `content/awareness-checks/<slug>.md`. Batch advancement is allowed but each file still requires explicit confirmation of who signed off.
2. **Target status.** `cfp_signed`, `compliance_signed`, or `approved_to_ship`.
3. **Signoff date.** ISO YYYY-MM-DD. If the user says "today", use the session's current date (Today is 2026-04-24 at time of writing).
4. **Who signed off.** Noted for the commit message / summary — not written into the file, but captured for auditability.

## Workflow

1. **Human confirm gate (above).** Do not proceed without explicit confirmation.

2. **Locate the file.** `master_template/content/provocations/` or `master_template/content/awareness-checks/`.

3. **Read current status.** Check `compliance_status`, `cfp_signoff_date`, `compliance_signoff_date`. If the advancement would skip a stage (e.g. current `draft`, target `approved_to_ship`), stop and explain — the workflow requires stage-by-stage advancement.

4. **Determine the required fields for the target stage:**

   | Target | Must be set |
   |---|---|
   | `cfp_signed` | `cfp_signoff_date` |
   | `compliance_signed` | both `cfp_signoff_date` (from the prior step) and `compliance_signoff_date` |
   | `approved_to_ship` | both dates must remain set |

5. **Edit the frontmatter.** Only these fields: `compliance_status`, `cfp_signoff_date`, `compliance_signoff_date`. Preserve every other field. Dates as plain YAML strings — `"2026-04-24"`.

6. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   `content:check` runs schema validation. The admin's integrity checks (`provocations:compliance-signoff-date-present`, `provocations:approved-needs-both-signoffs`) catch missing dates; they run in the admin UI but the CLI won't fail a standalone file-write — so visually verify after save that both dates are present when the target requires them.

7. **Summarise.** For each file: path, id, status before → after, dates set, and the human who authorised. This becomes the commit message. Example:

   > `content/provocations/iht-2m-cliff.md` — `draft` → `cfp_signed`. Recorded `cfp_signoff_date: 2026-04-24`. CFP sign-off authorised by Matt.

## Files touched

- `master_template/content/provocations/<slug>.md` — frontmatter only.
- OR `master_template/content/awareness-checks/<slug>.md` — frontmatter only.

## Invariants — never break these

- **The authoring agent is never the author of sign-off.** Advance only when the reviewer has explicitly confirmed. Inferred consent is not acceptable for regulatory copy.
- **Skipping stages is forbidden.** `draft → cfp_signed → compliance_signed → approved_to_ship`, one at a time. Never jump.
- **Dates must be present when required.** Advancing to `cfp_signed` without `cfp_signoff_date` or to `compliance_signed` without both dates silently breaks the production rendering gate — some callers check the dates, some check the status, and inconsistency creates ghost-approved content.
- **Never backdate.** If the user gives a date earlier than the file's previous mtime or obviously wrong, ask.
- **Never batch-advance without individual confirmation.** "Advance all these" is not blanket consent — confirm each advancement on each file.
- **Never advance as a side-effect of another edit.** Body edits reset status; they do not advance it.
- **Round-trip fidelity.** Use YAML AST editing.

## Examples

### Example 1 — CFP sign-off recorded on a draft provocation

**User:** "The CFP reviewed and signed off on the IHT 2m cliff provocation today. Mark it cfp_signed."

**Confirm step:**

> I'll advance `content/provocations/iht-2m-cliff.md` from `draft` to `cfp_signed` and record `cfp_signoff_date: 2026-04-24`. You're confirming the CFP has formally signed off — is that right?

User: "Yes."

**Edit (frontmatter only):**
```yaml
# Before
compliance_status: draft
cfp_signoff_date: null
compliance_signoff_date: null

# After
compliance_status: cfp_signed
cfp_signoff_date: "2026-04-24"
compliance_signoff_date: null
```

### Example 2 — advancing to approved_to_ship

**User:** "Compliance has the last sign-off on protection-gap. Move it to approved_to_ship."

**Check:** file's current state. If `compliance_status: compliance_signed` and both dates are set → legal to advance. If still at `cfp_signed` → the user might mean "advance through two stages"; clarify:

> `protection-gap.md` is currently `cfp_signed` with `cfp_signoff_date: 2026-04-21`. To advance to `approved_to_ship` I first need to record `compliance_signed` with today's `compliance_signoff_date`, then `approved_to_ship`. Want me to do both stages in one pass, confirming each?

If yes, do both edits, same commit.

### Example 3 — batch advance

**User:** "The compliance review hit three files today — retired-short, money-stress, and close-to-line. All approved. Record compliance_signed on each."

Confirm each one-by-one:

> 1. `content/provocations/retired-short.md` — current status `cfp_signed`. Advance to `compliance_signed`, record `compliance_signoff_date: 2026-04-24`? Confirm.
> 2. Same for `money-stress.md`.
> 3. Same for `close-to-line.md`.

Each one gets its own yes before the edit.

### Example 4 — don't do this: inferred consent

**User:** "These are done."

Do not advance. Ask:

> "Done" could mean drafted, reviewed, or shipped. Which stage are you confirming they've reached — `cfp_signed`, `compliance_signed`, or `approved_to_ship`? And which files specifically?

### Example 5 — don't do this: skip a stage

**User:** "Mark all of them as approved_to_ship — save us a round-trip."

Do not skip. Respond:

> The workflow requires stage-by-stage advancement. I can advance each file to `cfp_signed` if CFP has signed off, then to `compliance_signed` if Compliance has signed off, then to `approved_to_ship` once both are in hand. Want me to walk through each file confirming the sign-off chain?

## When NOT to use this skill

- **A body edit on an approved provocation** — that *resets* status; see `edit-provocation-body`.
- **A new provocation or awareness check** — it starts at `draft`; see `add-provocation` / `add-awareness-check`.
- **Deprecating a shipped provocation** — don't delete; mark back to `draft` and add a deprecation note (see `_AUDIT.md` §4.5).

## Related skills

- `edit-provocation-body` — the body-edit skill (resets status as a side effect).
- `edit-awareness-check` — the awareness-check analogue.
- `add-provocation` / `add-awareness-check` — new file starts at draft.
- `10.4 compliance ledger update` (bulk) — same pattern, many files in one pass; use this skill per-file inside it.

## Gotchas

- **The admin app is the recommended path.** The admin's compliance lane UI makes stage-by-stage advancement obvious and keeps an audit trail. Direct file edits bypass that trail. When direct-editing, put the authoriser's name in the commit message.
- **Date format is string, not native YAML date.** Quote the date: `"2026-04-24"`, not `2026-04-24`. Some YAML parsers coerce unquoted dates to native date objects, which then round-trip differently — the admin's fidelity test will fail.
- **`null` vs absent.** The fields default to `null` in the schema; they should be the literal `null` (or `~`) in YAML when unset, not omitted. Don't delete the fields — the admin integrity check expects them to be present-but-null.
- **Every advancement should land in git with a clear message.** "Record CFP sign-off on iht-2m-cliff (Matt, 2026-04-24)" is the pattern. Squashed into "update content" is not enough for a regulated audit.
