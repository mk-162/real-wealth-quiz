# Content Brief — Compiled

*Auto-generated from the `content/` folder by `npm run content:compile`. Read-only — edit the per-file sources under `content/` rather than this document.*

*Last compiled: 2026-04-16*

---

## Pages

*3 entries.*

### data-capture

- **id**: "data-capture"
- **title**: "Data capture"
- **eyebrow**: "LAST THING"
- **headline**: "Where shall we send your shortlist?"
- **sub**: "We'll email you your picture and, if you'd like, hold a slot for a first conversation. No account to create, no password to remember."
- **fields**: [{"id":"first_name","label":"First name","placeholder":"What your friends call you","type":"text","required":true},{"id":"email","label":"Email","placeholder":"name@example.com","type":"email","required":true},{"id":"phone","label":"Mobile number (optional — only if you'd prefer a call or text to arrange a time)","placeholder":"07…","type":"tel","required":false}]
- **consent**: {"label":"I'd like Real Wealth to contact me about booking a call and to send occasional planning insights. I can unsubscribe any time.","detail_link_label":"See our privacy notice for the detail — plain English.","detail_link_href":"/privacy"}
- **primary_button**: "See your picture →"
- **honesty_line**: "We won't share your details with anyone outside Real Wealth."

One screen, four fields, no account creation. This sits between the last questionnaire screen and the summary page.

---

### homepage

- **id**: "homepage"
- **title**: "Homepage"
- **hero**: {"eyebrow":"A CONVERSATION WITH REAL WEALTH","headline":"The life you're planning for.","sub":"Ten minutes of honest questions about your money and your plans. You'll finish with a clear shortlist of things worth talking to a planner about. No advice — just a picture.","primary_cta":"Start the conversation","reassurance_line":"Your answers stay with us. We won't share them. You can stop any time.","pills":[{"icon":"user-x","label":"No sign-in needed"},{"icon":"shield-check","label":"FCA regulated firm"}]}
- **tier_picker**: {"heading":"How deep would you like to go?","sub":"Three lengths, same honest conversation. Stop whenever you like — your answers are saved.","tiles":[{"id":"quick","icon":"zap","time_label":"THREE MINUTES","name":"Quick picture","description":"A handful of questions and a short list of things worth a conversation. Enough for a feel."},{"id":"standard","icon":"bar-chart-3","time_label":"SEVEN MINUTES","name":"Standard dive","description":"A proper shortlist, with illustrative examples — the shape of what a first call might cover.","ribbon":"MOST PEOPLE START HERE","featured":true},{"id":"thorough","icon":"book-open","time_label":"TWELVE MINUTES","name":"Thorough","description":"Enough of a picture that you'll save half your first call. Best if you're close to wanting one."}],"primary_button":"Let's begin →","helper":"Not sure? Start with Standard — you can always stop early."}
- **freedom_quote**: {"text":"Real wealth isn't just about money — it's about freedom. Freedom to choose how you live, work, and spend your time."}
- **benefit_cards**: [{"icon":"heart-handshake","headline":"Built around people, not products.","sub":"Financial planning that starts with your life, not your portfolio."},{"icon":"refresh-ccw","headline":"A mirror, not a scorecard.","sub":"A reflection tool, not an exam. There are no right or wrong answers — just a clearer picture."},{"icon":"shield-check","headline":"FCA authorised financial planners.","sub":"Regulated professional advice based in Manchester and Taunton."}]
- **footer**: {"disclosure":"Real Wealth is a trading name of [entity]. Authorised and regulated by the Financial Conduct Authority. FCA register number: [xxxxxx].","general_line":"This tool provides general guidance and does not constitute a personal recommendation or financial advice.","links":[{"label":"Privacy","href":"/privacy"},{"label":"How we meet our Consumer Duty obligations","href":"/consumer-duty"}]}

The homepage is the one page every user sees. It has four stacked sections — hero, tier picker, brand freedom moment, benefit cards — and a standing footer. The aesthetic is Real Wealth's "Digital Private Suite" — generous whitespace, serif headlines in gelica ExtraLight Italic, no 1px borders, tonal layering instead.

The hero uses the teal gradient at 96px / 48px vertical padding (desktop / mobile). Typography-led, no hero photography.

---

### summary

- **id**: "summary"
- **title**: "Summary page"
- **aspiration_echo**: {"caption":"— in your words, gently rephrased.","fallback_templates":{"freedom_time":"The life you're planning for: freedom over your time.","security_family":"The life you're planning for: the people in your plan, held steady whatever comes.","choice_work":"The life you're planning for: your terms, your hours, a say in how you work.","experiences":"The life you're planning for: horizons you haven't walked yet, time to walk them.","legacy":"The life you're planning for: something worth passing on, on your terms.","peace":"The life you're planning for: a quiet mind about what's next."}}
- **considered_list**: {"section_heading":"THINGS WORTH A CONVERSATION","intro":"Here's what we noticed, based on what you told us. None of this is advice yet — it's a shortlist of conversations that would be valuable for someone in your situation.","max_cards":6,"min_cards":3,"final_line":"We'll save this list against your name. If you book a call, we'll bring it to the conversation so you don't have to."}
- **charts**: {"section_heading":"THE SHAPE OF IT","intro":"Not your numbers — nobody's numbers. The shape of the question.","per_chart_illustrative_tag":"ILLUSTRATIVE EXAMPLE","disclaimer":"These are not projections of your personal numbers. They show the shape of the question for a typical household. Your numbers, your plan, your answer — that's a conversation.","segment_chart_selection":{"S1":"compounding_line","S2":"compounding_line","S3":"100k_trap","S4":"100k_trap","S5":"extraction_mix","S6":"badr_transition","S7":"drawdown_paths","S8":"drawdown_paths","S9":"iht_on_3m"}}
- **fca_footer**: {"disclosure":"Real Wealth is a trading name of [entity]. Authorised and regulated by the Financial Conduct Authority. FCA register number: [xxxxxx]. This tool provides general guidance and does not constitute a personal recommendation or financial advice. A regulated conversation with one of our planners is required before acting on anything discussed here.","links":[{"label":"Privacy","href":"/privacy"},{"label":"How we meet our Consumer Duty obligations","href":"/consumer-duty"},{"label":"Start over","href":"?action=start_over"}]}
- **demo_view_raw**: {"link_label":"View the captured data","modal_note":"Demo only. In production this view would not exist — the data would flow to the firm's systems via HubSpot or an equivalent. This page exists so IT can see the shape of what we capture."}

One long scrolling page with six sections: aspiration echo → considered list → illustrative charts → segment CTA → FCA footer → demo "view raw data" link.

The aspiration echo blends keywords from the user's Q2.4 answer with a template tied to their Q1.2 wealth-definition choice. Verbatim text on the page is generated server-side and not stored — the page is refreshed from source answers each time it renders.

Example blended echoes (for reference during copy review):

- User picked *Freedom over my time* + wrote *"mornings outside, lunch with my wife, the grandchildren round on Sundays, no work after four"*
  → *The life you're planning for: mornings outside, Sundays with the grandchildren, time you actually own.*
- User picked *Security for my family* + wrote *"knowing the mortgage is paid, the kids through uni, the family safe if anything happens"*
  → *The life you're planning for: the mortgage paid, the kids through uni, a family held steady whatever comes.*
- User picked *Choice in how I work* + wrote *"a couple of days a week, on my own terms, the flexibility to say no"*
  → *The life you're planning for: a couple of days a week, your own terms, the freedom to say no.*


## Screens

*28 entries.*

### screen.3.0.intro

- **id**: "screen.3.0.intro"
- **screen_number**: "3.0"
- **title**: "Intro"
- **section**: "set_the_tone"
- **layout**: "intro"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **q_refs**: []
- **logged_as**: []
- **inputs**: []

# Headline
Let's talk about the life you're planning for.

# Sub
A few honest questions. No right answers, no scorecard — just a clearer picture by the end. You can stop any time; we'll save what you've told us so far.

# Body
Eyebrow: BEFORE WE START.
Primary button: *Begin →*.
No back button on this screen.

---

### screen.3.1.intent

- **id**: "screen.3.1.intent"
- **screen_number**: "3.1"
- **title**: "What brought you here"
- **section**: "set_the_tone"
- **layout**: "asymmetric"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **image_family**: "family_1_life_shape"
- **image_direction**: "A kitchen table at morning, two mugs, soft light through a window. A sense of 'before the day begins.' Holding image OK for v1.0."
- **q_refs**: ["Q1.1"]
- **logged_as**: ["intent"]
- **inputs**: [{"id":"intent","control":"card_select","required":true,"options":[{"value":"curious","label":"Curious — just having a look"},{"value":"specific","label":"I've got a specific question in mind"},{"value":"life_change","label":"A life change is coming up","conditional_reveal":"life_change_text"},{"value":"on_track","label":"I want to check I'm on track"},{"value":"suggested","label":"Someone suggested it"},{"value":"other","label":"Something else"}]},{"id":"life_change_text","control":"short_text","label":"What's coming up — in your own words?","placeholder":"e.g. retirement in 18 months, selling the business, first child.","max_chars":140,"required":false,"conditional_reveal":"only when intent == life_change"}]

# Headline
What brought you here today?

# Sub
No wrong answer — we ask so we can pitch the rest of the conversation properly.

---

### screen.3.2.wealth_definition

- **id**: "screen.3.2.wealth_definition"
- **screen_number**: "3.2"
- **title**: "What real wealth means"
- **section**: "set_the_tone"
- **layout**: "asymmetric"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **image_family**: "family_3_legacy"
- **image_direction**: "A coastal path at late afternoon, long shadows, one figure walking into the distance. Not identifiable. Conveys horizon."
- **q_refs**: ["Q1.2"]
- **logged_as**: ["wealth_definition"]
- **inputs**: [{"id":"wealth_definition","control":"card_select","required":true,"options":[{"value":"freedom_time","label":"Freedom over my time","icon":"infinity"},{"value":"security_family","label":"Security for my family","icon":"shield"},{"value":"choice_work","label":"Choice in how I work","icon":"briefcase"},{"value":"experiences","label":"Experiences and travel","icon":"map"},{"value":"legacy","label":"Legacy and impact","icon":"sprout"},{"value":"peace","label":"Peace of mind","icon":"feather"},{"value":"other","label":"Something else — I'll say it in my own words","conditional_reveal":"wealth_definition_text"}]},{"id":"wealth_definition_text","control":"short_text","max_chars":140,"required":false,"conditional_reveal":"only when wealth_definition == other"}]

# Headline
When you picture a life that feels genuinely wealthy to you — which comes closest?

# Sub
Pick the one that resonates most. You can tell us *"it's all six"* on the call.

---

### screen.3.3.about_you

- **id**: "screen.3.3.about_you"
- **screen_number**: "3.3"
- **title**: "About you"
- **section**: "life_shape"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: true
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **image_family**: "family_1_life_shape"
- **image_direction**: "A domestic scene, a Sunday newspaper on a breakfast table, two place settings. Warm, unpeopled."
- **q_refs**: ["Q2.1","Q2.2","Q2.2a"]
- **logged_as**: ["age","household","youngest_child_band"]
- **inputs**: [{"id":"age","label":"Your age","control":"slider","range":{"min":25,"max":80,"default":45,"step":1},"required":true},{"id":"household","label":"Who else is part of the plan?","control":"multi_select","required":true,"options":[{"value":"partner","label":"A partner","icon":"heart"},{"value":"dependent_children","label":"Dependent children","icon":"baby","conditional_reveal":"youngest_child_band"},{"value":"adult_children","label":"Adult children","icon":"users"},{"value":"elderly_parent","label":"An elderly parent or relative we support","icon":"heart-hand"},{"value":"solo","label":"Nobody else — just me","icon":"user"},{"value":"complicated","label":"It's complicated — I'll explain","icon":"more-horizontal"}]},{"id":"youngest_child_band","label":"Youngest child's age","control":"radio","required":false,"conditional_reveal":"only when household includes dependent_children","options":[{"value":"under_5","label":"Under 5"},{"value":"5_to_11","label":"5–11"},{"value":"12_to_17","label":"12–17"}]}]

# Headline
Tell us a little about you.

# Sub
Two quick ones — they shape everything that follows.

---

### screen.3.4.work_status

- **id**: "screen.3.4.work_status"
- **screen_number**: "3.4"
- **title**: "Your working life"
- **section**: "life_shape"
- **layout**: "asymmetric"
- **grouped**: false
- **gate_critical**: true
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **image_family**: "family_4_business"
- **image_direction**: "A workbench with a single worn tool on it, late-afternoon light. Conveys craft and stewardship rather than 'business.'"
- **q_refs**: ["Q2.3"]
- **logged_as**: ["work_status"]
- **conditional_logic**: "gates the business-owner branch (Block C1) and the retirement branch (Block C)"
- **inputs**: [{"id":"work_status","control":"radio","required":true,"options":[{"value":"employed","label":"Employed"},{"value":"self_employed","label":"Self-employed"},{"value":"business_owner","label":"I run a business"},{"value":"partly_retired","label":"Partly retired — still working some"},{"value":"fully_retired","label":"Fully retired"},{"value":"between_roles","label":"Between roles or taking a break"}]}]

# Headline
How would you describe your working life right now?

---

### screen.3.5.money_today

- **id**: "screen.3.5.money_today"
- **screen_number**: "3.5"
- **title**: "Money today"
- **section**: "money_today"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: true
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **image_family**: "family_2_money_today"
- **image_direction**: "A leather notebook, a fountain pen, a fresh coffee cup, a stack of unopened mail. The texture of an adult life."
- **q_refs**: ["Q3.1","Q4.5"]
- **logged_as**: ["income_band","estate_band","earners_one_or_two"]
- **conditional_logic**: "if income >= £100k, reveal earners_one_or_two"
- **inputs**: [{"id":"income_band","label":"Your household's annual income, before tax","control":"radio","required":true,"options":[{"value":"lt50k","label":"Under £50,000"},{"value":"50to100k","label":"£50,000 – £100,000"},{"value":"100to125k","label":"£100,000 – £125,000"},{"value":"125to200k","label":"£125,000 – £200,000"},{"value":"gt200k","label":"£200,000 or more"},{"value":"prefer_not","label":"I'd rather not say"}]},{"id":"estate_band","label":"If you added everything up — home, pensions, investments, business — where would you land?","label_helper":"Rough orders of magnitude are fine. Nobody has this memorised.","control":"radio","required":true,"options":[{"value":"lt500k","label":"Under £500,000"},{"value":"500k_to_1m","label":"£500,000 – £1m"},{"value":"1m_to_2m","label":"£1m – £2m"},{"value":"2m_to_3m","label":"£2m – £3m"},{"value":"3m_to_5m","label":"£3m – £5m"},{"value":"gt5m","label":"£5m or more"},{"value":"not_sure","label":"Not sure"}]},{"id":"earners_one_or_two","label":"Is that across one earner or two?","control":"radio","required":false,"conditional_reveal":"only when income_band in [100to125k, 125to200k, gt200k]","options":[{"value":"one","label":"One"},{"value":"two_or_more","label":"Two or more"}]}]

# Headline
A picture of where your money sits.

# Sub
Rough is fine. Nobody's checking maths.

---

### screen.3.6.transition

- **id**: "screen.3.6.transition"
- **screen_number**: "3.6"
- **title**: "Section transition — money (segment assigned)"
- **section**: "money_today"
- **layout**: "transition"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **q_refs**: []
- **logged_as**: []
- **inputs**: []
- **transition_icon**: "sparkles"
- **conditional_logic**: "segment is assigned silently between 3.5 and 3.6; the rules engine fires here"

# Body
Now — let's talk about the rest of your life.

---

### screen.4.A.0.transition

- **id**: "screen.4.A.0.transition"
- **screen_number**: "4.A.0"
- **title**: "Section transition — money"
- **section**: "money_today"
- **layout**: "transition"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **q_refs**: []
- **logged_as**: []
- **inputs**: []
- **transition_icon**: "coins"

# Body
Now — let's talk about your money.

---

### screen.4.A.1.monthly_shape

- **id**: "screen.4.A.1.monthly_shape"
- **screen_number**: "4.A.1"
- **title**: "Monthly shape"
- **section**: "money_today"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: false
- **segments_served**: ["S2","S3","S4","S5","S6","S7","S8","S9"]
- **skip**: ["S1"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_2_money_today"
- **image_direction**: "A still life of a household's Sunday — a kettle, a bowl of fruit, a diary left open."
- **q_refs**: ["Q3.2","Q3.3"]
- **logged_as**: ["essential_monthly_spend","non_essential_monthly_spend"]
- **inputs**: [{"id":"essential_monthly_spend","label":"Monthly essentials — mortgage or rent, bills, food, transport, childcare","control":"radio","required":true,"options":[{"value":"lt2k","label":"Under £2,000"},{"value":"2to3_5k","label":"£2,000 – £3,500"},{"value":"3_5to5k","label":"£3,500 – £5,000"},{"value":"5to7_5k","label":"£5,000 – £7,500"},{"value":"7_5to12k","label":"£7,500 – £12,000"},{"value":"gt12k","label":"£12,000 or more"}]},{"id":"non_essential_monthly_spend","label":"Monthly on holidays, meals out, hobbies, subscriptions","control":"radio","required":true,"options":[{"value":"lt500","label":"Under £500"},{"value":"500to1k","label":"£500 – £1,000"},{"value":"1k_to_2k","label":"£1,000 – £2,000"},{"value":"2k_to_4k","label":"£2,000 – £4,000"},{"value":"gt4k","label":"£4,000 or more"},{"value":"not_sure","label":"Not sure"}]}]

# Headline
A feel for a typical month.

# Sub
Bands are easier than exact numbers. No need to get the calculator out.

---

### screen.4.A.2.confidence_mindset

- **id**: "screen.4.A.2.confidence_mindset"
- **screen_number**: "4.A.2"
- **title**: "Confidence and mindset"
- **section**: "money_today"
- **layout**: "centred"
- **grouped**: true
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B"]
- **q_refs**: ["Q3.4","Q3.5"]
- **logged_as**: ["saving_confidence","money_mindset"]
- **inputs**: [{"id":"saving_confidence","label":"How confident are you that you're saving enough for the life you want?","control":"likert_5","required":true},{"id":"money_mindset","label":"When you think about money, which comes closest?","control":"card_select","required":true,"options":[{"value":"tool_freedom","label":"A tool for freedom"},{"value":"security","label":"Security for the people I love"},{"value":"rather_not","label":"Something I'd rather not dwell on"},{"value":"scorecard","label":"A scorecard of what I've built"},{"value":"stress","label":"Honestly — a source of stress"},{"value":"neutral","label":"No strong feelings either way"}]}]

# Headline
How it sits with you.

# Sub
Two questions about feeling rather than figures. They matter more than most people expect.

---

### screen.4.A.3.assets

- **id**: "screen.4.A.3.assets"
- **screen_number**: "4.A.3"
- **title**: "Assets at a glance"
- **section**: "assets"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **image_family**: "family_3_legacy"
- **image_direction**: "A coastal horizon at dawn, grey-green water meeting paler sky. Long view, calm."
- **q_refs**: ["Q4.1","Q4.1a","Q4.3","Q4.3a","Q4.4"]
- **logged_as**: ["main_home","mortgage_balance","pension_pots","pension_total_band","investments_band"]
- **inputs**: [{"id":"main_home","label":"Your main home — own or rent?","control":"radio","required":true,"options":[{"value":"own_outright","label":"Own outright"},{"value":"own_mortgage","label":"Own, with a mortgage","conditional_reveal":"mortgage_balance"},{"value":"rent","label":"Renting"},{"value":"with_family","label":"Living with family"},{"value":"complicated","label":"It's more complicated"}]},{"id":"mortgage_balance","label":"Roughly how much is left on the mortgage?","control":"radio","required":false,"conditional_reveal":"only when main_home == own_mortgage","options":[{"value":"lt100k","label":"Under £100,000"},{"value":"100k_to_250k","label":"£100,000 – £250,000"},{"value":"250k_to_500k","label":"£250,000 – £500,000"},{"value":"gt500k","label":"£500,000+"},{"value":"prefer_not","label":"Prefer not to say"}]},{"id":"pension_pots","label":"Pension pots across your career so far","control":"radio","required":true,"options":[{"value":"none","label":"None yet"},{"value":"one","label":"One"},{"value":"two_three","label":"Two or three"},{"value":"four_six","label":"Four to six","conditional_reveal":"pension_total_band"},{"value":"more_than_six","label":"More than six","conditional_reveal":"pension_total_band"},{"value":"no_idea","label":"Genuinely no idea"}]},{"id":"pension_total_band","label":"Any sense of the combined value?","control":"radio","required":false,"conditional_reveal":"only when pension_pots >= four_six","options":[{"value":"lt100k","label":"Under £100,000"},{"value":"100k_to_250k","label":"£100,000 – £250,000"},{"value":"250k_to_500k","label":"£250,000 – £500,000"},{"value":"gt500k","label":"£500,000+"},{"value":"no_idea","label":"No idea — that's part of what I'd like to know"}]},{"id":"investments_band","label":"Savings and investments outside pensions and property","control":"radio","required":true,"options":[{"value":"lt50k","label":"Under £50,000"},{"value":"50k_to_250k","label":"£50,000 – £250,000"},{"value":"250k_to_1m","label":"£250,000 – £1m"},{"value":"1m_to_3m","label":"£1m – £3m"},{"value":"gt3m","label":"£3m or more"},{"value":"prefer_not","label":"I'd rather not say"}]}]

# Headline
What you've built so far.

# Sub
A quick shape of the big pots. Rough bands are fine.

---

### screen.4.A.4.other_property

- **id**: "screen.4.A.4.other_property"
- **screen_number**: "4.A.4"
- **title**: "Other property"
- **section**: "assets"
- **layout**: "asymmetric"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["S3","S4","S6","S7","S9"]
- **skip**: ["S1","S2","S5","S8"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_3_legacy"
- **image_direction**: "Row of coastal cottages at mid-afternoon, lived-in, English."
- **q_refs**: ["Q4.2","Q4.2a"]
- **logged_as**: ["other_property","held_in_limited_company"]
- **inputs**: [{"id":"other_property","control":"radio","required":true,"options":[{"value":"none","label":"No — just the main home"},{"value":"one_other","label":"One other"},{"value":"two_or_more","label":"Two or more","conditional_reveal":"held_in_limited_company"},{"value":"portfolio","label":"A portfolio — three or more","conditional_reveal":"held_in_limited_company"},{"value":"complicated","label":"It's complicated — I'll explain on the call"}]},{"id":"held_in_limited_company","label":"Is any of it held in a limited company?","control":"radio","required":false,"conditional_reveal":"only when other_property in [two_or_more, portfolio]","options":[{"value":"yes","label":"Yes"},{"value":"no","label":"No"},{"value":"not_sure","label":"Not sure — that's what I'd like to know"}]}]

# Headline
Any other property — a second place, a rental, something inherited?

---

### screen.4.A.5.happy_place

- **id**: "screen.4.A.5.happy_place"
- **screen_number**: "4.A.5"
- **title**: "Happy place"
- **section**: "life_shape"
- **layout**: "asymmetric"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **image_family**: "family_1_life_shape"
- **image_direction**: "A long, warm photograph of an ordinary-life scene. A beach at low tide with footprints. A kitchen in evening light. A garden hedge with flowers breaking through. Unpretentious and human-scale. This image family matters most — brief the design team carefully."
- **q_refs**: ["Q2.4"]
- **logged_as**: ["happy_place"]
- **inputs**: [{"id":"happy_place","control":"short_text","max_chars":140,"required":false,"placeholder":"e.g. Mornings outside, lunch with my partner, the grandchildren round on Sundays, no work after four."}]

# Headline
Describe your ideal normal week.

# Sub
Not a holiday — just your ordinary life, at its best. Whatever comes to mind.

---

### screen.4.B.0.transition

- **id**: "screen.4.B.0.transition"
- **screen_number**: "4.B.0"
- **title**: "Section transition — people"
- **section**: "people_and_legacy"
- **layout**: "transition"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B"]
- **q_refs**: []
- **logged_as**: []
- **inputs**: []
- **transition_icon**: "users"

# Body
Now — the people.

---

### screen.4.B.1.dependants_today

- **id**: "screen.4.B.1.dependants_today"
- **screen_number**: "4.B.1"
- **title**: "Dependants today"
- **section**: "people_and_legacy"
- **layout**: "asymmetric"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_1_life_shape"
- **image_direction**: "Children's drawings pinned to a kitchen wall, slightly askew, warm afternoon light. Or teenage trainers left by a hallway door. No faces."
- **q_refs**: ["Q6.1"]
- **logged_as**: ["dependency_horizon"]
- **conditional_logic**: "only fires if household includes dependent_children or adult_children"
- **inputs**: [{"id":"dependency_horizon","control":"radio","required":true,"options":[{"value":"fully_many_years","label":"Fully dependent — many years ahead"},{"value":"fully_nearing_indep","label":"Fully dependent — nearing independence"},{"value":"partly_coparent","label":"Partly, shared with a co-parent"},{"value":"occasionally","label":"Occasionally — e.g. helping through university"},{"value":"adults_but_help","label":"They're adults, but we still help out"}]}]

# Headline
How dependent are they on you at the moment?

# Sub
Their financial picture shapes yours.

---

### screen.4.B.2.legacy

- **id**: "screen.4.B.2.legacy"
- **screen_number**: "4.B.2"
- **title**: "Legacy"
- **section**: "people_and_legacy"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: false
- **segments_served**: ["S2","S3","S4","S5","S6","S7","S8","S9"]
- **skip**: ["S1"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_3_legacy"
- **image_direction**: "A long horizon, perhaps a path across fields in autumn. Conveys duration."
- **q_refs**: ["Q6.2","Q6.3"]
- **logged_as**: ["passing_on_intent","will_and_lpa_status"]
- **inputs**: [{"id":"passing_on_intent","label":"When you think about what you'd want to pass on, which feels closest?","control":"card_select","required":true,"options":[{"value":"max_family","label":"As much as possible to family"},{"value":"boost","label":"A boost for them, not a free ride"},{"value":"experiences","label":"Experiences and memories more than money"},{"value":"charity","label":"A charity or cause matters to me"},{"value":"not_thought","label":"I haven't thought about this much"},{"value":"complicated","label":"It's complicated — I need help with it"}]},{"id":"will_and_lpa_status","label":"Which of these do you have in place today?","control":"multi_select","required":true,"options":[{"value":"will_fresh","label":"A will, reviewed in the last 2 years","icon":"file-text"},{"value":"will_old","label":"A will, older than that","icon":"file-text"},{"value":"no_will","label":"No will yet","icon":"x-circle"},{"value":"lpa_health","label":"Lasting Power of Attorney — health","icon":"heart-pulse"},{"value":"lpa_finance","label":"Lasting Power of Attorney — finance","icon":"banknote"},{"value":"lpa_unsure","label":"Not sure what LPA is","icon":"help-circle"}]}]

# Headline
What happens later.

---

### screen.4.B.3.protection

- **id**: "screen.4.B.3.protection"
- **screen_number**: "4.B.3"
- **title**: "Protection"
- **section**: "protection"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: false
- **segments_served**: ["S2","S3","S4","S5","S6","S7","S9"]
- **skip**: ["S1","S8"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_1_life_shape"
- **image_direction**: "A bike leaning against a fence, a coat on a hook, a quiet hallway. Conveys ordinary life that would be disrupted by the unexpected."
- **q_refs**: ["Q8.1","Q8.2"]
- **logged_as**: ["earnings_protection_scale","life_cover_status"]
- **conditional_logic**: "only fires if household includes dependants"
- **inputs**: [{"id":"earnings_protection_scale","label":"If the main earner couldn't work for a year — injury, illness — how confident are you the family could maintain its lifestyle?","control":"likert_5","required":true},{"id":"life_cover_status","label":"Any life insurance or critical illness cover in place?","control":"radio","required":true,"options":[{"value":"through_work_only","label":"Yes — through work only"},{"value":"personal_policy","label":"Yes — a personal policy"},{"value":"both","label":"Both personal and work"},{"value":"no","label":"No"},{"value":"not_sure","label":"Not sure what we have"}]}]

# Headline
If something unexpected happened.

# Sub
A quieter subject, but worth asking.

---

### screen.4.C.0.transition

- **id**: "screen.4.C.0.transition"
- **screen_number**: "4.C.0"
- **title**: "Section transition — horizon"
- **section**: "retirement_horizon"
- **layout**: "transition"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B"]
- **q_refs**: []
- **logged_as**: []
- **inputs**: []
- **transition_icon**: "sunrise"

# Body
Now — what comes next.

---

### screen.4.C.1.retirement_picture

- **id**: "screen.4.C.1.retirement_picture"
- **screen_number**: "4.C.1"
- **title**: "The retirement picture"
- **section**: "retirement_horizon"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: false
- **segments_served**: ["S2","S3","S4","S5","S6","S7","S8","S9"]
- **skip**: ["S1"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_5_retirement"
- **image_direction**: "Walking shoes by a door, a wool coat on a peg, a waterproof. Conveys 'the day you don't have to go in.'"
- **q_refs**: ["Q7.1","Q7.2"]
- **logged_as**: ["target_retirement_age","retirement_feel"]
- **inputs**: [{"id":"target_retirement_age","label":"At what age would you ideally stop *needing* to work for money?","control":"slider","range":{"min":25,"max":75,"default":65,"step":1},"required":true},{"id":"retirement_feel","label":"When you picture not working, what comes up first?","control":"card_select","required":true,"options":[{"value":"cant_wait","label":"Can't wait"},{"value":"mixed","label":"A mix of excitement and nerves"},{"value":"uneasy","label":"A bit uneasy — I don't know who I am without work"},{"value":"hard_to_imagine","label":"Hard to imagine — I'll never fully stop"},{"value":"already_good","label":"Already there, and it's good"},{"value":"already_less_than_hoped","label":"Already there — and it's less than I hoped"}]}]

# Headline
The day you don't have to go to work.

---

### screen.4.C.2.state_pension

- **id**: "screen.4.C.2.state_pension"
- **screen_number**: "4.C.2"
- **title**: "State pension"
- **section**: "retirement_horizon"
- **layout**: "centred"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B"]
- **q_refs**: ["Q7.3"]
- **logged_as**: ["state_pension_awareness"]
- **conditional_logic**: "only fires if age >= 45"
- **inputs**: [{"id":"state_pension_awareness","control":"radio","required":true,"options":[{"value":"yes_checked","label":"Yes — I've checked it"},{"value":"roughly","label":"Roughly"},{"value":"no_should_check","label":"No — I should check"},{"value":"not_relevant_yet","label":"Not relevant to me yet"}]}]

# Headline
Do you know when you'll get the full new state pension — and how much it will be?

---

### screen.4.C1.0.transition

- **id**: "screen.4.C1.0.transition"
- **screen_number**: "4.C1.0"
- **title**: "Section transition — business"
- **section**: "business"
- **layout**: "transition"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["S5","S6"]
- **skip**: ["S1","S2","S3","S4","S7","S8","S9"]
- **tier_limit**: ["A","B"]
- **q_refs**: []
- **logged_as**: []
- **inputs**: []
- **transition_icon**: "briefcase"
- **conditional_logic**: "only fires if work_status in [business_owner, self_employed]"

# Body
Now — about your business.

---

### screen.4.C1.1.your_role

- **id**: "screen.4.C1.1.your_role"
- **screen_number**: "4.C1.1"
- **title**: "Your role in the business"
- **section**: "business"
- **layout**: "asymmetric"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["S5","S6"]
- **skip**: ["S1","S2","S3","S4","S7","S8","S9"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_4_business"
- **image_direction**: "A drawing board, a set of keys on a bench, a work jacket. Workshop light."
- **q_refs**: ["Q5.1"]
- **logged_as**: ["role"]
- **inputs**: [{"id":"role","control":"radio","required":true,"options":[{"value":"sole_director","label":"Sole director / owner"},{"value":"cofounder","label":"Co-founder or partner"},{"value":"majority_shareholder","label":"Majority shareholder"},{"value":"minority_shareholder","label":"Minority shareholder"},{"value":"freelancer","label":"Freelancer or sole trader"}]}]

# Headline
What's your role in the business?

---

### screen.4.C1.2.extraction_succession

- **id**: "screen.4.C1.2.extraction_succession"
- **screen_number**: "4.C1.2"
- **title**: "Taking money out"
- **section**: "business"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: false
- **segments_served**: ["S5","S6"]
- **skip**: ["S1","S2","S3","S4","S7","S8","S9"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_4_business"
- **image_direction**: "An open ledger on a desk, morning coffee, a pen. Working life."
- **q_refs**: ["Q5.2","Q5.3"]
- **logged_as**: ["extraction_mix","succession"]
- **conditional_logic**: "succession hidden if role == freelancer"
- **inputs**: [{"id":"extraction_mix","label":"How are you currently taking money from the business?","control":"multi_select","required":true,"options":[{"value":"salary","label":"Salary"},{"value":"dividends","label":"Dividends"},{"value":"pension","label":"Employer pension contributions"},{"value":"directors_loan","label":"Director's loan"},{"value":"leave_in","label":"I leave it in the business"},{"value":"accountant_handles_it","label":"My accountant handles it"}]},{"id":"succession","label":"When you think about what happens to the business next, which comes closest?","control":"card_select","required":false,"conditional_reveal":"only when role != freelancer","options":[{"value":"documented","label":"Documented plan, reviewed recently"},{"value":"informal","label":"Informal plan — we've talked about it"},{"value":"no_plan_thinking","label":"No plan — but I've been thinking about it"},{"value":"no_plan_low","label":"No plan — and it's not a priority"},{"value":"exit_5_years","label":"I want out in the next 5 years"},{"value":"never_until_have_to","label":"I'll never leave until I have to"}]}]

# Headline
The business, today and later.

---

### screen.4.D.0.transition

- **id**: "screen.4.D.0.transition"
- **screen_number**: "4.D.0"
- **title**: "Section transition — what matters"
- **section**: "priorities"
- **layout**: "transition"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **q_refs**: []
- **logged_as**: []
- **inputs**: []
- **transition_icon**: "compass"

# Body
Last stretch — what matters most.

---

### screen.4.D.1.tradeoffs

- **id**: "screen.4.D.1.tradeoffs"
- **screen_number**: "4.D.1"
- **title**: "Trade-offs"
- **section**: "priorities"
- **layout**: "centred"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B"]
- **q_refs**: ["Q10.1"]
- **logged_as**: ["tradeoff_pair_1","tradeoff_pair_2","tradeoff_pair_3"]
- **inputs**: [{"id":"tradeoff_pair_1","label":"Pair 1","control":"pair_picker","required":true,"options":[{"value":"enjoy_now","label":"Enjoy more now"},{"value":"retire_earlier","label":"Retire earlier"}]},{"id":"tradeoff_pair_2","label":"Pair 2","control":"pair_picker","required":true,"options":[{"value":"leave_family","label":"Leave more to family"},{"value":"spend_us","label":"Spend more on us"}]},{"id":"tradeoff_pair_3","label":"Pair 3","control":"pair_picker","required":true,"options":[{"value":"simplify","label":"Simplify my life"},{"value":"grow_pot","label":"Grow the pot"}]}]

# Headline
If you had to choose…

# Sub
Three pairs. Pick the side you lean towards. You can still want the other — just tell us which way your hand moves first.

---

### screen.4.D.2.one_thing

- **id**: "screen.4.D.2.one_thing"
- **screen_number**: "4.D.2"
- **title**: "The one thing"
- **section**: "priorities"
- **layout**: "centred"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B"]
- **q_refs**: ["Q10.2"]
- **logged_as**: ["one_thing"]
- **conditional_logic**: "business_exit option only shown if work_status == business_owner"
- **inputs**: [{"id":"one_thing","control":"radio","required":true,"options":[{"value":"one_picture","label":"Pull everything into one picture","icon":"layers"},{"value":"reduce_tax","label":"Reduce my tax","icon":"scissors"},{"value":"retirement","label":"Sort retirement properly","icon":"sunrise"},{"value":"estate","label":"Sort the estate — what happens next","icon":"scroll"},{"value":"protect_family","label":"Protect my family","icon":"shield"},{"value":"business_exit","label":"Plan the exit from my business","icon":"door-open"},{"value":"dont_know","label":"I don't know — that's why I'm here","icon":"compass"}]}]

# Headline
If you could only tackle one thing this year — which would it be?

# Sub
Pick one. We'll start the conversation there.

---

### screen.4.D.3.urgency

- **id**: "screen.4.D.3.urgency"
- **screen_number**: "4.D.3"
- **title**: "Urgency"
- **section**: "priorities"
- **layout**: "centred"
- **grouped**: false
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B","C"]
- **q_refs**: ["Q10.3"]
- **logged_as**: ["urgency"]
- **inputs**: [{"id":"urgency","control":"radio","required":true,"options":[{"value":"this_week","label":"This week"},{"value":"within_month","label":"Within a month"},{"value":"within_3_months","label":"Within three months"},{"value":"this_year","label":"Sometime this year"},{"value":"exploring","label":"Just exploring for now"}]}]

# Headline
When would you want this conversation?

---

### screen.4.D.4.advice_today

- **id**: "screen.4.D.4.advice_today"
- **screen_number**: "4.D.4"
- **title**: "Advice today"
- **section**: "advice_today"
- **layout**: "asymmetric"
- **grouped**: true
- **gate_critical**: false
- **segments_served**: ["all"]
- **tier_limit**: ["A","B"]
- **image_family**: "family_2_money_today"
- **image_direction**: "A handshake across a table, still life only (hands, cuffs, a coffee cup in the foreground). Or a boardroom chair from behind, empty. Conveys a conversation about to happen."
- **q_refs**: ["Q9.1","Q9.2"]
- **logged_as**: ["current_adviser","whats_missing"]
- **conditional_logic**: "whats_missing reveals only if current_adviser != yes_and_happy"
- **inputs**: [{"id":"current_adviser","label":"Do you currently work with a financial adviser or planner?","control":"radio","required":true,"options":[{"value":"yes_and_happy","label":"Yes — and I'm happy with them"},{"value":"yes_but_looking","label":"Yes — but I'm looking","conditional_reveal":"whats_missing"},{"value":"used_to","label":"I used to, not currently","conditional_reveal":"whats_missing"},{"value":"never_have","label":"Never have","conditional_reveal":"whats_missing"},{"value":"accountant_handles","label":"My accountant handles this side of things","conditional_reveal":"whats_missing"}]},{"id":"whats_missing","label":"What would you want a planner to help with that isn't being helped today? (Up to three.)","control":"multi_select","required":false,"conditional_reveal":"only when current_adviser != yes_and_happy","options":[{"value":"one_picture","label":"Pulling everything into one picture"},{"value":"tax","label":"Tax efficiency"},{"value":"retirement","label":"Retirement modelling"},{"value":"estate","label":"Estate and inheritance planning"},{"value":"business","label":"Business extraction or exit"},{"value":"protection","label":"Protection for my family"},{"value":"challenge","label":"Someone to challenge my thinking"},{"value":"dont_know","label":"I don't know — I just know something's missing"}]}]

# Headline
The conversation you're already having — or aren't.


## Awareness checks

*26 entries.*

### pitfall.adviser_fee_total

- **id**: "pitfall.adviser_fee_total"
- **core**: false
- **trigger**: "currently_advised"
- **placement**: "after independent_restricted if triggered"
- **source**: "FCA Consumer Duty (2023); FCA Assessing Suitability review"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
The all-in cost of ongoing advice is typically quoted as just the adviser fee — but the total (adviser + platform + fund) is usually 1.5–2× that number. Have you ever seen yours as a single figure?

# Aware body
Then you've probably seen the breakdown for your own arrangement.

# Partial body
Three cost layers: adviser ongoing (roughly 0.5–1.0%), platform (0.15–0.35%), fund OCF (0.05–0.9%). Totals usually land between 0.7% and 2.0%. Consumer Duty obliges advisers to demonstrate value for the *total* fee, not just their slice.

# Unaware body
It's not that advice is wrong to cost money. It's that the total cost is often quoted as a single line that happens to only include one of three layers. A Consumer Duty-compliant review of your current arrangement asks: what is the total, what am I getting for it, is it defensible. Useful even when the answer is *"yes, fine."*

---

### pitfall.badr_timing

- **id**: "pitfall.badr_timing"
- **core**: false
- **trigger**: "succession == 'exit_5_years'"
- **placement**: "after Block C1 if triggered; high priority for S6"
- **source**: "HMRC BADR rules; Autumn 2024 Budget CGT changes"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
Business Asset Disposal Relief gives a 10% CGT rate on qualifying business sales up to a £1m lifetime limit. But the rate is rising — to 14% from April 2025 and 18% from April 2026. Were you aware of the transition?

# Aware body
Then the question is purely whether your timeline matches the rate step-up.

# Partial body
BADR applies on qualifying shares (5%+ holding for 2 years, working in the business). Lifetime limit £1m. Rate: 10% to April 2025, 14% from April 2025, 18% from April 2026. The 2024 Budget confirmed the step-up.

# Unaware body
On a £1m qualifying gain, BADR at 10% is £100,000 of tax; at 18% it's £180,000. That's £80,000 of CGT decided by the date of completion. Most business sales take 18–24 months from decision to close. The conversation about whether to accelerate into the 14% year, the 18% year, or split consideration is one most sellers have too late.

---

### pitfall.btl_incorporation

- **id**: "pitfall.btl_incorporation"
- **core**: false
- **trigger**: "other_property >= 2 AND NOT held_in_limited_company"
- **placement**: "Tier A only, after Block A Screen 4.A.4"
- **source**: "Finance Act 2015 Section 24; HMRC BTL tax guidance"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
Buy-to-let properties held personally lose most of their mortgage interest as a tax-deductible expense. Those held in a limited company don't. Were you aware of the difference?

# Aware body
Then you'll know the *"should I incorporate"* question has about eight follow-ups.

# Partial body
Section 24 of the Finance Act 2015 replaced personal-name mortgage interest relief with a flat 20% tax credit. For higher and additional-rate taxpayers with mortgaged BTLs, that effectively raises the tax rate on rent. Incorporation avoids it, but the transfer itself triggers CGT and SDLT.

# Unaware body
After Section 24, a higher-rate landlord with a heavily-mortgaged BTL can end up paying tax on income they didn't actually earn. Incorporation is the common fix — but the transfer triggers CGT and SDLT unless structured carefully. It's a £5,000–£15,000 decision for most portfolio landlords, and we tend to run it alongside your accountant rather than over the top of them.

---

### pitfall.care_funding

- **id**: "pitfall.care_funding"
- **core**: false
- **trigger**: "household_includes_elderly_parent OR age >= 60"
- **placement**: "Tier A only, after Block B if triggered"
- **source**: "Laing Buisson Care of Older People UK Market Report 2024; DHSC charging guidance"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
Long-term residential care in the UK typically costs £60,000–£100,000+ a year. It's not free at the point of use once assets pass £23,250 — and that includes the value of a home not occupied by a spouse. Were you aware of those thresholds?

# Aware body
Then the only question is which members of the family this is likely to affect, and when.

# Partial body
The means-test thresholds in England: lower capital limit £14,250, upper £23,250. A home is disregarded if a spouse or partner still lives there. The *"care cost cap"* reform announced for October 2025 was paused in 2024.

# Unaware body
The average stay in residential care is about 30 months; 50% of people admitted will pay the full cost. A £90,000-a-year care home bill erodes a £450,000 house in five years. Families who plan this (immediate-needs annuities, deputyship, property structures) routinely preserve £100,000–£300,000 of the estate. It's the conversation that comes up too late.

---

### pitfall.carry_forward

- **id**: "pitfall.carry_forward"
- **core**: false
- **trigger**: "income >= 100_000 AND pension_pots >= 1"
- **placement**: "Tier A only, after the income/pension stack fires"
- **source**: "HMRC pension annual allowance carry-forward rules (PTM055100)"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
There's a way to carry forward up to three years of unused pension annual allowance — meaning a single one-off contribution of up to about £200,000 is sometimes possible. Were you aware of that?

# Aware body
Then you know the gift. Most people in this bracket don't.

# Partial body
The mechanics: you use the current year's allowance first, then step backwards across the previous three tax years' unused allowance, provided you were a member of a UK pension scheme in each year.

# Unaware body
A one-off £200,000 pension contribution using carry-forward can save roughly £80,000–£90,000 of income tax in a single year for a higher-rate earner. Most business-owner clients we work with do this in a year where profits are unusually good. The window is three years — use it, or lose it.

---

### pitfall.couples_alignment

- **id**: "pitfall.couples_alignment"
- **core**: false
- **trigger**: "household_includes_partner AND confidence <= 3"
- **placement**: "Tier A only, after Block B if triggered"
- **source**: "Aviva Family Finances Report 2023; Relate research on money and relationships"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
Couples who have a structured conversation about money once a year — not about the bills, but about the plan — report much higher satisfaction with their finances than couples who don't. Do you and your partner?

# Aware body
Then you're in the minority — only about 1 in 3 couples we meet actually do.

# Partial body
What the research points to is simpler than it sounds: a shared retirement picture, agreement on gifting to children, alignment on risk, and one person who knows the passwords. It's not about the numbers — it's about not being surprised.

# Unaware body
The single highest-value thing that happens in a planner meeting with a couple isn't the tax or the pension maths — it's the conversation they end up having with each other that they hadn't yet had at home. Most couples thank us for that after the first meeting, before we've advised on anything.

---

### pitfall.emergency_fund_sizing

- **id**: "pitfall.emergency_fund_sizing"
- **core**: false
- **trigger**: "cash < 3 * essential_monthly_spend"
- **placement**: "Tier A only, after Block A if triggered"
- **source**: "FCA Financial Lives Survey 2024; Money and Pensions Service benchmarks"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
The commonly-quoted three months of essential spending as an emergency fund is usually too thin for households with a mortgage, dependants and a single primary earner. Does that land?

# Aware body
Then the question is whether the 3–6 month range fits your specific job security and household shape.

# Partial body
The rule of thumb: 3 months for a dual-earner, no-dependants household; 6 months for a single-earner; 9–12 months for self-employed or commission-based earners. It's judgement, not formula.

# Unaware body
For a single-earner household with two children and an £1,800 mortgage, a 3-month emergency fund is often under-sized. The cost of getting it wrong: a forced sale of long-term investments at a bad time, or a high-interest loan in a crisis. Most planners we know land on 6 months for employed clients with dependants, more for business owners.

---

### pitfall.extraction_mix

- **id**: "pitfall.extraction_mix"
- **core**: true
- **rank**: 5
- **trigger**: "extraction_mix == 'salary_only' OR extraction_mix == 'accountant_handles_it'"
- **placement**: "after Block C1 if triggered"
- **source**: "HMRC income tax, NI and dividend rates 2024/25; ICAEW owner-manager benchmarks"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
Most business-owner clients we review are paying more tax on extraction than they need to — often because the salary, dividend and pension mix hasn't been revisited for a few years. How confident are you yours has been?

# Aware body
Then the test is whether the current mix still fits the current tax year — 2024/25 tightened the dividend allowance again.

# Partial body
The classic optimisation: salary up to the NI threshold, dividends to the basic-rate band, then employer pension contribution for the rest. Exact numbers shift every tax year. *"My accountant handles it"* often means the default mix hasn't been revisited for several years.

# Unaware body
On £100,000 drawn as pure salary versus a typical salary/dividend/employer-pension mix, the tax bill can differ by £15,000–£20,000 — per year. Whether that's you depends on your company structure and your accountant's current advice. We run this jointly with the accountant rather than over the top of them.

---

### pitfall.fund_fee_stack

- **id**: "pitfall.fund_fee_stack"
- **core**: false
- **trigger**: "investable_assets >= 250_000"
- **placement**: "Tier A only, after Block A if triggered"
- **source**: "FCA platform cost and value assessment framework; compound interest maths"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
On a £500,000 portfolio, the difference between a 1.0% and a 0.4% all-in annual cost is roughly £70,000 over twenty years. Were you aware the all-in cost is usually higher than the quoted figure?

# Aware body
Then you're in the minority. Most investors never add up their fee stack.

# Partial body
All-in cost is platform fee + fund OCF + adviser fee + transaction costs. It's rarely quoted as one number — you usually have to add it up yourself or ask for it in that form.

# Unaware body
On a £500,000 pot growing at 5% gross for 20 years with no contributions, the difference between 1.0% and 0.4% all-in annual charges is roughly £70,000 of terminal value. Most investors have never been shown their all-in fee stack as a single number. That's often the first useful conversation.

---

### pitfall.glide_path

- **id**: "pitfall.glide_path"
- **core**: false
- **trigger**: "(target_retirement_age - current_age) <= 10 AND investable_assets >= 250_000"
- **placement**: "Tier A only, conditional after Block C"
- **source**: "FCA DC Default Fund Design Thematic Review 2022"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
Most DC pension default funds don't automatically reduce equity risk as you approach retirement — the *"lifestyling"* you may be assuming often isn't switched on. Worth a look?

# Aware body
Then you'll have checked your fund's glide path against your plan.

# Partial body
Since freedom-and-choice in 2015, many default funds assume drawdown rather than annuity purchase — which means they hold equity risk for longer. That isn't wrong in itself — but it matters whether it fits *your* plan.

# Unaware body
A 58-year-old five years from planned retirement may still be 80%+ in equities inside a *"default"* fund. A 25% equity fall at 62 is very different from the same fall at 35. The question isn't *"is equity risk bad"* — it's *"is this risk profile right for your plan."* Most near-retirees we meet have never had this conversation about their default fund.

---

### pitfall.group_life_fragility

- **id**: "pitfall.group_life_fragility"
- **core**: true
- **rank**: 6
- **trigger**: "life_cover == 'through_work_only' AND has_dependants"
- **placement**: "after Block B Screen 4.B.3 if triggered"
- **source**: "ABI Group Risk Report 2023; Royal London income protection premium benchmarks"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
Life cover through work ends on the day you leave the job. The cover you have today isn't the cover you'll have if you change employer. Were you aware of that?

# Aware body
Then it's worth checking whether there's any personal cover to carry between jobs.

# Partial body
Group life is typically 3–4× salary and ends when employment ends. Critical illness and income protection in group schemes usually work the same way. Personal cover, set up while you're young and healthy, is often cheaper than people assume.

# Unaware body
Most families we work with had assumed their *"work benefit"* was lifelong cover. It isn't. A personal £500,000 life and £50,000 income protection policy for a healthy 40-year-old typically costs under £40 a month — less than most broadband bills. It's the cheapest big decision on most family balance sheets.

---

### pitfall.iht_mitigation

- **id**: "pitfall.iht_mitigation"
- **core**: true
- **trigger**: "estate >= 1_000_000 OR (estate == 'not_sure' AND investable_assets >= 500_000)"
- **placement**: "after Block B if triggered"
- **source**: "HMRC IHT rates and thresholds 2024/25; nil-rate band frozen to 2028; Autumn 2024 Budget IHT changes"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
There are well-established, legal ways to reduce — sometimes to nothing — the inheritance tax bill on an estate of your size. Were you aware of that?

# Aware body
Good. The question then is usually whether the plan you have still matches the rules as they are *now*, not as they were when you set it up.

# Partial body
The toolkit has four main parts: gifting within the seven-year rule; trust structures (discretionary, life interest); Business Relief on qualifying shares and AIM portfolios; and the residence nil-rate band if you leave the home to direct descendants. Each has specific rules, and the 2024 Budget changed several of them.

# Unaware body
At an estate of your size, the default IHT bill is typically 40% of everything above £325,000 (or £500,000 if the residence nil-rate band applies and you qualify). For a £2m estate, that's £540,000–£700,000. With 2–5 years of structured planning, most families we work with reduce that by £150,000–£400,000. It's the most common senior-planner conversation we have.

---

### pitfall.income_trap_100k

- **id**: "pitfall.income_trap_100k"
- **core**: true
- **rank**: 1
- **trigger**: "income_band == '100to125k'"
- **placement**: "after Screen 3.5 (income question), before Block A"
- **source**: "HMRC personal allowance taper rules; Tax Trap — Non-NHS — Insight Paper v0.01"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B","C"]

# Stem
Between £100,000 and £125,140, there's a quiet band where the effective tax rate is closer to 60% than 40%. Were you aware of that?

# Aware body
Good — you're in rare company. Only about three in ten people in that earnings band know about it.

# Partial body
The detail: for every £2 you earn above £100,000, you lose £1 of your personal allowance. Added to the higher-rate band and NI, the effective rate on that slice comes out around 60%. It's a band, not a cliff — it ends at £125,140.

# Unaware body
A £15,000 pay rise from £100,000 to £115,000 costs roughly £9,000 in tax and NI. If you've got young children, you may also lose up to £10,000 of tax-free childcare. A £15,000 raise can cost £19,000. The usual fix is a pension contribution or salary sacrifice — and most people in this band haven't used it. Worth a conversation.

---

### pitfall.independent_restricted

- **id**: "pitfall.independent_restricted"
- **core**: false
- **trigger**: "currently_advised"
- **placement**: "after Block D Screen 4.D.4 if triggered"
- **source**: "FCA Retail Distribution Review; FCA Handbook COBS 6.2A"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
A "financial adviser" can be either independent or restricted — and a restricted adviser can only recommend products from a limited range, sometimes a single provider. Did you know whether yours is independent?

# Aware body
Then you'll have asked your current adviser which they are.

# Partial body
The FCA requires advisers to disclose their status. *Independent* means they can recommend across the whole of market. *Restricted* can mean anything from *"limited to one provider"* to *"whole of market except annuities."* The scope sits on the first page of their initial disclosure document.

# Unaware body
About 60% of UK advice firms are restricted. Not knowing the scope of your current adviser's restriction isn't a problem in itself — but it's a question worth asking if you've never looked at the initial disclosure document. Real Wealth is independent and FCA-regulated, which means we're free to look across the whole market.

---

### pitfall.lpa

- **id**: "pitfall.lpa"
- **core**: false
- **rank**: 9
- **trigger**: "does_not_have_any_lpa AND age >= 50"
- **placement**: "after Block B if triggered"
- **source**: "Office of the Public Guardian; Court of Protection fees 2024"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B","C"]

# Stem
Without a Lasting Power of Attorney in place, your family can't legally manage your money or your health decisions if you lose capacity. The alternative — going through the Court of Protection — typically takes 6+ months and £3,000–£5,000 in fees. Were you aware of that?

# Aware body
Then the only question is whether the ones you have are the right ones.

# Partial body
Two LPAs: one for property and financial affairs, one for health and welfare. Separate documents, registered with the Office of the Public Guardian (£82 per LPA currently). Without them, the alternative is a deputyship through the Court of Protection.

# Unaware body
We see a handful of families a year who discover, in the worst month of their lives, that a parent's stroke or dementia means the bank won't let anyone pay the mortgage. Court of Protection deputyship takes 6+ months, costs £3,000–£5,000, and is supervised every year after. A pair of LPAs cost £164 and can be done in a month.

---

### pitfall.mpaa

- **id**: "pitfall.mpaa"
- **core**: false
- **trigger**: "age >= 50 AND pension_pots >= 1"
- **placement**: "Tier A only, after Block C if triggered"
- **source**: "HMRC Money Purchase Annual Allowance rules (PTM056500)"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
Once you take *any* taxable income from a pension — even a small amount — you lose 72% of your ability to contribute in future, from £60,000 a year down to £10,000. Were you aware of that?

# Aware body
Then you'll recognise this as the money-purchase annual allowance trap.

# Partial body
Taking the 25% tax-free lump sum by itself doesn't trigger it. It's the first time you take *taxable* income from a flexi-access drawdown that crystallises the MPAA — and once triggered, it doesn't unwind.

# Unaware body
A surprising number of people we meet took £5,000 of *"just to test it"* pension income in their 50s and capped their future contributions at £10,000 a year for the rest of their working life. The decision is reversible in the sense that you can stop — but not in the sense that you can reinstate the £60,000 allowance.

---

### pitfall.ni_gaps

- **id**: "pitfall.ni_gaps"
- **core**: true
- **rank**: 8
- **trigger**: "age >= 45 AND state_pension_awareness != 'yes_checked'"
- **placement**: "after Block C Screen 4.C.2 (state pension question) if triggered"
- **source**: "DWP state pension rates 2024/25; HMRC Class 3 NI rates"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
To get the full new state pension — currently about £11,500 a year — you need 35 qualifying years of National Insurance. Gaps can be filled voluntarily, but usually only looking back six years. Have you checked your record?

# Aware body
Then you'll have looked at gov.uk/check-state-pension.

# Partial body
Voluntary Class 3 NI contributions are currently £17.45 a week (about £900 a year). Each year of contributions adds roughly £328 a year to the state pension — a payback period under three years. Normal look-back is six years; the extended window to April 2025 allowed look-back to 2006.

# Unaware body
Around 60% of people in their late 40s and 50s have never checked their NI record. The most common surprise is a 2–5 year gap from self-employment, a career break, or time overseas. Each gap filled voluntarily typically returns 10–15× over retirement. gov.uk/check-state-pension takes about 90 seconds.

---

### pitfall.overpayment_vs_cash

- **id**: "pitfall.overpayment_vs_cash"
- **core**: false
- **trigger**: "has_mortgage AND cash >= 20_000_above_emergency_fund"
- **placement**: "Tier A only"
- **source**: "Bank of England base rate 2024; money.co.uk savings rate data"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
Mortgage overpayment gives a guaranteed return equal to your mortgage rate. At today's rates, that often beats the after-tax return on a cash savings account. Were you aware of the comparison?

# Aware body
Then it's usually just a question of redemption penalties and how much liquidity you want to keep.

# Partial body
The maths: overpaying a 5% mortgage is equivalent, in after-tax terms, to earning about 7% on a savings account taxed at basic rate (or about 9% taxed at higher rate). Most cash accounts don't offer that. The counterargument is liquidity — money in the house is harder to access.

# Unaware body
On a £300,000 mortgage at 5%, overpaying £500 a month for five years saves around £27,000 in interest and clears the mortgage about three years early. The same £500 in a taxed savings account, at 4.5% gross for a higher-rate taxpayer, is worth a lot less after tax. The decision depends on your emergency fund and redemption penalties — that's the planner conversation.

---

### pitfall.pension_as_extraction

- **id**: "pitfall.pension_as_extraction"
- **core**: false
- **trigger**: "business_owner AND pension_pots <= 1"
- **placement**: "Tier A only, after Block C1"
- **source**: "HMRC pension employer contribution tax treatment; corporation tax rate 2024/25"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
Employer pension contributions from your company reduce corporation tax, avoid NI, and don't count as dividend income — often the most tax-efficient way to take profit out. Were you aware of that lever?

# Aware body
Then you'll know it mostly comes down to annual allowance and your exit plan.

# Partial body
An employer pension contribution is a deductible business expense — the company saves corporation tax. No income tax or NI at the time of contribution. You pay income tax on the way out at retirement, usually at a lower rate than in-work extraction.

# Unaware body
Very few business owners with one or zero pension pots are using employer pension contributions as an extraction lever. On a £60,000 employer contribution, a 25% corporation-tax-paying company saves £15,000, and you save the NI and income tax you'd have paid on the equivalent dividend. The after-tax value is often 20–30% higher than an equivalent dividend.

---

### pitfall.pension_consolidation

- **id**: "pitfall.pension_consolidation"
- **core**: true
- **rank**: 7
- **trigger**: "pension_pots >= 4"
- **placement**: "after Block A Screen 4.A.3, conditional on pot count"
- **source**: "FCA Retirement Income Market Data 2023; Pensions Dashboards Programme research"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B","C"]

# Stem
Most people with four or more pension pots find, on consolidation, at least one old workplace scheme with charges more than double their best current one. Does that ring a bell?

# Aware body
Then you'll know the drill. What usually matters is whether the maths of consolidating favours you — some old schemes carry guarantees worth more than the charge saving.

# Partial body
Old workplace pensions often carry 1–1.5% annual charges; modern equivalents are 0.2–0.5%. But a handful of older schemes have valuable safeguarded benefits (guaranteed annuity rates, protected tax-free cash) that would be lost on transfer. The answer is rarely *"consolidate everything"* — it's *"consolidate the right ones."*

# Unaware body
Four or more pots often hides something forgotten. The average new client we work with finds £40,000–£60,000 across old workplace schemes they hadn't tracked. The right question isn't *"can I consolidate"* — it's *"should I, and in what order."*

---

### pitfall.pension_iht_2027

- **id**: "pitfall.pension_iht_2027"
- **core**: true
- **rank**: 2
- **trigger**: "pension_pots >= 2 AND estate >= 1_000_000"
- **placement**: "after rnrb_taper if triggered"
- **source**: "Autumn 2024 Budget announcement; HMRC technical consultation on pensions and IHT (Oct 2024)"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B","C"]

# Stem
From April 2027, unused pension funds are expected to fall *inside* the estate for inheritance tax — reversing a fifteen-year-old planning position. Were you aware of that change?

# Aware body
Then you're probably already thinking about the 2026–27 planning window.

# Partial body
Currently, most pensions pass outside the estate. The 2024 Budget announced that from April 2027, defined-contribution pension wealth will be included for IHT purposes. Draft legislation is expected in 2025 — the detail will matter.

# Unaware body
This one's live. For a family with £500,000+ in pensions and a £1m+ estate, the decision you'd have made in 2024 — *"draw from ISAs first, keep the pension for inheritance"* — may become exactly the wrong decision from April 2027. The planning window is now, not later.

---

### pitfall.rnrb_taper

- **id**: "pitfall.rnrb_taper"
- **core**: true
- **rank**: 3
- **trigger**: "estate >= 2_000_000"
- **placement**: "after iht_mitigation if triggered"
- **source**: "HMRC RNRB rules; Finance Act 2017; Autumn 2024 Budget extension of freeze"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B","C"]

# Stem
Above £2 million of total estate, the residence nil-rate band starts tapering away — £1 of relief lost for every £2 over. Were you aware of that?

# Aware body
Then you'll know — an estate at £2.35m per person loses the whole RNRB. The question is usually how to keep the estate below the cliff.

# Partial body
The RNRB is £175,000 per person (£350,000 for a married couple). It tapers at £1 for every £2 over £2m, fully gone at £2.35m per person. The £2m threshold counts *all* assets — including pensions from April 2027.

# Unaware body
A typical £2.5m family estate (house plus investments) can easily pay £200,000–£500,000 more IHT than necessary because of this taper alone. The fix is rarely *"spend more"* — it's usually about timing gifts, or using Business Relief-qualifying investments to move the estate below the cliff.

---

### pitfall.savings_tax_efficiency

- **id**: "pitfall.savings_tax_efficiency"
- **core**: true
- **rank**: 4
- **trigger**: "investable_assets >= 100_000 OR income >= 50_000"
- **placement**: "after Block A Screen 4.A.3 (assets at a glance)"
- **source**: "HMRC ISA rules; HMRC CGT annual exempt amount 2024/25 (£3,000); dividend allowance £500 2024/25"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
Most people pay more tax on their savings and investments than they need to — because the three allowances that reduce it don't tend to be used together. Any sense of whether you're using yours?

# Aware body
Good. Most of our happiest clients started from this position. The question then is usually whether the mix still fits *this* tax year.

# Partial body
The three levers: £20,000 annual ISA, £3,000 CGT annual exempt amount, and £500 dividend allowance. Used together across a couple, that's £46,500 of tax-protected capacity a year. Most couples use less than half.

# Unaware body
On £100,000 of investments outside an ISA, moving £20,000 a year inside over five years protects the whole amount from tax on future growth. The technique's called *"Bed and ISA"* and it's one of the most common first-year conversations we have.

---

### pitfall.ssp_gap

- **id**: "pitfall.ssp_gap"
- **core**: false
- **trigger**: "earnings_protection_scale <= 3"
- **placement**: "Tier A only, conditional on the confidence-score answer"
- **source**: "HMRC SSP rates 2024/25; ABI income protection data"
- **compliance_status**: "draft"
- **tier_limit**: ["A"]

# Stem
Statutory Sick Pay is £116.75 a week — about £505 a month — and most employer sick pay schemes run out at six months. Were you aware the gap is that steep?

# Aware body
Then you'll know why income protection is the planning cousin everyone forgets.

# Partial body
The ladder: full pay for up to 6 months (if lucky) → half pay → SSP → nothing. For most households with a mortgage, the *"half-pay"* line is already below essential outgoings.

# Unaware body
If the main earner is off sick for a year, most families we meet find their sick-pay arrangement covers the first 3–6 months at best, then crashes to £505 a month statutory. That's rarely enough to cover the mortgage. Income protection closes the gap — and because the event is more likely than early death, it's much cheaper than life insurance.

---

### pitfall.tapered_annual_allowance

- **id**: "pitfall.tapered_annual_allowance"
- **core**: false
- **rank**: 1
- **trigger**: "income >= 260_000"
- **placement**: "same slot as income_trap_100k, triggered instead for higher-income band"
- **source**: "HMRC tapered annual allowance 2024/25"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
Above £260,000 of adjusted income, the amount you can put into a pension each year starts tapering down — and it keeps falling. Were you aware of that?

# Aware body
You'll know the mechanics then. The live question is usually carry-forward — whether you've got unused allowance from prior years that's about to expire.

# Partial body
The taper reduces the £60,000 standard annual allowance by £1 for every £2 of adjusted income above £260,000, all the way down to a £10,000 floor at £360,000. Carry-forward from the previous three years can still add to it if you were a member of a UK scheme each year.

# Unaware body
At your income, the standard £60,000 annual allowance probably doesn't apply to you in full. Carry-forward is often the difference between a tax-efficient year and a painful one — and very few people at this income level use it deliberately. That's usually the first conversation.

---

### pitfall.will_currency

- **id**: "pitfall.will_currency"
- **core**: false
- **rank**: 10
- **trigger**: "has_will AND will_age > 2_years OR no_will"
- **placement**: "after Block B if triggered"
- **source**: "The Law Society will review guidance; Private Client Section best practice"
- **compliance_status**: "draft"
- **tier_limit**: ["A","B"]

# Stem
A will more than five years old is often out of date before anyone realises. Life moves — houses, children, business stakes, relationships — without a nudge to update the document. When did you last look at yours?

# Aware body
Then the only question is when you last re-read yours.

# Partial body
The common triggers for a will review: marriage or divorce, new child, house purchase, business stake, gift above £3,000, or the death of a named beneficiary. If none of those have happened since the last review, the will probably still works.

# Unaware body
The commonest will problem we see isn't *"no will"* — it's *"an old will that no longer reflects what the family actually looks like."* The cost of updating is usually a few hundred pounds. The cost of not updating it can be a seven-figure dispute.


## Provocations

*24 entries.*

### prov.advised_looking

- **id**: "prov.advised_looking"
- **trigger**: "current_adviser == 'yes_looking'"
- **segments**: ["all"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
You already know the answer.

# Body
You've told us you're already working with someone and you're looking. That's the highest-intent signal we see in this form — the decision is mostly made, it's about the fit.

# Close
Speak to one of our senior partners directly.

---

### prov.btl_portfolio

- **id**: "prov.btl_portfolio"
- **trigger**: "other_property >= 2 AND NOT held_in_limited_company"
- **segments**: ["S3","S4","S6","S7","S9"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
The incorporation question.

# Body
For portfolio landlords holding two or more properties personally with mortgages, the Section 24 tax change has made *"should I incorporate"* one of the most common planning questions we hear. The answer is *"it depends"* for about 60% of cases, and clearly yes or no for the rest.

# Close
We usually run this jointly with your accountant.

---

### prov.business_no_plan

- **id**: "prov.business_no_plan"
- **trigger**: "succession == 'no_plan_thinking'"
- **segments**: ["S5","S6"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Thinking is the planning starting.

# Body
There's no such thing as a bad first succession conversation — even *"I don't know what I want yet"* is a starting position. Most of the owners we work with came to us exactly there.

# Close
Thirty minutes to start the thinking in the open.

---

### prov.close_to_line

- **id**: "prov.close_to_line"
- **trigger**: "(target_retirement_age - current_age) < 10 AND investable_assets_and_pensions < 500_000"
- **segments**: ["S2","S7"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
The honest arithmetic.

# Body
You've given yourself a specific timeline to the day you don't have to work. Based on what you've told us, the monthly saving rate that implies is worth looking at — sooner is better than later, either way.

# Close
The conversation most people wish they'd had five years sooner.

---

### prov.director_single_pot

- **id**: "prov.director_single_pot"
- **trigger**: "role == 'sole_director' AND pension_pots <= 1"
- **segments**: ["S5","S6"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
The quiet tax lever.

# Body
A 25% corporation-tax-paying company making a £60,000 employer pension contribution for its sole director saves £15,000 of corporation tax and avoids NI and income tax on the equivalent dividend. Most sole directors with one pension pot aren't using this at scale.

# Close
We run this jointly with your accountant.

---

### prov.dont_know_priority

- **id**: "prov.dont_know_priority"
- **trigger**: "one_thing == 'dont_know'"
- **segments**: ["all"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Most of our best client relationships started here.

# Body
*"I don't know what I don't know"* is the most common way our strongest relationships begin. A first call is often half about what *you* think, half about what we show *you* — and the shape usually becomes obvious inside twenty minutes.

# Close
A good reason to book.

---

### prov.estate_unsure

- **id**: "prov.estate_unsure"
- **trigger**: "estate == 'not_sure' AND investable_assets >= 500_000"
- **segments**: ["S3","S4","S7"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Worth adding it up.

# Body
Most people we meet haven't added up their total estate recently — the house, the pensions, the investments, the business share. For households in your range, the number often crosses the £2m threshold where the inheritance tax maths changes shape.

# Close
We can do the adding up on the call.

---

### prov.exit_window

- **id**: "prov.exit_window"
- **trigger**: "succession == 'exit_5_years'"
- **segments**: ["S6"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Two years, not six months.

# Body
The typical business sale takes 18–24 months from decision to close. Most sellers tell us they wished they'd started the tax and estate planning at least two years before that — not six months.

# Close
The succession conversation is one of our signature strengths.

---

### prov.hnw_pathway

- **id**: "prov.hnw_pathway"
- **trigger**: "investable_assets >= 1_000_000 AND estate >= 3_000_000"
- **segments**: ["S9"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
A different conversation.

# Body
At your level of assets, the planning conversation is usually less about growth and more about structure — trusts, generational gifting, Business Relief portfolios, the 2027 pension IHT change. Our senior partners handle this end of the firm directly.

# Close
We'll book you with one of the seniors straight away.

---

### prov.iht_2m_cliff

- **id**: "prov.iht_2m_cliff"
- **trigger**: "estate >= 2_000_000 AND rnrb_taper_awareness_did_not_fire"
- **segments**: ["S4","S6","S7","S9"]
- **compliance_status**: "draft"
- **version**: "0.1.0"
- **source_refs**: ["HMRC RNRB rules","Finance Act 2017","Autumn 2024 Budget extension of freeze"]

# Headline
The £2m cliff.

# Body
Above £2m of total estate, the residence nil-rate band starts tapering — £1 of relief lost for every £2 over. A typical £2.5m family estate can end up paying £200,000–£500,000 more inheritance tax than necessary without planning.

# Close
One of the conversations most families come to us for.

---

### prov.iht_no_plan

- **id**: "prov.iht_no_plan"
- **trigger**: "estate >= 1_000_000 AND passing_on_intent == 'not_thought'"
- **segments**: ["S4","S7","S9"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Most of our clients said the same, first meeting.

# Body
The question isn't *"how much."* It's *"what do I want them to be able to do with it."* Getting that question answered once — between you, with a third party to hold the pen — is usually where the useful planning starts.

# Close
Worth half an hour together.

---

### prov.lifestyle_decade

- **id**: "prov.lifestyle_decade"
- **trigger**: "non_essential_spend >= 2000"
- **segments**: ["S2","S3","S4","S7"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Ten years of the nice-to-haves.

# Body
At the level you've told us, the non-essential line adds up to between £240,000 and £480,000 across a decade. That's not a criticism — it's a figure most people haven't sat with. What it's buying you is the real question.

# Close
Worth asking out loud, once.

---

### prov.money_stress

- **id**: "prov.money_stress"
- **trigger**: "money_mindset == 'stress'"
- **segments**: ["all"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
A note from us.

# Body
We work with people whose money was making them anxious. In our experience, a plan changes what money does to you — not because the numbers change, but because the unknowns do.

# Close
We'd be glad to talk.

---

### prov.no_will_estate

- **id**: "prov.no_will_estate"
- **trigger**: "no_will AND estate >= 500_000"
- **segments**: ["S2","S3","S4","S7","S9"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Intestate is a bad default.

# Body
Without a will, the intestacy rules decide who gets what — and the outcome rarely matches what you'd have chosen. For estates over £500,000, an unmarried partner can inherit nothing, and children inherit equal shares at 18.

# Close
The fix is usually a few hundred pounds and a morning.

---

### prov.pension_pots_tease

- **id**: "prov.pension_pots_tease"
- **trigger**: "age between 55 and 60 AND pension_pots >= 3"
- **segments**: ["S7","S8"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
The forgotten pots.

# Body
Most professionals in their late 50s can't name their total pension value within 20%. The average new client we work with finds £40,000–£60,000 across old workplace schemes they'd forgotten.

# Close
A good conversation to have before any decisions.

---

### prov.protection_gap

- **id**: "prov.protection_gap"
- **trigger**: "earnings_protection_scale <= 2 AND has_dependants"
- **segments**: ["S2","S3","S4","S5"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
The 3-month line.

# Body
Most families find there's a 3–6 month gap between sick pay and savings running out. Income protection is rarely the first thing people list — and it's the one most of our clients say they wished they'd sorted earlier.

# Close
The cheapest big decision on most family balance sheets.

---

### prov.retired_short

- **id**: "prov.retired_short"
- **trigger**: "retirement_feel == 'already_less_than_hoped'"
- **segments**: ["S8"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Still a plan to make.

# Body
The phase after work often needs more planning, not less — drawdown strategy, tax efficiency, the pension-IHT change coming in 2027. It's rarely too late to improve the shape of it.

# Close
Worth a planner's second opinion.

---

### prov.retirement_unease

- **id**: "prov.retirement_unease"
- **trigger**: "retirement_feel in ['uneasy', 'hard_to_imagine']"
- **segments**: ["S3","S4","S5","S6","S7"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
It's not about when you stop.

# Body
Over half of our business-owner and senior-professional clients said the same thing in their first meeting. Planning isn't about *"when do I stop"* — it's about *"when could I stop if I wanted to."* The freedom, not the date.

# Close
A conversation about optionality, not retirement.

---

### prov.sandwich_gen

- **id**: "prov.sandwich_gen"
- **trigger**: "household includes dependent_children AND household includes elderly_parent"
- **segments**: ["all"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Both ways at once.

# Body
Families supporting children *and* a parent at the same time are the planning group we see most stretched for time. The tools that matter here — LPAs for your parents, protection for you, a will that accounts for both — are the ones that get put off until they're urgent.

# Close
Worth thirty minutes with us.

---

### prov.self_employed_pension

- **id**: "prov.self_employed_pension"
- **trigger**: "work_status == 'self_employed' AND income >= 75_000 AND pension_pots <= 1"
- **segments**: ["S3","S4","S5"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
The quiet gap.

# Body
Self-employed people at your income typically fund a pension about 60% less than employed peers earning the same. It's nobody's fault — no employer nudging, no auto-enrolment — and it's the single commonest thing self-employed clients come to us to fix.

# Close
One of the fastest wins we work on.

---

### prov.spending_ratio

- **id**: "prov.spending_ratio"
- **trigger**: "essential_monthly_spend > 0.5 * income_band_midpoint"
- **segments**: ["all"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
The shape of a month.

# Body
You've told us roughly what comes in and what goes out on essentials. At that ratio, in our experience, households find it hardest to accelerate their saving — even when they want to. It's not usually about willpower; it's usually about the design of the plan.

# Close
Worth a conversation about the levers.

---

### prov.tradeoff_bigpot

- **id**: "prov.tradeoff_bigpot"
- **trigger**: "tradeoff == 'grow_pot' AND investable_assets_and_pensions < 500_000"
- **segments**: ["S2","S3"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Growing the pot.

# Body
You told us you lean towards growing the pot over simplifying life. At your current shape, a conversation about contribution capacity (pension, ISA, carry-forward) is usually where the biggest difference sits — bigger than investment selection.

# Close
The easy wins are usually the first 45 minutes.

---

### prov.urgency_week

- **id**: "prov.urgency_week"
- **trigger**: "urgency == 'this_week'"
- **segments**: ["all"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
We can move quickly.

# Body
You've told us this is urgent. We hold a small number of 48-hour slots for exactly this — a senior planner, next-day where possible, no prep needed from your side.

# Close
Let's pick a time.

---

### prov.work_cover_only

- **id**: "prov.work_cover_only"
- **trigger**: "life_cover == 'through_work_only' AND has_dependants"
- **segments**: ["S2","S3","S4","S5"]
- **compliance_status**: "draft"
- **version**: "0.1.0"

# Headline
Cover tied to the job.

# Body
We've seen families find out in the worst month of their life that the protection they thought they had was tied to a job they no longer held. Personal cover, set up while you're young and healthy, is usually cheaper than people assume.

# Close
Worth checking you've got something that doesn't end when the job does.


## Segment CTAs

*11 entries.*

### S1

- **id**: "S1"
- **kind**: "segment"
- **segment**: "S1"
- **button_link**: "calendly.com/real-wealth-nurture-signup-placeholder"

# Headline
Keep in touch.

# Body
We're not quite the fit for your current stage — you'll save money by sorting the basics first (pension, ISA, emergency fund). But we send a short, thoughtful monthly briefing, and we'd be glad to have you on it.

# Button
Join our monthly briefing

# Helper
No spam, no selling. Unsubscribe any time.

---

### S2

- **id**: "S2"
- **kind**: "segment"
- **segment**: "S2"
- **button_link**: "calendly.com/real-wealth-standard-call-placeholder"

# Headline
A first conversation.

# Body
Twenty minutes to walk through what you've told us — no preparation needed on your side, no obligation on ours. We'll share the shortlist and point out the moves that move the needle.

# Button
Book a 20-minute call

# Helper
We'll hold a slot this week and next.

---

### S3

- **id**: "S3"
- **kind**: "segment"
- **segment**: "S3"
- **button_link**: "calendly.com/real-wealth-standard-call-placeholder"

# Headline
A first conversation.

# Body
You're in the band where the difference between acting and drifting is biggest — the £100k tax trap, pension carry-forward, ISA sequencing. Twenty minutes to show you the shape; no preparation needed on your side.

# Button
Book a 20-minute call

# Helper
Planners who work with your segment routinely.

---

### S4

- **id**: "S4"
- **kind**: "segment"
- **segment**: "S4"
- **button_link**: "calendly.com/real-wealth-standard-call-placeholder"

# Headline
A first conversation.

# Body
We work with partners, consultants, and senior executives every week — the tapered allowance, carry-forward, and extraction questions come up often. Twenty minutes to walk through yours.

# Button
Book a 20-minute call

# Helper
With a planner experienced in your situation.

---

### S5

- **id**: "S5"
- **kind**: "segment"
- **segment**: "S5"
- **button_link**: "calendly.com/real-wealth-standard-call-placeholder"

# Headline
A first conversation.

# Body
Most of the levers for a growing business sit at the intersection of pension, extraction, and structure — and they move every tax year. Twenty minutes to look at yours, jointly with your accountant if you'd like.

# Button
Book a 20-minute call

# Helper
We work alongside accountants, not over them.

---

### S6

- **id**: "S6"
- **kind**: "segment"
- **segment**: "S6"
- **button_link**: "calendly.com/real-wealth-succession-call-placeholder"

# Headline
The succession conversation.

# Body
The BADR rate transition and the 18–24 month sale timeline mean the conversation about *when* is usually as important as the conversation about *how much*. Our senior partners handle exits directly.

# Button
Book a succession-focused call

# Helper
A 30-minute call with a senior partner.

---

### S7

- **id**: "S7"
- **kind**: "segment"
- **segment**: "S7"
- **button_link**: "calendly.com/real-wealth-standard-call-placeholder"

# Headline
A first conversation.

# Body
You're at the stage where drawdown design, the 2027 pension IHT change, and state pension sequencing start mattering more than contribution decisions. Twenty minutes to walk through what you've told us.

# Button
Book a 20-minute call

# Helper
With a planner who specialises in decumulation.

---

### S8

- **id**: "S8"
- **kind**: "segment"
- **segment**: "S8"
- **button_link**: "calendly.com/real-wealth-standard-call-placeholder"

# Headline
A second-opinion conversation.

# Body
Even a well-designed retirement plan is worth a second look when rules change — and the pensions IHT change in 2027, plus the 2024 Budget CGT step-ups, are significant. Twenty minutes, no pressure.

# Button
Book a 20-minute call

# Helper
A second opinion, nothing more.

---

### S9

- **id**: "S9"
- **kind**: "segment"
- **segment**: "S9"
- **button_link**: "calendly.com/real-wealth-senior-partner-placeholder"

# Headline
Meet a senior partner.

# Body
At your shape of assets, the planning conversation is about structure — trusts, generational gifting, Business Relief, the 2027 pension IHT change. Our senior partners take this end of the firm themselves.

# Button
Book with a senior partner

# Helper
A 45-minute call with a senior partner.

---

### advised_but_looking

- **id**: "advised_but_looking"
- **kind**: "overlay"
- **overlay**: "advised_but_looking"
- **button_link**: "calendly.com/real-wealth-senior-partner-placeholder"

# Headline
The highest-intent conversation we have.

# Body
You've told us you're already working with someone and you're looking. That's the clearest signal we see. Our senior partners handle the conversations about a change of planner directly.

# Button
Book with a senior partner

# Helper
45 minutes, no preparation on your side.

---

### urgency_this_week

- **id**: "urgency_this_week"
- **kind**: "overlay"
- **overlay**: "urgency_this_week"
- **button_link**: ""

# Headline
We can move quickly.

# Body
You said this week — we've held a small number of next-day slots for exactly this. Click through to see them.

# Button
Book a next-day slot

# Helper
A small number of 48-hour slots with a senior planner.


## Microcopy

*9 entries.*

### aria

- **id**: "aria"
- **title**: "ARIA and screen-reader strings"
- **entries**: [{"key":"landmark_banner","value":"Real Wealth — The Wealth Conversation"},{"key":"landmark_main","value":"Main content"},{"key":"landmark_contentinfo","value":"Footer, including regulatory information"},{"key":"tier_radiogroup","value":"How deep would you like to go?"},{"key":"tier_quick","value":"Quick picture, three minutes. A handful of questions."},{"key":"tier_standard","value":"Standard dive, seven minutes. Most people start here. A proper shortlist."},{"key":"tier_thorough","value":"Thorough, twelve minutes. Enough for a full first-call picture."},{"key":"tier_primary_button","value":"Begin the conversation with your selected depth."},{"key":"progress_label","value":"Progress through the conversation."},{"key":"demo_raw_link","value":"Open the demo-only raw-data view."}]

Every interactive element has a meaningful accessible name. Strings follow the same voice rules as visible copy. Decorative icons get `aria-hidden="true"`; functional icons get a paired visible or ARIA label.

---

### emails

- **id**: "emails"
- **title**: "Email stubs (for the production build)"
- **entries**: [{"key":"email1_subject","value":"Your considered picture, {first_name}"},{"key":"email1_preview","value":"The shortlist from your conversation, plus a link to book a first call."},{"key":"email1_body_first_para","value":"{first_name}, thank you for spending ten minutes with us. Below is the shortlist we promised — the same one you saw on screen — along with a link to book a first conversation whenever you're ready. We won't chase you."},{"key":"email2_subject","value":"Still thinking it over?"},{"key":"email2_preview","value":"No pressure. Your shortlist is here whenever you want it."},{"key":"email2_body_first_para","value":"{first_name}, we saw you hadn't picked a time yet — that's completely fine. Here's your shortlist again, in case it's useful. If the moment isn't right, it isn't right. When it is, we're here."}]

Two emails are sent in production (not wired in the demo):

1. **Confirmation + shortlist** — immediately after the data capture submit.
2. **Gentle nudge** — at +7 days if no booking has been made.

Both end with the same regulatory block as the summary-page FCA footer.

Copy is voice-brief only — HTML templates are not drafted yet; the templates go through Compliance before wiring.

---

### errors

- **id**: "errors"
- **title**: "Field validation and error messages"
- **entries**: [{"key":"required_generic","value":"We'll need an answer here to continue."},{"key":"email_invalid","value":"That email doesn't look quite right — a typo somewhere?"},{"key":"email_blank","value":"We need an email so we can send you the picture."},{"key":"first_name_blank","value":"A first name helps us address you properly."},{"key":"phone_invalid","value":"That number doesn't look like a UK mobile — try again or leave it blank."},{"key":"consent_unchecked","value":"We need your consent to send the shortlist — this box is how we confirm it."},{"key":"slider_default","value":"Move the slider to where feels right for you — any value is fine."},{"key":"number_out_of_range","value":"That sits outside what this tool is built for — give us your best estimate."},{"key":"radio_unanswered","value":"Pick whichever feels closest — there's no wrong answer."},{"key":"network_error","value":"Something on our end got stuck. Give it a moment and try again."},{"key":"session_expired","value":"Welcome back. It's been a while, so we've started a fresh session — your old answers are gone."}]

Error messages apologise for the system's lack of clarity, not for the user's mistake. Quiet, specific, actionable. Never red-and-bold shouting.

**Pattern** — single sentence, area-normal 14px, `--ink-muted`, small `alert-circle` icon left. Inline below the field it refers to. Appears on blur or on submit, whichever comes first. Dismissed when the user starts typing again.

No message ever includes the words *error*, *invalid*, *wrong*, *failed*. No exclamation marks. No second-person critical register (*"you forgot to…"*).

---

### loading_states

- **id**: "loading_states"
- **title**: "Loading, empty, and edge states"
- **entries**: [{"key":"initial_load","value":"Bringing the page together — one moment."},{"key":"summary_computing","value":"Putting the picture together.","note":"Skeleton state — only shown if the considered list takes more than 500ms."},{"key":"offline_banner","value":"You've gone offline. We'll keep your place — come back when you're connected."}]

- Initial load — a single centred line, area-normal regular 16px, stone. Rare in App Router; server components render synchronously.
- Between screens — no loading state, just a 250ms cross-fade.
- Summary page computing — calm skeleton (three rounded rectangles in `--surface-container-low`, no spinner).
- Offline / network lost — a small paper-background banner at the top of the viewport, ink text, 14px. Dismisses on reconnect.

---

### meta

- **id**: "meta"
- **title**: "Page titles and meta descriptions"
- **entries**: [{"key":"home_title","value":"The Wealth Conversation — Real Wealth"},{"key":"home_description","value":"Ten minutes of honest questions about your money. You'll finish with a shortlist of things worth a planner conversation."},{"key":"start_title","value":"Start the conversation — Real Wealth"},{"key":"start_description","value":"A short, considered set of questions. No sign-in. Stop whenever you like."},{"key":"questions_title","value":"The Wealth Conversation — Real Wealth"},{"key":"questions_description","value":"Ten minutes of honest questions about your money. You'll finish with a shortlist of things worth a planner conversation."},{"key":"details_title","value":"Where shall we send it? — Real Wealth"},{"key":"details_description","value":"Your contact details so we can send your shortlist."},{"key":"summary_title","value":"Your considered picture — Real Wealth"},{"key":"summary_description","value":"A clear, illustrative picture of what's worth a first conversation."},{"key":"demo_raw_title","value":"Session data — Real Wealth (demo)"},{"key":"demo_raw_description","value":"Demo-only view of the captured session."}]

Every route sets both. Titles quiet, descriptions avoid superlatives. OG image: the homepage hero image, never the user's data.

---

### modals

- **id**: "modals"
- **title**: "Modal dialogues"
- **entries**: [{"key":"start_over_headline","value":"Clear this and start again?"},{"key":"start_over_body","value":"We'll clear your answers and take you back to the homepage. Nothing is stored beyond your browser."},{"key":"start_over_primary","value":"Yes, start over"},{"key":"start_over_secondary","value":"Keep what I have"},{"key":"leave_midflow_headline","value":"Come back to it?"},{"key":"leave_midflow_body","value":"Your answers are saved in this browser. Close the tab if you'd like — they'll be here when you return."},{"key":"leave_midflow_primary","value":"Keep going"},{"key":"leave_midflow_secondary","value":"Close anyway"},{"key":"consent_detail_headline","value":"What we do with your answers"},{"key":"consent_detail_primary","value":"Got it"}]

Three modal dialogues — start-over confirmation (from summary-page footer and from browser back-button traps), leave-mid-flow (optional, Tier A only), and a consent detail reveal from the data capture screen.

---

### progress

- **id**: "progress"
- **title**: "Progress indicator copy"
- **entries**: [{"key":"band_0_25","value":"Just getting started"},{"key":"band_26_50","value":"Halfway through the picture"},{"key":"band_51_80","value":"Nearly there"},{"key":"band_81_99","value":"One or two more"},{"key":"complete_100","value":"Last step","note":"Shown on the data capture screen."}]

Percentage-based, not numbered. The short label sits above the bar, area-normal regular 13px, `--stone`. Bar itself: 4px tall, `--surface-container-low` track, `--brand-teal` fill with 300ms ease on step advance.

---

### toasts

- **id**: "toasts"
- **title**: "Toasts and inline confirmations"
- **entries**: [{"key":"answer_saved","value":"Saved. You can close this and come back.","note":"Fires once per session, throttled."},{"key":"save_and_close","value":"All saved. We'll remember where you were."},{"key":"copied_to_clipboard","value":"Copied."},{"key":"download_json","value":"Session JSON downloaded.","note":"Demo only."},{"key":"resume_detected","value":"Welcome back — we've picked up where you left off."}]

Toasts live top-right, paper background with soft shadow (per the No-Line Rule), 4 second auto-dismiss unless the user interacts, 300ms fade.

---

### voice_rules

- **id**: "voice_rules"
- **title**: "Voice and tone guardrails for auto-generated strings"
- **entries**: [{"key":"rule_case","value":"Use sentence case. No Title Case on buttons except proper nouns."},{"key":"rule_exclamation","value":"Avoid exclamation marks entirely."},{"key":"rule_banned_words","value":"Avoid the banned-word list in Voice and Tone §4 (no unlock, supercharge, transform, guaranteed, proven)."},{"key":"rule_advice_verbs","value":"Avoid recommend, advise, suggest you, should, must. Use consider, worth a conversation, you might, we'd talk about."},{"key":"rule_active_voice","value":"Prefer the active voice. \"We saved your answers\" beats \"Your answers have been saved.\""},{"key":"rule_contractions","value":"Prefer contractions. \"We won't\" not \"We will not.\""},{"key":"rule_sentence_length","value":"Max 15 words per sentence on any interactive element. 25 words anywhere else unless the content is intentionally narrative."},{"key":"rule_no_emoji","value":"Never use emoji, never use exclamation marks, never use punctuation shortcuts like :) or !"}]

Where the developer needs to invent a string that isn't specified in any of the other microcopy files, the string must obey the rules above. If any rule is hard to meet, flag the string in the README for a human edit rather than smuggling in a bad line.
