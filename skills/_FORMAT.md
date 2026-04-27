# Skill format — how to write skills in this folder

Every skill in `master_template/skills/*/SKILL.md` follows the same shape so AI agents and humans can read any of them with the same mental model. This doc defines that shape.

The two exemplars `change-question-wording/` and `change-matrix-cell/` are the canonical references. Copy one when adding a new skill.

## Folder layout

```
skills/
├── _AUDIT.md                             master catalogue of change types
├── _FORMAT.md                            this file
├── <skill-name-in-kebab-case>/
│   ├── SKILL.md                          required
│   ├── scripts/                          optional — only if the skill bundles code
│   ├── references/                       optional — deeper docs if SKILL.md hits 500 lines
│   └── assets/                           optional — templates used in output
```

Always use a folder, even for a single-file skill. Keeps room for bundled resources later without restructuring.

## Naming

- **Folder + frontmatter `name`**: kebab-case, verb-first, imperative. `change-question-wording`, not `question-wording-editor`. Verb-first because the name reads as "when you want to X".
- **One skill = one action.** If the description reads "… and also …" you probably need two skills.
- **Pair names where relevant.** `add-X` + `remove-X` + `change-X` are parallel; keep the naming symmetric.

## SKILL.md structure — always these sections, in this order

```markdown
---
name: <kebab-case-name>
description: <2–4 sentence trigger-focused blurb — what + when, slightly pushy>
---

# <Human-readable title — usually the name prettified>

## What this skill does
<Two sentences max. Plain English. Scope.>

## Background (optional)
<Only if the skill needs domain knowledge to interpret — e.g. "C cells need predicates" for the matrix skill. Skip if the skill is self-evident.>

## Inputs you need from the user
<Numbered list. What to ask if not provided. How to interpret ambiguous phrasing.>

## Workflow
<Numbered step-by-step. Include the actual shell commands, file paths, and validator invocations.>

## Files touched
<Exhaustive list. "One file, one section" or "these three files in a transaction.">

## Invariants — never break these
<Hard rules. Use "never" language sparingly and explain the why for each one.>

## Examples
<2–3 worked examples. Include a "don't do this" counter-example where ambiguity is likely.>

## When NOT to use this skill
<Named other skills for adjacent cases. This stops the skill from scope-creeping.>

## Related skills
<Links to neighbouring skills the user might have meant.>

## Gotchas (optional)
<Edge cases, admin-vs-script differences, fidelity concerns.>
```

## Description conventions

Per skill-creator guidance, skills tend to under-trigger. Counter with slightly pushy triggers:

- Say WHAT and WHEN in the same sentence.
- Name 3–4 phrasings the user might say.
- Include the specific filenames or concepts they'd name.
- Explicit "triggers even when the user just says X" for ambiguous cases.

**Example good description:**
> "Rewrite the headline, sub-copy, or body of an existing questionnaire screen. Use this skill whenever the user asks to soften a question, reword a prompt, change the framing, adjust the supporting text, or modify the wording of an existing question without changing its structure. Triggers even when the user just names the screen ('Q1.1') or the concept ('the question about what brought them here')."

**Example bad description:**
> "Edit question wording." ← too short; won't trigger reliably.

## Length

- Target 150–400 lines of SKILL.md.
- Cap at 500. If approaching, split bundled details into `references/`.
- Prose style: imperative ("Open the file …"), not passive ("The file should be opened").

## What NOT to include

- **No prose explaining the whole codebase.** Link to `docs/Guide.md` and `HOW_IT_IS_MANAGED.md` instead.
- **No sign-off lines** (`— Matt` / `v1.0` / etc). Git + `_AUDIT.md` cover versioning.
- **No hard MUSTs in ALL CAPS** unless it's a genuinely destructive operation. Explain the why instead; LLMs follow reasoning better than rules.
- **No "this skill is for …" intro paragraph.** The frontmatter description already did that job.

## Invariants every skill must mention

Every skill that edits `content/` must explicitly call out the three project-wide invariants where relevant:

1. **Ids are immutable.** Never change `id`, `screen_number`, `questionId`, or equivalent primary keys without an explicit rename skill.
2. **Audience is per-question, on the screen.** Each screen carries an `audience:` block keyed by `questionId` with a `shown | conditional | hidden` cell per segment S1–S9. There is no separate matrix file. A `conditional` cell needs a matching predicate in `src/lib/segmentation/engine.ts` keyed by the same `questionId`. Never invent or remove a cell silently — schema rejects malformed audience blocks.
3. **Round-trip fidelity.** Any file the admin app touches must re-parse to identical bytes. If you're writing a script not going through the admin, use `gray-matter` + `yaml` AST mode, never naive string replace.

## Validation commands — the canonical set

Every skill's Workflow section should name the relevant validator. Standard commands from `master_template/`:

- `npm run content:check` — Zod shape + body sections + audience cells + q_refs.
- `npm run voice:check` — banned phrases.
- `npm run typecheck` — TS compile for any code change.
- `npm run test` — full Vitest suite (admin app only has this).
- `npm run build` — full Next.js build; catches any content → catalogue regeneration error.

## Canonical body-section vocabulary (post-S3)

Every editable content type uses a small canonical vocabulary for body sections. Skills that touch bodies must use the right names — the loader and integrity tray match exactly.

| Type | Sections |
|---|---|
| Screen | `# Headline`, `# Sub`, optional `# Pullquote`, `# Body` (transition/intro layouts) |
| Segment / overlay CTA | `# Headline`, `# Body`, `# Cta`, `# Cta Helper` |
| Provocation | `# Headline`, `# Body`, `# Cta`, optional `# Notes` |
| Awareness check | `# Headline`, `# Body Aware`, `# Body Partial`, `# Body Unaware` |
| Report block, `kind: per_segment` | `# S1` … `# S9` (one per segment) |
| Report block, `kind: global` | `# Body` |

Old section names (`# Stem`, `# Aware body`, `# Close`, `# Button`, `# Helper`) and old field names (`provocation.close`, `segment.button`, `segment.helper`, `awareness.stem`) were removed in S3. Any skill referencing them is stale — rewrite to the table above.

Skills that touch the admin app's own code should also call out its tests: `cd admin_app && npm run test`.

## Tier 3 (high-risk) skills — extra guardrail

Skills from _AUDIT.md Tier 3 (segment add/remove, engine predicates, template structure, projection math, methodology copy) MUST include a "Human confirm gate" section near the top of Workflow:

```markdown
## Human confirm gate (Tier 3)

Before making any edit, summarise the proposed change, the files touched,
and the downstream consequences (sessions affected, compliance review needed,
tests to rerun). Wait for the human to reply "yes" / "proceed" / equivalent.
Never proceed on inferred consent.
```

This is the only place rigid language is appropriate — compliance and regulated-financial content requires explicit authorisation.

## Adding a new skill

1. Copy an exemplar folder (`change-question-wording/` or `change-matrix-cell/`) as a starting template.
2. Rename the folder to your new kebab-case name.
3. Rewrite frontmatter `name` + `description`.
4. Work through each section, grounding every step in actual filenames and commands.
5. Smoke test: read your SKILL.md fresh, imagine you're an AI agent invoked on a realistic prompt — does the SKILL.md give you enough? If not, add the missing step/example/gotcha.
6. Cross-link from `_AUDIT.md` Tier priority list if you added a new change type.
