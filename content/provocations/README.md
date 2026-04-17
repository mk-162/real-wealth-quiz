# Provocations README

This folder contains short triggered callouts. They are designed to feel like useful planner observations, not warnings or sales messages.

Provocations can appear inline when an answer pattern makes one relevant.

## Body Sections

Each file must contain:

| Section | What it does |
|---|---|
| `# Headline` | Short callout headline. |
| `# Body` | Main explanatory copy. |
| `# Close` | Short closing line or bridge. |

## Frontmatter Fields

| Field | What it does |
|---|---|
| `id` | Unique internal ID for the provocation. |
| `trigger` | Rule that decides when this provocation becomes eligible. |
| `segments` | Intended segment audience. `all` is allowed. |
| `placement` | Intended place in the journey. Optional admin context. |
| `compliance_status` | Compliance state. Controls where the provocation can appear. |
| `cfp_signoff_date` | Date of Chartered Financial Planner sign-off, or `null`. |
| `compliance_signoff_date` | Date of compliance sign-off, or `null`. |
| `version` | Content version. Defaults to `0.1.0`. |
| `source_refs` | Supporting sources or internal references. |

## Compliance States

| Status | Meaning |
|---|---|
| `draft` | Draft content. Development previews only. |
| `cfp_signed` | Reviewed by planner, not final compliance. |
| `compliance_signed` | Compliance reviewed but still pending final approval treatment. |
| `approved_to_ship` | Approved for production display. |

Do not change `compliance_status` casually. Treat status changes as review actions.

