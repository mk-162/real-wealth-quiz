---
id: grid.debt_position
tile_number: 7
label: "Debt position"
what_it_checks: "Non-mortgage debt only (credit cards, loans, car finance, student debt, director's loans). Mortgage is scored separately."
thresholds:
  green: "No significant non-mortgage debt (consumer debt ≤ ~£1k)"
  amber: "Manageable consumer debt (≤ 15% of gross income)"
  red: "Consumer debt > 15% of gross income, or competing with savings capacity"
  grey: "Not disclosed"
compliance_status: draft
---

# S1 — Early Accumulator

status: amber
note: "£{consumer_debt_k}k consumer debt. Clearing before a major savings push is usually worth doing first — the guaranteed return beats most investments."

---

# S2 — Mass-Affluent Mid-Career

status: green
note: "£{consumer_debt_k}k non-mortgage debt. A clean path for the savings rate to do the work over the next 20 years."

---

# S3 — High-Earner Mid-Career

status: green
note: "£{consumer_debt_k}k consumer debt. Net balance sheet is clean outside of the mortgage and investment property financing."

---

# S4 — Senior Professional

status: green
note: "£{consumer_debt_k}k non-mortgage debt. Balance sheet well-positioned for the transition from accumulation to distribution."

---

# S5 — Business Owner Growth

status: green
note: "£{consumer_debt_k}k personal debt. Business debt — if any — is a separate risk that would change this picture and is worth tracking separately."

---

# S6 — Business Owner Exit

status: green
note: "£{consumer_debt_k}k personal balance-sheet debt. A clean personal position simplifies the exit and post-completion financial planning."

---

# S7 — Pre-Retiree Affluent

status: green
note: "£{consumer_debt_k}k outside the property. The balance sheet is clean going into retirement — no debt servicing will compete with the income the plan needs to generate."

---

# S8 — Retired

status: green
note: "£{consumer_debt_k}k non-mortgage debt. The only meaningful balance sheet concern at this stage is longevity risk on the assets side."

---

# S9 — HNW Multi-Generational

status: green
note: "£{consumer_debt_k}k consumer or business debt of significance. A clean balance sheet at this level of assets."
