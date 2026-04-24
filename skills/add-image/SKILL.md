<!-- _AUDIT.md entry: 9.1 -->
---
name: add-image
description: Drop a new image file into the Real Wealth media library at `content/images/` with a matching `.meta.json` sidecar. Use this skill whenever the user asks to add a new image, register a new photo for the kitchen-table family, upload a new hero, or otherwise add a file to the image library. Triggers on phrasings like "add this kitchen-table image", "register a new hero for the homepage", or "drop this PNG into the media library".
---

# Add a new image

## What this skill does

Places a new image file under `master_template/content/images/<filename>` and creates the matching `.meta.json` sidecar with alt, caption, width_px, and image_family metadata.

## Background

Images live under `content/images/`. Each image has a sidecar JSON file named `<image>.meta.json` carrying metadata. Admin integrity checks: `images:alt-required`, `images:size-cap` (< 2MB), `images:path-resolves`.

## Inputs you need from the user

1. **The image file.** The user will have provided a path or the file content. This skill assumes the file already exists at a source path; your job is to place it in the library.
2. **Target filename.** Kebab-case, preserve the extension. e.g. `kitchen-morning.png`.
3. **Alt text.** Required, functional description.
4. **Image family** (optional but typical). One of the families named in screen `image_family` fields — `family_1_life_shape`, etc. Dictates which screens may reference this image.
5. **Caption** (optional), **width_px** (positive integer, typical 320–1200).

## Workflow

1. **Verify the file format and size.**
   - Allowed: PNG, JPG, WEBP, SVG.
   - Size < 2MB — admin check `images:size-cap`.
   - If > 2MB, flag and ask the user to resize or optimise first.

2. **Pick the destination path.** `master_template/content/images/<filename>`. Confirm no collision — a file with the same name already present would silently overwrite if you `Write` without checking.

3. **Place the file.** Copy to the destination.

4. **Create the sidecar `<filename>.meta.json`:**
   ```json
   {
     "alt": "A descriptive alt-text describing the image function",
     "caption": "Optional caption",
     "width_px": 480,
     "image_family": "family_1_life_shape"
   }
   ```

5. **Validate.**
   ```bash
   cd master_template
   npm run content:check
   ```
   Admin integrity scan checks alt + size + resolution.

6. **Summarise.** New file path, sidecar, metadata, and whether any existing binding (screen or report image binding) should be wired to use it next.

## Files touched

- `master_template/content/images/<filename>` (new).
- `master_template/content/images/<filename>.meta.json` (new).

## Invariants — never break these

- **Alt is non-empty.** Accessibility requirement.
- **Size < 2MB.** Page-weight budget.
- **Format is PNG/JPG/WEBP/SVG.**
- **Sidecar filename exactly matches** `<image_filename>.meta.json`.
- **Never silently overwrite** an existing file.

## Examples

### Example 1 — add a kitchen image

**User:** "Add this `kitchen-morning-v2.png` to the kitchen family."

Target: `content/images/kitchen-morning-v2.png`.

Sidecar `kitchen-morning-v2.png.meta.json`:
```json
{
  "alt": "A kitchen table at morning, two mugs, soft light through a window",
  "caption": "",
  "width_px": 1200,
  "image_family": "family_1_life_shape"
}
```

Validation clean. Note: nothing references this image yet — adding a binding is `change-image-binding` or a screen `image_family` edit.

### Example 2 — don't do this: overwrite silently

Check for existing file first. If `kitchen-morning.png` already exists and you're adding another "kitchen-morning.png" — stop, confirm naming.

## When NOT to use this skill

- **Rename an existing image** → `rename-image-with-refactor`.
- **Edit sidecar metadata only** → audit 9.4 (can be this skill's simpler sibling; for now, minor metadata edits are done via the admin or hand-editing the sidecar directly).
- **Delete an image** → audit 9.3.
- **Bind a new image to a section** → `change-image-binding` (report) or screen frontmatter edit.

## Related skills

- `rename-image-with-refactor`, `change-image-binding`.

## Gotchas

- **Sidecar is required.** No sidecar = admin flags missing alt (blank alt fails integrity check).
- **Image family governs screen compatibility.** Screens restrict which families they'll display via `image_family` frontmatter — an image in `family_3_people` won't render on a screen with `image_family: family_1_life_shape`.
- **SVGs have their own lint needs.** If adding an SVG, verify it's cleanly authored (no script tags, sensible viewBox). The admin doesn't deep-lint SVG content.
