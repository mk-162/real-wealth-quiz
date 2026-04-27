---
title: PDF Wealth Report — content directory
---

# PDF Wealth Report — content

This directory holds all copy for the multi-page PDF Wealth Report generated at the end of the Wealth Conversation. It is separate from the `content/` root because the PDF has its own rendering pipeline (Puppeteer), its own schema conventions, and its own compliance sign-off path.

---

## Directory map

```
content/report/
├── README.md                          ← you are here
├── health-gauge.md                    ← Page 1: gauge interpretation lines, per segment + zone
├── takeaway-banners.md                ← Page 1: headline banner + supporting copy, per segment
├── methodology.md                     ← Final page: assumptions, sources, regulatory disclosures
├── planning-grid/
│   ├── tile-01-retirement-readiness.md
│   ├── tile-02-pension-contributions.md
│   ├── tile-03-state-pension.md
│   ├── tile-04-investment-strategy.md
│   ├── tile-05-tax-efficiency.md
│   ├── tile-06-emergency-cash.md
│   ├── tile-07-debt-position.md
│   ├── tile-08-mortgage.md
│   ├── tile-09-estate-planning.md
│   ├── tile-10-inheritance-tax.md
│   ├── tile-11-protection.md
│   └── tile-12-business-income-mix.md ← dual-variant: see below
├── goals/
│   ├── S1-early-accumulator.md
│   ├── S2-mass-affluent.md
│   ├── S3-high-earner.md
│   ├── S4-senior-professional.md
│   ├── S5-business-growth.md
│   ├── S6-business-exit.md
│   ├── S7-pre-retiree.md
│   ├── S8-retired.md
│   └── S9-hnw.md
└── awareness-checks-expanded/
    ├── README.md                      ← field dictionary for this subdirectory
    └── [26 .md files — one per source check]
```

---

## Schema by file type

### `planning-grid/tile-NN-*.md`

One file per planning grid tile (12 tiles total). Each file covers all 9 segments.

**Frontmatter keys:**

| Key | Type | Notes |
|---|---|---|
| `id` | string | `pdf.tile.NN` |
| `tile_number` | integer | 1–12 |
| `label` | string | Tile header shown to readers (all segments). Omitted on tile 12 — use `label_owners`/`label_others` instead. |
| `label_owners` | string | **Tile 12 only.** Header shown when `is_business_owner == true`. e.g. `"Business exit"` |
| `label_others` | string | **Tile 12 only.** Header shown when `is_business_owner == false`. e.g. `"Income mix"` |
| `compliance_status` | string | `draft` → `approved_to_ship` |

**Body structure — one H1 section per segment:**

```markdown
# S1

status: grey
note: "Two-line note shown in the tile. Max ~120 characters."

---

# S2

status: amber
note: "..."
```

**Status values:** `green` | `amber` | `red` | `grey`

- `green` — earned, not automatic; something is working well
- `amber` — worth a review; not urgent but not resolved
- `red` — attention needed; a specific gap is open
- `grey` — not applicable or too early to assess (never decorative)

**Tile 12 special case — per-segment variant label:**

Tile 12 additionally supports a `tile_label:` key within each segment block. This overrides the global `label_owners`/`label_others` for that specific segment. Used to give S5 and S6 their own specific wording at the segment level:

```markdown
# S5

tile_label: "Business exit"
status: red
note: "..."
```

The loader reads: frontmatter `label_owners`/`label_others` for the tile header, then checks for a `tile_label:` key within the segment block if further specialisation is needed.

---

### `goals/S[n]-*.md`

One file per segment (9 files). Each file contains 3–5 goals for that segment.

**Frontmatter keys:**

| Key | Type | Notes |
|---|---|---|
| `id` | string | `pdf.goals.SN` |
| `segment` | string | `S1`–`S9` |
| `title` | string | Internal label only; not displayed |
| `compliance_status` | string | `draft` → `approved_to_ship` |

**Body structure — one H1 section per goal:**

```markdown
# Goal 1 — [goal name]

status: green
capacity: "2–4 sentences. What the current plan can and cannot deliver toward this goal. Specific and hedged — never a guarantee."
rationale: "1–2 sentences. The planning insight: what this status means in practice, what the conversation is about."
```

**Status values:** same as planning grid — `green` | `amber` | `red`

Goals are inferred from the segment profile, not stated by the user. They describe what someone in this segment typically wants from their financial plan at this life stage.

---

### `health-gauge.md`

One file covering all 9 segments × 4 zone variants.

**Frontmatter keys:**

| Key | Type | Notes |
|---|---|---|
| `id` | string | `pdf.health_gauge` |
| `compliance_status` | string | `draft` → `approved_to_ship` |

**Body structure:**

```markdown
# S1 — Early Accumulator

## Red (score < 70)
"Quoted interpretation line — rendered as display text beside the gauge."

## Amber (score 70–89)
"..."

## Green (score 90–115)
"..."

## Blue (score 116+)
"..."
```

S8 (Retired) uses a different gauge framing: percentage of expected remaining lifetime covered at current spend, rather than wealth-at-retirement vs. wealth-needed. The interpretation lines in the S8 section reflect this.

---

### `takeaway-banners.md`

One file covering all 9 segments.

**Body structure:**

```markdown
# S1 — Early Accumulator

## Banner headline
"The sentence the reader remembers a week later. In quotes. Display type."

## Supporting copy
One short paragraph. Backs up the headline. Warm and precise. Not advice.
```

---

### `methodology.md`

One file. Final page of the PDF. Plain text and markdown tables.

**Body structure:**

| Section | Content |
|---|---|
| Opening paragraph | What the report is and what it isn't |
| Section 1 — Health score | Formula, what "wealth needed" and "projected liquid wealth" mean |
| Section 2 — Assumptions table | All growth rates, inflation, tax rates, allowances with sources |
| Section 3 — Band-to-midpoint mapping table | Every banded quiz answer and the midpoint used in calculations |
| Section 4 — What this report cannot show | 5 honest limitations |
| Section 5 — Regulatory disclosures | Non-advice disclaimer, FCA registration, data, tax year, Scottish taxpayers |

The assumptions tables must round-trip cleanly through any Markdown parser — no fancy table syntax.

---

### `awareness-checks-expanded/*.md`

26 files. Long-form PDF versions of the awareness checks. See `awareness-checks-expanded/README.md` for the full field dictionary.

**Frontmatter keys:**

| Key | Type | Notes |
|---|---|---|
| `id` | string | `pdf.expanded.[check_id]` |
| `source_id` | string | Links to the corresponding `content/awareness-checks/` file |
| `title` | string | Internal label |
| `image_slug` | string | Optional. Slug for an illustrative icon shown alongside the check in the PDF. Not required — renderer falls back to no image if absent. |
| `compliance_status` | string | `draft` → `approved_to_ship` |

The `source_id` field is how the PDF renderer finds the expanded copy for a given check. If a check fires (governed by the original `content/awareness-checks/` trigger logic) and an expanded version exists with a matching `source_id`, the PDF uses the expanded version. If no expanded version exists, it falls back to the `unaware_body` from the source file.

---

## Compliance workflow

All files in this directory follow the same compliance status ladder as the rest of `content/`:

| Status | Rendered where |
|---|---|
| `draft` | Development previews only |
| `cfp_signed` | Staging previews only |
| `compliance_signed` | Staging + production, with a "Pending final approval" note |
| `approved_to_ship` | Freely rendered in production |

CFP and compliance sign-off are required before any file ships to production. The `methodology.md` file in particular requires compliance sign-off on the regulatory disclosures section before it can move to `approved_to_ship`.

---

## Adding a new field

If you need to add a frontmatter field not listed above, the process is the same as for the rest of `content/`:

1. Add the field to the relevant file(s).
2. Update this README's schema table.
3. Flag the change in a pull request comment — the developer needs to extend `content/schema.ts` to recognise it.

If the field is not in the schema, `npm run content:check` will flag an unknown-field warning on every affected file.
