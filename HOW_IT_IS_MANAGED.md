# How the App Is Managed

A plain-English, step-by-step guide to editing the Wealth Conversation service after launch — where the master lives, what to change for a given client request, and how changes get safely to production.

Read this first if someone asks "can you tweak that question?" or "change the CTA for retirees" and you are not sure which file to open.

---

## 1. The big picture

The service is a Next.js app (folder: `master_template/`). Every piece of user-facing content is stored as a markdown file under `master_template/content/`. A build script validates those files, compiles them into typed code, and the app reads from that. One spreadsheet — `Question Segment Master.xlsx` — still controls one thing only: which questions each of the 9 segments sees.

So there are exactly **two places** where "the source of truth" lives:

1. **`master_template/content/`** — all wording, options, CTAs, error messages, tone copy.
2. **`Question Segment Master.xlsx`** (Sheet 2) — the Y / C / N matrix that decides which questions appear for each segment.

Everything else (the catalogues the app imports, the JSON matrix, the rendered HTML for the client review site) is **generated**. Do not edit generated files by hand — they will be overwritten on the next build.

---

## 2. Golden rules before you edit anything

1. Work on the `dev` branch. Never commit to `main` directly — `main` is what Vercel ships to production.
2. Pull the latest `dev` before you start: `git pull origin dev`.
3. Edit only the source files described below. If a file has a comment saying "auto-generated, do not edit", close it.
4. When done, run the validation suite (Section 8) before pushing.
5. If in doubt, create a new branch off `dev` (e.g. `dev-client-edits-2026-04`) and open a PR back into `dev`.

---

## 3. Common client requests — what to edit

Use the table below as a lookup. File paths are relative to `master_template/`.

| Client says... | Edit this | How to do it |
|---|---|---|
| "Change the wording of Q3.1" | `content/screens/3.1-*.md` | Edit the headline, sub, or inputs in the markdown body. Save. |
| "Add a new answer option to Q2.3" | `content/screens/2.3-*.md` | Add an item under the `inputs` frontmatter block. |
| "Change what shows on the retiree's summary CTA" | `content/segments/s8-*.md` | Edit the CTA heading and body. |
| "Update the error message when someone skips a required field" | `content/microcopy/errors.md` | Edit the entry for the relevant error key. |
| "Change the homepage hero line" | `content/pages/home.md` | Edit the hero block. |
| "Add a compliance callout when someone answers X" | `content/provocations/<slug>.md` | Create a new file. Set `compliance_status: draft` until signed off. |
| "Change who sees Q5.3 (business exit)" | `Question Segment Master.xlsx` (Sheet 2), then run `npm run parse:matrix` | Flip the Y/C/N cell for the segment. |
| "Change how the 5 gating answers decide the segment" | `src/lib/segmentation/rules.ts` | Edit the ranked predicates. Engineering change — not content. |
| "Change which question comes next after Q2.4" | `src/lib/segmentation/engine.ts` or the screen frontmatter | Ordering is driven by matrix + frontmatter; ask an engineer if unsure. |
| "Update the Voice and Tone rules" | `../Brand Assets/Voice and Tone.md` (parent folder) | Edit the source. Run `npm run client-review:build` to refresh the review site. |

---

## 4. Step-by-step: editing a question

This is the most common request. Example: the client wants to soften the wording of Q1.1 ("What brought you here today?").

1. Open a terminal in `master_template/`.
2. Make sure you are on `dev`:
   ```bash
   git status
   git checkout dev
   git pull
   ```
3. Open `content/screens/1.1-what-brought-you.md` in your editor.
4. Edit the headline or sub-copy. Do not change the `id` field in the frontmatter — the app uses it to find the screen.
5. Save the file.
6. In the terminal, validate:
   ```bash
   npm run content:check
   ```
   If this fails, the error message names the file and the field. Fix it before moving on.
7. Preview locally:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000/conversation and walk to Q1.1.
8. Commit:
   ```bash
   git add content/screens/1.1-what-brought-you.md
   git commit -m "Soften Q1.1 headline per client feedback"
   git push origin dev
   ```
9. Vercel will build a preview deployment for the `dev` branch. Share that preview link with the client for sign-off.
10. Only when the client approves: open a PR from `dev` to `main`. Merging to `main` ships to production.

---

## 5. Step-by-step: changing which segments see a question

This is a matrix change, not a content change. Example: the client decides S1 (Early Accumulator) should also see Q3.2 (monthly essential spending).

1. Open `Question Segment Master.xlsx` (in the `Real Wealth/` folder, one level above `master_template/`).
2. Go to Sheet 2. Find the Q3.2 row and the S1 column. Change the cell from `N` to `Y`.
3. Save and close the file.
4. Regenerate the matrix JSON:
   ```bash
   npx tsx scripts/parse-segment-master.ts
   ```
5. This writes `content/generated/matrix.json`. Do not edit that file by hand.
6. Run the full content check:
   ```bash
   npm run content:build
   ```
7. Preview locally and confirm S1 users now see Q3.2. (Easiest way: use the dev-only segment override URL parameter — ask an engineer if you do not remember it.)
8. Commit both the xlsx and the regenerated matrix.json:
   ```bash
   git add "../Question Segment Master.xlsx" content/generated/matrix.json
   git commit -m "S1 now sees Q3.2 per client request"
   git push origin dev
   ```

---

## 6. Step-by-step: adding or editing a provocation

Provocations are the short commercial callouts that fire on specific answer patterns (e.g. "the GBP 2m cliff" for estates over GBP 2m). Every provocation needs CFP and Compliance sign-off before it can render in production.

1. Open `content/provocations/` and either edit an existing file or copy one as a template.
2. Name the new file with a clear slug, e.g. `content/provocations/new-pension-allowance.md`.
3. Fill in the frontmatter: `id`, `name`, `trigger`, `segments`, `compliance_status`.
4. Set `compliance_status: draft` while you are drafting.
5. Write the body copy in markdown.
6. Run `npm run content:check`.
7. Send the file to the CFP and the Compliance reviewer. They review the body and the trigger logic.
8. When both approve, change `compliance_status` to `approved_to_ship`. **This is the flag that lets it render in production.**
9. Commit and push on `dev`. PR to `main` only after sign-off is captured in the commit history (e.g. co-author tags or a linked approval).

---

## 7. How a change flows to production

```
Your edit (markdown / xlsx)
   ↓
npm run content:build (validates + compiles)
   ↓
src/lib/content/catalogue.ts (auto-generated typed objects)
   ↓
npm run dev / npm run build (Next.js reads the catalogue)
   ↓
Commit on dev → Vercel preview deploy
   ↓
Client sign-off
   ↓
PR dev → main → merge → Vercel production deploy
```

Key points:

- **`dev` is safe to break.** If a build fails on `dev`, production is untouched.
- **`main` is production.** Anything merged there deploys immediately. Never push directly to `main`.
- **Content validation is a build gate.** If a markdown file is malformed, `npm run build` fails — so a broken content file cannot reach production.

---

## 8. The full validation suite

Before pushing anything non-trivial, run all of these in `master_template/`:

```bash
npm run content:check     # validates every content file against the schema
npm run lint              # ESLint
npm run typecheck         # TypeScript
npm run build             # full Next.js production build
npm run voice:check       # flags banned phrases against the Voice and Tone rules
npx playwright test       # end-to-end user journey tests
```

The safe dev checkpoint at commit `0eaa2a4` passed all of the above. If your change breaks any of them, fix it before pushing or revert to the checkpoint.

---

## 9. Refreshing the client review site

The `/client-review` dashboard (at `http://localhost:3000/client-review`) is a static bundle generated from the markdown docs. If you edit any of the source documents it links to — README, Decision Log, Voice and Tone, this guide, etc. — rebuild it:

```bash
npm run client-review:build
```

Then commit the regenerated files under `public/client-review/` along with the source markdown.

---

## 10. Key files map

| File or folder | What it controls |
|---|---|
| `content/screens/*.md` | Question wording, options, layout |
| `content/pages/*.md` | Homepage, data-capture, summary structure |
| `content/segments/*.md` | Segment-specific CTAs and overlays |
| `content/provocations/*.md` | Compliance-gated callouts |
| `content/awareness-checks/*.md` | "Something worth noticing" educational prompts |
| `content/microcopy/*.md` | Errors, toasts, emails, ARIA labels |
| `content/schema.ts` | Validation rules for every content type |
| `Question Segment Master.xlsx` (Sheet 2) | Which questions each segment sees (Y / C / N) |
| `scripts/parse-segment-master.ts` | Reads the xlsx and writes `matrix.json` |
| `scripts/content-build.ts` | Validates and compiles all markdown into typed code |
| `scripts/build-client-review-site.mjs` | Rebuilds the `/client-review` dashboard |
| `src/lib/segmentation/rules.ts` | How answers map to one of 9 segments |
| `src/lib/segmentation/engine.ts` | Conditional question-display logic |
| `src/lib/content/catalogue.ts` | **Auto-generated** — do not edit |
| `src/lib/content/generated-order.ts` | **Auto-generated** — do not edit |
| `content/generated/matrix.json` | **Auto-generated** — do not edit |

---

## 11. Who owns what

| Area | Owner |
|---|---|
| Copy, tone, voice | Real Wealth content lead |
| Provocations and awareness checks | Real Wealth CFP + Compliance (must sign off) |
| Segment rules and engine | Engineering |
| Question-segment matrix (xlsx) | Real Wealth content lead, with engineering review |
| Visual design and brand assets | Real Wealth brand + design |
| Deployment (Vercel) and infrastructure | Engineering |

---

## 12. If something goes wrong

- **Local build fails after an edit:** read the error output. The validator names the file and field. Revert your change with `git checkout -- <file>` if stuck.
- **Preview deployment looks wrong:** confirm you pushed to `dev`, not a feature branch Vercel is not watching.
- **Production looks wrong:** revert the merge commit on `main`. Do not hotfix on `main` — fix on `dev` and PR again.
- **You are not sure which file a piece of copy lives in:** search for the visible text:
  ```bash
  grep -r "the exact phrase from the UI" content/
  ```

---

## 13. Quick reference

```bash
# Start work
git checkout dev && git pull

# Edit files under content/ or the xlsx

# Validate
npm run content:check
npm run lint && npm run typecheck

# Preview
npm run dev              # http://localhost:3000

# Ship
git add . && git commit -m "..." && git push origin dev
# Then PR dev → main when client approves
```

That is the whole system.
