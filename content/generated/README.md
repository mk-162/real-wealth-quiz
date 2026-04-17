# Generated Content README

This folder contains generated or imported routing support files.

Do not edit these files casually. They are inputs or artefacts used to keep the questionnaire matrix and client-review guide aligned.

## Files

| File | What it does |
|---|---|
| `matrix.json` | Segment/question routing matrix. The app uses this to decide whether a referenced question is shown for a segment. |
| `rules.json` | Segmentation rules used by the review documentation and routing explanation. |
| `CATALOGUE_CHANGES.md` | Generated notes about catalogue changes. |

## Routing Note

For screens with `q_refs`, the matrix is the source of truth for segment visibility. A screen is shown when at least one referenced question is `Y` or `C` for the visitor's segment.

If screen metadata such as `segments_served` or `skip` disagrees with `matrix.json`, treat that as a content/routing inconsistency to resolve.

