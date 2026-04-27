---
id: report.tile.business_income_mix
kind: per_segment
title: "Income mix"
tile_number: 12
label_owners: "Business exit"
label_others: "Income mix"
what_it_checks_owners: "Business value as a share of net worth, and whether a documented succession or exit plan exists."
what_it_checks_others: "Income source concentration — single employer, multiple income streams, or diversified portfolio income."
thresholds:
  green: "Owners: business < 25% of net worth, or documented exit plan. Others: diversified income sources."
  amber: "Owners: business 25–50% of net worth. Others: single employer, but stable."
  red: "Owners: business > 50% of net worth. Others: high income concentration in a single volatile source."
  grey: "Not applicable or not asked"
compliance_status: draft
---

# S1 — Early Accumulator

tile_label: "Income mix"
status: amber
note: "Single employer income — normal at this stage, but worth being aware of the concentration risk. A second income stream or emergency fund is the mitigation."

---

# S2 — Mass-Affluent Mid-Career

tile_label: "Income mix"
status: amber
note: "Income largely from one employer. Stable and manageable — but the absence of income protection means a single event could affect everything downstream."

---

# S3 — High-Earner Mid-Career

tile_label: "Income mix"
status: amber
note: "Salary plus rental income provides some resilience. The tax efficiency of that mix — particularly Section 24 on the rental side — is worth checking."

---

# S4 — Senior Professional

tile_label: "Income mix"
status: green
note: "Senior professional income combined with investment income and approaching pension drawdown. Well-placed for the transition to retirement income."

---

# S5 — Business Owner Growth

tile_label: "Business exit"
status: red
note: "Around {business_pct}% of net worth sits in the business. Financial independence from it — building personal assets alongside it — is the planning goal not yet achieved."

---

# S6 — Business Owner Exit

tile_label: "Business exit"
status: amber
note: "Around {business_pct}% of net worth in the business pre-exit. Exit plan in place — the question now is which income streams replace the business income after completion."

---

# S7 — Pre-Retiree Affluent

tile_label: "Income mix"
status: green
note: "Pension, investment income, and state pension incoming — good diversification. Drawdown sequencing is the efficiency lever from here."

---

# S8 — Retired

tile_label: "Income mix"
status: green
note: "State pension plus drawdown plus investment income — well-diversified. The question is which source to draw from first, and in what order, for the best tax outcome."

---

# S9 — HNW Multi-Generational

tile_label: "Income mix"
status: green
note: "Well-diversified across income types at scale. The question is which streams are most tax-efficient to draw from — and whether the mix minimises the IHT exposure."
