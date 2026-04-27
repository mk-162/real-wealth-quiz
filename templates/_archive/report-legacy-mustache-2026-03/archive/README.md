# Report template — archive

Rollback snapshots of each structural version of the report template.
The four files in `templates/report/` (tokens.css, report.css, the
two HTMLs) always reflect the **currently-shipping** version; every
archive subfolder is a known-good previous state.

## Currently active in `templates/report/`

**v1-cover-masked** (rolled back 2026-04-23 after client preferred
the earlier teal-gradient style).

---

## Snapshots

### `v1-cover-masked/` — teal gradient, two-leaf cover mask

Visual signature: bright teal gradient cover (`#0c7372` → `#11a09f`),
welcome image masked by the two-leaf app-logo clip-path
(`#rw-hero-2-leaves`), white-wordmark logo top-left, orange accent
strip on content pages, orange-bordered callouts, teal CTA panel on
the closing page. 6 A4 pages.

**Visual truth (rendered PDF):** `Desktop/Your Real Wealth Report —
Michelle.pdf` (saved 19:14 on the pivot day — before the brochure
rewrite).

**Files:**
- `tokens.css` — teal-focused palette
- `report.css` — two-leaf masked cover, fact-strip, steps, insight
  blocks, orange-bordered callout, checklist, teal CTA panel
- `real-wealth-report.html` — 6-page template with `{{mustache}}`
  placeholders
- `real-wealth-report-sample.html` — same, with Michelle persona
  content filled in

### `v2-brochure/` — forest green cover, single-curve mask, cream blobs

Visual signature: deep forest-green cover (`#0c3a32`), single organic
curve mask on the cover image, cream-blob backgrounds on content
pages, alternating teal/orange/navy circular icons, navy "Let's
talk" panel with two contact cards, full-bleed back cover. 7 A4
pages. Modelled on the "Nearing retirement IFAs" brochure (Feb
2026).

**Visual truth (rendered PDF):** `Desktop/Your Real Wealth Report —
Michelle - NEW.pdf` (saved 19:27 on the pivot day).

**Files:** same four (tokens.css, report.css, template, sample).

---

## How to preview either version in the dev server

Only the **current active** version is at the root preview URL; older
snapshots stay parked under `/v1/`:

| URL | Version |
|---|---|
| `http://localhost:5000/report-preview/index.html` | current active (placeholders) |
| `http://localhost:5000/report-preview/sample.html` | current active (Michelle) |
| `http://localhost:5000/report-preview/v1/index.html` | v1-cover-masked (placeholders) |
| `http://localhost:5000/report-preview/v1/sample.html` | v1-cover-masked (Michelle) |

When rolling back or forward, re-sync the `public/report-preview/`
root and `/v1/` folder to match (see commands below).

---

## How to switch versions

**Make v1 active:**

```bash
cp templates/report/archive/v1-cover-masked/tokens.css               templates/report/tokens.css
cp templates/report/archive/v1-cover-masked/report.css               templates/report/report.css
cp templates/report/archive/v1-cover-masked/real-wealth-report.html  templates/report/real-wealth-report.html
cp templates/report/archive/v1-cover-masked/real-wealth-report-sample.html  templates/report/real-wealth-report-sample.html

# sync preview
cp templates/report/tokens.css               public/report-preview/tokens.css
cp templates/report/report.css               public/report-preview/report.css
cp templates/report/real-wealth-report.html  public/report-preview/index.html
cp templates/report/real-wealth-report-sample.html  public/report-preview/sample.html
```

**Make v2 active:** same pattern with `archive/v2-brochure/`.

---

## Rule for future rewrites

**Before any structural rewrite of `templates/report/*`, snapshot the
current state into a dated archive folder first:**

```bash
mkdir -p templates/report/archive/vN-<descriptor>
cp templates/report/{tokens.css,report.css,real-wealth-report.html,real-wealth-report-sample.html} \
   templates/report/archive/vN-<descriptor>/
```

Reconstructing from conversation history is error-prone; archiving
first is cheap insurance.
