<!-- _AUDIT.md entry: 6.2 -->
---
name: edit-page-nested-frontmatter
description: Add, remove, or edit leaf strings and entries inside the deep nested frontmatter on a Real Wealth page markdown file — chiefly `content/pages/summary.md`, which holds `silent_gaps.prompts`, `aspiration_echo.fallback_templates`, `emotional_intros`, `spotlight_flags`, `charts.titles`, `fca_footer.links`, and similar structured groups. Use this skill whenever the user asks to add a silent-gap prompt, update a high-earner emotional intro, change a fallback template, add a new chart title, or otherwise tweak a nested key inside a page. Triggers on phrasings like "add a silent gap for X", "update the sandwich-generation spotlight", "change the S9 HNW emotional intro", or "add a new fallback template".
---

# Edit nested page frontmatter

## What this skill does

Updates a keyed value inside the deep YAML frontmatter of a `content/pages/*.md` file — primarily `summary.md`, which is the densest. Operations:
- **Edit** a leaf string value (e.g. `silent_gaps.prompts.business_spouse: "new prose"`).
- **Add** a new entry to a keyed map (e.g. a new `silent_gaps.prompts.new_key`).
- **Remove** a key (with the grep-first discipline — summary resolver may read it).

## Background

Pages have schema:
```typescript
pageSchema = z.object({
  id: z.string(),
  title: z.string(),
  sections: z.record(z.string(), z.unknown()),
});
```

`summary.md` is the main example — see its frontmatter for the full surface:

- `aspiration_echo.fallback_templates` — 6 template strings keyed by Q1.2 wealth-definition values.
- `emotional_intros` — 6 variants keyed by priority (urgency, advised_but_looking, money_stress, retirement_less, s1_early, s9_hnw) + `fallback`.
- `silent_gaps.prompts` — 12+ prose snippets keyed by a gap identifier (business_spouse, btl_mortgages, lpa_urgency, etc.).
- `spotlight_flags.*` — 4 named spotlight groups with `eyebrow`, `headline`, `body`, `close`.
- `charts.titles` + `charts.captions` — chart labels keyed by chart slug.
- `fca_footer.links` — ordered list of `{ label, href }`.

Runtime reader: `src/lib/summary/*`. The resolver looks up keys by name — removing a key that's still referenced breaks the render.

## Inputs you need from the user

1. **Which page.** Typically `summary.md`; also `homepage.md`, `privacy.md`, `consumer-duty.md`, `data-capture.md`.
2. **Which nested path.** `silent_gaps.prompts.<key>`, `emotional_intros.<variant>`, etc.
3. **Operation.** Add / edit / remove.
4. **New content** (for add/edit).

## Workflow

1. **Locate the page file.** Usually `content/pages/summary.md`.

2. **Read the relevant section.** Understand the existing shape and register.

3. **For REMOVE:** grep `src/lib/summary/` and `src/app/` for the key name first — same discipline as option value removal. If the key is referenced, escalate: removal is a code+content change.

   ```bash
   cd master_template
   grep -rn "<key_name>" src/lib/summary/ src/app/
   ```

4. **For ADD:** check whether the summary resolver will automatically pick up the new key. Many groups (like `silent_gaps.prompts`) are indexed by the resolver via an allow-list OR keyed lookup. Verify either path:
   - **Allow-list pattern** — the resolver has a fixed set of keys it looks for. Adding a new key with no resolver change → dead.
   - **Dynamic lookup** — the resolver reads by key name when a condition fires. Safe to add.

   Usually `silent_gaps.prompts` is dynamic lookup (the resolver walks the map), but `emotional_intros` is allow-list (the resolver picks by priority). Confirm by reading the relevant source file.

5. **For EDIT:** straightforward — just change the leaf string. Preserve YAML quoting style.

6. **Character budgets** — most nested strings inherit general prose budgets:
   - Silent-gap prompts: 200–320 chars typical.
   - Emotional intros: 100–200 chars.
   - Spotlight bodies: 160–260 chars.
   - Chart titles: 30–50 chars.
   Match the existing siblings' length register.

7. **Voice.** See `content/microcopy/voice-rules.md`. Page copy is the summary-layer voice — slightly more narrative than microcopy, less punchy than provocations. Compare against siblings.

8. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   npm run voice:check
   ```
   Page schema is `z.record(z.string(), z.unknown())` — lenient. It catches id/title but not nested drift. Visual QA via `npm run dev` is load-bearing.

9. **Summarise.** File, nested path, operation, before → after, any resolver implications.

## Files touched

- `master_template/content/pages/<page>.md` — frontmatter only.
- Flagged, not edited: summary resolver in `src/lib/summary/*` if the change depends on it.

## Invariants — never break these

- **Never remove a key without grepping for consumers.** Page YAML is unconstrained by Zod — the schema won't catch dangling references.
- **Never rename a key in-place.** A rename is a remove + add, and both ends must coordinate with the resolver.
- **Never touch `id` or `title`** — top-level frontmatter fields that the runtime depends on.
- **Indentation matters.** Nested YAML uses 2-space indent per level. Preserve exactly on edits.
- **Round-trip fidelity.** YAML AST editing is a hard requirement here — naive string manipulation will destroy the nested structure. Use `yaml` package, not `string.replace`.

## Examples

### Example 1 — add a new silent gap

**User:** "Add a silent gap for solo business owners without a shareholder agreement."

Target: `content/pages/summary.md`, path `silent_gaps.prompts.<new_key>`.

Verify resolver is dynamic: read `src/lib/summary/silent-gaps.ts` (or wherever silent-gaps live). Confirm the resolver walks `silent_gaps.prompts` as a map keyed by rule name.

Edit frontmatter:
```yaml
silent_gaps:
  prompts:
    # ...existing...
    solo_no_shareholder: "If you're the sole director without a shareholder agreement, the succession picture runs through your will and the company's articles — worth a quick conversation about which one wins when they conflict."
```

Verify resolver has a trigger rule wired for `solo_no_shareholder`. If not, flag — the new prompt is dead until a rule fires it.

### Example 2 — edit an emotional intro

**User:** "Update the HNW emotional intro — 'structural questions' feels stiff."

Target: `content/pages/summary.md`, path `emotional_intros.s9_hnw`.

Before:
```yaml
s9_hnw: "Here are the structural questions that usually matter most at this level — trusts, timing, and the 2027 pension change."
```

After:
```yaml
s9_hnw: "Here's what usually matters most at your level — trusts and the shape of the estate, the timing of gifts, and the 2027 pension change that catches most people off guard."
```

Validation clean.

### Example 3 — remove a key (escalate)

**User:** "Drop the 'auto_enrolment' silent gap — we're not using it."

Grep `auto_enrolment` across `src/`. Find:
- `src/lib/summary/silent-gaps.ts` — rule engine keyed on `auto_enrolment`.
- Nothing else.

Present:

> The `auto_enrolment` prompt is read by `src/lib/summary/silent-gaps.ts` — removing the frontmatter key without removing the rule leaves dead code. Do you want to:
> 1. Remove both the frontmatter key and the resolver rule in the same commit?
> 2. Keep it — it's not currently firing but easy to reactivate?
>
> Which?

## When NOT to use this skill

- **Edit the top-level `id` or `title`** — different treatment (use 6.1, not in this batch).
- **Add / remove a whole page** → audit 6.3 (Tier 3).
- **Add / remove a new section key** → that's a schema + resolver change, not content.

## Related skills

- `edit-microcopy` — the toast/error equivalent.
- `change-segment-cta` — the CTA equivalent in segments folder.

## Gotchas

- **Page YAML is permissive.** `content:check` doesn't catch many mistakes — wrong indentation, extra keys, type mismatches. Visual QA in `npm run dev` is the real gate.
- **Resolver coupling is invisible in the YAML.** You can add a key and the admin/validator will happily accept it, while it sits dead at runtime because no resolver reads it. Always verify the consumer side.
- **Charts titles/captions are keyed by chart slug.** `charts.titles.iht_on_3m` pairs with chart slug `iht_on_3m`. Renaming requires coordinated change in `content/charts/manifest.json`.
- **FCA footer disclosure is regulatory.** Don't edit the `fca_footer.disclosure` text without compliance review — flag.
