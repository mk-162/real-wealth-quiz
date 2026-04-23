---
id: screen.compass.04.state-pension-ni
screen_number: "4.E.4"
title: State pension and your retirement shape
section: retirement_horizon
layout: asymmetric
grouped: true
gate_critical: false
segments_served: [all]
tier_limit: [A, B, C]
q_refs: ["Q4.D.1", "Q4.D.2", "Q4.D.3"]
logged_as: [state_pension_amount_band, ni_qualifying_years_band, retirement_spend_ratio]
inputs:
  - id: state_pension_amount_band
    label: "Expected annual state pension (at your state pension age)"
    control: radio
    required: true
    options:
      - value: full_rate
        label: "Full rate (~£11,502/yr in 2025/26) — I expect to get the full amount"
      - value: partial
        label: "Partial — my record isn't complete"
      - value: none
        label: "None — I won't qualify"
      - value: no_idea
        label: "No idea — please use the default assumption"
  - id: ni_qualifying_years_band
    label: "NI qualifying years you've built up so far"
    control: radio
    required: true
    options:
      - value: lt10
        label: "Under 10"
      - value: 10to20
        label: "10 – 20"
      - value: 20to30
        label: "20 – 30"
      - value: 30to35
        label: "30 – 35"
      - value: gte35
        label: "35+ (or will reach 35 by state pension age)"
      - value: no_idea
        label: "Genuinely no idea — part of what I'd like to check"
  - id: retirement_spend_ratio
    label: "In retirement, do you expect to spend…"
    control: radio
    required: true
    options:
      - value: less
        label: "Less than I do now (mortgage paid, kids grown, quieter life)"
      - value: same
        label: "About the same"
      - value: more
        label: "More — I intend to travel, upgrade, treat myself"
---

# Headline
State pension, and what retirement really looks like for you.

# Sub
Your NI record drives what the state pays you. The "less/same/more" card is the single most important input to how long your money needs to last.
