---
id: summary
title: Summary page
aspiration_echo:
  caption: "— in your words, gently rephrased."
  fallback_templates:
    freedom_time: "The life you're planning for: freedom over your time."
    security_family: "The life you're planning for: the people in your plan, held steady whatever comes."
    choice_work: "The life you're planning for: your terms, your hours, a say in how you work."
    experiences: "The life you're planning for: horizons you haven't walked yet, time to walk them."
    legacy: "The life you're planning for: something worth passing on, on your terms."
    peace: "The life you're planning for: a quiet mind about what's next."
considered_list:
  section_heading: "THINGS WORTH A CONVERSATION"
  intro: "Here's what we noticed, based on what you told us. None of this is advice yet — it's a shortlist of conversations that would be valuable for someone in your situation."
  max_cards: 6
  min_cards: 3
  final_line: "We'll save this list against your name. If you book a call, we'll bring it to the conversation so you don't have to."
charts:
  section_heading: "THE SHAPE OF IT"
  intro: "Not your numbers — nobody's numbers. The shape of the question."
  per_chart_illustrative_tag: "ILLUSTRATIVE EXAMPLE"
  disclaimer: "These are not projections of your personal numbers. They show the shape of the question for a typical household. Your numbers, your plan, your answer — that's a conversation."
  segment_chart_selection:
    S1: "compounding_line"
    S2: "compounding_line"
    S3: "100k_trap"
    S4: "100k_trap"
    S5: "extraction_mix"
    S6: "badr_transition"
    S7: "drawdown_paths"
    S8: "drawdown_paths"
    S9: "iht_on_3m"
fca_footer:
  disclosure: "Real Wealth Partners Ltd is authorised and regulated by the Financial Conduct Authority (FRN 1037186). Registered in England and Wales, company number 16498380. Registered office: Office 1, First Floor, 14–18 Tib Lane, Manchester, M2 4JB. A wholly owned subsidiary of Real Wealth Group Ltd. This tool provides general guidance and does not constitute a personal recommendation or financial advice. A regulated conversation with one of our planners is required before acting on anything discussed here."
  links:
    - label: "Privacy"
      href: "/privacy"
    - label: "How we meet our Consumer Duty obligations"
      href: "/consumer-duty"
    - label: "Start over"
      href: "?action=start_over"
demo_view_raw:
  link_label: "View the captured data"
  modal_note: "Demo only. In production this view would not exist — the data would flow to the firm's systems via HubSpot or an equivalent. This page exists so IT can see the shape of what we capture."
---

One long scrolling page with six sections: aspiration echo → considered list → illustrative charts → segment CTA → FCA footer → demo "view raw data" link.

The aspiration echo blends keywords from the user's Q2.4 answer with a template tied to their Q1.2 wealth-definition choice. Verbatim text on the page is generated server-side and not stored — the page is refreshed from source answers each time it renders.

Example blended echoes (for reference during copy review):

- User picked *Freedom over my time* + wrote *"mornings outside, lunch with my wife, the grandchildren round on Sundays, no work after four"*
  → *The life you're planning for: mornings outside, Sundays with the grandchildren, time you actually own.*
- User picked *Security for my family* + wrote *"knowing the mortgage is paid, the kids through uni, the family safe if anything happens"*
  → *The life you're planning for: the mortgage paid, the kids through uni, a family held steady whatever comes.*
- User picked *Choice in how I work* + wrote *"a couple of days a week, on my own terms, the flexibility to say no"*
  → *The life you're planning for: a couple of days a week, your own terms, the freedom to say no.*
