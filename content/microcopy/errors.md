---
id: errors
title: Field validation and error messages
entries:
  - key: required_generic
    value: "We'll need an answer here to continue."
  - key: email_invalid
    value: "That email doesn't look quite right — a typo somewhere?"
  - key: email_blank
    value: "We need an email so we can send you the picture."
  - key: first_name_blank
    value: "A first name helps us address you properly."
  - key: phone_invalid
    value: "That number doesn't look like a UK mobile — try again or leave it blank."
  - key: consent_unchecked
    value: "We need your consent to send the shortlist — this box is how we confirm it."
  - key: slider_default
    value: "Move the slider to where feels right for you — any value is fine."
  - key: number_out_of_range
    value: "That sits outside what this tool is built for — give us your best estimate."
  - key: radio_unanswered
    value: "Pick whichever feels closest — there's no wrong answer."
  - key: network_error
    value: "Something on our end got stuck. Give it a moment and try again."
  - key: session_expired
    value: "Welcome back. It's been a while, so we've started a fresh session — your old answers are gone."
---

Error messages apologise for the system's lack of clarity, not for the user's mistake. Quiet, specific, actionable. Never red-and-bold shouting.

**Pattern** — single sentence, area-normal 14px, `--ink-muted`, small `alert-circle` icon left. Inline below the field it refers to. Appears on blur or on submit, whichever comes first. Dismissed when the user starts typing again.

No message ever includes the words *error*, *invalid*, *wrong*, *failed*. No exclamation marks. No second-person critical register (*"you forgot to…"*).
