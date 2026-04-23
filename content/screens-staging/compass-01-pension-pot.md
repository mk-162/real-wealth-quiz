---
id: screen.compass.01.pension-pot
screen_number: "4.E.1"
title: Your pension, roughly
section: assets
layout: asymmetric
grouped: false
gate_critical: false
segments_served: [all]
tier_limit: [A, B, C]
q_refs: ["Q4.A.1"]
logged_as: [pension_total_value]
conditional_logic: "only when pension_pots != none"
inputs:
  - id: pension_total_value
    label: "Roughly, what would it all add up to today?"
    control: radio
    required: true
    options:
      - value: none
        label: "Nothing yet"
      - value: lt25k
        label: "Under £25,000"
      - value: 25to100k
        label: "£25,000 – £100,000"
      - value: 100to250k
        label: "£100,000 – £250,000"
      - value: 250to500k
        label: "£250,000 – £500,000"
      - value: 500kto1m
        label: "£500,000 – £1m"
      - value: 1to2m
        label: "£1m – £2m"
      - value: 2to3m
        label: "£2m – £3m"
      - value: gt3m
        label: "Over £3m"
      - value: prefer_not
        label: "Prefer not to say"
---

# Headline
Your pension, roughly.

# Sub
A rough total is enough. If the answer is "I have no idea", that itself is useful — most people don't, and it's one of the things a planner helps fix.
