---
id: report.tile.retirement_readiness
kind: per_segment
title: "Retirement readiness"
tile_number: 1
label: "Retirement readiness"
what_it_checks: "Projected wealth at the user's target retirement age vs the wealth needed to sustain their stated spend for a 95-year life expectancy."
thresholds:
  green: "≥ 100%"
  amber: "70–99%"
  red: "< 70%"
  grey: "Age < 35 — projection not yet meaningful, or no target retirement age given"
compliance_status: draft
---

# S1 — Early Accumulator

status: grey
note: "Too early to run a meaningful projection. Time is the main asset at your stage — the habit matters more than the number right now."

---

# S2 — Mass-Affluent Mid-Career

status: amber
note: "At {coverage_pct}% of your target at age {retire_age}. A 3% pension contribution increase today closes most of the gap by the time you get there."

---

# S3 — High-Earner Mid-Career

status: green
note: "At {coverage_pct}% for retirement at {retire_age}. On track — the story now is tax efficiency, not accumulation. The pot is building itself."

---

# S4 — Senior Professional

status: green
note: "At {coverage_pct}% — well ahead of target. Focus shifts from building the pot to protecting it from IHT and drawing it down in the right order."

---

# S5 — Business Owner Growth

status: amber
note: "At {coverage_pct}% excluding a business exit. A clean sale at fair value adds ~30 points to this score. No exit subtracts ~20."

---

# S6 — Business Owner Exit

status: green
note: "At {coverage_pct}% assuming the sale executes at expected value. Structure matters more than markets from this point."

---

# S7 — Pre-Retiree Affluent

status: green
note: "At {coverage_pct}% — comfortably on track. The conversation shifts to drawdown order and state pension timing rather than accumulation."

---

# S8 — Retired

status: amber
gauge_reframe: "% of expected remaining lifetime covered at current spend"
note: "Funds cover {coverage_pct}% of your expected remaining lifetime at current spend. A modest adjustment closes the gap."

---

# S9 — HNW Multi-Generational

status: green
note: "At {coverage_pct}% — far beyond what you need. The chart that matters most to your family is the one showing what they inherit."
