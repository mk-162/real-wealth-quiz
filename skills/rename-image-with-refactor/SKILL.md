<!-- _AUDIT.md entry: 9.2 -->
---
name: rename-image-with-refactor
description: Rename an image file in the Real Wealth media library AND cascade every reference to it — screen frontmatter, report image bindings, and the sidecar `.meta.json`. Use this skill whenever the user asks to rename an image, change a filename in the media library, or swap out a filename that's used in multiple places. Triggers on phrasings like "rename kitchen-morning.png to kitchen-warm.png", "update the IHT chart image filename", or "the image is named wrong — fix it everywhere".
---

# Rename an image with refactor

## What this skill does

Renames an image file, renames its `.meta.json` sidecar, and updates every reference across:
- Screen frontmatter (`image_family` — sometimes includes filename; per-screen direction rarely does).
- Report image bindings (`content/report/images/*.md` — `image` field).
- Page frontmatter (rare — check homepage / summary).
- Any inline reference in content (rare — flag if found).

Admin integrity check `images:path-resolves` verifies no dangling references remain.

## Inputs you need from the user

1. **Old filename.** Exact.
2. **New filename.** Kebab-case, preserve extension.

## Workflow

1. **Grep for references first.**
   ```bash
   cd master_template
   grep -rn "<old_filename>" content/ src/
   ```
   Every hit is a place to flip.

2. **Check the sidecar.** `<old_filename>.meta.json` — must be renamed in lockstep.

3. **Plan the single commit.** All edits in one transaction:
   - Rename `content/images/<old>` → `content/images/<new>`.
   - Rename `content/images/<old>.meta.json` → `content/images/<new>.meta.json`.
   - Update every referring file.

4. **Execute the renames.**

5. **Validate.**
   ```bash
   npm run content:check
   ```
   Plus admin integrity scan.

6. **Grep again post-rename** for the old name — should be zero hits.

7. **Summarise.** Files renamed, references updated (count), any residual hits.

## Files touched

- `master_template/content/images/<old>` → `<new>`.
- `master_template/content/images/<old>.meta.json` → `<new>.meta.json`.
- Every file that referenced the old name.

## Invariants — never break these

- **Single atomic commit.** Partial rename = dangling references = broken render.
- **Sidecar tracks the file.** Never leave the sidecar at the old name.
- **Post-rename, zero hits** on the old filename in a grep.
- **Never change the image's content** as part of the rename — only the name.

## Examples

### Example 1 — straightforward rename

**User:** "Rename `kitchen-morning.png` to `kitchen-warm.png`."

Grep: 2 hits — `content/screens/3.1-what-brought-you.md` (via image_family path indirectly, probably doesn't touch filename), `content/images/kitchen-morning.png.meta.json` (sidecar).

Plan:
1. Move `content/images/kitchen-morning.png` → `kitchen-warm.png`.
2. Move `content/images/kitchen-morning.png.meta.json` → `kitchen-warm.png.meta.json`.
3. Update references (if any).

Validate, summarise.

### Example 2 — many references

**User:** "Rename `hero-v1.png` to `hero-2026.png`."

Grep: 8 hits across screens, pages, and the homepage. Single commit updates all.

### Example 3 — don't do this: partial cascade

Bad: rename the file, skip the sidecar. Admin integrity check fails; alt resolution breaks.

## When NOT to use this skill

- **Add a new image** → `add-image`.
- **Delete an image** → audit 9.3.
- **Edit image metadata only** → audit 9.4.

## Related skills

- `add-image`, `change-image-binding`.

## Gotchas

- **Admin has a transactional rename action.** It does the cascade in one shot with an undo. Prefer it to direct file ops when possible.
- **SVG inline references.** If an SVG is inlined into a page (uncommon here), the inline reference may use the filename — grep catches it.
- **Case sensitivity.** macOS filesystem is case-insensitive by default; Linux isn't. A "rename" that only changes case may silently succeed on one and fail on the other. Avoid case-only renames.
