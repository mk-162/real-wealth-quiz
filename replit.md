# Real Wealth — The Wealth Conversation

A Next.js (App Router) lead-magnet quiz for [realwealth.co.uk](https://realwealth.co.uk). The user works through a series of empathetic, brand-aligned questions and receives a tailored "things worth a conversation" shortlist with a final CTA. No advice is given.

## Stack
- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: CSS Modules + a single design-token file (`src/styles/tokens.css`)
- **Fonts**: Adobe Typekit kit `ayo5bxu` — `gelica` (italic serif display) + `area-normal` (body)
- **Content**: markdown/YAML files in `content/` consumed via `pageValue()` / `microcopy()` helpers in `src/lib/content`
- **Sessions**: persisted client-side via `src/lib/questionnaire/session`
- **Dev port**: 5000 (bound to `0.0.0.0` for the Replit preview)

## Workflows
- `Start application` runs `npm run dev` on port 5000.

## Design system
The single source of truth lives in `src/styles/tokens.css`. Component CSS modules consume tokens — no raw hex values elsewhere.

### Brand voice (visual)
- **Display**: `gelica` italic, weight 300, large negative tracking. Used for hero headlines, question stems, intro headlines, summary moments, and benefit row sub-heads.
- **Body / UI**: `area-normal` 400–600. All form labels, paragraph copy, helper text.
- **Primary CTA**: orange-gradient pill (`--gradient-cta`) with italic gelica caption and a chevron suffix. Defined as `Button.primary`.
- **Surfaces**: warm off-white `--paper-warm` page background; pure `--paper` for cards and the right-column panel; teal gradient (`--gradient-teal`) for hero / transition / summary echo sections.

### Selection-state pattern
OptionTile, CardGrid and TierTile all follow the same rule: selected state uses an **inset box-shadow ring + soft tint**, never a border-width change. This eliminates layout shift on selection. Hover uses subtle lift (`translateY(-1px or -2px)`) + small shadow.

### Spacing
- 8pt grid (`--space-2xs` … `--space-hero`).
- Page edges use `--gutter: clamp(1rem, 4vw, 2.5rem)` so they scale fluidly across mobile → tablet → desktop.
- Question shell two-column grid breaks at 1024px and gets generous gutter at 1280px+.
- Mobile screens reserve `100px` bottom padding so the dev nav chip never covers the action row.

### Accessibility
- All `--ink-*` text tokens clear WCAG AA on the warm paper background.
- `--stone` is **decoration only** (borders, dividers). Use `--ink-soft` for small/secondary text.
- Focus states: 2–4px teal ring (`--teal-tint-15`) with no layout shift.
- Form errors are wired with `aria-describedby` + `role="alert"` (see `src/app/conversation/details/page.tsx`).
- Reduced motion preferences are respected globally in `base.css`.

## Architecture
```
src/
  app/
    page.tsx                            # Homepage (hero + tier picker + freedom moment + benefits)
    layout.tsx                          # Loads tokens + base + Typekit
    conversation/
      page.tsx                          # Questionnaire engine + sticky header
      details/page.tsx                  # Lead capture form
      summary/page.tsx                  # Aspiration echo + considered list + charts + CTA
      support/page.tsx                  # Vulnerable-customer signposting
  components/
    Button/                             # Primary / secondary / text / outline-on-dark
    QuestionShell/                      # 2-column shell with kicker/stem/pullquote/image + panel
    ScreenRenderer/                     # Renders intro / centred / asymmetric / transition screens
    OptionTile, CardGrid, TierTile/     # Selectable surfaces (unified selection pattern)
    CurrencySlider, LikertFive          # Range inputs
    AspirationEcho, FinalCTA            # Summary moments
    FCAFooter, ProgressBar, Logo        # Chrome
  lib/
    content/                            # Markdown/YAML loaders
    questionnaire/                      # Engine + session persistence
    segmentation/                       # Segment assignment + upgrade rules
    safeguards/distress.ts              # Vulnerable-customer keyword regex
  styles/
    tokens.css                          # Design tokens (the source of truth)
    base.css                            # Element resets, focus, container utilities
content/                                # Pages, microcopy, segmentation rules — all editable copy
```

## Editing copy vs editing styles
**All copy lives in `content/` markdown/YAML files**, surfaced via `pageValue()` and `microcopy()` helpers. Do not hard-code copy in components — only structure and styles.

## Recent work
- Migrated from Vercel to Replit (port 5000, dev/start scripts updated).
- Comprehensive design / UX overhaul: italic serif display, orange-gradient CTAs, organic hero image mask, unified non-shifting selection states, soft consent card on details page, AA-contrast text tokens, fluid responsive gutters, summary hero clear of the dev nav.
