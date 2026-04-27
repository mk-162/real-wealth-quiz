---
id: report.tile.emergency_cash
kind: per_segment
title: "Emergency cash"
tile_number: 6
label: "Emergency cash"
what_it_checks: "Cash reserves vs 3–6 months of essential monthly spend. Threshold adjusts: 3 months for dual-earner no-dependants; 6 months for single-earner with dependants; 9 months for self-employed."
thresholds:
  green: "6+ months of essential spend in accessible cash"
  amber: "3–6 months, or unclear"
  red: "Under 3 months, or forced reliance on credit likely"
  grey: "Cash not disclosed"
compliance_status: draft
---

# S1 — Early Accumulator

status: amber
note: "£{cash_k}k covers {cash_months} months of essentials. Workable at this stage — aim to build toward 6 months as earnings rise."

---

# S2 — Mass-Affluent Mid-Career

status: amber
note: "£{cash_k}k covers {cash_months} months. Below the 6-month ideal for a single-earner household with dependants — closing the gap slowly over 12–18 months is more practical than a single transfer."

---

# S3 — High-Earner Mid-Career

status: green
note: "£{cash_k}k — around {cash_months} months of essentials. Well-covered for a mortgaged household with dependants. No action indicated."

---

# S4 — Senior Professional

status: green
note: "£{cash_k}k covers {cash_months}+ months. Strong reserve for a senior-earning household approaching retirement."

---

# S5 — Business Owner Growth

status: green
note: "£{cash_k}k covers {cash_months}+ months of personal essentials. Solid — business working capital is a separate question worth keeping distinct."

---

# S6 — Business Owner Exit

status: green
note: "£{cash_k}k is around {cash_months} months of essentials. Ample buffer pre-exit — a business sale often takes longer and costs more than expected."

---

# S7 — Pre-Retiree Affluent

status: green
note: "£{cash_k}k — {cash_months}+ months of essentials. Near retirement, cash set aside for flexibility is a different category from emergency reserves."

---

# S8 — Retired

status: amber
note: "£{cash_k}k covers {cash_months} months. Adequate, but worth reviewing as drawdown increases — a cash buffer reduces the risk of selling investments at a bad time."

---

# S9 — HNW Multi-Generational

status: green
note: "£{cash_k}k covers {cash_months}+ months. Comfortable. The allocation question here is about opportunity cost, not adequacy."
