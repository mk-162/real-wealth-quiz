# Testing

How to verify the app is working — automated tests, URL shortcuts, manual journeys, and visual QA.

Last updated: 2026-04-24

---

## TL;DR — the 90-second sanity check

Run this before any commit. Everything must be green.

```bash
cd master_template
npx tsc --noEmit                                        # TypeScript strict
npm run content:check                                   # Zod validation on all markdown
npx tsx --test scripts/test-tile-scoring-full.ts        # 108 tile/segment assertions
```

If those three pass, nothing structural is broken. Deeper test runs below.

---

## 1. Automated test suite

### Full regression (5 min)

```bash
# TypeScript
npx tsc --noEmit

# Unit tests (Node built-in test runner)
npx tsx --test scripts/test-tile-scoring.ts                         # 74 tests — per-tile branches
npx tsx --test scripts/test-tile-template.ts                        # 10 tests — {token} parser
npx tsx --test src/lib/content/__tests__/compliance.test.ts         # 19 tests — compliance gate + bypass

# Integration
npx tsx --test scripts/test-tile-scoring-full.ts                    # 126 assertions — 9 fixtures × 12 tiles
npx tsx scripts/test-compass-inputs.ts                              # 9 segments produce valid coverage

# Content
npm run content:check                                               # Zod schemas pass, 32 screens valid

# E2E (needs dev server on :5000)
npx playwright test tests/flows.spec.ts                             # 10 tests, ~30s
```

Everything green = system is healthy.

### What each suite covers

| Suite | File | What it catches |
|---|---|---|
| `test-tile-scoring.ts` | 74 unit tests | A regression in any of the 12 tile scoring functions — green/amber/red/grey boundaries |
| `test-tile-template.ts` | 10 template tests | `{token}` parser edge cases — unknown tokens left literal, fast-path for no `{`, no recursive substitution |
| `compliance.test.ts` | 19 tests | `canPublishInProduction` correctness + `RW_BYPASS_COMPLIANCE` escape hatch |
| `test-tile-scoring-full.ts` | 126 assertions | **Most valuable**. Runs `scoreAllTiles` + `loadPlanningTiles` + `applyTemplate` end-to-end across all 9 fixtures. Fails if any `{token}` remains unresolved — catches content/engine mismatches instantly |
| `test-compass-inputs.ts` | 9 segments | The input mapper produces a valid `CompassReport` for every segment — coverage in 0-300% range, no thrown errors |
| `flows.spec.ts` | 10 Playwright tests | The full user journey survives — questionnaire seed → summary → unlock → 9-page report visible |

### Single-purpose spot checks

```bash
# Did I break tile 06 (cash)?
npx tsx --test scripts/test-tile-scoring.ts --test-name-pattern="cash"

# Does S4 still produce sane output?
npx tsx scripts/test-compass-inputs.ts | grep S4

# Is my token substitution working across all segments?
npx tsx --test scripts/test-tile-scoring-full.ts 2>&1 | grep -E "fail|unresolved"
```

---

## 2. URL shortcuts

### Public routes

| URL | Purpose |
|---|---|
| `http://localhost:5000/` | Homepage + tier picker |
| `http://localhost:5000/conversation` | Questionnaire entry |
| `http://localhost:5000/conversation?tier=standard` | Questionnaire, standard tier preset |
| `http://localhost:5000/conversation?tier=thorough` | Questionnaire, thorough tier preset |
| `http://localhost:5000/conversation/details` | Data-capture page |
| `http://localhost:5000/conversation/summary` | Summary page (email-gated; see §3 for unlock) |
| `http://localhost:5000/conversation/support` | Distress-signpost page (Samaritans / NHS 111) |
| `http://localhost:5000/privacy` | Privacy policy |
| `http://localhost:5000/consumer-duty` | Consumer Duty statement |

### Report routes (all 9 segments)

| URL | Segment profile |
|---|---|
| `http://localhost:5000/report/master/S1` | 28, solo, renter, light savings |
| `http://localhost:5000/report/master/S2` | 42, partner + kids, mortgaged (good default) |
| `http://localhost:5000/report/master/S3` | 45, £150k, £100k tax trap |
| `http://localhost:5000/report/master/S4` | 55, £200k, 5 years from exit |
| `http://localhost:5000/report/master/S5` | 48, business owner, growth phase |
| `http://localhost:5000/report/master/S6` | 58, business owner, exit within 3 years |
| `http://localhost:5000/report/master/S7` | 63, pre-retiree, 18 months out |
| `http://localhost:5000/report/master/S8` | 70, retired, drawdown mode |
| `http://localhost:5000/report/master/S9` | 68, HNW, £6m estate, IHT-exposed |

Each of the above is SSG — renders identically on every visit for that segment.

### Debug / preview routes

| URL | Purpose |
|---|---|
| `http://localhost:5000/report/master-fields` | Field-map debug — every content slot shows its data-field path (e.g. `{view.headline.title}`). Engine-driven numbers still render real values. Uses S2 band inputs. |
| `http://localhost:5000/report/master` | Index page listing all 9 master segment URLs |
| `http://localhost:5000/report/compass-preview` | Client-side tab-picker across all 9 segments |
| `http://localhost:5000/report/compass-client-view/S2` | Clean client-facing preview, no dev chrome. Swap segment in URL. |

---

## 3. DevTools shortcuts — skip gates + seed sessions

Open DevTools console (F12 → Console) on any page and paste one of these.

### Unlock the summary page (skip email gate)

```js
localStorage.setItem('real-wealth:report-unlocked', 'true');
location.reload();
```

### Reset everything (wipe session + unlock)

```js
localStorage.removeItem('real-wealth:conversation');
localStorage.removeItem('real-wealth:report-unlocked');
location.reload();
```

### Seed a session for a specific segment, then jump to the summary

All nine seeds are below. **Paste the snippet, then navigate to `/conversation/summary`** to see that segment's report inline. The `unlockReport: true` flag skips the email gate too.

Each snippet is a paste-ready one-liner.

**S1 — Early Accumulator (28, solo, renter)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'standard',answers:{age:28,household:['solo'],work_status:'employed',income_band:'lt50k',estate_band:'lt500k',happy_place:'Time for running and cooking.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

**S2 — Mass-Affluent Mid-Career (42, partner, £50-100k)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'standard',answers:{age:42,household:['partner'],work_status:'employed',income_band:'50to100k',estate_band:'500k_to_1m',happy_place:'Breakfast on the porch, walking the dog, a quiet Sunday.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

**S3 — High-Earner Mid-Career (40, partner + kids, £100-125k)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'standard',answers:{age:40,household:['partner','dependent_children'],work_status:'employed',income_band:'100to125k',estate_band:'1m_to_2m',happy_place:'Long weekends, the kids settled, and time to read.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

**S4 — Senior Professional (52, partner + adult kids, £200k+)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'standard',answers:{age:52,household:['partner','adult_children'],work_status:'employed',income_band:'gt200k',estate_band:'2m_to_3m',happy_place:'A long walk with the family after Sunday lunch.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

**S5 — Business-Owner Growth (38, partner + kids, business owner)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'standard',answers:{age:38,household:['partner','dependent_children'],work_status:'business_owner',income_band:'100to125k',estate_band:'500k_to_1m',happy_place:'Saturday in the garden with the kids.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

**S6 — Business-Owner Exit (55, partner, exit in 5yr)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'thorough',answers:{age:55,household:['partner'],work_status:'business_owner',income_band:'gt200k',estate_band:'2m_to_3m',succession:'exit_5_years',happy_place:'A clean handover and time to sail.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

**S7 — Pre-Retiree Affluent (58, partner, £125-200k)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'standard',answers:{age:58,household:['partner'],work_status:'employed',income_band:'125to200k',estate_band:'1m_to_2m',happy_place:'A slow morning, coffee, and a long book.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

**S8 — Retired Decumulation (66, partner, fully retired)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'standard',answers:{age:66,household:['partner'],work_status:'fully_retired',income_band:'50to100k',estate_band:'500k_to_1m',happy_place:'A quiet Sunday, the grandchildren visiting later.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

**S9 — HNW Multi-Generational (52, partner + adult kids, £5m+ estate)**
```js
(() => { const key='real-wealth:conversation', unlock='real-wealth:report-unlocked', now=new Date().toISOString(); localStorage.setItem(key, JSON.stringify({version:'2',createdAt:now,updatedAt:now,tier:'thorough',answers:{age:52,household:['partner','adult_children'],work_status:'employed',income_band:'gt200k',estate_band:'gt5m',happy_place:'Family Christmases at the cottage.'},currentScreenId:null,visitedOrder:[]})); localStorage.setItem(unlock,'true'); location.href='/conversation/summary'; })();
```

These seeds come directly from `tests/flows.spec.ts` — they are the exact inputs the Playwright tests use, so if they work there they'll work for you.

### Inspect current session

```js
JSON.parse(localStorage.getItem('real-wealth:conversation'));
```

### Check unlock state

```js
localStorage.getItem('real-wealth:report-unlocked');   // 'true' or null
```

---

## 4. Manual journey tests

### Happy path — full end-to-end (3 min)

1. **Reset** — paste the reset snippet from §3 into DevTools.
2. Go to `http://localhost:5000/` — confirm the homepage + tier picker renders.
3. Click "Thorough" tier → should land on `/conversation`.
4. Answer through the questionnaire with a consistent persona. Use this script for S2:
   - Age: 42
   - Household: Partner
   - Work: Employed
   - Income: £50-100k
   - Estate: £500k - £1m
   - Happy place: "Breakfast on the porch."
   - ...continue answering the remaining screens (they're short)
5. Submit → `/conversation/details`.
6. Fill email + consent → submit.
7. Lands on `/conversation/summary` with the 9-page report embedded after the considered list.
8. Scroll through all 9 pages. Confirm:
   - Cover shows first name
   - Tile grid shows per-client statuses (e.g. cash tile has real £k amount)
   - Chart renders
   - Methodology page is present

### Distress safeguard (2 min)

1. Reset. Go to `/conversation`. Walk to Q2.4 (happy place).
2. Enter something concerning — e.g. "I'm not okay, I don't want to be here anymore."
3. Submit the question.
4. Expected: redirect to `/conversation/support` with Samaritans / NHS 111 signposts. **Not** the sales-y summary.

Regression guard: benign Q2.4 answers ("walks with the dog") must NOT trigger this redirect. The E2E test already checks this.

### Email unlock gate (1 min)

1. Paste an S2 seed from §3 **but edit out the `unlockReport: true` / `localStorage.setItem(unlock,'true')` part**, so the session is seeded but unlock is not.
2. Navigate to `/conversation/summary`. The email capture form should be visible; the 9-page report should NOT be visible.
3. Submit a fake email + consent.
4. Report appears inline.

---

## 5. Visual QA — page by page

After running the automated suite, a visual pass catches anything that's semantically correct but looks wrong. Open `http://localhost:5000/report/master/S2` and work through these.

### Cover (page 01)
- [ ] Logo wordmark top-left
- [ ] Date + "· 9 pages" in top-right
- [ ] "Your Wealth Report." H1 visible, no clipping
- [ ] 3-line lede under H1
- [ ] Prepared-for name matches seeded session's first name
- [ ] Bike-image mask is portrait (roughly 0.75:1), logo-shaped
- [ ] Footer: `realwealth.co.uk · 01 · 09`

### Snapshot (page 02)
- [ ] HealthGauge: needle position roughly matches score % (e.g. S2's ~73% → just under the "on track" zone)
- [ ] Gauge title reads as short copy ("You're close to target"), NOT the long banner
- [ ] Donut: slices sum to 100%, legend on right with segment % values
- [ ] Balance strip: 3 cells — Total assets, Total liabilities, Net worth — numbers are real
- [ ] Takeaway banner at bottom with full segment-tailored headline + body

### Planning grid + Goals (page 03)
- [ ] 12 tiles in 3×4 grid
- [ ] Tile colours match status chip — red tiles have orange left-border band
- [ ] Each tile's note reads naturally — numbers substituted (e.g. "£13k covers 3 months") not literal `{cash_k}`
- [ ] "Good / Review / Attention / Not checked" legend visible above the grid
- [ ] Goals matrix below: 3-5 rows with alignment chips

### Projection (page 04)
- [ ] Milestone strip: 4 cells — Today, At retirement, Peak wealth, At age 95 / Funds last to
- [ ] Chart renders — stacked area, retirement marker line, optional depletion marker
- [ ] "How to read this chart" — 4 rows with Good/Watch/Risk/Info chips + title + body
- [ ] CTA panel at bottom — title mentions the recipient name ("Let's talk about you, Sarah")

### Narrative (pages 05–07)
- [ ] Page 05 "Where you are today" renders (currently placeholder, acceptable)
- [ ] Page 06 "Five things" renders with 4 standard + 1 featured card (with illustration if available)
- [ ] Page 07 "Silent gaps" renders (placeholder, acceptable)

### Next step + Methodology (pages 08–09)
- [ ] Page 08 CTA + scope heading + regulatory disclaimer paragraph
- [ ] Page 09 Methodology: H2 + intro + 5 sections (Financial Health Score, Growth/inflation, Answer mapping, What this report cannot show, Regulatory disclosures)
- [ ] Methodology tables render (growth/inflation table, answer-mapping table)

### Print as PDF
- [ ] Ctrl+P → Destination "Save as PDF" → Paper size A4 → Margins None
- [ ] Output: exactly 9 pages, no content split across pages, headers/footers present

---

## 6. Edge-case scenarios worth checking

| Edge case | How to trigger | What to expect |
|---|---|---|
| Very young (grey retirement tile) | S1 seed | Retirement tile = grey, "Too early" note |
| Already retired (grey pension tile) | S8 seed | Pension tile = grey, drawdown-reframe copy |
| Renter (grey mortgage tile) | S1 seed | Mortgage tile = grey, rent-vs-buy copy |
| Business owner (red investment concentration) | S5 or S6 seed | Investment tile = red with `{business_pct}%` substituted |
| No dependants young (grey estate tile) | S1 seed | Estate tile = grey OR amber, not red |
| Active £100k tax trap | S3 seed | Tax tile = red, mentions £100k trap |
| HNW IHT exposure | S9 seed | IHT tile = red with £{iht_exposure_k}k visible |

If any of these produce unexpected tile output, either the engine scoring or the tile content needs adjustment.

---

## 7. Compliance gate verification

### Gate fires correctly in production

```bash
npm run build                                    # WITHOUT bypass
```

Expected: build FAILS loudly with error message like:
```
Error: Content not approved to ship: content/report/health-gauge.md (compliance_status: draft). Set requireApproved=false to bypass in dev.
```

This is the **designed behaviour** — it prevents shipping draft content to end users. Not a bug.

### Bypass works for demo builds

```bash
RW_BYPASS_COMPLIANCE=1 npm run build             # with bypass
```

Expected: build succeeds, produces a deployable `.next/` directory.

### Unit test confirms bypass doesn't leak

```bash
npx tsx --test src/lib/content/__tests__/compliance.test.ts
```

Expected: 19/19 pass. Includes explicit tests for bypass-off (strict blocking) and bypass-on (permissive) modes across all status values.

---

## 8. Production build — full deploy rehearsal

```bash
cd master_template
RW_BYPASS_COMPLIANCE=1 npm run build             # build
RW_BYPASS_COMPLIANCE=1 npm run start             # serve .next on :5000
```

Open http://localhost:5000 and walk a journey. Confirms the production bundle works (not just dev mode).

---

## 9. Mobile / viewport

Dev tools → device toolbar → pick a phone preset (e.g. iPhone 14 Pro, Galaxy S20).

Check:
- [ ] Homepage tier picker wraps cleanly
- [ ] Questionnaire: single question per screen, options tappable (56px min)
- [ ] Summary page: considered list readable, unlock form usable
- [ ] Report: A4-sized pages will be wider than mobile viewport — this is **expected**, the report is print-oriented, not mobile-oriented. Mobile users get horizontal-scroll reflow, which is acceptable for a PDF-shaped document.

---

## 10. Quick reference — commands-to-run-before

| Before... | Run |
|---|---|
| Every commit | `npx tsc --noEmit && npm run content:check` |
| PR / demo | Full automated suite (§1) |
| Production deploy | §1 + §7 (compliance gate) + §8 (full build) |
| Content-only change | `npm run content:check` + restart dev server |
| Engine change | `npx tsx --test scripts/test-tile-scoring.ts` + visual check on affected segments |
| Questionnaire screen change | `npm run content:check` + `npx tsx scripts/test-compass-inputs.ts` |
