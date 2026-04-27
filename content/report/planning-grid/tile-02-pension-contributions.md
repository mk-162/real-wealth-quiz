---
id: grid.pension_contributions
tile_number: 2
label: "Pension contributions"
what_it_checks: "Contribution rate (employee + employer) vs age-divided-by-two rule of thumb as a percentage of gross income."
thresholds:
  green: "At or above the age-target rate"
  amber: "60–99% of age-target rate, or rate unknown"
  red: "Below 60% of age-target rate, or no pension"
  grey: "Already retired — tile reframes to drawdown rate"
compliance_status: draft
---

# S1 — Early Accumulator

status: amber
note: "Contributing {contrib_pct}% vs an age-target around {age_target_pct}%. Employer match may not be fully taken — often the highest-return decision available at this stage."

---

# S2 — Mass-Affluent Mid-Career

status: amber
note: "Contributing {contrib_pct}% vs an age-target of {age_target_pct}%. When the mortgage clears, redirecting that payment into the pension closes most of the gap automatically."

---

# S3 — High-Earner Mid-Career

status: amber
note: "Contributing {contrib_pct}% — below the age-{age_target_pct}% target. Carry-forward could close it in a single year — and resolve the £100k tax issue at the same time."

---

# S4 — Senior Professional

status: green
note: "Contributing {contrib_pct}%, above the age-target. Carry-forward and the extraction mix are worth revisiting each tax year at this income level."

---

# S5 — Business Owner Growth

status: red
note: "Pension pot of £{pension_k}k is well behind for age. Employer pension contributions from the company are the most tax-efficient lever and it is not being used at scale."

---

# S6 — Business Owner Exit

status: amber
note: "Pot of £{pension_k}k. Catch-up contributions in the run-up to exit can shelter significant proceeds from income tax. The window is narrowing."

---

# S7 — Pre-Retiree Affluent

status: green
note: "Pension pot of £{pension_k}k — fully funded for the target retirement date. Decisions shift to drawdown order."

---

# S8 — Retired

status: amber
tile_reframe_label: "Drawdown rate"
note: "Sustainable at current spend with a small margin. Reducing annual withdrawals by 10% extends the runway by approximately 4 years."

---

# S9 — HNW Multi-Generational

status: green
note: "Pot of £{pension_k}k — well-funded. The question is not contribution — it is whether to draw down before April 2027 to reduce IHT exposure on unused pension wealth."
