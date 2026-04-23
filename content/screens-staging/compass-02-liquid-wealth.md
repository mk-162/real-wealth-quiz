---
id: screen.compass.02.liquid-wealth
screen_number: "4.E.2"
title: Your liquid wealth
section: assets
layout: asymmetric
grouped: true
gate_critical: false
segments_served: [all]
tier_limit: [A, B, C]
q_refs: ["Q4.A.2", "Q4.A.3", "Q4.A.4"]
logged_as: [cash_savings_band, isa_balance_band, gia_balance_band]
inputs:
  - id: cash_savings_band
    label: "Cash savings (current, easy-access, fixed-term deposits)"
    control: radio
    required: true
    options:
      - value: none
        label: "None"
      - value: lt25k
        label: "Under £25,000"
      - value: 25to100k
        label: "£25,000 – £100,000"
      - value: 100to250k
        label: "£100,000 – £250,000"
      - value: gt250k
        label: "Over £250,000"
      - value: prefer_not
        label: "Prefer not to say"
  - id: isa_balance_band
    label: "ISAs (stocks-and-shares + cash ISAs)"
    control: radio
    required: true
    options:
      - value: none
        label: "None"
      - value: lt25k
        label: "Under £25,000"
      - value: 25to100k
        label: "£25,000 – £100,000"
      - value: 100to250k
        label: "£100,000 – £250,000"
      - value: 250to500k
        label: "£250,000 – £500,000"
      - value: gt500k
        label: "Over £500,000"
      - value: prefer_not
        label: "Prefer not to say"
  - id: gia_balance_band
    label: "Other investments outside ISA (trading accounts, funds, crypto)"
    control: radio
    required: true
    options:
      - value: none
        label: "None"
      - value: lt25k
        label: "Under £25,000"
      - value: 25to100k
        label: "£25,000 – £100,000"
      - value: 100to250k
        label: "£100,000 – £250,000"
      - value: 250to500k
        label: "£250,000 – £500,000"
      - value: gt500k
        label: "Over £500,000"
      - value: prefer_not
        label: "Prefer not to say"
---

# Headline
The money you can actually reach.

# Sub
Liquid wealth — cash, ISAs, investments outside pensions. The parts you could spend tomorrow if you needed to.
