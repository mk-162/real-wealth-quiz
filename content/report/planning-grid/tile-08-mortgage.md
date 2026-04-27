---
id: grid.mortgage
tile_number: 8
label: "Mortgage"
what_it_checks: "For homeowners: years remaining on the mortgage vs target retirement age, and payment-to-income ratio. For renters: shown as informational — not red/green."
thresholds:
  green: "Clears before or at retirement; payment ≤ 25% of gross income"
  amber: "Clears after retirement, or payment 25–35% of income"
  red: "Payment > 35% of income, or significant refinancing risk"
  grey: "Renter — not applicable, shown as informational"
compliance_status: draft
---

# S1 — Early Accumulator

status: grey
note: "Renting — no mortgage to score. The rent-vs-buy question is relevant at this income and saving rate."

---

# S2 — Mass-Affluent Mid-Career

status: green
note: "£{mortgage_balance_k}k outstanding, clears at age {mortgage_clear_age}. On track to be mortgage-free well before retirement. Payment is {mortgage_pti_pct}% of income — serviceable."

---

# S3 — High-Earner Mid-Career

status: amber
note: "£{mortgage_balance_k}k outstanding — high but serviceable at {mortgage_pti_pct}% of income. Whether to overpay vs maximise pension contributions is a live question worth resolving."

---

# S4 — Senior Professional

status: green
note: "£{mortgage_balance_k}k balance, clears at age {mortgage_clear_age} — neatly alongside planned retirement. Freed-up payment improves cash flow at exactly the right moment."

---

# S5 — Business Owner Growth

status: amber
note: "£{mortgage_balance_k}k outstanding at {mortgage_pti_pct}% of income. Serviceable, but the mortgage sits alongside business income risk — a stress test of both together is worth doing."

---

# S6 — Business Owner Exit

status: green
note: "£{mortgage_balance_k}k remaining — cleared or nearly cleared. A clean personal balance sheet reduces transaction complexity and post-completion financial pressure."

---

# S7 — Pre-Retiree Affluent

status: green
note: "Mortgage paid off. No debt service competing with the income the retirement plan needs to generate."

---

# S8 — Retired

status: green
note: "Mortgage-free. Property equity is a reserve the plan does not need to liquidate — unless care costs become a significant factor."

---

# S9 — HNW Multi-Generational

status: green
note: "Mortgage-free. Property is a component of the estate plan rather than a financial burden requiring management."
