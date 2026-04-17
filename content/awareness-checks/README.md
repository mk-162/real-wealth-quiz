# Awareness Checks README

This folder contains in-flow awareness checks: short moments that ask whether the visitor already knows something important.

Awareness checks are not ordinary questionnaire screens. They are triggered by answers, shown where relevant, and capped by questionnaire length.

## Body Sections

Each file must contain:

| Section | What it does |
|---|---|
| `# Stem` | The question or prompt shown to the visitor. |
| `# Aware body` | Copy shown when the visitor already knows the point. |
| `# Partial body` | Copy shown when the visitor partly knows the point. |
| `# Unaware body` | Copy shown when the visitor did not know the point. |

## Frontmatter Fields

| Field | What it does |
|---|---|
| `id` | Unique internal ID for the awareness check. |
| `core` | Marks a high-priority awareness check. Used as a sorting signal after explicit rank. |
| `trigger` | Rule that decides when this check becomes eligible. |
| `placement` | Intended place in the journey. Mostly documentation/admin context. |
| `source` | Source or rationale for the check. Useful for compliance review. |
| `rank` | Numeric priority. Lower numbers are shown first. `null` means no explicit priority. |
| `tier_limit` | Questionnaire lengths that may show it. `A` = thorough, `B` = standard, `C` = quick. |
| `compliance_status` | Compliance state. Draft content should not be treated as production-ready. |

## Runtime Notes

- The app only considers awareness checks whose `trigger` matches the current answers.
- The app respects `tier_limit`.
- The app sorts by `rank`, then `core: true`, then file order.
- Already answered awareness checks are not shown again in the same session.

