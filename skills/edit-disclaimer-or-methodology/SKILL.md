<!-- _AUDIT.md entry: 8.13 -->
---
name: edit-disclaimer-or-methodology
description: Edit regulatory and compliance copy in the Real Wealth report — disclaimer ribbons, methodology page prose, cover disclosures, FCA footer text. Use this skill ONLY when the user asks to update legal / compliance copy. This is Tier 3 — changes here require CFP / Compliance sign-off captured in the commit. Triggers on phrasings like "update the methodology page", "change the disclaimer", "edit the FCA footer disclosure", or "revise the cover caveat".
---

# Edit disclaimer / methodology copy

## What this skill does

Updates regulatory prose in the report's template (`templates/_archive/report-legacy-mustache-2026-03/real-wealth-report.html`) or in any supporting static content file (`content/report/static/disclaimer.md` if it exists; some is template-inline). Also touches `content/pages/summary.md` `fca_footer.disclosure` for the summary-page footer.

## Human confirm gate (Tier 3) — regulatory content

Before making any edit:

1. **Confirm the reviewer is in the loop.** Ask: "Has a CFP or Compliance reviewer approved this wording? Who? On what date?"
2. **If not yet approved:** surface that the change should go through review before landing. Draft in a branch; don't merge until sign-off captured.
3. **If approved:** ask for the explicit approval marker (name + date) to include in the commit message.
4. **Summarise the change.** Old text → new text. Specific legal / regulatory claim changed (e.g. "The firm is authorised by the FCA" → "authorised and regulated by the FCA").
5. **Flag the surface.** Disclaimer / methodology copy appears on multiple places: cover, report body ribbons, methodology page, summary page FCA footer. Coordinate changes across all of them if the same text repeats.
6. Wait for explicit "proceed, approval captured" — a single "yes" is not enough here.

## Background

Regulatory copy is the most compliance-sensitive text in the app. FCA Consumer Duty and Conduct of Business Sourcebook (COBS) rules govern what financial firms must disclose. Changes need CFP + Compliance review.

Places to find regulatory copy:
- `templates/_archive/report-legacy-mustache-2026-03/real-wealth-report.html` — cover disclaimer, page ribbons, methodology page.
- `content/pages/summary.md` → `fca_footer.disclosure` — the summary page FCA strip.
- `content/pages/consumer-duty.md` — the consumer-duty explainer.
- `content/pages/privacy.md` — the privacy notice.
- Possibly `content/report/static/disclaimer.md` if that file tree exists.

## Inputs you need from the user

1. **Which surface.** Cover? Methodology? Summary FCA footer? Consumer-duty page? Privacy?
2. **The new text.** Verbatim, from the reviewer.
3. **Review captured.** Who signed off, on what date.

## Workflow

1. **Human confirm gate (above).**

2. **Locate the file.** Template or content file — grep for the existing phrase.

3. **Read the file whole.** Understand where the regulatory claim sits — sometimes it's split across multiple ribbons; changing one without the others creates inconsistency.

4. **Edit the specific passage.** Preserve formatting (HTML tags, YAML structure) exactly.

5. **If the same claim appears elsewhere (cover + methodology + summary footer), update all instances in the same commit.** Regulatory consistency is load-bearing.

6. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run build
   ```
   Render a sample report — verify the new text appears where expected.

7. **Capture the approval in the commit message.** Example:
   > Update FCA footer disclosure per Compliance review (Sarah Patel, 2026-04-22).

8. **Summarise.** File(s), surface(s) updated, approval captured in commit, sample render verified.

## Files touched

- `master_template/templates/_archive/report-legacy-mustache-2026-03/real-wealth-report.html` (if template copy).
- `master_template/content/pages/summary.md` (if summary FCA footer).
- `master_template/content/pages/consumer-duty.md` (if consumer-duty page).
- `master_template/content/pages/privacy.md` (if privacy).
- Occasionally `content/report/static/*.md` if that tree exists.

## Invariants — never break these

- **Human-confirm gate — with approval captured. Every time.**
- **Regulatory consistency across surfaces.** The same firm, FRN, and registration number appearing in multiple places must match.
- **Never edit based on inferred approval.** "I think the reviewer would be fine with this" is not sign-off.
- **Commit message captures approval.** Auditable history for regulatory content.
- **Never silently truncate.** If the new text is shorter and loses a required disclosure (firm name, FRN, registered office), flag.

## Examples

### Example 1 — update the FCA footer disclosure

**User:** "Update the FCA footer — we've got a new registered office."

**Confirm:**

> Current `fca_footer.disclosure` in `content/pages/summary.md`:
>
> > Real Wealth Partners Ltd is authorised and regulated by the Financial Conduct Authority (FRN 1037186). Registered in England and Wales, company number 16498380. Registered office: Office 1, First Floor, 14–18 Tib Lane, Manchester, M2 4JB.
>
> Proposed new registered office? Who is the approver — the firm's compliance lead?
>
> I'll also check the report template for the same claim — if it's duplicated, I'll update both in the same commit.

Update summary.md. Grep template for the old address — if present, update there too. Commit with approval captured.

### Example 2 — methodology prose refinement

**User:** "The methodology page mentions 'balanced 60/40 portfolio' — Compliance wants us to say 'balanced portfolio with 60% equities and 40% bonds' for clarity."

Confirm: who signed off? On what date? Update the template. Commit with the name.

### Example 3 — don't do this: soften legal language without review

User: "The disclaimer says 'does not constitute advice' — can we say 'general guidance only'?"

Refuse without review. Those are legally-loaded phrases. Surface:

> "Does not constitute advice" is a specific regulatory formulation. Changing it to "general guidance only" has compliance implications I can't assess on my own. Please route through CFP / Compliance and come back with the specific wording they approve.

## When NOT to use this skill

- **Non-regulatory copy** → content skills (e.g. `edit-provocation-body`, `edit-microcopy`).
- **Restructuring the template layout** → `change-report-template-structure`.
- **Editing `fca_footer.links`** (the link list, not the disclosure prose) → `edit-page-nested-frontmatter`.

## Related skills

- `change-report-template-structure`, `edit-page-nested-frontmatter`, `advance-compliance-status`.

## Gotchas

- **FRN and company number may appear many times.** A rename/update cascades — grep the entire repo.
- **Commit message is the audit trail.** "Update disclaimer" is not enough; name the approver and date. Example: "Update FCA footer per Compliance review (name, date)".
- **Template CDATA and HTML entities.** Regulatory text inside HTML may include entities (`&amp;`, `&pound;`). Preserve exactly.
- **Summary page vs report page vs cover.** The same disclosure often lives in 2-3 places. Always grep to find all instances before editing.
