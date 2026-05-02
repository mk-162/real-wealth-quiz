# Client Readiness Audit - Real Wealth Lead Magnet App

Date: 2026-04-16  
App path: `C:\Users\matty\Real Wealth\Real Wealth\master_template`  
Audit output/screenshots path: `C:\Users\matty\Real Wealth\Lead Magnet App`

## Executive Status

The app is technically runnable and the automated checks are in a much better state:

- Content validation passes.
- TypeScript passes.
- Production build passes.
- Playwright smoke tests pass across 9 segment scenarios.
- ESLint has no errors, only 5 image-optimization warnings after the partial image work was rolled back.

This is demoable as an internal prototype or controlled walkthrough. It is not yet ready for an external client review without a few presentation and compliance decisions, mainly because draft compliance content and dev-only chrome can still appear depending on how the app is served.

## Verification Results

Last verified from `master_template` on 2026-04-16:

| Check | Result | Notes |
| --- | --- | --- |
| `npm run content:check` | Pass | 28 screens, 26 awareness checks, 24 provocations, 11 segments, 5 pages, 9 microcopy files. Voice-and-tone scan: 0 warnings. |
| `npm run lint` | Pass with warnings | 0 errors, 5 warnings. All warnings are `@next/next/no-img-element`. |
| `npm run typecheck` | Pass | `tsc --noEmit` completed successfully. |
| `npm run build` | Pass | Next build completed and prerendered 8 app routes plus not-found. |
| `npm run test:e2e` | Pass | 9 Playwright tests passed in Chromium. |

Build warning to resolve:

- Next.js inferred the workspace root as `C:\Users\matty` because multiple lockfiles exist. Set `turbopack.root` in `next.config.ts`, or remove the unrelated parent lockfile if appropriate.

Current lint warnings:

- `src/app/page.tsx`: homepage hero uses `<img>`.
- `src/components/ImagePullquote/ImagePullquote.tsx`: pullquote image uses `<img>`.
- `src/components/Logo/Logo.tsx`: logo uses `<img>`.
- `src/components/QuestionShell/QuestionShell.tsx`: two questionnaire images use `<img>`.

These are performance warnings, not functional failures. The partial `next/image` conversion was rolled back deliberately to avoid leaving the other agent with half-converted image behavior.

## Changes Made In This Session

There is no git repository in the audit folder, so this list is based on direct file inspection and command history rather than `git diff`.

### Kept

| File | Change | Risk |
| --- | --- | --- |
| `src/app/conversation/summary/page.tsx` | Deferred session load state update so React hook lint no longer errors. | Low. Slight hydration timing change. |
| `src/lib/questionnaire/engine.ts` | Deferred several effect-driven state updates and memoized active screen state to satisfy React 19 lint rules. Also deferred stale-session `setCurrentId`. | Moderate. Core questionnaire timing changed, but typecheck, build, and 9 E2E tests pass. Coordinate with any agent editing this file. |
| `src/app/conversation/page.tsx` | Final content screen now routes directly to `/conversation/summary` (the previous `/conversation/details` page was retired — capture happens inline on the summary). | Low to moderate. Behaviorally desirable, but still worth manual QA. |
| `content/microcopy/voice-rules.md` | Reworded the banned-word guidance so the content QA script does not flag the rule itself. | Very low. |
| `eslint.config.mjs` | Replaced anonymous default export with `const config` plus `export default config`. | Very low. |
| `src/lib/questionnaire/triggers.ts` | Removed stale `eslint-disable-next-line no-console`. | Very low. |
| `src/lib/questionnaire/visibility.ts` | Removed stale `eslint-disable-next-line no-console`. | Very low. |

### Rolled Back

The partial `next/image` conversion was reverted:

| File | Current status |
| --- | --- |
| `next.config.ts` | Back to no Unsplash `remotePatterns` image config. |
| `src/app/page.tsx` | Homepage hero restored to `<img loading="eager">`. |
| `src/components/ImagePullquote/ImagePullquote.tsx` | Restored to `<img loading="lazy">`. |
| `src/components/Logo/Logo.tsx` | Restored to plain `<img>`. |
| `src/components/QuestionShell/QuestionShell.tsx` | Was not changed by the interrupted edit; still uses `<img>`. |

### Generated/Build Output

`npm run build` runs `content:build`, which rewrote `src/lib/content/catalogue.ts`. That is expected generated output, but the other agent should be aware of it if they are editing generated content or comparing timestamps.

## Client-Demo Blockers

These should be handled before showing the app as anything more than an internal work-in-progress.

1. Dev navigation can appear in development.

   `RootLayout` always renders `DevNav`, and `DevNav` hides itself only when `process.env.NODE_ENV === 'production'`. If the app is shown with `npm run dev`, the floating dev strip will be visible. For a client demo, either serve the production build with `npm run build` then `npm run start`, or hide `DevNav` behind an explicit env flag.

2. Compliance statuses are all draft.

   Current content counts:

   - Awareness checks: 26 draft, 0 approved.
   - Provocations: 24 draft, 0 approved.

   Inline provocations are filtered through `isCompliancePublishable`, so draft provocations should not appear in the questionnaire. The summary page is different: it builds the considered list from all matching provocations and labels unapproved items as draft. That means a summary page can show `DRAFT - pending compliance` to the user. This is the largest client-demo risk.

   Recommended demo fix: either filter non-approved summary items, or mark a small signed-off subset as `approved_to_ship` for demo content only.

3. Booking links are placeholders.

   Segment CTA files use placeholder Calendly URLs such as `calendly.com/real-wealth-standard-call-placeholder`. `FinalCTA` normalizes these to `https://...`, so they will open, but they are not live client-ready destinations.

4. Lead-capture backend is minimal.

   The summary page hosts an inline `ReportCapture` form that POSTs to `/api/report/send` (Resend). On 200 the unlock flag flips and the embedded report opens. There is no DB-backed audit trail, CRM integration, or booking handoff yet — Resend's delivery log is the MVP compliance record. When `RESEND_API_KEY` is unset the API returns 200 in non-production so the summary can still be previewed end-to-end.

5. Privacy and Consumer Duty content need sign-off.

   `content/pages/privacy.md` and `content/pages/consumer-duty.md` contain compliance-review notes/placeholders. Privacy also needs live references such as ICO registration details.

6. Distress safeguard is client-side only.

   `src/lib/safeguards/distress.ts` clearly notes this. Production needs server-side moderation and a human review/escalation queue.

7. Visual assets and brand assets need final confirmation.

   The app currently uses a Real Wealth wordmark SVG and external lifestyle imagery. Confirm final logo usage rights, Typekit kit, photography direction, and whether Unsplash images are acceptable for client review.

## Non-Blocking Technical Issues

1. Image optimization warnings remain.

   The current `<img>` usage is acceptable for prototype stability. For production, convert images to `next/image` in one coherent pass and configure allowed remote hosts or move assets into `public/`.

2. Next workspace root warning.

   The build passes, but the root warning is noisy and can confuse deployment. Set the root explicitly in `next.config.ts`.

3. E2E tests are smoke tests.

   The 9 Playwright tests seed sessions and verify segment summary rendering. They do not yet walk the whole 28-screen questionnaire, validate every conditional reveal, or test the details form submission path.

4. Existing docs are partly stale.

   `README.md` and `DECISION_LOG.md` still mention older gaps such as missing logo and missing Consumer Duty route, both of which appear to have changed. Update docs before client handoff.

5. Summary charts are illustrative placeholders.

   The three chart panels are styled placeholders, not data-driven charts. That is acceptable if framed as illustrative examples, but they should not be mistaken for personalized calculations.

## Recommended Handoff Plan

### Phase 1 - Make A Clean Client Demo

1. Decide whether to keep the current `engine.ts` lint fixes.

   Recommendation: keep them unless the other agent is actively rewriting the questionnaire engine. They pass build and E2E, but they touch core state timing.

2. Hide all draft compliance output from user-facing screens.

   Minimum fix: summary considered-list should filter to approved content in production/demo mode, or avoid rendering draft labels to clients.

3. Remove or gate `DevNav` for demo.

   Best demo route: `npm run build` then `npm run start`, because `DevNav` returns `null` in production.

4. Replace placeholder booking links.

   Use live Calendly links, a disabled demo CTA, or a route to a known booking placeholder page controlled by Real Wealth.

5. Run a final visual screenshot pass.

   Required pages:

   - `/`
   - `/conversation?tier=quick`
   - `/conversation?tier=standard`
   - `/conversation/summary`
   - `/conversation/support`
   - `/privacy`
   - `/consumer-duty`

   Viewports:

   - 375px mobile
   - 768px tablet
   - 1440px desktop

### Phase 2 - Prepare For Production

1. Add `/api/capture` or equivalent backend.

   Store contact details, questionnaire answers, assigned segment, consent timestamps, source URL, and submission metadata.

2. Add email/CRM workflow.

   Wire confirmation and nudge emails, ensure legal footer copy is included, and track booking status.

3. Add server-side vulnerable-customer handling.

   Client regex is not enough. Add server moderation and a documented escalation path.

4. Complete compliance approval workflow.

   Move approved awareness/provocation content from `draft` to `approved_to_ship` only after sign-off.

5. Add analytics.

   Suggested events:

   - `tier_picker_viewed`
   - `tier_selected`
   - `conversation_started`
   - `section_completed`
   - `segment_assigned`
   - `details_submitted`
   - `booking_cta_clicked`
   - `support_route_triggered`

6. Expand tests.

   Add tests for:

   - required-answer gating
   - conditional reveal behavior
   - details form validation
   - distress safeguard routing
   - final CTA link normalization
   - summary filtering of draft compliance content

## Current Recommended Commands

Use these to reproduce the current passing state:

```powershell
Set-Location "C:\Users\matty\Real Wealth\Real Wealth\master_template"
npm run content:check
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Expected current result:

- content: pass
- lint: pass with 5 image warnings
- typecheck: pass
- build: pass with Next workspace-root warning
- e2e: 9 passed

## Bottom Line

The implementation is close to a clean technical demo. The main risk is not build stability; it is presentation and compliance polish. Before a client sees it, hide dev chrome, prevent draft compliance content from appearing, replace placeholder booking links, and decide whether the demo is explicitly a prototype or a near-production walkthrough.
