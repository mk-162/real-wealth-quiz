# Generated Content README

This folder contains routing support files for the questionnaire.

## Files

| File | What it does |
|---|---|
| `rules.json` | Segmentation rules (the ranked predicate list that decides which segment each respondent lands in). |
| `CATALOGUE_CHANGES.md` | Generated notes about catalogue changes. |

## Where the matrix lives

`matrix.json` was retired in Phase 4 (2026-04-27). The segment × question
visibility matrix now lives as per-screen `audience:` frontmatter blocks
under `content/screens/*.md`. Each screen owns the questions in its
`q_refs` array and gates them per segment via `audience`.

To change who sees a question:

1. Find the owning screen (the one whose `q_refs` lists the questionId).
2. Edit the `audience:` entry for that questionId, flipping per-segment
   values between `shown`, `conditional`, and `hidden`.
3. Run `npm run content:check`.

See `content/screens/README.md` for the full schema and a worked example.

## rules.json

`rules.json` carries metadata for the 9 segment-assignment rules
(rank, label, predicate text, description). The executable predicate
logic lives in `src/lib/segmentation/rules.ts`. Edit the JSON for
documentation/predicate-text changes; edit the TS for logic changes.
