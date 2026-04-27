# Actions

Things you need to do, grouped by urgency. Each item is self-contained — you can do them in any order within a section.

Last updated: 2026-04-27

---

## Now (before demo)

### 1. Restart the dev server

`pdf-content.ts` has a module-level tile cache that doesn't invalidate when markdown changes. After any tile content edit, restart dev to see the change.

```bash
# kill whatever's on port 5000, then:
cd master_template
npm run dev
```

Open http://localhost:5000/report/master/S2 and confirm the planning-grid tiles show templated numbers (e.g. "£13k covers 3 months") rather than generic prose.

### 2. Decide the compliance path for demo

Most tile markdown is still `compliance_status: draft`. The compliance gate is **opt-in** — by default all content renders everywhere (dev, staging, production) until you enable enforcement.

- **Demo from localhost or any deployed URL** — do nothing. All content passes through.
- **Go to production properly** — review each `content/pdf-report/*.md` with compliance, flip `compliance_status: draft` → `approved_to_ship` file-by-file. Then set `RW_ENFORCE_COMPLIANCE=1` in the production environment to activate the gate. Only `approved_to_ship` content will render once the gate is enabled.

See `src/lib/content/compliance.ts` for the gate implementation.

### 3. Spot-check the 9 segment reports

Visually eyeball each segment. Look for tile notes that feel off — cases where the engine scored a status that contradicts the note's tone.

```
http://localhost:5000/report/master/S1   — age 28, renter, solo
http://localhost:5000/report/master/S2   — 42, partner + kids, mortgaged  ← recommended for first look
http://localhost:5000/report/master/S3   — high earner, £100k trap
http://localhost:5000/report/master/S4   — 55, 5 yrs from exit
http://localhost:5000/report/master/S5   — business owner growth
http://localhost:5000/report/master/S6   — business owner exit
http://localhost:5000/report/master/S7   — pre-retiree affluent
http://localhost:5000/report/master/S8   — retired, drawdown
http://localhost:5000/report/master/S9   — HNW multi-generational
```

If a tile note reads awkwardly for the engine's status, that's a content tweak in `content/pdf-report/planning-grid/tile-NN-*.md` — per-segment `note:` field.

---

## Soon (before sharing with real prospects)

### 4. Approve the rest of the PDF content

Everything in `content/pdf-report/` is currently `compliance_status: draft`:

- `health-gauge.md` (zone-matched interpretations)
- `takeaway-banners.md` (per-segment headline + body)
- `methodology.md` (full 5-section methodology page)
- `planning-grid/tile-NN-*.md` × 12 (tile notes per segment)
- `goals/S[n]-*.md` × 9 (wellbeing goals)
- `awareness-checks-expanded/*.md` × 26

Compliance review → flip each file's `compliance_status: draft` → `approved_to_ship` → then set `RW_ENFORCE_COMPLIANCE=1` in the production environment.

### 5. Restart dev after any markdown change

See Action 1. Flag this to anyone else authoring content on the project.

---

## Later (nice-to-haves)

### 7. Fix the `_tileCache` invalidation

`src/lib/compass/pdf-content.ts` uses module-level `let _tileCache` and similar caches. These survive across Turbopack hot-reloads because markdown files aren't part of the TS module graph. Options:

- Add file-mtime-based cache invalidation
- Or just remove the caches (file reads are cheap for 12 markdown files)

~30 min of engineering work. Removes the "restart dev server" friction.

### 8. Draft the admin-CMS v2 plan

`Lead Magnet App/PLAN_admin_app.md` is v1. v1 ships when the editor-only Electron app is ready. v2 should cover the content-aware authoring patterns that surfaced during the tile-scoring work — particularly:

- Inline `{token}` validation (warn if a template token references an unpopulated metric)
- Per-segment preview with real engine output
- Compliance-status flip UI

### 9. Reconcile stale docs

See `docs/OutstandingItems.md` §"Stale docs" for the list. Briefly: `PLAN_pdf_report.md`, `HANDOFF_NEXT_MODEL.md`, `DECISION_LOG.md`, and `audit-handoff-2026-04-17.md` contain references that pre-date today's work. A once-over pass to merge or archive is worth an hour.

---

## Reference — key commands

```bash
# Run the app
npm run dev                                 # http://localhost:5000 (content-watch included)

# Tests
npx tsc --noEmit                            # TypeScript strict check
npx tsx --test scripts/test-tile-scoring.ts       # 74 unit tests
npx tsx --test scripts/test-tile-template.ts      # 10 template tests
npx tsx --test src/lib/content/__tests__/compliance.test.ts  # 19 compliance tests
npx tsx --test scripts/test-tile-scoring-full.ts  # 126 integration assertions
npx tsx scripts/test-compass-inputs.ts      # 9-segment coverage self-test
npx playwright test tests/flows.spec.ts     # E2E journey (10 tests, ~30s)
npm run content:check                       # Zod validation across all markdown

# Content build
npm run content:build                       # writes src/lib/content/catalogue.ts

# Matrix regeneration (after editing xlsx)
npx tsx scripts/parse-segment-master.ts

# Production build (all content passes by default)
npm run build
RW_ENFORCE_COMPLIANCE=1 npm run build       # enable compliance gate (only approved_to_ship renders)
```

---

## Reference — demo URLs

```
http://localhost:5000/                             — homepage / tier picker
http://localhost:5000/conversation                 — questionnaire start
http://localhost:5000/conversation/summary         — summary (email-gated)
http://localhost:5000/report/master/S2             — main sample report (recommended)
http://localhost:5000/report/master-fields         — debug view (field-paths instead of copy)
http://localhost:5000/report/compass-preview       — segment tab-picker
```

To bypass the email gate on the summary page during a demo, open DevTools console and run:

```js
localStorage.setItem('real-wealth:report-unlocked', 'true'); location.reload();
```
