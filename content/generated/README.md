# Generated Content README

This folder contains routing support files for the questionnaire.

## Files

| File | What it does |
|---|---|
| `matrix.json` | Segment/question routing matrix. **Directly edited** — see below. |
| `rules.json` | Segmentation rules used by the review documentation and routing explanation. |
| `CATALOGUE_CHANGES.md` | Generated notes about catalogue changes. |

## matrix.json — source of truth

`matrix.json` is the **directly-edited source of truth** for segment/question routing. It is no longer generated from the `Question Segment Master.xlsx` spreadsheet.

Each entry maps a `questionId` to nine segment flags (`S1`–`S9`) with three possible values:

| Value | Meaning |
|---|---|
| `Y` | Question is shown for this segment |
| `N` | Question is hidden for this segment |
| `C` | Question is shown as conditional (contextual reveal) |

**To add new question IDs**: add a new object to the array, positioned logically alongside related IDs. Use `Y` for all segments if `segments_served: [all]` in the screen file.

`scripts/parse-segment-master.ts` was the previous generation script. It is now archived/unused — do not run it, as it would overwrite manual additions.

## Routing Note

For screens with `q_refs`, the matrix is the source of truth for segment visibility. A screen is shown when at least one referenced question is `Y` or `C` for the visitor's segment.

If screen metadata such as `segments_served` or `skip` disagrees with `matrix.json`, treat that as a content/routing inconsistency to resolve.

