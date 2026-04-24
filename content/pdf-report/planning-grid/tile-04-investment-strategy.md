---
id: grid.investment_strategy
tile_number: 4
label: "Investment strategy"
what_it_checks: "Wrapper diversification (ISA, pension, GIA) and broad risk-to-horizon match. Business concentration flagged separately."
thresholds:
  green: "Multi-wrapper (2+ non-cash), risk appropriate for horizon"
  amber: "Single wrapper, or risk level unclear against horizon"
  red: "All in cash, or majority concentrated in one illiquid asset (e.g. a business)"
  grey: "No investable assets disclosed"
compliance_status: draft
---

# S1 — Early Accumulator

status: amber
note: "{wrapper_count} wrapper(s) in use — normal at this stage. Diversifying across wrappers matters more as the pot grows."

---

# S2 — Mass-Affluent Mid-Career

status: green
note: "{wrapper_count} wrappers in use — reasonable spread. Risk level appropriate for a 20-year accumulation horizon, no change indicated."

---

# S3 — High-Earner Mid-Career

status: green
note: "{wrapper_count} wrappers — good structure. The question worth asking is not what is held — it is what it costs."

---

# S4 — Senior Professional

status: green
note: "{wrapper_count} wrappers, well-structured. The risk conversation begins to shift as you approach distribution — equity allocation appropriate at 55 may not be at 60."

---

# S5 — Business Owner Growth

status: red
note: "Around {business_pct}% of your net worth sits in the business. Investment outside the business — not diversification within it — is the gap."

---

# S6 — Business Owner Exit

status: amber
note: "Around {business_pct}% of net worth in the business pre-exit — expected and manageable. Post-exit allocation is the next significant investment decision."

---

# S7 — Pre-Retiree Affluent

status: amber
note: "{wrapper_count} wrappers. Risk level worth reviewing at your stage — the right answer in the distribution phase is different from the right answer at 50."

---

# S8 — Retired

status: amber
note: "{wrapper_count} wrappers. De-risking level worth reviewing. The 30-year horizon people assume during accumulation doesn't apply in drawdown the same way."

---

# S9 — HNW Multi-Generational

status: green
note: "{wrapper_count} wrappers, well-structured at this scale. The questions are trust structures and generational allocation — not asset selection within the existing portfolio."
