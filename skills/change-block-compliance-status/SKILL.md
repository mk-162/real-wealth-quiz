<!-- _AUDIT.md entry: 8.6 -->
---
name: change-block-compliance-status
description: Advance the `compliance_status` field on a Real Wealth report block (any file under `content/report/`) through the workflow ladder draft → cfp_signed → compliance_signed → approved_to_ship. Use this skill whenever the user asks to mark a tile as CFP-signed, advance the methodology to compliance-signed, ship a takeaway banner to production, flip an expanded awareness check to approved_to_ship, or otherwise change the compliance state of a single report block. Triggers on phrasings like "mark the LPA expanded copy as CFP-signed", "the methodology is approved", "this tile is ready to ship", or just "advance the compliance status on …".
---

# Change a report block's compliance status

## What this skill does

Updates the `compliance_status` frontmatter field on a single `content/report/<file>.md` block, walking it through the four-state ladder. Preserves the rest of frontmatter and the entire body. Surfaces the human-confirmation gate every time — compliance advancement is never automatic.

## Background — the four states

| Status              | Where it renders            | Who owns the gate |
|---------------------|----------------------------|-------------------|
| `draft`             | Dev only                    | The author        |
| `cfp_signed`        | Staging                     | The CFP reviewer  |
| `compliance_signed` | Staging + production (with "Pending final approval" note in some surfaces) | The Compliance officer |
| `approved_to_ship`  | Production, freely          | Compliance officer (final gate) |

The renderer's compliance gate (`canPublishInProduction` in `src/lib/content/compliance.ts`) only emits content at the matching status level. A draft block in the public tool's production build is suppressed — the fixture baseline takes over.

## Inputs you need from the user

1. **Which file.** Path or topic.
2. **Target status.** One of the four. Reject lateral moves (draft → compliance_signed without cfp_signed is not allowed in normal use); ask for confirmation if requested.
3. **Sign-off attribution.** Who signed off — name + date. Captured in the commit message, not in the file (frontmatter has no signoff_date field for report blocks in the canonical shape).

## Workflow

1. **Locate the file.** Glob `content/report/` for the matching block.

2. **Read it whole.** Confirm the body is in a state worth shipping — no `_TODO:_` markers, no obvious placeholders. If you find any, surface them and pause.

3. **Confirm the gate explicitly.**
   > Advancing `<id>` from `<current>` to `<next>`. This will:
   > - <effects on rendering surfaces>
   > - require any subsequent body edit to reset the status to `draft` (you'll need to come back here once the change lands).
   >
   > Confirm to proceed?

   Wait for explicit "yes" / "proceed". Never advance on inferred consent.

4. **Make the edit.** Change exactly the `compliance_status:` line in the frontmatter. Nothing else.

5. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   ```

6. **Optional: render check.** If advancing to `approved_to_ship`, run `NODE_ENV=production npm run build` — the loader's `requireApproved=true` gate will throw if anything's mis-wired.

7. **Summarise.** File path, id, before → after status. Note who signed off and when (for the commit message).

## Files touched

- `master_template/content/report/<path>.md` — one file, one frontmatter field.

## Invariants — never break these

- **Human confirm gate is mandatory.** Compliance advancement is the moment unreviewed copy becomes production-ready. Never skip the confirm.
- **No lateral skips by default.** Ladder is `draft → cfp_signed → compliance_signed → approved_to_ship`. Skipping a rung needs explicit human override.
- **Body edits reset to draft.** If the user is also asking for a body edit, do that first (with the relevant `edit-report-block-*` skill) and reset to `draft`. Only after the edit is reviewed does the ladder restart.
- **Never edit the body here.** This is a status-only skill.
- **Round-trip fidelity.** Use the admin's save path or `parseMd` / `serializeMd`.

## Examples

### Example 1 — advance an expanded awareness check to CFP-signed

**User:** "The LPA expanded copy is CFP-signed by Jane on 2026-04-25."

**Target:** `content/report/awareness-checks-expanded/lpa.md`.

Confirm:
> Advancing `report.expanded.lpa` from `draft` to `cfp_signed`. This makes the LPA expanded page render in staging previews. Body edits after this point reset to `draft`.
>
> Sign-off: Jane, 2026-04-25.
>
> Confirm to proceed?

On "yes", flip the field. Validate. Note the sign-off in the commit message.

### Example 2 — ship the methodology to production

**User:** "Methodology is fully signed — approved_to_ship."

Pre-flight:
- Confirm the body has zero `_TODO_` markers.
- Confirm the regulatory disclosures section hasn't drifted from the last reviewed version.
- Confirm both CFP and Compliance have signed (regulatory copy needs both gates; ask for both names if not given).

Confirm gate:
> Advancing `report.methodology` from `compliance_signed` to `approved_to_ship`. This makes the methodology page render in production — every reader sees this copy at the end of their PDF.
>
> Bypassing CFP review on a body change after this point requires explicit Compliance re-sign-off.
>
> Confirm to proceed?

### Example 3 — don't do this: silent batch advance

**User:** "Mark all tiles as CFP-signed."

Refuse the bulk form. Each tile's body needs a CFP signature against it. Walk through them one by one, surfacing the per-block confirm. If the user pushes back ("they all got signed in the same review session, just do them all"), still surface a one-shot confirmation that names every block being advanced and the signing CFP — and only on explicit "yes" do them in sequence.

### Example 4 — don't do this: advance during a body edit

**User:** "Rewrite the S2 tile note and ship it."

Two operations. Don't do both in this skill:
1. Use `edit-report-block-segment` to rewrite the body (status will reset to `draft` if the file was already approved).
2. Then come back to this skill to advance the status — but only after CFP / Compliance review has happened.

The whole point of the gate is that someone with sign-off authority has reviewed the new copy. Auto-advancing right after an edit defeats the gate.

## When NOT to use this skill

- **Edit body prose** → `edit-report-block-segment` / `edit-report-block-global`.
- **Create a new block** → `add-report-block`.
- **Advance compliance on screens, segments, provocations, or awareness checks** — they have their own skill: `advance-compliance-status` (the original, narrower skill that predates the canonical block shape).

## Related skills

- `advance-compliance-status` — sibling for screens / segments / provocations / awareness checks (different frontmatter shape — has `cfp_signoff_date` and `compliance_signoff_date` fields).
- `edit-report-block-segment` — body edit.
- `edit-report-block-global` — body edit.

## Gotchas

- **The canonical report block has NO `cfp_signoff_date` / `compliance_signoff_date`.** Only the older content types (provocations, awareness checks) carry sign-off dates in frontmatter. For report blocks, the sign-off attribution lives in the git commit message — capture it there.
- **`approved_to_ship` is the production gate.** A block at `compliance_signed` may render in production with a "Pending final approval" annotation depending on the surface — confirm with the renderer before assuming staging-only.
- **Production builds enforce.** `master_template/src/app/report/master/[segment]/page.tsx` sets `requireApproved = process.env.NODE_ENV === 'production'`. A draft block in production throws at SSG time, failing the build loudly. That's intentional — ships of unreviewed copy are caught at build, not at runtime.
- **Reviewer in the loop.** The skill never advances on the agent's behalf. The user must paste the reviewer's confirmation (or be the reviewer themselves) before the flip happens.
