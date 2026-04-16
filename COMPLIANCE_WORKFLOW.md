# Compliance review workflow

How provocations and awareness checks move from `draft` to `approved_to_ship`.

---

## 1. Principle

Every provocation and awareness check in `content/` carries a `compliance_status` field in its YAML frontmatter. Nothing renders to end-users in production unless that status reads `approved_to_ship`. The runtime enforces this; reviewers enforce the status changes.

## 2. The four states

- **`draft`** — authored, awaiting review. Shows in dev only, with a visible `DRAFT` tag on the card. Never reaches staging or production.
- **`cfp_signed`** — the Chartered Financial Planner has read the entry and approved the facts, citations, and client-appropriate framing. Shows in staging previews only so the content team can proofread in context; still suppressed in production.
- **`compliance_signed`** — the Compliance Officer has approved the entry against FCA rules (fair, clear, not misleading; no advice framed as regulated activity; Consumer Duty-aligned). Shows in staging and production, but production renders with a small `Pending final approval` note so the team can tell it hasn't had a final pass.
- **`approved_to_ship`** — both reviewers signed off and the author has promoted the status as part of the merge. Renders in production cleanly, no tag.

## 3. The review workflow — as a GitHub PR flow

1. **Content author** writes or edits a markdown file in `content/provocations/` or `content/awareness-checks/`. Sets `compliance_status: draft`. Opens a PR tagged `content-review`.
2. **CFP review** — the Chartered Financial Planner pulls the branch, reads the file, and either:
   - **Approves** — edits the frontmatter to `cfp_signed`, fills `cfp_signoff_date: YYYY-MM-DD`, commits on the same branch.
   - **Requests changes** — adds inline review comments on the PR. Author revises and the file loops back to step 1.
3. **Compliance review** — the Compliance Officer reviews the file once it's `cfp_signed`. Either:
   - **Approves** — edits the status to `compliance_signed`, fills `compliance_signoff_date: YYYY-MM-DD`, commits.
   - **Requests changes** — adds inline comments. Author revises; because the content itself has changed, the status drops back to `draft` and both reviews start again.
4. **Final approval** — when both signoff dates are filled and no further changes have landed, the author (or whoever merges) bumps the status to `approved_to_ship` in the same commit that merges the PR. This is deliberate: the promotion and the merge are inseparable so the audit trail is one commit.
5. **Merge** — the merge triggers `content:build` in CI, Zod validation confirms the `compliance_status` enum is valid and the signoff dates parse, and the app picks up the new content on next deploy.

## 4. When to re-review

A file's `compliance_status` MUST drop back to `draft` whenever:

- The `headline` or `body` changes.
- A new fact, citation, or source is added (including replacing one source with another).
- The `trigger` expression changes in a way that broadens who sees it — e.g. loosening a segment filter, removing a "gate answered yes" clause, or adding a new qualifying answer.

Pure clarifying edits (fixing a typo, nudging a comma, tidying markdown formatting that does not change the rendered copy) can keep the existing status. That call sits with the author; when in doubt, drop to `draft` and re-walk the review.

## 5. Version field

Each file has a `version: "0.1.0"` semver. Bump when:

- **Minor** — wording edits, footnote refinements, source swaps that don't change the factual claim.
- **Major** — the trigger condition changes fundamentally, or the claim itself changes (not just how it's worded).

The version is the easiest field to scan when auditing a file's history at a glance.

## 6. Source refs

Every factual claim must point to a source via the `source_refs` array. Reviewers confirm each ref resolves (URL is live, citation is accurate, the source actually supports the claim at the strength stated). A broken or misattributed ref is grounds for sending the file back to `draft`.

## 7. What the runtime does

`src/lib/provocations/catalogue.ts` exports `isCompliancePublishable(status)` — a single function that returns `true` for `approved_to_ship` in production and `true` for everything in dev/staging (so reviewers can preview WIP). That's the whole production gate.

## 8. Audit trail

Each merge commit is the auditable record. The PR title, the file diffs, the commit SHAs of the two signoff edits, and the final `approved_to_ship` promotion are preserved by Git. No extra tooling is needed.

For full session-level auditability, the app also needs to log `variant_shown` for every awareness check that fires, tying the user's visit to the exact file + version they saw. That work is tracked in the audit plan as P1.5 and is still open.
