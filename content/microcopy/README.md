# Microcopy README

This folder contains small reusable strings: errors, loading states, ARIA labels, emails, modals, progress copy, toasts, and voice rules.

Use this folder for small wording changes that are not tied to one questionnaire screen.

## Frontmatter Fields

| Field | What it does |
|---|---|
| `id` | Unique microcopy group ID. Usually matches the filename. |
| `title` | Human-readable title for the group. |
| `entries` | List of key/value strings used by the app. |

## Entry Fields

| Field | What it does |
|---|---|
| `key` | Stable lookup key used by the app. Do not rename without checking code. |
| `value` | The text shown to the visitor or used in generated messaging. |
| `note` | Optional admin note for context. |

## Editing Notes

- Prefer changing `value`, not `key`.
- Keep messages short and specific.
- For errors, avoid blaming the visitor. Say what is needed to continue.
- After editing, run `npm run content:check`.

