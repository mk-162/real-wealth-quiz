---
id: loading_states
title: Loading, empty, and edge states
entries:
  - key: initial_load
    value: "Bringing the page together — one moment."
  - key: summary_computing
    value: "Putting the picture together."
    note: "Skeleton state — only shown if the considered list takes more than 500ms."
  - key: offline_banner
    value: "You've gone offline. We'll keep your place — come back when you're connected."
---

- Initial load — a single centred line, area-normal regular 16px, stone. Rare in App Router; server components render synchronously.
- Between screens — no loading state, just a 250ms cross-fade.
- Summary page computing — calm skeleton (three rounded rectangles in `--surface-container-low`, no spinner).
- Offline / network lost — a small paper-background banner at the top of the viewport, ink text, 14px. Dismisses on reconnect.
