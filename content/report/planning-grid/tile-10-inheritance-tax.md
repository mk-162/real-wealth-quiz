---
id: report.tile.inheritance_tax
kind: per_segment
title: "Inheritance tax"
tile_number: 10
label: "Inheritance tax"
what_it_checks: "Estimated estate value vs nil-rate band (£325k) plus residence nil-rate band (£175k per person, tapering above £2m). From April 2027, unused pension wealth is included."
thresholds:
  green: "No taxable excess above the nil-rate band"
  amber: "Rough IHT liability below £50k — emerging, not yet material"
  red: "Rough IHT liability £50k+ — structured planning meaningfully reduces"
  grey: "Estate below £100k — IHT picture not yet meaningful"
compliance_status: draft
---

# S1 — Early Accumulator

status: grey
note: "Estate well below the nil-rate band. No IHT exposure — not a relevant concern at this stage."

---

# S2 — Mass-Affluent Mid-Career

status: green
note: "Estate of approximately £{estate_k}k — below the £{nil_rate_total_k}k threshold at current values. Worth watching as the mortgage clears and property appreciates over the next 15–20 years."

---

# S3 — High-Earner Mid-Career

status: amber
note: "Estate of approximately £{estate_k}k on a trajectory to cross £2m within 10–15 years. The earlier the planning, the more options remain open."

---

# S4 — Senior Professional

status: red
note: "Estate of approximately £{estate_k}k creates a rough £{iht_exposure_k}k IHT liability. Structured planning over the next 2–5 years typically reduces the bill by £150,000–£400,000."

---

# S5 — Business Owner Growth

status: amber
note: "Estate of approximately £{estate_k}k. Business value creates IHT complexity — Business Relief may apply, but it depends on the trading structure and is not permanent."

---

# S6 — Business Owner Exit

status: amber
note: "Estate of approximately £{estate_k}k. Post-exit, the estate steps up significantly as illiquid business value becomes liquid — the IHT conversation needs to run alongside the exit plan."

---

# S7 — Pre-Retiree Affluent

status: amber
note: "Estate of approximately £{estate_k}k, rough exposure £{iht_exposure_k}k. Annual gifting and trust structures become worth exploring — the 7-year clock needs to start."

---

# S8 — Retired

status: green
note: "Estate of approximately £{estate_k}k — below the £{nil_rate_total_k}k nil-rate thresholds. Longevity risk and care costs are a greater financial concern than IHT at this stage."

---

# S9 — HNW Multi-Generational

status: red
note: "Estate of approximately £{estate_k}k with rough IHT exposure around £{iht_exposure_k}k — the single largest financial cost your heirs will face. The dominant planning conversation at this level."
