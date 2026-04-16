---
id: voice_rules
title: Voice and tone guardrails for auto-generated strings
entries:
  - key: rule_case
    value: "Use sentence case. No Title Case on buttons except proper nouns."
  - key: rule_exclamation
    value: "Avoid exclamation marks entirely."
  - key: rule_banned_words
    value: "Avoid the disallowed hype verbs listed in Voice and Tone section 4."
  - key: rule_advice_verbs
    value: "Avoid recommend, advise, suggest you, should, must. Use consider, worth a conversation, you might, we'd talk about."
  - key: rule_active_voice
    value: "Prefer the active voice. \"We saved your answers\" beats \"Your answers have been saved.\""
  - key: rule_contractions
    value: "Prefer contractions. \"We won't\" not \"We will not.\""
  - key: rule_sentence_length
    value: "Max 15 words per sentence on any interactive element. 25 words anywhere else unless the content is intentionally narrative."
  - key: rule_no_emoji
    value: "Never use emoji, never use exclamation marks, never use punctuation shortcuts like :) or !"
---

Where the developer needs to invent a string that isn't specified in any of the other microcopy files, the string must obey the rules above. If any rule is hard to meet, flag the string in the README for a human edit rather than smuggling in a bad line.
