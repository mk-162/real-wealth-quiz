---
id: pitfall.ni_gaps
core: true
rank: 8
trigger: "age >= 45 AND state_pension_amount_band in ['partial', 'no_idea']"
placement: "after Block E Screen 4.E.4 (state pension and NI) if triggered"
source: "DWP state pension rates 2024/25; HMRC Class 3 NI rates"
compliance_status: draft
tier_limit: [A, B]
---

# Headline
To get the full new state pension — currently about £11,500 a year — you need 35 qualifying years of National Insurance. Gaps can be filled voluntarily, but usually only looking back six years. Have you checked your record?

# Body Aware
Useful. If you've pulled the forecast from gov.uk already, we can work straight from the gap list on the call.

# Body Partial
Voluntary Class 3 NI contributions are currently £17.45 a week (about £900 a year). Each year of contributions adds roughly £328 a year to the state pension — a payback period under three years. Normal look-back is six years; the extended window to April 2025 allowed look-back to 2006.

# Body Unaware
Around 60% of people in their late 40s and 50s have never checked their NI record. The most common surprise is a 2–5 year gap from self-employment, a career break, or time overseas. Each gap filled voluntarily typically returns 10–15× over retirement. gov.uk/check-state-pension takes about 90 seconds.
