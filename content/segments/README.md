# Segments README

This folder contains summary-page calls to action for each segment plus overlay CTAs.

Segment CTAs are the closing message shown after the questionnaire assigns a segment or detects an overlay condition.

## Body Sections

Each file must contain:

| Section | What it does |
|---|---|
| `# Headline` | Main summary CTA headline. |
| `# Body` | Supporting explanation. |
| `# Button` | Button label. |
| `# Helper` | Small helper line near the CTA. |

## Frontmatter Fields

| Field | What it does |
|---|---|
| `id` | Unique internal ID for this CTA. |
| `kind` | `segment` for S1-S9 CTAs, `overlay` for condition-based CTAs. |
| `segment` | Segment ID for segment CTAs, such as `S3`. Use `null` for overlays. |
| `overlay` | Overlay key for overlay CTAs. Allowed values are `advised_but_looking` and `urgency_this_week`. Use `null` for segment CTAs. |
| `button_link` | Destination URL for the CTA button. |

## Segment IDs

| ID | Meaning |
|---|---|
| `S1` | Early Accumulator |
| `S2` | Mass-Affluent Mid-Career |
| `S3` | High-Earner Mid-Career |
| `S4` | Senior Professional / Partner |
| `S5` | Business Owner - Growth |
| `S6` | Business Owner - Exit-minded |
| `S7` | Pre-Retiree Affluent |
| `S8` | Retired / Decumulation |
| `S9` | HNW / Multi-Gen |

