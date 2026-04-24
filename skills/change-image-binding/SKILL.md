<!-- _AUDIT.md entry: 8.10 -->
---
name: change-image-binding
description: Swap the image a Real Wealth report section uses, or update its alt/width/caption. Use this skill whenever the user asks to use a different image on a report section, swap the hero for investment, change the alt text on a report image, or update which file a section's image binding points at. Triggers on phrasings like "use a different image on the investment page", "swap the cash-section image", or "update the alt on the protection image".
---

# Change an image binding

## What this skill does

Edits a `content/report/images/<slug>.md` file — the binding that pins an image file + metadata to a report section. Typical changes: swap the `image` path, update `alt`, adjust `width_px`, revise `caption`.

## Background

Each report-image binding is a small file:
```yaml
---
id: report.image.investment
section: investment
image: "investment-hero.png"
alt: "A hand-drawn line chart of balanced growth over 30 years"
width_px: 480
caption: "Illustrative — balanced 60/40 with annual rebalancing"
---
```

The `image` field resolves to a file under `content/images/`. Integrity check `report:image-file-exists` verifies resolution.

## Inputs you need from the user

1. **Which binding file.** Path or slug.
2. **Which field(s).** `image`, `alt`, `width_px`, `caption`.
3. **New value(s).**

## Workflow

1. **Locate the file.** `master_template/content/report/images/<slug>.md`.

2. **If swapping the `image` file:**
   - Verify the new file exists under `content/images/`. Use Glob.
   - Check the new image's metadata — alt and width in any sidecar `.meta.json` — and align the binding accordingly.
   - If the new filename is missing a `.meta.json` sidecar, flag.

3. **For alt / caption / width_px edits:**
   - Alt must be non-empty (accessibility invariant). Describe the image functionally, not decoratively — "A hand-drawn line chart of balanced growth over 30 years" not "A nice chart".
   - `width_px` is a positive integer; typical 320–640 on the report page.
   - Caption is optional but should be a plain phrase.

4. **Save and validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Admin integrity checks `report:image-file-exists`, `images:alt-required`.

5. **Visual QA.** Render the report preview to confirm the image + alt display correctly.

6. **Summarise.** File, fields changed, before → after.

## Files touched

- `master_template/content/report/images/<slug>.md`.

## Invariants — never break these

- **`image` must resolve** to a file in `content/images/`.
- **`alt` must be non-empty.** Accessibility requirement.
- **`width_px` is a positive integer.**
- **Never touch `id` or `section`.** Structural.
- **Round-trip fidelity.** YAML AST editing.

## Examples

### Example 1 — swap an image

**User:** "The investment section image feels dated. Use investment-balanced-v2.png instead."

Target: `content/report/images/investment.md`.

Before:
```yaml
image: "investment-hero.png"
alt: "A hand-drawn line chart of balanced growth over 30 years"
width_px: 480
```

Check: `content/images/investment-balanced-v2.png` exists? If yes:

After:
```yaml
image: "investment-balanced-v2.png"
alt: "A hand-drawn line chart of balanced 60/40 growth over 30 years"
width_px: 480
```

Update alt if the new image's meaning differs. Validation clean.

### Example 2 — fix alt text only

**User:** "The alt on the cash image is generic. Make it describe the actual figure."

Edit `alt` only. Leave `image`, `width_px`, `caption` alone.

### Example 3 — don't do this: broken reference

**User:** "Use newhero.png on the cover." If `content/images/newhero.png` doesn't exist, stop — adding the image is `add-image`; do that first, then this binding.

## When NOT to use this skill

- **Add a new image file** → `add-image`.
- **Rename an image file** → `rename-image-with-refactor` (cascade).
- **Delete an image** → audit 9.3 (not in this batch).
- **Edit image metadata sidecar** → audit 9.4 (not in this batch; overlaps with this skill if the metadata is referenced only from the binding).

## Related skills

- `add-image`, `rename-image-with-refactor`.
- `change-chart-binding` — sibling skill for charts.

## Gotchas

- **Alt text is load-bearing.** A screen reader reads it. Vague alt ("decorative image") is worse than no alt. Describe function.
- **`width_px` governs page layout.** Over-large values can break column flow in the PDF. Match existing neighbours.
- **The image file itself is separate from the binding.** Swapping the binding doesn't edit or move the file — it just changes which file the section uses.
