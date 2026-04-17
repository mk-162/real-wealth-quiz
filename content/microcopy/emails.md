---
id: emails
title: Email stubs (for the production build)
entries:
  - key: email1_subject
    value: "Your Wealth Report, {first_name}"
  - key: email1_preview
    value: "Your Wealth Report from the conversation, plus a link to book a first call."
  - key: email1_body_first_para
    value: "{first_name}, thank you for spending ten minutes with us. Below is the Wealth Report we promised — the same one you saw on screen — along with a link to book a first conversation whenever you're ready. We won't chase you."
  - key: email2_subject
    value: "Still thinking it over?"
  - key: email2_preview
    value: "No pressure. Your Wealth Report is here whenever you want it."
  - key: email2_body_first_para
    value: "{first_name}, we saw you hadn't picked a time yet — that's completely fine. Here's your Wealth Report again, in case it's useful. If the moment isn't right, it isn't right. When it is, we're here."
  - key: footer_regulated
    value: "Real Wealth Partners Ltd is authorised and regulated by the Financial Conduct Authority (FRN 1037186). Registered in England and Wales, company number 16498380. Registered office: Office 1, First Floor, 14–18 Tib Lane, Manchester, M2 4JB. A wholly owned subsidiary of Real Wealth Group Ltd."
  - key: footer_confidentiality
    value: "Confidentiality: This email and any attachments are confidential and intended solely for the addressee. If you have received this message in error, please notify the sender immediately and delete it. Unauthorised use, disclosure, copying or alteration is prohibited. To the extent permitted by law, Real Wealth Partners Ltd accepts no liability for any reliance placed on this email by any person other than the intended recipient(s), except where agreed in writing."
  - key: footer_non_binding
    value: "Non-binding communication: This email is for information purposes only and does not constitute a legally binding agreement. No employee is authorised to bind Real Wealth Partners Ltd unless confirmed in writing by a Director."
  - key: footer_security
    value: "Security: Electronic communications are not guaranteed to be secure. Real Wealth Partners Ltd does not accept liability for any loss or damage arising from interception, corruption, or unauthorised alteration of this email."
  - key: footer_call_recording
    value: "Telephone calls may be recorded for training, monitoring, and regulatory purposes."
---

Two emails are sent in production (not wired in the demo):

1. **Confirmation + Wealth Report** — immediately after the data capture submit.
2. **Gentle nudge** — at +7 days if no booking has been made.

Every email ends with the full regulatory + legal footer block — the five `footer_*` entries above, concatenated in this order:

1. `footer_regulated` — FCA authorisation + company number + registered office + parent
2. `footer_confidentiality` — standard confidentiality / mis-directed mail disclaimer
3. `footer_non_binding` — non-binding communication clause
4. `footer_security` — interception / corruption liability disclaimer
5. `footer_call_recording` — call recording notice

Copy is voice-brief only — HTML templates are not drafted yet; the templates go through Compliance before wiring.
