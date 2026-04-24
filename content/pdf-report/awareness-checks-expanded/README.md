---
title: Expanded awareness check copy — PDF report Pages 2–4
---

# Expanded awareness checks — PDF report

This directory contains the long-form versions of the 26 awareness checks used in the PDF Wealth Report (Pages 2–4). Each file corresponds to a matching file in `content/awareness-checks/` and is linked via the `source_id` field in its frontmatter.

## Purpose

The original awareness check files (`content/awareness-checks/`) contain short-form copy designed for the web summary page — typically a 3–4 sentence `unaware_body` block. For the PDF report, each check that appears in the considered list (Pages 2–4) is rendered at greater length: two to three full paragraphs providing context, the relevant numbers, and a bridge toward the planning conversation.

## Structure

Each file contains:
- YAML frontmatter: `id`, `source_id` (links to the original check), `title`, `compliance_status`
- A heading (the topic, in sentence case)
- **Paragraph 1** — context: why this topic matters for readers in the relevant situation
- **Paragraph 2** — specifics: the numbers, the mechanics, the applicable rules
- **Paragraph 3** — bridge: what the planning conversation typically covers, what it usually finds

## Voice rules

Consistent with `content/microcopy/voice-rules.md`:
- No exclamation marks
- Sentence case throughout
- Contractions permitted
- Banned words: recommend, advise, should, must
- Preferred register: "in our experience", "typically", "usually", "worth a conversation"
- Nothing constitutes financial advice; describe the situation, do not prescribe an action

## Files

| File | Source ID | Topic |
|---|---|---|
| `adviser-fee-total.md` | pitfall.adviser_fee_total | Total cost of advice (all three layers) |
| `badr-timing.md` | pitfall.badr_timing | BADR rate step-up and exit timing |
| `btl-incorporation.md` | pitfall.btl_incorporation | Buy-to-let and the incorporation question |
| `care-funding.md` | pitfall.care_funding | Residential care cost and funding thresholds |
| `carry-forward.md` | pitfall.carry_forward | Pension annual allowance carry-forward |
| `couples-alignment.md` | pitfall.couples_alignment | Financial alignment between partners |
| `emergency-fund-sizing.md` | pitfall.emergency_fund_sizing | Emergency cash buffer sizing |
| `extraction-mix.md` | pitfall.extraction_mix | Business owner salary/dividend/pension mix |
| `fund-fee-stack.md` | pitfall.fund_fee_stack | All-in investment cost stack |
| `glide-path.md` | pitfall.glide_path | DC default fund risk near retirement |
| `group-life-fragility.md` | pitfall.group_life_fragility | Group life cover ending on job change |
| `iht-mitigation.md` | pitfall.iht_mitigation | IHT planning toolkit overview |
| `income-100k-trap.md` | pitfall.income_trap_100k | £100k–£125,140 effective 60% tax band |
| `independent-restricted.md` | pitfall.independent_restricted | Independent vs restricted adviser status |
| `lpa.md` | pitfall.lpa | Lasting Power of Attorney |
| `mpaa.md` | pitfall.mpaa | Money Purchase Annual Allowance trigger |
| `ni-gaps.md` | pitfall.ni_gaps | National Insurance gaps and state pension |
| `overpayment-vs-cash.md` | pitfall.overpayment_vs_cash | Mortgage overpayment vs savings return |
| `pension-as-extraction.md` | pitfall.pension_as_extraction | Employer pension as business extraction |
| `pension-consolidation.md` | pitfall.pension_consolidation | Pension pot consolidation |
| `pension-iht-2027.md` | pitfall.pension_iht_2027 | Pensions inside estate from April 2027 |
| `rnrb-taper.md` | pitfall.rnrb_taper | Residence nil-rate band taper above £2m |
| `savings-tax-efficiency.md` | pitfall.savings_tax_efficiency | ISA, CGT and dividend allowances |
| `ssp-gap.md` | pitfall.ssp_gap | Sick pay gap and income protection |
| `tapered-annual-allowance.md` | pitfall.tapered_annual_allowance | Pension taper above £260k income |
| `will-currency.md` | pitfall.will_currency | Will review and currency |

## Compliance

All files carry `compliance_status: draft`. CFP and compliance review required before any file is used in a shipped PDF. The `compliance_status` field must be updated to `approved_to_ship` after sign-off.
