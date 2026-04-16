# Decision Log — Master Template

*One-page record of what we took from the Stitch prototype, what we did not, and the open questions we couldn't resolve from the files alone.*

*Written 2026-04-16 alongside the initial scaffold. When a decision below is revisited, append a dated addendum rather than rewriting.*

---

## What we took from the prototype

| From the prototype | What we kept | Why |
|--------------------|--------------|-----|
| Teal gradient hero (`#0c7372 → rgb(17,160,159)`) | Used verbatim as `--gradient-teal` in `tokens.css`. | On-brand; matches the dev site. |
| Sticky minimal header with wordmark left | Kept on homepage and questionnaire. | Low-friction, brand-correct. |
| Orange primary CTA on the hero | Kept as `--brand-orange` primary button. | On-brand; passes AA on paper. |
| Three reassurance pills below hero | Kept as two pills (see below), same visual pattern. | Pattern is good; claim count needed to change. |
| Question-per-screen pacing | Kept as the core questionnaire flow. | Matches the Typeform reference + the spec. |
| Benefit-card strip below the fold | Kept verbatim in shape; copy replaced. | Good visual rest between hero and footer. |
| Hero → scroll-to-tier-picker pattern | Kept. `smooth` scroll, reduced-motion respected. | The explicit CTA click + tier confirmation is part of the spec. |
| Generous whitespace rhythm | Kept in token-level spacing scale. | Matches the brand's "private-bank calm" register. |

## What we did not use — and why

| From the prototype | Why cut |
|--------------------|---------|
| Stock skyscraper photography (growth/preservation question, Regent's Reserve screen) | Explicitly banned in `Homepage Prompt for Agent.md` §What NOT to do. Brand direction is typography-led. |
| "Strategic Focus" / "Stewardship" / "Speak with Advisor" copy | Voice and Tone banned vocabulary. Replaced with warm, plain-spoken alternatives. |
| Material Design colour tokens (`primary-container`, `tertiary-fixed-dim`, etc.) | Unnecessary and conflicting. Replaced with the `var(--brand-*)` tokens from the Brand Assets pack. |
| "Step 7 of 12" progress label | The questionnaire is segment-aware; the per-user question count varies from ~12 to ~30. Replaced with percentage. |
| "A fifteen-minute conversation… Fifteen questions. Five minutes." | Internally contradicting and obsoleted by the tier picker. Homepage Prompt §1/2 supersede. |
| Tailwind CDN script tag | Not appropriate for a production template. Replaced with CSS Modules that consume a single `tokens.css`. |
| Noto Serif / Manrope Google Fonts | Wrong fonts. Replaced with `gelica` + `area-normal` stacks (with TODO for the Typekit kit id). |
| Three-pill row in the hero including `~5 minutes` | Time now lives inside each tier tile. Kept two pills (No sign-in / FCA regulated). |
| Dark-mode variants in the prototype HTML | Out of scope for v1. Can be added later from the same token set. |
| Inline `onclick` scripts | Replaced with React event handlers. |

## What we reshaped

| Element | Change | Reason |
|---------|--------|--------|
| Tier picker | Added (prototype had none). Three tiles, radiogroup pattern, "Most people start here" ribbon on Standard. | Required by Design Agent Prompt — Tier Picker.md. |
| Provocation card | Redesigned per Component Styles.md — 3px orange left bar, 5% teal tint, `role="status"`. | Prototype's ornamental styling was off-tone. |
| Header progress | Percentage-based bar only. Tier identifier shown as a quiet label, not a step count. | Segment-aware form has variable length. |
| Hero H1 | Replaced with the verbatim copy from Brand Assets' Key Sales Messages section. | Prototype copy contradicted itself and named a duration. |

---

## Open questions we could not resolve from the files alone

1. **Typekit kit ID.** Brand Assets/README.md lists this as missing. Until RW supplies it, the template falls back to system serif / sans. Flagged with a `TODO` in `src/styles/tokens.css` and in `src/app/layout.tsx`.
2. **FCA entity name and register number.** Placeholders `[Real Wealth Group Ltd]` and `[xxxxxx]` in `FCAFooter`. Needs RW Compliance Officer sign-off before production.
3. **Provocation compliance status.** Every entry in `src/lib/provocations/catalogue.ts` is shipped as `pending`. None should render in production until CFP + Compliance sign off. Question Design Options §12 item 3 flags this.
4. **The full Question Segment Master matrix.** We translated the rules file (tab 3) into `rules.ts` from the text description in `Segmentation Design Companion.md` §5. The Y/C/N matrix in `matrix.ts` covers the 22 questions actually referenced in the catalogue — the remaining 13 questions from the 35-question Tier A need to be added when their copy is locked.
5. **Urgency CTA copy per band.** `FinalCTA` takes an `urgency` prop but the `this_week` variant currently says "Book a slot for tomorrow" — this is a placeholder. Question Design Options §12 item 10 is an open decision.
6. **Consumer Duty page.** The `FCAFooter` links to `/consumer-duty` but no such route exists yet. The Homepage Prompt calls this out as "link needs to be there; page doesn't need to exist yet".
7. **Analytics wiring.** Master Action Plan A19 specifies four events (`tier_picker_viewed`, `tier_selected`, `tier_confirmed`, `segment_assigned`). The template leaves the instrumentation to a follow-up pass — adding Plausible or a similar first-party tracker is the cleanest fit because it avoids a cookie banner.
8. **Who owns segment-boundary re-banding.** Segmentation Design Companion §11 item 5 — an operational decision rather than a code decision. Noted so the template does not pretend to have answered it.

---

---

## Addendum — 2026-04-16 — Live-site brand match

Added after a pass over https://realwealth.co.uk/ to pull through obvious brand elements the spec docs hadn't captured. Summary of what changed:

| Change | Source |
|--------|--------|
| **Logo SVG wired in** (`public/real-wealth-wordmark.svg`) via a new `Logo` component. Used on the homepage header (teal on paper), the questionnaire header, and the FCA footer (white on navy). | Lifted from `https://dev.realwealth.co.uk/wp-content/uploads/2025/09/logo.svg` and recoloured to `currentColor` so CSS drives the fill. |
| **Primary CTA button re-styled** to an orange gradient with a 2px white border, gelica italic text, and a hover-flip where the text/border go orange and the background goes paper. | Matches the `.wp-block-button__link` style on the live site. |
| **Card shadow softened** to `0 15px 15px -10px rgba(0,0,0,0.05)` for default elevation, and a `--shadow-card` token added for the "sits under the page" selected-state shadow (`0 0 14px rgba(0,0,0,0.2)`). | Matches the card-elevation style on the live site. |
| **Gradient token added** `--gradient-cta` so the CTA gradient is centrally owned. | Same source as above. |

The five colour tokens in `tokens.css` (orange `#ff6801`, teal `#0c7372`, ink `#353535`, navy `#333566`, gold `#ffd33a`) match the live site's `--global-palette1..9` system verbatim — no change needed.

Still not lifted from the live site, deliberately:

- **Lifestyle photography.** The site uses swimming / wellness / mountain imagery. The template has no imagery yet because Real Wealth need to supply the rights-cleared files (flagged in Brand Assets/README.md "What's missing").
- **The site's top navigation** (Home / About / What we do / Who we are). The lead-magnet app is deliberately a single-funnel product — adding the main-site nav would pull users out of the conversation. The homepage has only the wordmark; the questionnaire header has the wordmark + a quiet progress chip. This is consistent with Design Agent Prompt — Wealth Conversation.md §Template 1.
- **The full footer column structure** on the live site (contact, services, social, blog). The FCA footer here is a single-column regulatory disclosure because that's what Voice and Tone.md and Component Styles.md specify for the lead magnet.

---

## Addendum — 2026-04-16 — Content pipeline

Added after reviewing the 2,624-line `Content Brief — Wealth Conversation.md` and agreeing with the client that hand-copying copy into TypeScript stubs was producing drift. Summary of the move:

| Change | Source of truth |
|--------|-----------------|
| Content moved out of hand-written TS stubs into `content/*.md` (one file per entry, YAML frontmatter + markdown body) | `content/**/*.md` |
| Zod schemas added in `content/schema.ts` — every entry is validated on every build | Schema file |
| Build script `scripts/content-build.ts` emits typed catalogues to `src/lib/content/` | Script |
| Compile script `scripts/content-compile-md.ts` regenerates `Content Brief — Compiled.md` for client review | Script |
| `npm run build` now runs `content:build` as a prebuild step — malformed content fails the production build | package.json |

**101 content entries migrated** (28 screens + 26 awareness checks + 24 provocations + 11 segments + 3 pages + 9 microcopy groups).

**Compliance workflow** is now first-class: every provocation in `content/provocations/` has a `compliance_status` field with four values. The `provocationFor(...)` helper in `src/lib/provocations/catalogue.ts` filters by `approved_to_ship` at runtime so unapproved copy physically cannot render in production.

**Client workflow options, in order of friction:**

1. Edit per-entry markdown files directly in VS Code (recommended — the smallest possible change set per review).
2. Review the compiled master doc (`Content Brief — Compiled.md`), hand back a marked-up copy, dev re-splits. Same document shape the client is used to, but *not* the source of truth.
3. Later: Decap CMS / Sveltia CMS can be layered on top of the same files with no schema changes — pure future-proofing.

**Known gaps in the content layer:**

- The app components still reference copy inline (e.g. the TierTile descriptions on the homepage). Wiring each component to `@/lib/content` is a follow-up pass — the pipeline and the copy both exist; the swap is mechanical.
- The provocation runtime lookup is still a placeholder string-contains check. When the rules engine lands (segmentation companion §5), it parses the trigger DSL properly.
- Images are still Unsplash hot-links — Real Wealth's own rights-cleared lifestyle library is still missing per `Brand Assets/README.md`.

*End of decision log.*
