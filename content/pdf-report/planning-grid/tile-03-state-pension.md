---
id: grid.state_pension
tile_number: 3
label: "State pension"
what_it_checks: "NI qualifying years vs the 35 required for the full new state pension (£11,502/yr, 2025/26 rate)."
thresholds:
  green: "35+ qualifying years — full state pension secured"
  amber: "25–34 qualifying years — gap fillable voluntarily"
  red: "Fewer than 25 qualifying years"
  grey: "Age < 30, or not yet asked"
compliance_status: draft
---

# S1 — Early Accumulator

status: grey
note: "Not yet relevant — too few qualifying years to score, and plenty of time to build them."

---

# S2 — Mass-Affluent Mid-Career

status: amber
note: "Around {ni_yr} qualifying years so far — building steadily. A 90-second check at gov.uk/check-state-pension catches any gaps from a career break or early self-employment."

---

# S3 — High-Earner Mid-Career

status: green
note: "{ni_yr} qualifying years — on track for the full state pension of around £{sp_annual_k}k/yr. One worth checking: any NI gaps from time overseas."

---

# S4 — Senior Professional

status: green
note: "{ni_yr}+ qualifying years confirmed. State pension of around £{sp_annual_k}k/yr from age 67 — a meaningful income floor in the retirement plan."

---

# S5 — Business Owner Growth

status: amber
note: "Around {ni_yr} qualifying years — mixed record across employment and self-employment. Class 2 and 4 contributions don't always register cleanly. Worth checking."

---

# S6 — Business Owner Exit

status: green
note: "{ni_yr}+ qualifying years — full state pension of around £{sp_annual_k}k/yr confirmed. Timing it relative to pension drawdown could save a meaningful sum in tax."

---

# S7 — Pre-Retiree Affluent

status: green
note: "State pension of around £{sp_annual_k}k/yr is about 4 years away. The defer-or-claim decision at 67 is worth running through numbers — deferral increases the annual amount but isn't always optimal."

---

# S8 — Retired

status: green
note: "State pension in payment — around £{sp_annual_k}k/yr acts as an income floor that makes the rest of the drawdown calculation significantly more manageable."

---

# S9 — HNW Multi-Generational

status: green
note: "State pension in payment at around £{sp_annual_k}k/yr. A small fraction of total income at this level, but every guaranteed floor reduces drawdown risk."
