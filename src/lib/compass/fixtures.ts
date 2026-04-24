/**
 * Compass preview fixtures — nine canned personas, one per segment S1-S9.
 *
 * Used by /report/compass-preview to stress-test the Page-1 redesign
 * (gauge, planning grid, goals matrix, compact balance strip) and Page-2
 * lifetime wealth chart across the full segment range.
 *
 * These are illustrative. Real input data comes from the questionnaire via
 * `inputs.buildCompassInputs()`. When the 4 new content screens are wired up,
 * the fixture shapes must stay identical to the live shape.
 */

import type { CompassInputs, SegmentView } from './types';

export interface Fixture {
  inputs: CompassInputs;
  view: SegmentView;
}

// Default grid template — each segment overrides the statuses/notes it needs.
function grid(overrides: Partial<Record<import('./types').TileKey, { status: 'green' | 'amber' | 'red' | 'grey'; note: string; label?: string }>>, twelfthLabel: 'Income mix' | 'Business exit' = 'Income mix') {
  const base: Record<string, { status: 'green' | 'amber' | 'red' | 'grey'; note: string; label?: string }> = {
    retirement:   { status: 'grey', note: 'Not scored' },
    pension:      { status: 'grey', note: 'Not scored' },
    statePension: { status: 'grey', note: 'Not scored' },
    investment:   { status: 'grey', note: 'Not scored' },
    tax:          { status: 'grey', note: 'Not scored' },
    cash:         { status: 'grey', note: 'Not scored' },
    debt:         { status: 'grey', note: 'Not scored' },
    mortgage:     { status: 'grey', note: 'Not scored' },
    estate:       { status: 'grey', note: 'Not scored' },
    iht:          { status: 'grey', note: 'Not scored' },
    protection:   { status: 'grey', note: 'Not scored' },
    twelfth:      { status: 'grey', note: 'Not scored', label: twelfthLabel },
  };
  const labels: Record<string, string> = {
    retirement: 'Retirement readiness',
    pension: 'Pension contributions',
    statePension: 'State pension',
    investment: 'Investment strategy',
    tax: 'Tax efficiency',
    cash: 'Emergency cash',
    debt: 'Debt position',
    mortgage: 'Mortgage position',
    estate: 'Estate planning',
    iht: 'Inheritance tax',
    protection: 'Protection cover',
    twelfth: twelfthLabel,
  };
  const merged = { ...base, ...(overrides as Record<string, { status: 'green' | 'amber' | 'red' | 'grey'; note: string; label?: string }>) };
  return (Object.keys(base) as Array<keyof typeof base>).map(k => ({
    key: k,
    label: merged[k].label ?? labels[k],
    status: merged[k].status,
    note: merged[k].note,
  })) as SegmentView['grid'];
}

// ---------- S1 Early Accumulator ----------
const S1: Fixture = {
  inputs: {
    currentAge: 28, partnerPresent: false, hasDependentChildren: false, hasElderlyParents: false, targetRetirementAge: 65,
    mainHomeValue: 0, otherPropertyValue: 0,
    totalPensionValue: '<25k', cashSavings: '<25k', isaBalance: '<25k', giaBalance: 0,
    businessValue: 0, otherAssets: 0,
    mainHomeMortgageBalance: 0, otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: '<25k',
    householdGrossIncome: '<50k', isScottishTaxpayer: false,
    monthlySavingAmount: '<1.5k', employerPensionContribPct: '3-5', ownPensionContribPct: '3-5',
    essentialMonthlySpend: '1.5-3k', nonEssentialMonthlySpend: '<1.5k', retirementSpendRatio: 'same',
    mortgageEndAge: 'renting', rentMonthly: '1.5-3k',
    statePensionKnown: 'no', niQualifyingYears: '<10',
    totalEstate: '<25k', isMarriedOrCP: false, homeLeftToDescendants: false,
    willInPlace: false, lpaInPlace: false,
    riskProfile: 'balanced',
  },
  view: {
    segmentId: 'S1', segmentLabel: 'Early Accumulator',
    persona: 'Age 28 • £45k income • Solo, renting',
    healthInterpretation: 'You are on track thanks to time. The biggest lever you can pull now is capturing your full employer pension match — one decision, 30+ years of compounding.',
    headline: {
      tone: 'good',
      title: 'Time is your biggest asset — and you\'re using it lightly',
      body: 'On your current contribution rate you are on course for a workable retirement at 65. Nudging contributions up by a few percent now is worth more than every other decision you can make later.',
    },
    grid: grid({
      retirement:   { status: 'green', note: 'Projected to meet target at 65 with time on your side.' },
      pension:      { status: 'amber', note: '8% of income. Check employer match — it may be higher.' },
      statePension: { status: 'grey',  note: 'Too early to know NI record.' },
      investment:   { status: 'amber', note: 'Small pot, single wrapper. Diversification starts now.' },
      tax:          { status: 'green', note: 'Basic-rate. ISA allowance partially used.' },
      cash:         { status: 'green', note: '£8k covers your essentials for 6+ months.' },
      debt:         { status: 'amber', note: '£2.2k credit card — clear before investing more.' },
      mortgage:     { status: 'grey',  note: 'You rent — not applicable yet.' },
      estate:       { status: 'red',   note: 'No will or LPA likely. Cheap to fix now.' },
      iht:          { status: 'green', note: 'No exposure.' },
      protection:   { status: 'grey',  note: 'Not asked. Worth a thought once dependents appear.' },
      twelfth:      { status: 'amber', note: 'One employer — salary is your only income stream.', label: 'Income mix' },
    }),
    goals: [
      { goal: 'Buy a home in 5 years',        capacity: 'No deposit yet. £250/mo saving ramping up.', alignment: 'amber' },
      { goal: 'Comfortable retirement at 65', capacity: '37 years of compounding does the heavy lifting.', alignment: 'green' },
      { goal: 'Build financial independence', capacity: 'Surplus growing; habits forming.', alignment: 'green' },
    ],
    nextSteps: [
      'Check your employer pension match — request the max from HR.',
      'Automate a £50/month ISA top-up for one year, re-evaluate.',
      'Set a 35-year NI record goal — check gaps on gov.uk.',
    ],
    // 5 "things worth a conversation" for S1 — items 0-3 render as standard cards,
    // item 4 ("pitfall.ni_gaps") renders as the featured "fifth" highlight.
    awarenessCheckIds: [
      'pitfall.lpa',
      'pitfall.pension_consolidation',
      'pitfall.fund_fee_stack',
      'pitfall.emergency_fund_sizing',
      'pitfall.ni_gaps',
    ],
    bullets: [
      { tone: 'good', text: 'You have 37 years of compounding ahead — the single biggest lever in the chart.' },
      { tone: 'warn', text: 'Pension at £12k is light for age 28. Capturing any employer match above 3% is the cheapest upgrade you can make.' },
      { tone: 'info', text: 'Your ISA becomes the bridge to age 57 when pension unlocks — keep it liquid and invested.' },
      { tone: 'risk', text: 'Renting + no property equity shifts the "safe spend" line down in later life.' },
    ],
  },
};

// ---------- S2 Mass-Affluent Mid-Career ----------
const S2: Fixture = {
  inputs: {
    currentAge: 42, partnerPresent: true, partnerAge: 40, hasDependentChildren: true, hasElderlyParents: false, targetRetirementAge: 62,
    mainHomeValue: '250-500k', otherPropertyValue: 0,
    totalPensionValue: '25-100k', cashSavings: '<25k', isaBalance: '25-100k', giaBalance: 0,
    businessValue: 0, otherAssets: 0,
    mainHomeMortgageBalance: '100-250k', otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: '<25k',
    householdGrossIncome: '50-100k', isScottishTaxpayer: false,
    monthlySavingAmount: '<1.5k', employerPensionContribPct: '5-10', ownPensionContribPct: '3-5',
    essentialMonthlySpend: '3-5k', nonEssentialMonthlySpend: '<1.5k', retirementSpendRatio: 'same',
    mortgageMonthlyPayment: '1.5-3k', mortgageEndAge: '55_65',
    statePensionKnown: 'partial', niQualifyingYears: '20-30',
    totalEstate: '250-500k', isMarriedOrCP: true, homeLeftToDescendants: true,
    willInPlace: false, lpaInPlace: false,
    riskProfile: 'balanced',
  },
  view: {
    segmentId: 'S2', segmentLabel: 'Mass-Affluent Mid-Career',
    persona: 'Age 42 • £75k • Partner + kids, mortgaged',
    healthInterpretation: 'Slightly below target. Lifting pension contribution from 12% to 15% plus redirecting freed mortgage payment at 58 closes the gap entirely.',
    headline: {
      tone: 'warn',
      title: 'On track — but the mortgage cliff at 58 is the pivot',
      body: 'When the mortgage clears, ~£1,200/month of freed cash flow decides your retirement comfort. Committing that surplus before it arrives is the single biggest lever.',
    },
    grid: grid({
      retirement:   { status: 'amber', note: 'At 88% of target — within reach, not yet secured.' },
      pension:      { status: 'amber', note: '£95k is ~£180k behind a typical 42yo target.' },
      statePension: { status: 'amber', note: '~20 years NI built. 15 more needed for full.' },
      investment:   { status: 'green', note: 'ISA + pension — diversified enough for now.' },
      tax:          { status: 'green', note: 'Basic + higher rate; allowances being used.' },
      cash:         { status: 'amber', note: '£15k vs ~£24k ideal for household of 4.' },
      debt:         { status: 'amber', note: '£3.5k CC — clear this year.' },
      mortgage:     { status: 'green', note: 'On track to clear at age 58.' },
      estate:       { status: 'red',   note: 'Children + likely no will is the biggest flag.' },
      iht:          { status: 'green', note: 'Below thresholds currently.' },
      protection:   { status: 'red',   note: 'Dependents without cover is a material risk.' },
      twelfth:      { status: 'amber', note: 'Single household earner carries concentration risk.', label: 'Income mix' },
    }),
    goals: [
      { goal: 'Fund university for two kids',    capacity: '~£90k needed. Current surplus ~£8k/yr.', alignment: 'amber' },
      { goal: 'Pay off mortgage by 58',          capacity: 'On current schedule — £1,200/mo stream freed.', alignment: 'green' },
      { goal: 'Retire at 62 comfortably',        capacity: '88% of target — close, not guaranteed.', alignment: 'amber' },
      { goal: 'Recession-proof family finances', capacity: 'Cash buffer thin; no protection in place.', alignment: 'amber' },
    ],
    nextSteps: [
      'Set a diary note for age 57 to redirect the full mortgage payment into pension/ISA.',
      'Consider a one-off ISA top-up from savings above £10k emergency buffer.',
      'Check partner\'s pension — household-level planning usually adds 10-15% to retirement income.',
    ],
    // Family + mortgage stage — LPA + protection dominate; the "fifth" is will currency (kids make it urgent).
    awarenessCheckIds: [
      'pitfall.lpa',
      'pitfall.ssp_gap',
      'pitfall.couples_alignment',
      'pitfall.pension_consolidation',
      'pitfall.will_currency',
    ],
    bullets: [
      { tone: 'good', text: 'Comfortable retirement at 62 is achievable on current trajectory.' },
      { tone: 'warn', text: 'Pension balance is roughly £180k below a typical age-42 on-track figure.' },
      { tone: 'info', text: 'Mortgage ends at age 58 — chart shows a step-up in saveable income from that year.' },
      { tone: 'risk', text: 'School fees, big family spend years, and career breaks not modelled here.' },
    ],
  },
};

// ---------- S3 High-Earner Mid-Career ----------
const S3: Fixture = {
  inputs: {
    currentAge: 45, partnerPresent: true, hasDependentChildren: true, hasElderlyParents: false, targetRetirementAge: 60,
    mainHomeValue: '500k-1m', otherPropertyValue: 0,
    totalPensionValue: '100-250k', cashSavings: '25-100k', isaBalance: '100-250k', giaBalance: '25-100k',
    businessValue: 0, otherAssets: 0,
    mainHomeMortgageBalance: '250-500k', otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: 0,
    householdGrossIncome: '125-200k', isScottishTaxpayer: false,
    monthlySavingAmount: '<1.5k', employerPensionContribPct: '10+', ownPensionContribPct: '3-5',
    essentialMonthlySpend: '3-5k', nonEssentialMonthlySpend: '1.5-3k', retirementSpendRatio: 'same',
    mortgageMonthlyPayment: '1.5-3k', mortgageEndAge: '55_65',
    statePensionKnown: 'partial', niQualifyingYears: '20-30',
    totalEstate: '1-2m', isMarriedOrCP: true, homeLeftToDescendants: true,
    willInPlace: true, lpaInPlace: false,
    riskProfile: 'balanced',
  },
  view: {
    segmentId: 'S3', segmentLabel: 'High-Earner Mid-Career',
    persona: 'Age 45 • £150k • £100k tax trap active',
    healthInterpretation: 'Above target. Your biggest unused lever is not returns — it\'s tax. Salary-sacrifice within the £100-125k band pays back at an effective 60% marginal rate.',
    headline: {
      tone: 'risk',
      title: 'The £100k–£125k tax trap is active — and costing you',
      body: 'Every £1 of income between £100k and £125k is taxed at an effective 60%. Salary-sacrifice into pension within this band is the highest-value contribution available anywhere in UK tax.',
    },
    grid: grid({
      retirement:   { status: 'green', note: '124% of target — strong margin.' },
      pension:      { status: 'amber', note: '14% is decent, but not enough to offset £100k trap.' },
      statePension: { status: 'green', note: '20+ years NI likely — on track for full.' },
      investment:   { status: 'green', note: 'ISA + GIA + Pension — properly diversified.' },
      tax:          { status: 'red',   note: '£100k–£125k trap active: effective 60% rate.' },
      cash:         { status: 'green', note: '£30k covers 5+ months of spend.' },
      debt:         { status: 'green', note: 'No non-mortgage debt.' },
      mortgage:     { status: 'amber', note: '£380k high but serviceable; clears at 60.' },
      estate:       { status: 'amber', note: 'Will likely in place; LPA often missed.' },
      iht:          { status: 'amber', note: 'Growth trajectory enters IHT territory by age 72.' },
      protection:   { status: 'red',   note: 'Cover likely under-matched to this income level.' },
      twelfth:      { status: 'amber', note: 'High earnings from one employer — concentration.', label: 'Income mix' },
    }),
    goals: [
      { goal: 'Retire at 60 with £90k/yr spend', capacity: 'Projected liquid ~£2.1m at 60.', alignment: 'green' },
      { goal: 'Minimise tax drag',               capacity: '60% marginal rate in £100-125k band — unaddressed.', alignment: 'red' },
      { goal: 'Fund children\'s adulthood',       capacity: 'Capacity available; tax-efficient routes exist.', alignment: 'green' },
      { goal: 'Leave meaningful legacy',         capacity: 'On track, though IHT drag will grow.', alignment: 'amber' },
    ],
    nextSteps: [
      'Move bonus + income above £100k into pension via salary sacrifice if available.',
      'Use full £20k ISA allowance and £3,000 CGT allowance each year.',
      'Review whether a VCT or EIS has a place in your mix — tax-led, not return-led.',
    ],
    // High-earner — the 100k trap is the headline; "fifth" is income-100k-trap itself.
    awarenessCheckIds: [
      'pitfall.iht_mitigation',
      'pitfall.savings_tax_efficiency',
      'pitfall.fund_fee_stack',
      'pitfall.carry_forward',
      'pitfall.income_trap_100k',
    ],
    bullets: [
      { tone: 'risk', text: '£100k tax trap: you lose £1 of Personal Allowance for every £2 earned over £100k — effective rate hits 60%.' },
      { tone: 'good', text: 'At 60, liquid wealth projects to ~£2.1m — roughly £90k/yr "safe" drawdown for 35 years.' },
      { tone: 'warn', text: 'Estate growth trajectory enters inheritance-tax territory around age 72 at current rates.' },
      { tone: 'info', text: 'Pension annual allowance taper may apply if total income > £260k.' },
    ],
  },
};

// ---------- S4 Senior Professional ----------
const S4: Fixture = {
  inputs: {
    currentAge: 55, partnerPresent: true, hasDependentChildren: false, hasElderlyParents: true, targetRetirementAge: 60,
    mainHomeValue: '1-2m', otherPropertyValue: 0,
    totalPensionValue: '500k-1m', cashSavings: '25-100k', isaBalance: '100-250k', giaBalance: '25-100k',
    businessValue: 0, otherAssets: 0,
    mainHomeMortgageBalance: '100-250k', otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: 0,
    householdGrossIncome: '125-200k', isScottishTaxpayer: false,
    monthlySavingAmount: '1.5-3k', employerPensionContribPct: '10+', ownPensionContribPct: '5-10',
    essentialMonthlySpend: '3-5k', nonEssentialMonthlySpend: '3-5k', retirementSpendRatio: 'same',
    mortgageMonthlyPayment: '1.5-3k', mortgageEndAge: '55_65',
    statePensionKnown: 'yes', niQualifyingYears: '30-35',
    totalEstate: '2-3m', isMarriedOrCP: true, homeLeftToDescendants: true,
    willInPlace: true, lpaInPlace: false,
    riskProfile: 'balanced',
  },
  view: {
    segmentId: 'S4', segmentLabel: 'Senior Professional',
    persona: 'Age 55 • £200k • 5 years from exit',
    healthInterpretation: 'Comfortably above target. The question is no longer "will the money last" — it\'s "what happens to the surplus". Drawdown order and IHT planning become the story.',
    headline: {
      tone: 'good',
      title: 'Five years to peak — then drawdown order matters',
      body: 'On current trajectory you can sustain a £120k/yr lifestyle to age 95 with a buffer. What changes that is not return — it\'s the order you draw from ISA / GIA / Pension, and the IHT wrapper you leave behind.',
    },
    grid: grid({
      retirement:   { status: 'green', note: '142% of target — strong buffer.' },
      pension:      { status: 'green', note: '18% contribution, £650k pot. Solid.' },
      statePension: { status: 'green', note: '30+ NI years — full expected.' },
      investment:   { status: 'green', note: 'Well-diversified across wrappers.' },
      tax:          { status: 'amber', note: 'Higher-rate still — carry-forward pension + CGT worth reviewing.' },
      cash:         { status: 'green', note: '£80k — 10+ months of cover.' },
      debt:         { status: 'green', note: 'No non-mortgage debt.' },
      mortgage:     { status: 'green', note: 'Clears at 60 — aligned to retirement.' },
      estate:       { status: 'amber', note: 'Will likely yes; LPA often missed at this stage.' },
      iht:          { status: 'red',   note: '£2m+ liquid + £1.2m home = material IHT liability by 75.' },
      protection:   { status: 'amber', note: 'Relevant until retirement; review cover levels.' },
      twelfth:      { status: 'green', note: 'Senior tenure; consulting income diversified.', label: 'Income mix' },
    }),
    goals: [
      { goal: 'Retire at 60',                 capacity: 'Projected £1.4m liquid + pension accessible.', alignment: 'green' },
      { goal: 'Travel extensively (£20k/yr)', capacity: 'Well within budget at projected drawdown.', alignment: 'green' },
      { goal: 'Leave £1m to children',        capacity: 'On current path — but IHT will take a large bite.', alignment: 'amber' },
      { goal: 'Support ageing parents',       capacity: 'Capacity clearly available.', alignment: 'green' },
    ],
    nextSteps: [
      'Max pension annual allowance before retirement (60k) — carry-forward the last 3 years if possible.',
      'Stress-test cash flow at 4% return (not 6%) — see if the retirement age still holds.',
      'Start the IHT conversation now while options (PETs, trusts, gifting) have time to work.',
    ],
    // Peak accumulation + IHT emerging. "Fifth" = iht_mitigation (the planning story).
    awarenessCheckIds: [
      'pitfall.pension_iht_2027',
      'pitfall.rnrb_taper',
      'pitfall.tapered_annual_allowance',
      'pitfall.carry_forward',
      'pitfall.iht_mitigation',
    ],
    bullets: [
      { tone: 'good', text: 'Retirement at 60 fully feasible; current liquid + pension accessible at 60 ~£1.4m.' },
      { tone: 'info', text: 'Drawdown order matters: ISA and GIA first leaves the pension intact (outside estate for IHT).' },
      { tone: 'warn', text: 'Mortgage clears at 60 — don\'t redirect that £1,500/mo into cash.' },
      { tone: 'risk', text: '£1.2m home + £2m+ liquid estate means IHT exposure by age 75.' },
    ],
  },
};

// ---------- S5 Business Owner Growth ----------
const S5: Fixture = {
  inputs: {
    currentAge: 48, partnerPresent: true, hasDependentChildren: true, hasElderlyParents: false, targetRetirementAge: 60,
    mainHomeValue: '500k-1m', otherPropertyValue: 0,
    totalPensionValue: '100-250k', cashSavings: '25-100k', isaBalance: '25-100k', giaBalance: 0,
    businessValue: '250-500k', otherAssets: 0,
    mainHomeMortgageBalance: '100-250k', otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: 0,
    householdGrossIncome: '50-100k', isScottishTaxpayer: false,
    monthlySavingAmount: '<1.5k', employerPensionContribPct: '3-5', ownPensionContribPct: '3-5',
    essentialMonthlySpend: '3-5k', nonEssentialMonthlySpend: '1.5-3k', retirementSpendRatio: 'same',
    mortgageMonthlyPayment: '1.5-3k', mortgageEndAge: '55_65',
    statePensionKnown: 'partial', niQualifyingYears: '20-30',
    totalEstate: '1-2m', isMarriedOrCP: true, homeLeftToDescendants: true,
    willInPlace: false, lpaInPlace: false,
    riskProfile: 'balanced',
  },
  view: {
    segmentId: 'S5', segmentLabel: 'Business Owner Growth',
    persona: 'Age 48 • Business ~£500k • No exit plan yet',
    healthInterpretation: 'This score depends entirely on the business. An exit at today\'s valuation adds ~30 points. No exit subtracts ~20. It is your single biggest variable, not on this page.',
    headline: {
      tone: 'risk',
      title: 'Your business is 45% of your net worth — but it\'s not in the chart',
      body: 'Personal pension and ISA are light because the business has been the preferred vehicle. An exit is the single decision that most changes this chart. Planning for it 3+ years ahead is the difference between 10% CGT and 24%.',
    },
    grid: grid({
      retirement:   { status: 'amber', note: 'Depends on exit. Standalone pension + ISA would give Red.' },
      pension:      { status: 'red',   note: '£120k is ~£230k behind a typical 48yo target.' },
      statePension: { status: 'amber', note: 'Mixed Class 2/4 record — worth a formal check.' },
      investment:   { status: 'red',   note: '45% of net worth in one illiquid business.' },
      tax:          { status: 'amber', note: 'Dividend/salary mix could be optimised.' },
      cash:         { status: 'green', note: '£60k — healthy personal buffer.' },
      debt:         { status: 'green', note: 'No non-mortgage personal debt.' },
      mortgage:     { status: 'amber', note: '£250k, clears 62. Serviceable but linked to business income.' },
      estate:       { status: 'red',   note: 'Shareholder agreement + cross-option likely missing.' },
      iht:          { status: 'amber', note: 'Business Property Relief may apply — untested without planning.' },
      protection:   { status: 'red',   note: 'Key-person + shareholder protection rarely in place here.' },
      twelfth:      { status: 'red',   note: 'No documented exit plan. Biggest single lever.', label: 'Business exit' },
    }, 'Business exit'),
    goals: [
      { goal: 'Exit at 60 for £500k+ net',      capacity: 'No exit plan; valuation unanchored.', alignment: 'red' },
      { goal: 'Pay off mortgage by 62',         capacity: 'On track given current personal income.', alignment: 'green' },
      { goal: 'Fund children through uni',      capacity: 'Possible if personal wealth grows alongside business.', alignment: 'amber' },
      { goal: 'Independence from the business', capacity: 'Personal pot is thin — you are the business.', alignment: 'red' },
    ],
    nextSteps: [
      'Get an informal business valuation annually — you need a number in this chart, not a guess.',
      'Start drawing a pension even if dividend-heavy — annual allowance otherwise evaporates.',
      'Model three exit scenarios: BADR-qualifying sale, EOT, or trade sale.',
    ],
    // Business owner growth — "fifth" = extraction-mix (the owner's core decision).
    awarenessCheckIds: [
      'pitfall.pension_as_extraction',
      'pitfall.group_life_fragility',
      'pitfall.ssp_gap',
      'pitfall.couples_alignment',
      'pitfall.extraction_mix',
    ],
    bullets: [
      { tone: 'risk', text: '45% of net worth is illiquid, unvalued in this chart, and worth whatever a buyer decides.' },
      { tone: 'warn', text: 'Personal pension at £120k is behind a typical 48-year-old.' },
      { tone: 'info', text: 'Business Asset Disposal Relief caps CGT at 10% on the first £1m of gain.' },
      { tone: 'good', text: 'An exit in 12 years at £500k shifts the chart up by ~£400k from age 60 onwards.' },
    ],
  },
};

// ---------- S6 Business Owner Exit ----------
const S6: Fixture = {
  inputs: {
    currentAge: 58, partnerPresent: true, hasDependentChildren: false, hasElderlyParents: false, targetRetirementAge: 61,
    mainHomeValue: '500k-1m', otherPropertyValue: 0,
    totalPensionValue: '250-500k', cashSavings: '100-250k', isaBalance: '100-250k', giaBalance: 0,
    businessValue: '1-2m', otherAssets: 0,
    mainHomeMortgageBalance: '25-100k', otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: 0,
    householdGrossIncome: '100-125k', isScottishTaxpayer: false,
    monthlySavingAmount: '1.5-3k', employerPensionContribPct: '10+', ownPensionContribPct: '5-10',
    essentialMonthlySpend: '3-5k', nonEssentialMonthlySpend: '3-5k', retirementSpendRatio: 'same',
    mortgageMonthlyPayment: '<1.5k', mortgageEndAge: '55_65',
    statePensionKnown: 'yes', niQualifyingYears: '30-35',
    totalEstate: '2-3m', isMarriedOrCP: true, homeLeftToDescendants: true,
    willInPlace: true, lpaInPlace: true,
    riskProfile: 'balanced',
  },
  view: {
    segmentId: 'S6', segmentLabel: 'Business Owner Exit',
    persona: 'Age 58 • Exiting business in ~3 years',
    healthInterpretation: 'On track if the exit executes. Structure — BADR qualifying, earn-out sequencing, pension contributions around sale year — is worth six figures in tax saved.',
    headline: {
      tone: 'good',
      title: 'The exit in ~3 years is the defining event on this chart',
      body: 'How you structure it — BADR-qualifying, earn-out tranches, pension contributions sequenced around the sale year — is worth more than every investment return decision combined.',
    },
    grid: grid({
      retirement:   { status: 'green', note: '128% of target if exit closes at plan.' },
      pension:      { status: 'amber', note: '£280k — catch-up contributions before exit year matter.' },
      statePension: { status: 'green', note: 'Long NI record.' },
      investment:   { status: 'amber', note: 'Pre-exit concentration expected; post-exit allocation is next.' },
      tax:          { status: 'green', note: 'BADR planning likely in place — worth ~£140k.' },
      cash:         { status: 'green', note: '£150k — very healthy.' },
      debt:         { status: 'green', note: 'None.' },
      mortgage:     { status: 'green', note: '£80k balance, clears 63.' },
      estate:       { status: 'amber', note: 'Will yes; trust + LPA worth checking.' },
      iht:          { status: 'amber', note: 'Estate steps up post-sale — plan before, not after.' },
      protection:   { status: 'amber', note: 'Key-person still matters until handover complete.' },
      twelfth:      { status: 'green', note: 'Documented exit plan with timeline.', label: 'Business exit' },
    }, 'Business exit'),
    goals: [
      { goal: 'Execute clean exit at BADR rate',      capacity: 'Plan in place; structure worth ~£140k in tax.', alignment: 'green' },
      { goal: '£80k/yr retirement spend',             capacity: 'Post-exit capacity comfortably covers.', alignment: 'green' },
      { goal: 'Provide for grandchildren',            capacity: 'Clear capacity post-exit.', alignment: 'green' },
      { goal: 'Successor transition (family vs external)', capacity: 'Often unresolved until close to the deal.', alignment: 'amber' },
    ],
    nextSteps: [
      'Lock in the sale structure before signing — tax treatment depends on it.',
      'Use every year\'s pension allowance up to the exit date.',
      'Line up the post-exit asset allocation now.',
    ],
    // Business owner exit — "fifth" = BADR timing (the defining decision for the exit).
    awarenessCheckIds: [
      'pitfall.iht_mitigation',
      'pitfall.carry_forward',
      'pitfall.extraction_mix',
      'pitfall.pension_iht_2027',
      'pitfall.badr_timing',
    ],
    bullets: [
      { tone: 'good', text: 'Post-exit wealth (~£1m+ liquid) supports an £80k/yr lifestyle to 95 with comfort.' },
      { tone: 'info', text: 'BADR: 10% CGT on the first £1m of gain — saves ~£140k vs standard 24%.' },
      { tone: 'warn', text: 'Annual allowance resets each April — sequencing contributions before the exit year adds to tax efficiency.' },
      { tone: 'risk', text: 'Post-sale, your entire wealth shifts from "business" to "investments".' },
    ],
  },
};

// ---------- S7 Pre-Retiree Affluent ----------
const S7: Fixture = {
  inputs: {
    currentAge: 63, partnerPresent: true, hasDependentChildren: false, hasElderlyParents: false, targetRetirementAge: 65,
    mainHomeValue: '500k-1m', otherPropertyValue: 0,
    totalPensionValue: '250-500k', cashSavings: '100-250k', isaBalance: '100-250k', giaBalance: '25-100k',
    businessValue: 0, otherAssets: 0,
    mainHomeMortgageBalance: 0, otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: 0,
    householdGrossIncome: '50-100k', isScottishTaxpayer: false,
    monthlySavingAmount: '1.5-3k', employerPensionContribPct: '10+', ownPensionContribPct: '5-10',
    essentialMonthlySpend: '3-5k', nonEssentialMonthlySpend: '1.5-3k', retirementSpendRatio: 'less',
    mortgageEndAge: 'paid',
    statePensionKnown: 'yes', niQualifyingYears: '35+',
    totalEstate: '1-2m', isMarriedOrCP: true, homeLeftToDescendants: true,
    willInPlace: true, lpaInPlace: false,
    riskProfile: 'balanced',
  },
  view: {
    segmentId: 'S7', segmentLabel: 'Pre-Retiree Affluent',
    persona: 'Age 63 • 18 months to retirement',
    healthInterpretation: 'Above target. The accumulation conversation is finished; sequencing — which pot, which year, which wrapper — is the next 18 months of planning.',
    headline: {
      tone: 'good',
      title: '18 months to planned retirement — flex, not panic',
      body: 'Pension already accessible, mortgage paid, and ISA providing a tax-free bridge to state pension age. You have more options than constraints.',
    },
    grid: grid({
      retirement:   { status: 'green', note: '135% of target — strong position.' },
      pension:      { status: 'green', note: '£480k + 12% ongoing contribution.' },
      statePension: { status: 'green', note: 'Full expected in 4 years.' },
      investment:   { status: 'green', note: 'Multi-wrapper, de-risking starting.' },
      tax:          { status: 'amber', note: 'Drawdown order + pension lump-sum decision pending.' },
      cash:         { status: 'green', note: '£120k — very comfortable.' },
      debt:         { status: 'green', note: 'None.' },
      mortgage:     { status: 'green', note: 'Paid off.' },
      estate:       { status: 'amber', note: 'Will yes, LPA not always updated at this stage.' },
      iht:          { status: 'amber', note: 'Below immediate threshold; worth watching.' },
      protection:   { status: 'amber', note: 'Life/IP becoming less relevant; review still useful.' },
      twelfth:      { status: 'green', note: 'Diversified retirement income sources.', label: 'Income mix' },
    }),
    goals: [
      { goal: 'Retire at 65',                     capacity: 'Projected liquid ~£1m; state pension 2 years after.', alignment: 'green' },
      { goal: 'Travel annually while health allows', capacity: 'Clear capacity.', alignment: 'green' },
      { goal: 'Help grandchildren with education',  capacity: 'Gifting capacity comfortable.', alignment: 'green' },
      { goal: 'Stay in the current home',          capacity: 'No mortgage; maintenance reserves adequate.', alignment: 'green' },
    ],
    nextSteps: [
      'Map out the first 5 years of retirement income month-by-month — not year-by-year.',
      'Stress-test at 3% return and 4% inflation — does the plan still work?',
      'Decide now: lump sum up-front vs UFPLS. Big tax consequences either way.',
    ],
    // Pre-retirement — "fifth" = pension-iht-2027 (the imminent rule change).
    awarenessCheckIds: [
      'pitfall.carry_forward',
      'pitfall.glide_path',
      'pitfall.iht_mitigation',
      'pitfall.lpa',
      'pitfall.pension_iht_2027',
    ],
    bullets: [
      { tone: 'good', text: 'Current liquid + accessible pension = ~£1.0m. Supports £48k/yr spend to 95 with headroom.' },
      { tone: 'info', text: 'Pension tax-free lump sum (25% up to £268,275) can fund the first 5 years without touching taxable income.' },
      { tone: 'warn', text: 'Four-year gap to state pension — most tax-efficient drawdown window.' },
      { tone: 'risk', text: 'Sequence-of-returns risk: a bad first 5 years shortens the runway disproportionately.' },
    ],
  },
};

// ---------- S8 Retired (drawdown) ----------
const S8: Fixture = {
  inputs: {
    currentAge: 70, partnerPresent: false, hasDependentChildren: false, hasElderlyParents: false, targetRetirementAge: 60,
    mainHomeValue: '500k-1m', otherPropertyValue: 0,
    totalPensionValue: '250-500k', cashSavings: '25-100k', isaBalance: '100-250k', giaBalance: 0,
    businessValue: 0, otherAssets: 0,
    mainHomeMortgageBalance: 0, otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: 0,
    householdGrossIncome: '<50k', isScottishTaxpayer: false,
    monthlySavingAmount: '<1.5k', employerPensionContribPct: '0-3', ownPensionContribPct: '0-3',
    essentialMonthlySpend: '1.5-3k', nonEssentialMonthlySpend: '1.5-3k', retirementSpendRatio: 'same',
    mortgageEndAge: 'paid',
    statePensionKnown: 'yes', niQualifyingYears: '35+',
    totalEstate: '500k-1m', isMarriedOrCP: false, homeLeftToDescendants: true,
    willInPlace: true, lpaInPlace: false,
    riskProfile: 'cautious',
  },
  view: {
    segmentId: 'S8', segmentLabel: 'Retired',
    persona: 'Age 70 • Drawing down • £45k/yr spend',
    healthInterpretation: 'Your funds are projected to last approximately 91% of your expected remaining lifetime — about a 4-year gap against a 25-year horizon. Small spending adjustments or a rate re-check close most of it.',
    headline: {
      tone: 'warn',
      title: 'At £45k/yr spend, your funds last to approximately age 91',
      body: 'The chart shows a declining balance; at current growth and inflation assumptions, you have ~21 years of runway. Below, you\'ll see how sensitive that number is to the variables you cannot control.',
    },
    grid: grid({
      retirement:   { status: 'amber', note: 'Funds cover 91% of expected lifetime; 4-year gap.' },
      pension:      { status: 'amber', note: 'Drawdown rate sustainable at spend minus ~10%.' },
      statePension: { status: 'green', note: 'Full rate, in payment.' },
      investment:   { status: 'amber', note: 'Review de-risk level — not too cautious, not too racy.' },
      tax:          { status: 'amber', note: 'Drawdown order affects lifetime tax by thousands.' },
      cash:         { status: 'green', note: '£90k reserve is healthy.' },
      debt:         { status: 'green', note: 'None.' },
      mortgage:     { status: 'green', note: 'Paid.' },
      estate:       { status: 'red',   note: 'Will likely out of date; LPA critical at this age.' },
      iht:          { status: 'green', note: 'Below thresholds.' },
      protection:   { status: 'grey',  note: 'Less relevant at this stage.' },
      twelfth:      { status: 'green', note: 'State + private pension + ISA income streams.', label: 'Income mix' },
    }),
    goals: [
      { goal: 'Remain independent in my home',  capacity: 'Equity release or downsize adds 12-18 months runway.', alignment: 'amber' },
      { goal: 'Help grandchildren financially', capacity: 'Constrained by runway; small gifts only.', alignment: 'amber' },
      { goal: 'Leave something to my children', capacity: 'Depends on longevity and market sequence.', alignment: 'amber' },
      { goal: 'Manage healthcare without burdening family', capacity: 'LPA + care-fees planning not confirmed.', alignment: 'amber' },
    ],
    nextSteps: [
      'Review whether £45k spend is essential or includes elective items — a £6k/yr reduction adds 5 years of runway.',
      'Annual check-in on the "money-lasts-until" age — this number will move each year with markets.',
      'Talk to family about house plans. Downsizing is a decision made once.',
    ],
    // Retired — "fifth" = LPA (the legal gap that is most urgent at 70).
    awarenessCheckIds: [
      'pitfall.care_funding',
      'pitfall.pension_iht_2027',
      'pitfall.will_currency',
      'pitfall.rnrb_taper',
      'pitfall.lpa',
    ],
    bullets: [
      { tone: 'good', text: 'State pension (~£12k/yr) covers essential spending — without it, runway ends at 81.' },
      { tone: 'warn', text: 'Inflation at 2.5% means year-20 expenses are ~£74k in today\'s money.' },
      { tone: 'risk', text: 'If returns average 3% not 4.5%, runway shortens to age 84.' },
      { tone: 'info', text: 'Your home (£550k) is a final reserve — equity release or downsize adds 12-18 months.' },
    ],
  },
};

// ---------- S9 HNW Multi-Generational ----------
const S9: Fixture = {
  inputs: {
    currentAge: 68, partnerPresent: true, hasDependentChildren: false, hasElderlyParents: false, targetRetirementAge: 72,
    mainHomeValue: '2-3m', otherPropertyValue: '1-2m',
    totalPensionValue: '1-2m', cashSavings: '100-250k', isaBalance: '250-500k', giaBalance: '250-500k',
    businessValue: 0, otherAssets: '100-250k',
    mainHomeMortgageBalance: 0, otherPropertyMortgageBalance: 0, personalLoans: 0, creditCardDebt: 0,
    householdGrossIncome: '125-200k', isScottishTaxpayer: false,
    monthlySavingAmount: '3-5k', employerPensionContribPct: '5-10', ownPensionContribPct: '5-10',
    essentialMonthlySpend: '5-8k', nonEssentialMonthlySpend: '3-5k', retirementSpendRatio: 'same',
    mortgageEndAge: 'paid',
    statePensionKnown: 'yes', niQualifyingYears: '35+',
    totalEstate: '3m+', isMarriedOrCP: true, homeLeftToDescendants: true,
    willInPlace: true, lpaInPlace: true,
    riskProfile: 'balanced',
  },
  view: {
    segmentId: 'S9', segmentLabel: 'HNW Multi-Generational',
    persona: 'Age 68 • £6m+ estate • IHT exposed',
    healthInterpretation: 'Far above retirement target. The planning conversation is no longer about sustainability — it\'s about what your heirs keep after inheritance tax.',
    headline: {
      tone: 'risk',
      title: 'Your net estate is exposed to ~£1.9m of inheritance tax',
      body: 'At current reliefs and estate size, HMRC is the single largest inheritor. Every year without a structured plan is a year of lost opportunity (PETs, trusts, pension transfer).',
    },
    grid: grid({
      retirement:   { status: 'green', note: 'Far above target — sustainability is not the question.' },
      pension:      { status: 'green', note: '£1.4m, well-managed.' },
      statePension: { status: 'green', note: 'Full rate, in payment.' },
      investment:   { status: 'green', note: 'Multi-wrapper, multi-asset.' },
      tax:          { status: 'amber', note: 'Scope to optimise dividend + CGT drag.' },
      cash:         { status: 'green', note: '£240k buffer — more than adequate.' },
      debt:         { status: 'green', note: 'None.' },
      mortgage:     { status: 'green', note: 'Paid across all properties.' },
      estate:       { status: 'amber', note: 'Has will; trust structure not confirmed.' },
      iht:          { status: 'red',   note: '~£1.9m exposure at 40% — largest single cost to heirs.' },
      protection:   { status: 'amber', note: 'Whole-of-life worth discussing specifically for IHT.' },
      twelfth:      { status: 'green', note: 'Diversified: salary, dividends, investment income.', label: 'Income mix' },
    }),
    goals: [
      { goal: 'Leave multi-generational legacy',       capacity: '~£1.9m of it goes to HMRC under current plan.', alignment: 'red' },
      { goal: 'Fund philanthropy meaningfully',        capacity: 'Charitable giving is IHT-efficient; capacity ample.', alignment: 'green' },
      { goal: 'Support adult children during lifetime', capacity: 'Gifting allowances plus PETs — underused.', alignment: 'green' },
      { goal: 'Maintain lifestyle indefinitely',        capacity: 'Spend rate 2.1% of wealth — pot grows.', alignment: 'green' },
    ],
    nextSteps: [
      'Commission a full estate plan — IHT is a bespoke-advice problem.',
      'Consider pension as a transfer vehicle (outside estate, inherited tax-efficient).',
      'Discuss the family governance conversation. This is as much about alignment as numbers.',
    ],
    // HNW — "fifth" = iht_mitigation (the largest single cost to heirs).
    awarenessCheckIds: [
      'pitfall.rnrb_taper',
      'pitfall.pension_iht_2027',
      'pitfall.tapered_annual_allowance',
      'pitfall.adviser_fee_total',
      'pitfall.iht_mitigation',
    ],
    bullets: [
      { tone: 'risk', text: 'Estate value ~£6m → IHT liability ~£1.94m at 40% after nil-rate bands.' },
      { tone: 'info', text: 'Annual gifting allowances are material but not solving this alone. PETs need 7 years.' },
      { tone: 'good', text: 'Your spend rate is 2.1% of liquid wealth — pot grows despite withdrawals.' },
      { tone: 'warn', text: 'RNRB tapers to zero at £2.35m. You are already above it.' },
    ],
  },
};

export const FIXTURES: Fixture[] = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

export function fixtureById(id: string): Fixture | undefined {
  return FIXTURES.find(f => f.view.segmentId === id);
}
