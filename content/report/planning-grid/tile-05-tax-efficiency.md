---
id: grid.tax_efficiency
tile_number: 5
label: "Tax efficiency"
what_it_checks: "Whether the main tax-reduction levers are being used: £100k personal allowance trap, annual ISA allowance, pension relief, couples' allowance splitting, higher-rate reclaim."
thresholds:
  green: "Basic-rate + ISA in use, or known levers engaged"
  amber: "Partial use, or a known opportunity not yet taken"
  red: "Active £100k trap with no pension contribution to offset"
  grey: "Insufficient income data"
compliance_status: draft
---

# S1 — Early Accumulator

status: green
note: "At £{income_k}k income, basic-rate. ISA is the primary tool and it's in use — no significant efficiency gap at this stage."

---

# S2 — Mass-Affluent Mid-Career

status: green
note: "At £{income_k}k, reasonable wrapper use. Bed-and-ISA and couples' allowance-splitting are the natural next steps as investments grow."

---

# S3 — High-Earner Mid-Career

status: red
note: "At £{income_k}k — active £100k trap. Effective rate around 60% on income in that band. A pension contribution or salary sacrifice reduces this materially."

---

# S4 — Senior Professional

status: amber
note: "At £{income_k}k, tapering annual allowance becomes relevant above £260k adjusted income. Extraction and contribution mix worth reviewing at the start of each tax year."

---

# S5 — Business Owner Growth

status: amber
note: "At £{income_k}k income drawn. Salary, dividend and pension extraction mix likely hasn't been reviewed this tax year. The optimal split shifts with each Budget — and it matters by £10,000–£20,000 annually."

---

# S6 — Business Owner Exit

status: green
note: "BADR planning in place. The tax story between now and completion is the extraction structure — and the specific date the contracts are signed."

---

# S7 — Pre-Retiree Affluent

status: amber
note: "At £{income_k}k income. Drawdown sequencing has a significant tax dimension: which pot you draw from first, and in what order, can reduce the lifetime tax bill considerably."

---

# S8 — Retired

status: amber
note: "Mixing state pension, drawdown, and ISA withdrawals efficiently can save £5,000–£15,000 a year. Not often revisited once the drawdown pattern is set."

---

# S9 — HNW Multi-Generational

status: amber
note: "At this estate size, IHT is the dominant tax question. Income tax optimisation is a second-order consideration — but the two aren't always separable."
