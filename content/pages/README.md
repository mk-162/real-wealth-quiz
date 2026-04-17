# Pages README

This folder contains structured copy for top-level pages such as the homepage, summary page, privacy page, and data-capture page.

Page files are more flexible than screens. Most of their structure lives in YAML frontmatter, and the app reads named sections from that data.

## Frontmatter Fields

| Field | What it does |
|---|---|
| `id` | Unique page ID. Usually matches the filename, such as `homepage`. |
| `title` | Admin/page title. |
| Other fields | Page-specific structured content. The schema stores these under `sections`, so each page can have its own shape. |

## Body Copy

Any markdown below the closing `---` is stored as page body copy. Some pages use this heavily; others keep most copy in frontmatter.

## Editing Notes

- Keep existing field names stable unless the app code is being updated too.
- Edit visitor-facing strings freely.
- Be careful changing nested IDs such as tile IDs, link IDs, or CTA IDs because app components may depend on them.
- After editing, run `npm run content:check`.

