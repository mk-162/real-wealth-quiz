---
id: screen.compass.03.contributions
screen_number: "4.E.3"
title: What you add, what you still owe
section: assets
layout: asymmetric
grouped: true
gate_critical: false
segments_served: [all]
tier_limit: [A, B, C]
q_refs: ["Q4.B.1", "Q4.B.2", "Q4.C.1", "Q4.C.2"]
logged_as: [monthly_saving_band, employer_pension_pct_band, mortgage_monthly_payment_band, mortgage_end_age_band]
inputs:
  - id: monthly_saving_band
    label: "Roughly, how much do you put away each month — across all pots?"
    control: radio
    required: true
    options:
      - value: lt1500
        label: "Under £1,500"
      - value: 1500to3000
        label: "£1,500 – £3,000"
      - value: 3000to5000
        label: "£3,000 – £5,000"
      - value: 5000to8000
        label: "£5,000 – £8,000"
      - value: gt8000
        label: "Over £8,000"
      - value: unsure
        label: "I'm not sure"
  - id: employer_pension_pct_band
    label: "Your employer pension contribution — roughly, as % of salary"
    control: radio
    required: true
    options:
      - value: 0to3
        label: "0 – 3%"
      - value: 3to5
        label: "3 – 5%"
      - value: 5to10
        label: "5 – 10%"
      - value: 10plus
        label: "10%+"
      - value: unsure
        label: "Not sure"
      - value: not_applicable
        label: "Not applicable — self-employed / unemployed"
  - id: mortgage_monthly_payment_band
    label: "Monthly mortgage payment (if applicable)"
    control: radio
    required: false
    conditional_reveal: "only when main_home == own_mortgage"
    options:
      - value: lt1500
        label: "Under £1,500"
      - value: 1500to3000
        label: "£1,500 – £3,000"
      - value: 3000to5000
        label: "£3,000 – £5,000"
      - value: gt5000
        label: "Over £5,000"
      - value: prefer_not
        label: "Prefer not to say"
  - id: mortgage_end_age_band
    label: "Age you expect the mortgage to end"
    control: radio
    required: false
    conditional_reveal: "only when main_home == own_mortgage"
    options:
      - value: under_55
        label: "Before 55"
      - value: 55_65
        label: "55 – 65"
      - value: 65_75
        label: "65 – 75"
      - value: paid
        label: "Already paid / about to be"
---

# Headline
What you add, and what you still owe.

# Sub
How fast your pot grows — and whether the mortgage becomes a freed-up saving stream, or runs on into retirement.
