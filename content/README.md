# Content — Real Wealth Wealth Conversation

*This folder holds every piece of copy the app shows to a user. One file per content entry, so changes are small, reviewable, and easy to compare. Edit these files directly, commit, and the site rebuilds.*

---

## How to edit

The short version:

1. Open the file for the piece of copy you want to change. The folder names tell you what you're looking at (`provocations/`, `awareness-checks/`, `screens/`, `segments/`, `pages/`, `microcopy/`).
2. Edit the text on the right-hand side of the `---` line.
3. Save. Commit. That's it.

Every file has two parts:

```markdown
---
id: pitfall.iht_2m_cliff
trigger: "estate >= 2_000_000"
compliance_status: draft
---

# Headline
The £2m cliff.

# Body
Above £2 million of total estate, the residence nil-rate band starts tapering away —
£1 of relief lost for every £2 over.

# Close
Worth a conversation.
```

- The block between the two `---` lines is **frontmatter** — structured data the app needs (the id, what triggers it, compliance status, etc.). Change values cautiously — the app won't build if you break the structure.
- The block below the second `---` is **the copy**. Each `# Heading` starts a named section. Edit freely — the app will pick up the change.

## Folders

| Folder | What's in here | When to edit |
|---|---|---|
| `pages/` | Homepage, data-capture, summary-page structure | When the structure or top-level copy of a page changes |
| `screens/` | The questionnaire screens, one file per screen | When a question wording, option, or helper needs to change |
| `awareness-checks/` | The 20 "something worth noticing" moments | When the stem or the three-body response copy changes |
| `provocations/` | The 24 quiet callouts triggered by answers | When a provocation headline/body needs a rewrite. **CFP + Compliance sign-off required before `compliance_status` can flip to `approved_to_ship`.** |
| `segments/` | The 9 summary-page CTAs + 2 overlays | When a segment's closing call-to-action changes |
| `microcopy/` | Errors, toasts, modals, meta, ARIA, emails | When small interstitial strings change |

Each content subfolder now has its own `README.md` with the field dictionary for that folder. Start there if you need to know what a frontmatter key does before editing it.

## The compiled master doc

Prefer reading the whole thing in one document? Run:

```bash
npm run content:compile
```

This regenerates `Content Brief — Compiled.md` in the project root. It's a read-only artefact of everything in this folder concatenated into a single review document — same shape as the original content brief, always in sync with the files.

If you'd rather edit the compiled document and hand it back to the developer, that's fine too — the developer runs a script that splits it back into the per-file structure.

## Compliance workflow for provocations

Every file in `provocations/` has a `compliance_status` field. The app honours it at runtime:

| Status | Rendered where |
|---|---|
| `draft` | Development previews only (not production) |
| `cfp_signed` | Staging previews only |
| `compliance_signed` | Staging + production, with a *"Pending final approval"* prefix |
| `approved_to_ship` | Freely rendered in production |

A Chartered Financial Planner reviews, then sets `compliance_status: cfp_signed` and fills `cfp_signoff_date`. Compliance reviews next, sets `compliance_status: approved_to_ship` and fills `compliance_signoff_date`. Both reviews happen as pull requests against this folder — every review has an auditable diff.

## Running the build

From the project root:

```bash
npm run content:check     # validates every file, prints errors, does not write
npm run content:build     # validates and writes typed catalogues for the app
npm run content:compile   # regenerates Content Brief — Compiled.md
```

`npm run build` runs `content:build` automatically first. If anything is malformed, the build fails and tells you which file is wrong.

## What happens when a file is wrong

Example error:

```
✗ content/provocations/iht-2m-cliff.md
    · compliance_status must be one of: draft | cfp_signed | compliance_signed | approved_to_ship
    · headline body section missing
```

Fix what it points at, rebuild.

## If the structure needs to change

The structure is defined in `content/schema.ts`. Adding a new field to any content type is a small dev change; the schema is the conversation between client and engineering. Flag it in a pull request comment and the developer will extend the schema.
