# Wealth Conversation — Master Template

A Next.js 16 / React 19 / TypeScript master template for Real Wealth's "Wealth Conversation" lead-magnet app. Covers the four-screen workflow end-to-end: **homepage → questionnaire → data capture → summary results**.

This is the scaffold. Copy, brand, and segmentation logic are drawn from the files in `/Real Wealth/`; when those documents change, update here in step.

---

## Run

```bash
cd master_template
npm install
npm run dev              # http://localhost:3000
npm run typecheck        # tsc --noEmit
npm run lint             # next lint
npm run build            # validates content + builds Next app
npm run content:check    # validates content only, no writes
npm run content:build    # validates + writes src/lib/content/catalogue.ts
npm run content:compile  # regenerates Content Brief — Compiled.md
```

Node 24 LTS is the current Vercel default and is recommended.

## Content architecture

Every piece of user-facing copy lives under `content/` as per-entry markdown files with YAML frontmatter. The build validates against Zod schemas in `content/schema.ts`, emits typed catalogues to `src/lib/content/`, and regenerates a human-readable `Content Brief — Compiled.md` at the project root on request.

See [`content/README.md`](content/README.md) for the client's authoring guide.

**At a glance:**

- `content/pages/*.md` — homepage, data-capture, summary-page structure
- `content/screens/*.md` — 28 questionnaire screens (5 section transitions + 23 question screens)
- `content/awareness-checks/*.md` — 26 awareness checks with stem + aware/partial/unaware bodies
- `content/provocations/*.md` — 24 provocation cards with compliance status per entry
- `content/segments/*.md` — 9 segment CTAs + 2 overlays
- `content/microcopy/*.md` — errors, toasts, modals, meta, ARIA, emails, progress labels, loading states, voice rules

The app imports generated catalogues from `@/lib/content`. `npm run build` automatically runs `content:build` first, so a malformed content file fails the production build rather than shipping a broken page.

---

## Project layout

```
master_template/
├── README.md                       — this file
├── DECISION_LOG.md                 — what we kept from the prototype, what we cut, open questions
├── package.json
├── tsconfig.json
├── next.config.ts
├── vercel.ts                       — Vercel project config (preferred over vercel.json)
├── src/
│   ├── app/                        — Next.js App Router
│   │   ├── layout.tsx              — root layout, loads tokens once
│   │   ├── globals.css             — imports tokens.css + base.css
│   │   ├── page.tsx                — Homepage (hero, tier picker, freedom quote, benefits)
│   │   ├── page.module.css
│   │   └── conversation/
│   │       ├── layout.tsx          — shared footer wrapper
│   │       ├── page.tsx            — Questionnaire
│   │       ├── page.module.css
│   │       ├── details/page.tsx    — Data capture
│   │       ├── details/page.module.css
│   │       └── summary/page.tsx    — Summary / results
│   ├── styles/
│   │   ├── tokens.css              — THE source of truth for every colour, type size, spacing, motion, z-index
│   │   └── base.css                — minimal reset + element defaults that consume tokens
│   ├── components/                 — typed component library (see below)
│   └── lib/
│       ├── segmentation/           — rules + engine + types
│       ├── questions/              — catalogue + Y/C/N matrix
│       └── provocations/           — compliance-tracked callout library
└── public/
```

---

## Component library

Each component ships with a `.tsx` + `.module.css` + `index.ts` barrel. Everything imports `@/components`.

| Component | Purpose |
|-----------|---------|
| `Button` | Primary / secondary / text variants. 56px tap target, focus-ring. |
| `Card` | Generic paper-surface container with light / tinted tones. |
| `QuestionCard` | One question per screen — serif stem, micro helper, radiogroup slot. |
| `OptionTile` | A single selectable row inside `QuestionCard`. Radiogroup member. |
| `TierTile` | One of the three depth options on the homepage tier picker. |
| `ProgressBar` | Percentage-based progress (NOT "Q 4 of 15" — see §Why percentage below). |
| `AwarenessCheck` | Aware / partial / unaware triad. |
| `ProvocationCard` | Quiet high-care callout that appears after an answer. `role="status"`. |
| `AspirationEcho` | Serif-italic echo of the user's Q2.4 on the summary page. |
| `FinalCTA` | "Let's talk about you." close block. Never gives advice. |
| `FCAFooter` | Regulatory footer. TODO values for FCA number + entity. |
| `IllustrativeChart` | Wraps any chart with the orange uppercase "Illustrative example" tag. |

### Why percentage progress?

The questionnaire is segment-aware. A user on Q7 might see 12 questions in total (S1 — Early Accumulator) or 30 (S5 — Business Owner Growth with all conditionals firing). Telling them they're on "Q 7 of 15" is a lie for eight of the nine segments. The bar and the small label both use percentage. See `Segmentation Design Companion.md` §10.

---

## How to add a question

1. **Add the question to the catalogue.** Append to `src/lib/questions/catalogue.ts`:

   ```ts
   {
     id: 'Q4.2',                           // use the spec's id
     section: 'assets',
     stem: 'Do you own any other property...',
     input: 'radio',
     options: [
       { value: 'none', label: 'No' },
       ...
     ],
   }
   ```

2. **Add the matrix row.** Append to `src/lib/questions/matrix.ts` with a Y/C/N per segment (S1..S9). Follow the spreadsheet order.

3. **(If conditional)** add a predicate in `src/lib/segmentation/engine.ts` under the `conditionals` map.

4. **Add the question id to the ordering array** in `src/lib/questions/matrix.ts` → `questionOrder`.

5. **Run the typecheck.** If a gating answer changes shape, `rules.ts` also needs updating.

---

## How to add a provocation

1. Append to `src/lib/provocations/catalogue.ts` with `compliance_status: 'pending'`. Use the Voice and Tone patterns — quote / fact / magnitude / gentle.

2. Send the entry to the Chartered Financial Planner and the Compliance Officer for sign-off.

3. When approved, flip `compliance_status` to `'approved'`. Nothing shows in production unless approved.

4. If the provocation needs a new trigger question, add the question first (see above).

---

## Email templates

Two production email templates live under `templates/emails/`:

- `templates/emails/confirmation.html` + `confirmation.txt` — the shortlist confirmation sent immediately after data-capture submit.
- `templates/emails/nudge.html` + `nudge.txt` — the +7 day gentle nudge sent if no booking has been made.

Both are table-based, inline-styled, and 600px-wrapped for email-client compatibility. System fonts only; no `<link>` or `@import` web fonts; literal hex colour values throughout.

### Handlebars placeholders

Each template contains Handlebars-style merge fields that the production email engine must substitute before send:

- `{{first_name}}` — recipient's first name
- `{{booking_url}}` — URL to the booking flow
- `{{email1_subject}}` / `{{email1_preview}}` / `{{email1_body_first_para}}` (confirmation)
- `{{email2_subject}}` / `{{email2_preview}}` / `{{email2_body_first_para}}` (nudge)
- `{{footer_regulated}}`, `{{footer_confidentiality}}`, `{{footer_non_binding}}`, `{{footer_security}}`, `{{footer_call_recording}}` — the five legal paragraphs, concatenated in that order

A `<!-- SHORTLIST_ITEMS -->` comment marks the slot the engine fills with the rendered shortlist block.

### How production consumes them

`src/lib/emails/render.ts` exports `loadEmailTemplate(kind)` — a Node-only helper that reads the raw template + plain-text companion from disk and returns `{ html, text, subject, preview }`. The strings are returned unmodified; substitution happens at send time in the email engine, not here. Do not import this helper from client code.

### Regulatory footer — mandatory on every send

Every email MUST include the five legal paragraphs from `content/microcopy/emails.md`, in this order: `footer_regulated`, `footer_confidentiality`, `footer_non_binding`, `footer_security`, `footer_call_recording`. The templates wire them in — do not remove or reorder them.

---

## Known gaps (to resolve before ship)

1. **Typekit kit ID is missing.** `tokens.css` has the two font stacks but falls back to `serif` / `sans-serif`. The root layout has a TODO `<link>` tag. Until Real Wealth supplies the kit, the visual is off-brand.
2. **Logo files.** No SVG wordmark in `public/`. Root layout just uses the text "Real Wealth".
3. **Lifestyle photography.** The homepage hero and summary page currently have no imagery. Real Wealth needs to supply the coastal-path / sailing / grandchildren set.
4. **Typekit-agnostic font-weight hinting.** `gelica ExtraLight Italic 200` is the intended display weight. Once the kit lands, confirm the available weights match.
5. **Compliance approval.** Every entry in `src/lib/provocations/catalogue.ts` ships with `compliance_status: 'pending'`. Nothing surfaces until signed off.
6. **Analytics events.** `tier_picker_viewed` / `tier_selected` / `tier_confirmed` / `segment_assigned` are not yet wired (Plausible recommended — first-party, no cookie banner needed).
7. **The five-question gate state.** The questionnaire page currently drives from a hard-coded demo sequence (`DEMO_SEQUENCE`) so the template renders end-to-end. In production this becomes a call to `segment(gatingAnswers).questionIds` once the five gating answers are captured.
8. **`vercel.ts`** imports `@vercel/config`. Run `npm i -D @vercel/config` once the CLI is installed (see §Greenfield below).
9. **The 35-question catalogue is ~70% filled.** The catalogue implements the questions that demonstrate every input type and every trigger; the remainder (Q3.3, Q4.1, Q4.2, Q5.1, Q6.1, Q7.3, Q8.x, Q9.x) follow the same shape and can be added when the voice-and-tone review has finalised their stems.
10. **No backend.** The data-capture submit is a `router.push` to the summary. A POST to a capture endpoint (e.g. a Vercel Function at `/api/capture`) is the first backend task.

---

## Prototype reconciliation — what we took, what we did not

See `DECISION_LOG.md` for the one-page decision log. Short version:

- **Kept**: the teal gradient hero, the question-per-screen pacing, the sticky minimal header, the generous whitespace rhythm, the three-panel benefit strip.
- **Cut**: the stock skyscraper imagery, the "Step 7 of 12" progress labels, the "Fifteen questions. Five minutes." claim in the hero, the growth-marketing word choices ("Strategic Focus", "Stewardship of your capital", "Speak with Advisor"), the Material Design colour tokens, the Tailwind CDN.
- **Reshaped**: the tier picker (prototype has none; spec requires it), the progress indicator (percentage not step count), the provocation card (prototype uses ornamental quotes; spec is a 3px orange bar and quiet teal tint).

---

## Accessibility

WCAG 2.2 AA is non-negotiable. Every component:

- Has a visible 2px ink focus ring at 3px offset (set in `base.css` via `:focus-visible`).
- Meets 4.5:1 contrast on any coloured text against its background (contrast-verified for the teal/orange/paper/navy pairings in `tokens.css`).
- Respects `prefers-reduced-motion` via a single `@media` block in `base.css` that disables animation globally.
- Uses the correct ARIA pattern (`role="radiogroup"` + `role="radio"` + `aria-checked` for the tier picker and option groups; `role="status"` + `aria-live="polite"` on provocations; `role="progressbar"` + `aria-valuenow` on the progress bar).

---

## Voice and tone

Everything user-facing is written against `Brand Assets/Voice and Tone.md`. Specifically:

- No hype words (`unlock`, `supercharge`, `transform`, `guaranteed`, `proven`).
- No fear appeals, no false urgency, no countdowns.
- Never gives advice. All CTAs invite a conversation.
- The banned-word list applies to ARIA labels too.

When adding copy, read the passage aloud before shipping. If you wouldn't say it to a client across a coffee table, rewrite it.

---

## Testing

End-to-end happy-path tests live under `tests/` and run against a local dev server with Playwright (Chromium only).

```bash
npm install            # picks up @playwright/test as a devDep
npx playwright install chromium    # one-time browser download
npm run dev            # in one terminal — http://localhost:3000
npm run test:e2e       # in another terminal — runs tests/flows.spec.ts
```

The current spec (`tests/flows.spec.ts`) covers four representative segments — S1 Early Accumulator, S3 High-Earner, S6 Business-Owner exit-minded, S9 HNW. Each test seeds a complete `real-wealth:conversation` session into localStorage, navigates to `/conversation/summary`, and confirms the page renders with the expected gating answers. The S1 case additionally walks the first questionnaire screens to smoke-test the engine wiring end-to-end.

Override the base URL with `PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e` if Next picked an alternate port.

### Distress-indicator safeguard

The Q2.4 "happy place" free-text answer is scanned client-side by `src/lib/safeguards/distress.ts` on data-capture submit. If the answer contains a phrase suggesting the user is in crisis (suicide ideation, self-harm, hopelessness, etc.), the user is routed to `/conversation/support` — a quiet, non-commercial page with Samaritans / MoneyHelper / NHS 111 signposts — instead of the sales-y summary. **This is a UX-level safeguard only.** A production deployment must also wire up server-side moderation on submit and a human review queue with escalation to a Vulnerable Customer Specialist under Consumer Duty.

---

## Report routes

The 9-page Compass report is rendered across three routes depending on the audience:

| Route | Purpose |
|-------|---------|
| `/report/master/[segment]` | Production-shaped 9-page report for one of the 9 segments (`S1`..`S9`). Cover → Snapshot → Planning grid + Goals → Projection + CTA → Narrative (5-7) → Next step → Methodology. SSG-rendered; pages 02, 03, 09 are fully content-driven from `content/report/`; pages 05-07 are deliberate placeholders until the narrative components land. Index page at `/report/master`. |
| `/report/master-fields` | Debug / field-map view of the same 9 pages. Content slots render as their data-field paths (e.g. `{view.headline.title}`) instead of copy, so you can eyeball which source drives each slot. Engine-driven numbers (gauge %, totals, chart) still render at real values. Uses S2 band values. |
| `/conversation/summary` | Live summary page. Server-component wrapper pre-renders one `CompassReportSection` per segment, `SummaryClient.tsx` embeds the correct one inline after the email-unlock considered-list. The page entry is Phase 1B of the PDF-report plan. |

Preview-only routes (dev/design agents, not linked from the live site):

- `/report/compass-preview` — tab-picker for all 9 segments. Client-side.
- `/report/compass-client-view/[segment]` — clean client-facing view without dev chrome.

Plan docs: see `Lead Magnet App/MASTER_REPORT_PLAN.md` for the page-by-page data contract, and `Lead Magnet App/PHASE_1_NOTES.md` for the feature-branch history.
