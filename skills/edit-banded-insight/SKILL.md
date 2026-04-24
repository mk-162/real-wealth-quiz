<!-- _AUDIT.md entry: 8.1 -->
---
name: edit-banded-insight
description: Rewrite the body of a single `banding_cases[]` entry inside a Real Wealth report insight markdown file under `content/report/insights/`. Use this skill whenever the user asks to rewrite a report insight for a specific band (e.g. the "3-6 months cash" body on the cash-surplus insight), soften a banded message, tighten the prose in one case, update an insight's wording for one input range, or otherwise edit the copy that fires under a specific `when` condition. Triggers on phrasings like "rewrite the cash-surplus insight for the 3–6 months band", "the high-band IHT insight is too strong", or "update the low-essential-spend case".
---

# Edit a banded insight

## What this skill does

Updates the `body` prose on one entry in the `banding_cases[]` list of a report insight file (`content/report/insights/<slug>.md`). Preserves the `when` predicate, every other case in the list, the `fallback` body, and all frontmatter. Keeps any `{{placeholder}}` tokens intact so report rendering continues to work.

## Background — banded insights

Report insights are personalised paragraphs rendered on pages 5–7 of the PDF report. Each insight has:

- Frontmatter — `id`, `section` (one of `cash | expenditure | fin_life_planning | protection | investment | pension | property_mortgage | tax_optimisation | where_you_are | actions`), optional `order`, `compliance_status`.
- `banding_cases[]` — an ordered list of `{ when, body }` objects. First matching `when` wins.
- `fallback` — the body used if no `when` matches. The safety net.

Each `body` string can contain `{{mustache}}` placeholder tokens — `{{snapshot_stat_1_val}}`, `{{net_worth}}`, etc. The template substitutor looks these up in the registry (`admin_app/shared/placeholders.ts`) and replaces them at render time. Unknown tokens → validator fails.

The `when` DSL (e.g. `cash_months_of_essential_spend between 3 and 6`) parses via the report engine. Admin integrity check `report:banding-exhaustiveness` verifies that, for every possible input-band combination, exactly one case matches — or the `fallback` picks it up. Admin integrity check `report:placeholder-known` verifies every token in a body exists in the registry.

## Inputs you need from the user

1. **Which insight file.** Slug or path. If the user named the topic ("cash surplus", "IHT 2m"), glob `content/report/insights/` and find the match.
2. **Which case.** The `when` expression (or a plain-English description of it — "the 3–6 months band", "the very-high-estate case").
3. **The new body prose** or the intent.

## Workflow

1. **Locate the file.** `master_template/content/report/insights/<slug>.md`.

2. **Read the file whole.** Understand which input fields this insight bands on, the full list of cases, and the fallback. A single-case edit still lands in a document of 3–6 cases — neighbours set voice and register.

3. **Identify the target case.** Match the user's plain-English description against the `when` expressions. If ambiguous, list the cases and ask.

4. **Edit only the `body` field on that one case.** The `when` predicate is structural — changing it cascades into coverage (might open or close a band the test suite doesn't expect). Predicate changes live in `edit-banding-cases` (the list-manipulation skill).

5. **Preserve every `{{token}}`.** Read the body before editing; list the tokens. The edit must keep them all (unless the user is deliberately removing one — rare, and grounds for a cross-check against the registry). Adding a new token is allowed if the token exists in `admin_app/shared/placeholders.ts`. Adding an unknown token fails the placeholder-known integrity check.

6. **Character budget.** `report.insight.body` — ideal 200, hard 420.

7. **Voice.** Report-insight register: specific, numerate, grown-up. Uses concrete numbers (tokenised — `{{cash_months}}`, `{{iht_bill}}`). Avoids "should" / "must" / "you need to". Prefers "worth a conversation", "most people in your situation", "the way most families we see handle this is…". Full rules: `content/microcopy/voice-rules.md` + `scripts/banned-phrases.json`.

8. **If this insight is currently approved** (`compliance_status: approved_to_ship`): flag to the user that a body edit is effectively new copy and will likely require re-review. The reviewer may want the status reset to `draft`. Do not reset automatically — surface the question.

9. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   Plus the admin integrity scan (`report:banding-exhaustiveness`, `report:placeholder-known`) — runs in the admin UI when the file's opened. Fix anything it flags.

10. **Summarise.** File path, insight id, case targeted (by its `when`), before → after, tokens used, and any compliance flag raised.

## Files touched

- `master_template/content/report/insights/<slug>.md` — one file, one case body.

## Invariants — never break these

- **Never change `when` in this skill.** That's `edit-banding-cases`. Changing `when` alters the case's coverage and can leave bands uncovered.
- **Never add or remove cases here.** That's `edit-banding-cases` (add/remove).
- **Never touch `fallback`.** That's a separate edit — audit entry 8.3.
- **Preserve all `{{placeholder}}` tokens** or deliberately swap them with user intent + validator confirmation.
- **Never touch `id`, `section`, `order`, or `compliance_status` here.** Compliance advancement has its own skill.
- **Round-trip fidelity.** Use YAML AST editing for the frontmatter-adjacent structure; body lists of `{ when, body }` objects must re-serialise identically.

## Examples

### Example 1 — rewrite the 3–6 months cash body

**User:** "The 3–6 months cash-surplus body reads a bit clinical. Soften it — keep the numbers, lose the 'you should'."

**Target:** `content/report/insights/cash-surplus.md` (hypothetical — check the actual filename). Case: `when: cash_months_of_essential_spend between 3 and 6`.

**Before:**
```yaml
- when: "cash_months_of_essential_spend between 3 and 6"
  body: "You hold {{cash_months}} months of essential spend in cash. You should consider topping this up to 6 months — a common rule of thumb for households like yours."
```

**After:**
```yaml
- when: "cash_months_of_essential_spend between 3 and 6"
  body: "You hold {{cash_months}} months of essential spend in cash. Worth a conversation about whether 6 months is a better fit for a household at your income shape — not a rule, but the range most people in similar situations land on."
```

Tokens preserved: `{{cash_months}}`. Case unchanged. Validation: 232 chars — under ideal-for-edge-of-ideal. Voice check: "should" replaced with "worth a conversation". Clean.

### Example 2 — add a token to an existing case

**User:** "The high-estate IHT case should reference the actual estimated bill — use the {{iht_bill_estimate}} token."

First, verify `{{iht_bill_estimate}}` exists in `admin_app/shared/placeholders.ts`. If yes, edit the body to include it. If no, stop:

> `{{iht_bill_estimate}}` isn't in the placeholder registry. I can't add it to an insight body without first registering it in `admin_app/shared/placeholders.ts` AND wiring a value source in the template substitutor. That's `rename-placeholder-token` territory (Tier 3). Do you want to proceed with a different token, or shall we scope adding this one?

### Example 3 — don't do this: change the `when` predicate

**User:** "Make the 3-6 months case also cover 6-9 months so we don't need a separate entry."

Not this skill. That's `edit-banding-cases` — widening a `when` predicate can leave the 6-9 band uncovered elsewhere, or create an overlap.

### Example 4 — don't do this: edit the fallback

**User:** "Update the fallback body on the cash-surplus insight."

That's audit entry 8.3. Different skill (not in this batch — may be merged into `edit-banded-insight` as a post-hoc scope expansion if the team finds it trivially similar; for now, flag as out of scope).

## When NOT to use this skill

- **Add or remove a banding case** → `edit-banding-cases`.
- **Edit the fallback body** → a separate skill (audit 8.3).
- **Rename a placeholder token** → `rename-placeholder-token` (Tier 3).
- **Change which section the insight belongs to** → the `section` field is structural; a different surface is likely better than editing here.
- **Advance compliance status** → `advance-compliance-status`.

## Related skills

- `edit-banding-cases` — list-level manipulation (add / remove a case).
- `rename-placeholder-token` — Tier 3 cascade across template + registry + every insight.
- `edit-static-report-block` — context / think / tip edits (siblings in the report surface).
- `advance-compliance-status` — workflow advancement.

## Gotchas

- **Tokens render literal if unknown.** An unknown `{{cash_surplus_band}}` in a shipped insight prints as literal `{{cash_surplus_band}}` — the template never substitutes. The admin integrity check catches this before ship, but the CLI validator does not.
- **First-match-wins on `when`.** If you make a body edit that depends on a specific input range (e.g. "3–6 months specifically"), verify the case actually receives that range at runtime — the preceding case might already match.
- **The fallback is the safety net.** If every numeric range is explicitly cased, the fallback might be unreachable. That's fine — keep it in place as a defensive default.
- **Voice drifts across cases.** A single insight with 5 cases might have been written by 3 different people over 6 months. When doing a one-case edit, glance at the other cases and match their register — avoid creating a lone outlier.
