/**
 * Report email — HTML + text variants.
 *
 * Builds a branded transactional email that delivers the Real Wealth
 * Wealth Report to the user. The body includes the emotional-intro
 * line from the summary resolvers plus a link back to the summary
 * page where the full analysis is already unlocked (the client set
 * the unlock flag in localStorage when the submit succeeded).
 *
 * Phase 1.5 will attach a PDF built from the restyled AbleCare
 * template; this version keeps the email itself as the delivery
 * artefact so we can ship compliance + capture before the PDF
 * pipeline is ready.
 *
 * Email design — lean inline CSS, table-based layout for maximum
 * client compatibility (Outlook / Gmail / Apple Mail).
 */

interface ReportEmailInput {
  firstName: string;
  summaryIntro: string;
  reportUrl: string;
  unsubscribeUrl: string;
  privacyUrl: string;
}

const BRAND_TEAL = '#0c7372';
const BRAND_ORANGE = '#ff6801';
const INK = '#353535';
const INK_SOFT = '#5a5a5a';
const PAPER = '#ffffff';
const PAPER_WARM = '#faf7f2';
const STONE = '#b2b2b2';

export function renderReportEmailHtml(input: ReportEmailInput): string {
  const { firstName, summaryIntro, reportUrl, unsubscribeUrl, privacyUrl } = input;
  const safeName = escapeHtml(firstName);
  const safeIntro = escapeHtml(summaryIntro);
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Your Real Wealth Report</title>
</head>
<body style="margin:0;padding:0;background:${PAPER_WARM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER_WARM};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PAPER};border-radius:12px;overflow:hidden;">
          <!-- Teal banner -->
          <tr>
            <td style="background:${BRAND_TEAL};padding:28px 32px;">
              <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.82);">Your Wealth Report</p>
              <h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;font-style:italic;font-weight:300;color:${PAPER};letter-spacing:-0.015em;">
                ${safeName}, your report is ready.
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${INK};">
                Thank you for taking The Wealth Conversation. Here&rsquo;s what we heard:
              </p>
              <blockquote style="margin:0 0 24px;padding:16px 20px;border-left:3px solid ${BRAND_ORANGE};background:${PAPER_WARM};font-size:16px;line-height:1.55;color:${INK_SOFT};">
                ${safeIntro}
              </blockquote>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${INK};">
                Your full Wealth Report — the five areas worth a conversation,
                the gaps we noticed, and the actions most likely to matter —
                is available to view any time.
              </p>
              <!-- Primary CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
                <tr>
                  <td style="background:${BRAND_ORANGE};border-radius:6px;">
                    <a href="${escapeAttr(reportUrl)}" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:300;font-style:italic;color:${PAPER};text-decoration:none;">
                      View my full report &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.55;color:${INK_SOFT};">
                If you&rsquo;d like to talk it through with a planner, just
                reply to this email — there&rsquo;s no preparation needed on
                your side.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #eee;background:${PAPER};">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${STONE};">
                Real Wealth Group &middot; Manchester &middot; Authorised and regulated by the Financial Conduct Authority.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${STONE};">
                <a href="${escapeAttr(unsubscribeUrl)}" style="color:${BRAND_TEAL};">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeAttr(privacyUrl)}" style="color:${BRAND_TEAL};">Privacy notice</a>
                &nbsp;&middot;&nbsp;
                This wasn&rsquo;t you? <a href="${escapeAttr(unsubscribeUrl)}&amp;reason=not-me" style="color:${BRAND_TEAL};">Remove my data</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderReportEmailText(input: ReportEmailInput): string {
  const { firstName, summaryIntro, reportUrl, unsubscribeUrl, privacyUrl } = input;
  return `${firstName}, your Real Wealth Report is ready.

Thank you for taking The Wealth Conversation. Here's what we heard:

"${summaryIntro}"

Your full Wealth Report — the five areas worth a conversation, the gaps we noticed, and the actions most likely to matter — is available to view any time:

${reportUrl}

If you'd like to talk it through with a planner, just reply to this email. There's no preparation needed on your side.

—
Real Wealth Group · Manchester · Authorised and regulated by the Financial Conduct Authority.

Unsubscribe: ${unsubscribeUrl}
Privacy notice: ${privacyUrl}
This wasn't you? Remove my data: ${unsubscribeUrl}&reason=not-me
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
