import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(appRoot, '..');
const parentRoot = resolve(workspaceRoot, '..');
const outDir = join(appRoot, 'public', 'client-review');
const docsDir = join(outDir, 'docs');
const assetsDir = join(outDir, 'assets');

const segmentIds = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];

const segments = [
  { id: 'S1', name: 'Early Accumulator', description: 'Low-fit fallback and nurture route. Keeps the form short and avoids specialist planning sections.', counts: { y: 15, c: 2, n: 15 } },
  { id: 'S2', name: 'Mass-Affluent Mid-Career', description: 'Accumulating household with enough estate value for useful planning, but not the core high-earner route.', counts: { y: 23, c: 4, n: 5 } },
  { id: 'S3', name: 'High-Earner Mid-Career', description: 'Strong provocation territory around income tax, savings capacity, protection, and planning focus.', counts: { y: 27, c: 2, n: 3 } },
  { id: 'S4', name: 'Senior Professional / Partner', description: 'Senior-professional route with higher estate value, tax-allowance exposure, and estate planning prompts.', counts: { y: 27, c: 2, n: 3 } },
  { id: 'S5', name: 'Business Owner - Growth', description: 'Owner still building. Receives the business branch and most planning sections.', counts: { y: 30, c: 2, n: 0 } },
  { id: 'S6', name: 'Business Owner - Exit-minded', description: 'Business owner with exit intent. Receives succession, extraction, and exit-window triggers.', counts: { y: 28, c: 4, n: 0 } },
  { id: 'S7', name: 'Pre-Retiree Affluent', description: 'Peak retirement-planning target. Strong route for pensions, estate, retirement confidence, and state pension.', counts: { y: 25, c: 4, n: 3 } },
  { id: 'S8', name: 'Retired / Decumulation', description: 'Skips accumulation-era and protection questions. Focuses on retirement shape, estate, advice, and priorities.', counts: { y: 23, c: 1, n: 8 } },
  { id: 'S9', name: 'HNW / Multi-Gen', description: 'High-net-worth route. HNW overrides other signals and opens senior-partner style prompts.', counts: { y: 25, c: 7, n: 0 } },
];

const rules = [
  { rank: 1, id: 'S9', label: 'HNW / Multi-Gen', predicate: 'Q4.5 >= GBP 3m', description: 'HNW overrides other signals. Senior-partner routing regardless of age or income.' },
  { rank: 2, id: 'S6', label: 'Business Owner - Exit-minded', predicate: 'Q2.3 = business owner AND Q2.1 >= 50 AND Q5.3 shows exit intent', description: 'Exit-oriented answer upgrades the provisional S5 business-owner route.' },
  { rank: 3, id: 'S5', label: 'Business Owner - Growth', predicate: 'Q2.3 = business owner AND Q2.1 < 50', description: 'Owner still building.' },
  { rank: 4, id: 'S8', label: 'Retired / Decumulation', predicate: 'Q2.3 = fully retired or partly retired AND Q2.1 >= 60', description: 'Skips accumulation-era questions and protection prompts.' },
  { rank: 5, id: 'S7', label: 'Pre-Retiree Affluent', predicate: 'Q2.1 is 55-65 AND Q2.3 = employed or self-employed', description: 'Peak Real Wealth target for retirement planning.' },
  { rank: 6, id: 'S4', label: 'Senior Professional / Partner', predicate: 'Q3.1 >= GBP 200k AND Q4.5 >= GBP 1m', description: 'Senior professional tone and tax allowance triggers.' },
  { rank: 7, id: 'S3', label: 'High-Earner Mid-Career', predicate: 'Q3.1 is GBP 100k-GBP 200k', description: 'Richest territory for the GBP 100k tax-trap provocation.' },
  { rank: 8, id: 'S2', label: 'Mass-Affluent Mid-Career', predicate: 'Q3.1 is GBP 50k-GBP 100k AND Q4.5 >= GBP 250k', description: 'Accumulating, but not yet at the core high-earner provocation point.' },
  { rank: 9, id: 'S1', label: 'Early Accumulator', predicate: 'Default when no higher rule matches', description: 'Short friendly route with nurture-style follow-up.' },
];

const sections = [
  { id: 'set_the_tone', label: 'Set the tone' },
  { id: 'life_shape', label: 'Life shape' },
  { id: 'money_today', label: 'Money today' },
  { id: 'assets', label: 'Assets' },
  { id: 'business', label: 'Business' },
  { id: 'people_and_legacy', label: 'People and legacy' },
  { id: 'retirement_horizon', label: 'Retirement horizon' },
  { id: 'protection', label: 'Protection' },
  { id: 'advice_today', label: 'Advice today' },
  { id: 'priorities', label: 'Priorities' },
];

const questions = [
  { id: 'Q1.1', section: 'set_the_tone', label: 'What brought you here today?', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q1.2', section: 'set_the_tone', label: 'What does real wealth mean to you?', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q2.1', section: 'life_shape', label: 'Age', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q2.2', section: 'life_shape', label: 'Who else is part of the plan?', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q2.3', section: 'life_shape', label: 'Working life right now', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q2.4', section: 'life_shape', label: 'Ideal normal week / happy place', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q3.1', section: 'money_today', label: 'Household income before tax', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q3.2', section: 'money_today', label: 'Monthly essential spending', cells: ['N','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q3.3', section: 'money_today', label: 'Monthly non-essential spending', cells: ['N','N','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q3.4', section: 'money_today', label: 'Saving confidence', cells: ['Y','Y','Y','Y','Y','Y','Y','N','Y'] },
  { id: 'Q3.5', section: 'money_today', label: 'Money mindset', cells: ['N','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q4.1', section: 'assets', label: 'Main home and mortgage', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q4.2', section: 'assets', label: 'Other property', cells: ['N','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q4.3', section: 'assets', label: 'Pension pots', cells: ['N','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q4.4', section: 'assets', label: 'Savings and investments', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q4.5', section: 'assets', label: 'Total estate band', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q5.1', section: 'business', label: 'Role in the business', cells: ['N','N','N','N','Y','Y','N','N','C'] },
  { id: 'Q5.2', section: 'business', label: 'How money is taken from the business', cells: ['N','N','N','N','Y','Y','N','N','C'] },
  { id: 'Q5.3', section: 'business', label: 'Business succession / exit thinking', cells: ['N','N','N','N','Y','Y','N','N','C'] },
  { id: 'Q6.1', section: 'people_and_legacy', label: 'Dependants today', cells: ['N','C','C','C','C','C','C','N','C'] },
  { id: 'Q6.2', section: 'people_and_legacy', label: 'Passing-on intent', cells: ['N','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q6.3', section: 'people_and_legacy', label: 'Will and LPA status', cells: ['N','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q7.1', section: 'retirement_horizon', label: 'Target retirement age', cells: ['Y','Y','Y','Y','Y','Y','Y','N','Y'] },
  { id: 'Q7.2', section: 'retirement_horizon', label: 'How retirement feels', cells: ['N','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q7.3', section: 'retirement_horizon', label: 'State pension awareness', cells: ['N','N','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q8.1', section: 'protection', label: 'Earnings protection confidence', cells: ['C','C','Y','Y','Y','C','C','N','C'] },
  { id: 'Q8.2', section: 'protection', label: 'Life cover status', cells: ['N','C','Y','Y','Y','C','C','N','C'] },
  { id: 'Q9.1', section: 'advice_today', label: 'Current adviser', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q9.2', section: 'advice_today', label: 'What is missing from advice', cells: ['C','C','C','C','C','C','C','C','C'] },
  { id: 'Q10.1', section: 'priorities', label: 'Trade-off choices', cells: ['N','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q10.2', section: 'priorities', label: 'One thing to sort', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
  { id: 'Q10.3', section: 'priorities', label: 'Urgency', cells: ['Y','Y','Y','Y','Y','Y','Y','Y','Y'] },
];

const provocations = [
  { id: 'prov.advised_looking', name: 'You already know the answer.', trigger: "current_adviser == 'yes_looking'", segments: ['all'] },
  { id: 'prov.btl_portfolio', name: 'The incorporation question.', trigger: 'other_property >= 2 AND NOT held_in_limited_company', segments: ['S3','S4','S6','S7','S9'] },
  { id: 'prov.business_no_plan', name: 'Thinking is the planning starting.', trigger: "succession == 'no_plan_thinking'", segments: ['S5','S6'] },
  { id: 'prov.director_single_pot', name: 'The quiet tax lever.', trigger: "role == 'sole_director' AND pension_pots <= 1", segments: ['S5','S6'] },
  { id: 'prov.dont_know_priority', name: 'Most of our best client relationships started here.', trigger: "one_thing == 'dont_know'", segments: ['all'] },
  { id: 'prov.estate_unsure', name: 'Worth adding it up.', trigger: "estate == 'not_sure' AND investable_assets >= 500_000", segments: ['S3','S4','S7'] },
  { id: 'prov.exit_window', name: 'Two years, not six months.', trigger: "succession == 'exit_5_years'", segments: ['S6'] },
  { id: 'prov.hnw_pathway', name: 'A different conversation.', trigger: 'investable_assets >= 1_000_000 AND estate >= 3_000_000', segments: ['S9'] },
  { id: 'prov.iht_2m_cliff', name: 'The GBP 2m cliff.', trigger: 'estate >= 2_000_000 AND rnrb_taper_awareness_did_not_fire', segments: ['S4','S6','S7','S9'] },
  { id: 'prov.money_stress', name: 'A note from us.', trigger: "money_mindset == 'stress'", segments: ['all'] },
  { id: 'prov.no_will_estate', name: 'Intestate is a bad default.', trigger: 'no_will AND estate >= 500_000', segments: ['S2','S3','S4','S7','S9'] },
  { id: 'prov.protection_gap', name: 'The 3-month line.', trigger: 'earnings_protection_scale <= 2 AND has_dependants', segments: ['S2','S3','S4','S5'] },
  { id: 'prov.retirement_unease', name: 'It is not about when you stop.', trigger: "retirement_feel in ['uneasy', 'hard_to_imagine']", segments: ['S3','S4','S5','S6','S7'] },
  { id: 'prov.sandwich_gen', name: 'Both ways at once.', trigger: 'household includes dependent_children AND household includes elderly_parent', segments: ['all'] },
  { id: 'prov.urgency_week', name: 'We can move quickly.', trigger: "urgency == 'this_week'", segments: ['all'] },
];

const docs = [
  { slug: 'content-readme', title: 'Content README', summary: 'How copy is edited in the content folder and validated before shipping.', source: join(appRoot, 'content', 'README.md') },
  { slug: 'wealth-conversation-spec', title: 'Wealth Conversation Spec', summary: 'The core service specification for the lead magnet and client journey.', source: join(workspaceRoot, 'Lead Magnet - Wealth Conversation Spec.md') },
  { slug: 'prototype-action-plan', title: 'Prototype Action Plan', summary: 'The build plan, trigger matrix, data flow, and pilot plan.', source: join(workspaceRoot, 'Lead Magnet - Prototype Action Plan.md') },
  { slug: 'app-build-prompt', title: 'App Build Prompt', summary: 'The prompt used to scaffold the demo from the master template.', source: join(workspaceRoot, 'Claude Code Prompt - App Build.md') },
  { slug: 'master-template-readme', title: 'Master Template README', summary: 'Engineering guide to the Next.js scaffold and project layout.', source: join(appRoot, 'README.md') },
  { slug: 'decision-log', title: 'Decision Log', summary: 'What was kept, what was cut, and what remains open.', source: join(appRoot, 'DECISION_LOG.md') },
  { slug: 'brand-overview', title: 'Brand Overview', summary: 'Real Wealth positioning, audiences, services, and tone.', source: join(workspaceRoot, 'Brand Assets', 'Brand Overview.md') },
  { slug: 'voice-and-tone', title: 'Voice and Tone', summary: 'Writing rules, banned phrases, and voice guidance.', source: join(workspaceRoot, 'Brand Assets', 'Voice and Tone.md') },
  { slug: 'colour-palette', title: 'Colour Palette and Tokens', summary: 'Primary, secondary, and neutral colours with usage guidance.', source: join(workspaceRoot, 'Brand Assets', 'Colour Palette.md') },
  { slug: 'segmentation-companion', title: 'Segmentation Design Companion', summary: 'The nine-segment model, five-question gate, and route matrix.', source: join(workspaceRoot, 'Segmentation Design Companion.md') },
  { slug: 'question-design-options', title: 'Question Design Options', summary: 'The question catalogue and interaction patterns used in the form.', source: join(workspaceRoot, 'Question Design Options.md') },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function repairText(value) {
  const replacements = [
    ['\u00c2\u00a3', '\u00a3'],
    ['\u00c2\u00b7', '\u00b7'],
    ['\u00c3\u2014', '\u00d7'],
    ['\u00e2\u20ac\u201d', '\u2014'],
    ['\u00e2\u20ac\u201c', '\u2013'],
    ['\u00e2\u20ac\u02dc', '\u2018'],
    ['\u00e2\u20ac\u2122', '\u2019'],
    ['\u00e2\u20ac\u0153', '\u201c'],
    ['\u00e2\u20ac\u009d', '\u201d'],
    ['\u00e2\u20ac\u00a6', '\u2026'],
    ['\u00e2\u2020\u2019', '\u2192'],
    ['\u00e2\u2030\u00a5', '\u2265'],
    ['\u00e2\u2030\u00a4', '\u2264'],
    ['\u00e2\u02c6\u02c6', '\u2208'],
    ['\u00e2\u02c6\u2019', '\u2212'],
  ];

  let output = String(value);
  for (const [from, to] of replacements) {
    output = output.replaceAll(from, to);
  }
  return output;
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  const code = [];
  text = text.replace(/`([^`]+)`/g, (_m, c) => {
    const token = `@@CODE${code.length}@@`;
    code.push(`<code>${c}</code>`);
    return token;
  });
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => `<a href="${escapeHtml(rewriteDocHref(href))}">${label}</a>`);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  code.forEach((html, index) => {
    text = text.replace(`@@CODE${index}@@`, html);
  });
  return text;
}

function rewriteDocHref(href) {
  const decoded = decodeURIComponent(href).replaceAll('\\', '/');
  const match = docs.find((doc) => decoded.endsWith(doc.source.replaceAll('\\', '/').split('/').slice(-1)[0]));
  if (match) return `./${match.slug}.html`;
  return href;
}

function renderMarkdown(markdown) {
  let source = repairText(markdown).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (source.startsWith('---\n')) {
    const end = source.indexOf('\n---\n', 4);
    if (end !== -1) source = source.slice(end + 5);
  }

  const lines = source.split('\n');
  const out = [];
  let paragraph = [];
  let list = null;
  let inCode = false;
  let codeLines = [];

  const closeParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      closeParagraph();
      closeList();
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (/^\|.+\|$/.test(line.trim()) && i + 1 < lines.length && /^\|?[\s:-]+\|[\s|:-]+$/.test(lines[i + 1].trim())) {
      closeParagraph();
      closeList();
      const header = line.trim().slice(1, -1).split('|').map((c) => c.trim());
      i += 1;
      const rows = [];
      while (i + 1 < lines.length && /^\|.+\|$/.test(lines[i + 1].trim())) {
        i += 1;
        rows.push(lines[i].trim().slice(1, -1).split('|').map((c) => c.trim()));
      }
      out.push(`<div class="doc-table-wrap"><table><thead><tr>${header.map((c) => `<th>${inlineMarkdown(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    if (!line.trim()) {
      closeParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 5);
      out.push(`<h${level}>${inlineMarkdown(heading[2].trim())}</h${level}>`);
      continue;
    }

    const quote = line.match(/^>\s*(.*)$/);
    if (quote) {
      closeParagraph();
      closeList();
      out.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      closeParagraph();
      if (list !== 'ul') {
        closeList();
        list = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    const number = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (number) {
      closeParagraph();
      if (list !== 'ol') {
        closeList();
        list = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${inlineMarkdown(number[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  closeParagraph();
  closeList();
  if (inCode) out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  return out.join('\n');
}

function pageShell({ title, description, body, depth = 0 }) {
  const prefix = depth === 0 ? './' : '../';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)} - Real Wealth Client Review</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="${prefix}site.css">
</head>
<body>
  <header class="site-header">
    <a class="logo-link" href="${prefix}index.html" aria-label="Real Wealth client review home">
      <img src="/real-wealth-logo-wordmark.svg" alt="Real Wealth">
    </a>
    <nav class="site-nav" aria-label="Primary navigation">
      <a href="${prefix}index.html#service">Service</a>
      <a href="${prefix}index.html#question-flow">Question flow</a>
      <a href="${prefix}index.html#delivery">Delivery</a>
      <a href="${prefix}index.html#documents">Docs</a>
      <a class="service-link" href="/">Open service</a>
    </nav>
  </header>
  ${body}
  <footer class="site-footer">
    <div>
      <img src="/real-wealth-logo-wordmark.svg" alt="Real Wealth">
      <p>Manchester / Taunton | 0161 768 7722 | hello@realwealth.co.uk</p>
    </div>
    <p>This client review website is for internal review only. Public launch requires final compliance sign-off and production data integrations.</p>
  </footer>
</body>
</html>`;
}

function buildIndex() {
  const docCards = docs.map((doc) => `
    <a class="doc-card" href="./docs/${doc.slug}.html">
      <span>Document</span>
      <strong>${escapeHtml(doc.title)}</strong>
      <p>${escapeHtml(doc.summary)}</p>
    </a>`).join('\n');

  const body = `
<main>
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Client review website</p>
      <h1>Wealth Conversation service review.</h1>
      <p class="lead">A branded guide to the Real Wealth lead-magnet service: what the user experiences, how the question flow adapts, what content can trigger, and what needs to happen before public launch.</p>
      <div class="hero-actions">
        <a class="btn primary" href="/">Open the service</a>
        <a class="btn secondary" href="/conversation?tier=standard">Start standard conversation</a>
        <a class="btn ghost" href="#documents">Review source docs</a>
      </div>
    </div>
    <div class="hero-visual" aria-label="Service screenshots">
      <figure class="shot shot-main"><img src="./assets/question-screen.png" alt="Real Wealth questionnaire screen"><figcaption>Questionnaire</figcaption></figure>
      <figure class="shot shot-small"><img src="./assets/summary-screen.png" alt="Real Wealth summary screen"><figcaption>Triggered summary</figcaption></figure>
    </div>
  </section>

  <section id="service" class="section">
    <div class="section-head">
      <p class="eyebrow">How the service works</p>
      <h2>It is a guided conversation, not a score quiz.</h2>
      <p>The visitor chooses a depth, answers a conversational form, receives tailored prompts and a summary, then can book a call with Real Wealth. The system is designed to make the first planner conversation warmer, more specific, and easier to prepare for.</p>
    </div>
    <div class="journey-grid">
      ${[
        ['1', 'Landing page', 'Explains the promise, lets the visitor choose quick, standard, or thorough.'],
        ['2', 'Opening questions', 'Sets tone and captures what real wealth means to the person.'],
        ['3', 'Segment gate', 'Age, household, work status, income, and estate band assign a planning segment.'],
        ['4', 'Adaptive flow', 'The segment matrix decides which later questions are shown, conditional, or skipped.'],
        ['5', 'Triggered insight', 'Answer patterns can show provocations, awareness checks, and summary overlays.'],
        ['6', 'Next step', 'The visitor submits details and moves into booking, CRM, and adviser follow-up.'],
      ].map(([n, h, p]) => `<article class="journey-card"><span>${n}</span><h3>${h}</h3><p>${p}</p></article>`).join('\n')}
    </div>
  </section>

  <section id="built" class="section split">
    <div>
      <p class="eyebrow">What has been built</p>
      <h2>Current demo status.</h2>
      <p>The demo is a Next.js single-page app with a content-as-code layer, typed catalogues, adaptive question routing, segment assignment, and review-ready content libraries.</p>
    </div>
    <div class="status-list">
      ${[
        ['Master Template', 'Built', 'Next.js app, component library, content schemas.'],
        ['Questionnaire Flow', 'Built', 'Tier picker, question screens, navigation, local session state.'],
        ['Segmentation Engine', 'Built', 'Nine ranked rules and S5 to S6 upgrade behaviour.'],
        ['Content Pipeline', 'Built', 'Markdown content validates into typed TypeScript catalogues.'],
        ['Component Wiring', 'In progress', 'Demo components are connected; production integrations remain.'],
        ['Backend / Database', 'Roadmap', 'Postgres submission storage and consent log are designed but not live.'],
        ['CRM Integration', 'Roadmap', 'HubSpot is assumed, with alternative CRM options possible.'],
      ].map(([name, status, detail]) => `<div class="status-row"><strong>${name}</strong><span>${status}</span><p>${detail}</p></div>`).join('\n')}
    </div>
  </section>

  <section id="question-flow" class="section">
    <div class="section-head">
      <p class="eyebrow">Question flow</p>
      <h2>The first five gate answers shape the rest of the service.</h2>
      <p>The app asks the same opening questions for everyone, assigns a segment silently after the money-today screen, then continues with only the sections that make sense for that person.</p>
    </div>
    <div class="gate-grid">
      ${[
        ['Q2.1', 'Age', 'Used for retirement, business exit, pre-retirement, and HNW context.'],
        ['Q2.2', 'Household', 'Identifies partner, children, adult children, elderly parent, or solo planning.'],
        ['Q2.3', 'Work status', 'Separates employed, self-employed, business owner, retired, and between-role journeys.'],
        ['Q3.1', 'Income band', 'Identifies high-earner tax traps and income-led segment fit.'],
        ['Q4.5', 'Estate band', 'Creates senior, HNW, IHT, and estate-planning routes.'],
      ].map(([qid, h, p]) => `<article class="gate-card"><span>${qid}</span><h3>${h}</h3><p>${p}</p></article>`).join('\n')}
    </div>
    <h3 class="subhead">Ranked segment rules</h3>
    <div id="ruleList" class="rule-list"></div>
    <div class="note"><strong>S6 is two-stage.</strong> The app initially treats an older business owner as S5. If Q5.3 later shows exit intent, the segment upgrades to S6.</div>
    <h3 class="subhead">Segment question matrix</h3>
    <div id="segmentToolbar" class="segment-toolbar" aria-label="Filter by segment"></div>
    <div id="routePanel" class="route-panel"></div>
    <div class="legend"><span><b class="y">Y</b> shown</span><span><b class="c">C</b> conditional</span><span><b class="n">N</b> skipped</span></div>
    <div class="matrix-wrap"><table id="matrixTable" class="matrix-table"></table></div>
  </section>

  <section id="triggers" class="section split">
    <div>
      <p class="eyebrow">Triggered content</p>
      <h2>The service responds to meaningful answer patterns.</h2>
      <p>Provocations create timely commercial prompts. Awareness checks educate the user on planning pitfalls and capture whether they already knew the issue.</p>
    </div>
    <div class="trigger-box">
      <div><strong>24</strong><span>provocation cards</span></div>
      <div><strong>26</strong><span>awareness checks</span></div>
      <div><strong>11</strong><span>summary CTAs and overlays</span></div>
    </div>
  </section>
  <section class="section">
    <h3 class="subhead">Example provocation triggers</h3>
    <div id="provocationList" class="provocation-list"></div>
  </section>

  <section id="delivery" class="section">
    <div class="section-head">
      <p class="eyebrow">Delivery model</p>
      <h2>Content, compliance, data, and deployment.</h2>
      <p>The current demo keeps data local to the browser. Production should add encrypted submission storage, consent logging, CRM record creation, and calendar prefill.</p>
    </div>
    <div class="delivery-grid">
      <article><h3>Content workflow</h3><p>Markdown files are validated by Zod schemas, then compiled into typed catalogues consumed by the React app.</p></article>
      <article><h3>Compliance workflow</h3><p>Provocations and awareness checks carry review status. Production should only render approved-to-ship content.</p></article>
      <article><h3>Data roadmap</h3><p>Postgres should store submissions, answers, segment, fired triggers, consent text, and timestamps.</p></article>
      <article><h3>CRM roadmap</h3><p>HubSpot is assumed. Captured fields can create a lead, attach segment metadata, and enroll follow-up workflows.</p></article>
    </div>
  </section>

  <section id="documents" class="section">
    <div class="section-head">
      <p class="eyebrow">Review library</p>
      <h2>Rendered source documents.</h2>
      <p>The documents that were linked from the original dashboard are rendered here as HTML pages so the client can review the whole service without opening raw Markdown files.</p>
    </div>
    <div class="docs-grid">${docCards}</div>
  </section>

  <section id="next" class="section next-panel">
    <p class="eyebrow">Next decisions</p>
    <h2>What Real Wealth needs to confirm before launch.</h2>
    <div class="next-grid">
      ${[
        'Review and edit the content folder or the rendered documents above.',
        'Provide final brand assets: Typekit ID, production logo files, and approved photography.',
        'Confirm CRM platform and provide credentials or sandbox access.',
        'Choose the Vercel project, domain, and DNS route.',
        'Complete CFP and compliance sign-off on all triggered content.',
        'Schedule a soft-launch pilot with 8-12 warm contacts.',
      ].map((item) => `<p>${item}</p>`).join('\n')}
    </div>
  </section>
</main>
<script src="./app.js"></script>`;

  return pageShell({
    title: 'Wealth Conversation Service Review',
    description: 'Client review website for the Real Wealth Wealth Conversation service.',
    body,
  });
}

function buildDocPage(doc) {
  const raw = readFileSync(doc.source, 'utf8');
  const body = `
<main class="doc-page">
  <a class="back-link" href="../index.html#documents">Back to review library</a>
  <article class="doc-article">
    <header class="doc-hero">
      <p class="eyebrow">Source document</p>
      <h1>${escapeHtml(doc.title)}</h1>
      <p>${escapeHtml(doc.summary)}</p>
    </header>
    <div class="doc-body">${renderMarkdown(raw)}</div>
  </article>
</main>`;
  return pageShell({
    title: doc.title,
    description: doc.summary,
    body,
    depth: 1,
  });
}

function buildCss() {
  return `:root {
  --orange: #ff6801;
  --teal: #0c7372;
  --teal-light: #11a09f;
  --ink: #353535;
  --stone: #6d777b;
  --line: #dbe6e8;
  --paper: #fff;
  --wash: #f7fafa;
  --navy: #333566;
  --gold: #ffd33a;
  --radius: 9px;
  --shadow: 0 18px 44px rgba(13, 42, 46, 0.12);
  --heading: gelica, Georgia, "Times New Roman", serif;
  --body: area-normal, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; color: var(--ink); background: var(--paper); font-family: var(--body); font-size: 17px; line-height: 1.62; }
a { color: inherit; }
.site-header { position: sticky; top: 0; z-index: 20; min-height: 72px; padding: 12px clamp(18px, 4vw, 54px); display: flex; align-items: center; justify-content: space-between; gap: 22px; background: rgba(255,255,255,0.94); border-bottom: 1px solid var(--line); backdrop-filter: blur(12px); }
.logo-link img { display: block; width: 170px; max-width: 44vw; height: auto; }
.site-nav { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.site-nav a { min-height: 38px; display: inline-flex; align-items: center; border: 1px solid transparent; border-radius: var(--radius); padding: 0 12px; color: var(--stone); font-size: 0.86rem; font-weight: 700; text-decoration: none; }
.site-nav a:hover { color: var(--teal); border-color: rgba(12,115,114,0.24); }
.site-nav .service-link { color: #fff; background: var(--orange); border-color: var(--orange); }
main { width: min(1220px, calc(100% - 32px)); margin: 0 auto; }
.hero { min-height: calc(100svh - 72px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 0.92fr); gap: 54px; align-items: center; padding: 56px 0 72px; }
.eyebrow { margin: 0 0 12px; color: var(--teal); font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.13em; font-weight: 900; }
h1, h2, h3 { margin: 0; line-height: 1.08; letter-spacing: 0; color: #18383b; }
h1, h2 { font-family: var(--heading); font-weight: 500; }
h1 { font-size: clamp(3rem, 8vw, 6rem); max-width: 760px; }
h2 { font-size: clamp(2rem, 5vw, 3.8rem); }
h3 { font-size: 1.08rem; }
.lead { max-width: 700px; color: var(--stone); font-size: 1.12rem; margin: 22px 0 0; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
.btn { min-height: 46px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius); padding: 0 17px; font-weight: 850; text-decoration: none; border: 2px solid transparent; }
.btn.primary { background: var(--orange); color: #fff; border-color: var(--orange); }
.btn.secondary { background: #fff; color: var(--teal); border-color: var(--teal); }
.btn.ghost { background: #fff; color: var(--stone); border-color: var(--line); }
.hero-visual { position: relative; min-height: 560px; }
.shot { position: absolute; margin: 0; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 10px; box-shadow: var(--shadow); }
.shot img { display: block; width: 100%; border-radius: 7px; border: 1px solid var(--line); }
.shot figcaption { color: var(--stone); font-size: 0.76rem; font-weight: 800; padding: 8px 2px 0; }
.shot-main { width: min(560px, 94%); top: 8px; left: 0; transform: rotate(1deg); }
.shot-small { width: min(330px, 58%); right: 0; bottom: 10px; transform: rotate(-2deg); }
.section { padding: 78px 0; border-top: 1px solid var(--line); }
.section-head { display: grid; grid-template-columns: minmax(260px, 0.42fr) minmax(0, 0.58fr); gap: 42px; align-items: start; margin-bottom: 30px; }
.section-head p:last-child, .split > div:first-child p { color: var(--stone); margin: 18px 0 0; }
.journey-grid, .gate-grid, .delivery-grid, .docs-grid, .next-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.journey-card, .gate-card, .delivery-grid article, .doc-card, .next-grid p { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; box-shadow: 0 8px 24px rgba(13,42,46,0.05); }
.journey-card span, .gate-card span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: var(--radius); color: #fff; background: var(--teal); font-weight: 900; margin-bottom: 14px; }
.journey-card p, .gate-card p, .delivery-grid p, .doc-card p { color: var(--stone); margin: 8px 0 0; font-size: 0.94rem; }
.split { display: grid; grid-template-columns: minmax(250px, 0.4fr) minmax(0, 0.6fr); gap: 42px; align-items: start; }
.status-list { border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; background: #fff; }
.status-row { display: grid; grid-template-columns: minmax(150px, 0.34fr) 110px minmax(0, 1fr); gap: 14px; padding: 15px 16px; border-top: 1px solid #eef3f3; align-items: center; }
.status-row:first-child { border-top: 0; }
.status-row span { display: inline-flex; min-height: 28px; align-items: center; justify-content: center; border-radius: 999px; background: var(--wash); color: var(--teal); font-size: 0.76rem; font-weight: 900; }
.status-row p { color: var(--stone); margin: 0; font-size: 0.88rem; }
.subhead { margin: 34px 0 14px; }
.rule-list { display: grid; gap: 9px; }
.rule-card { display: grid; grid-template-columns: 52px minmax(160px, 0.32fr) minmax(0, 0.68fr); gap: 16px; align-items: center; border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; background: #fff; }
.rank { width: 38px; height: 38px; display: grid; place-items: center; border-radius: var(--radius); background: #fff3ea; color: var(--orange); font-weight: 900; }
.predicate { color: var(--stone); font-size: 0.9rem; }
code, .trigger-code { font-family: Consolas, "Liberation Mono", monospace; font-size: 0.86em; background: #edf7f6; color: #1d484d; border: 1px solid rgba(12,115,114,0.14); border-radius: 6px; padding: 2px 6px; }
.note { border-left: 4px solid var(--orange); background: #fff6ee; padding: 16px 18px; border-radius: 0 var(--radius) var(--radius) 0; margin-top: 18px; color: #5b4030; }
.segment-toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.segment-toolbar button { min-height: 38px; border: 1px solid var(--line); background: #fff; color: var(--stone); border-radius: var(--radius); padding: 0 12px; cursor: pointer; font-weight: 850; }
.segment-toolbar button[aria-pressed="true"] { color: #fff; background: var(--teal); border-color: var(--teal); }
.route-panel { border: 1px solid var(--line); border-radius: var(--radius); background: var(--wash); padding: 18px; margin-bottom: 16px; }
.route-panel p { color: var(--stone); margin: 8px 0 0; }
.legend { display: flex; gap: 10px; flex-wrap: wrap; color: var(--stone); font-size: 0.86rem; margin-bottom: 12px; }
.legend b, .matrix-cell { width: 26px; height: 26px; display: inline-grid; place-items: center; border-radius: 6px; color: #fff; font-size: 0.75rem; font-weight: 900; }
.y { background: var(--teal); } .c { background: #bf5b00; } .n { background: #7b8790; }
.matrix-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
.matrix-table { width: 100%; min-width: 860px; border-collapse: collapse; font-size: 0.82rem; background: #fff; }
.matrix-table th { background: #f3f8f7; color: #24474a; padding: 10px 8px; text-align: left; border-bottom: 1px solid var(--line); }
.matrix-table td { padding: 10px 8px; border-top: 1px solid #edf2f2; }
.matrix-table .section-row td { background: #193f43; color: #fff; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; font-weight: 900; }
.qid { display: inline-flex; min-width: 45px; justify-content: center; margin-right: 6px; padding: 2px 6px; border-radius: 6px; background: #e9f4f3; color: var(--teal); font-weight: 900; }
.dim { opacity: 0.25; }
.trigger-box { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.trigger-box div { background: var(--wash); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; }
.trigger-box strong { display: block; font-size: 2rem; color: var(--navy); line-height: 1; }
.trigger-box span { color: var(--stone); font-size: 0.84rem; }
.provocation-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.provocation-card { border: 1px solid var(--line); border-left: 4px solid var(--orange); border-radius: var(--radius); background: var(--wash); padding: 16px; }
.provocation-card p { color: var(--stone); font-size: 0.84rem; margin: 8px 0 0; overflow-wrap: anywhere; }
.delivery-grid article { background: var(--wash); }
.doc-card { display: block; text-decoration: none; }
.doc-card span { color: var(--orange); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 900; font-size: 0.72rem; }
.doc-card strong { display: block; margin-top: 8px; color: #18383b; }
.next-panel { background: linear-gradient(135deg, rgba(12,115,114,0.08), rgba(255,104,1,0.08)); border-radius: var(--radius); padding-left: clamp(18px, 4vw, 42px); padding-right: clamp(18px, 4vw, 42px); margin: 40px 0 78px; }
.site-footer { background: var(--navy); color: rgba(255,255,255,0.7); padding: 34px clamp(18px, 4vw, 54px); display: flex; justify-content: space-between; gap: 28px; }
.site-footer img { width: 150px; filter: brightness(0) invert(1); }
.site-footer p { max-width: 760px; margin: 8px 0 0; font-size: 0.86rem; }
.doc-page { width: min(960px, calc(100% - 32px)); padding: 42px 0 80px; }
.back-link { display: inline-flex; margin-bottom: 18px; color: var(--teal); font-weight: 850; text-decoration: none; }
.doc-article { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; box-shadow: 0 12px 34px rgba(13,42,46,0.08); }
.doc-hero { background: var(--wash); padding: clamp(24px, 5vw, 54px); border-bottom: 1px solid var(--line); }
.doc-hero h1 { font-size: clamp(2.2rem, 6vw, 4.6rem); }
.doc-hero p:last-child { color: var(--stone); max-width: 720px; }
.doc-body { padding: clamp(22px, 4vw, 52px); }
.doc-body h2, .doc-body h3, .doc-body h4, .doc-body h5 { font-family: var(--body); color: var(--teal); margin: 2rem 0 0.8rem; }
.doc-body p, .doc-body li { color: #435055; }
.doc-body blockquote { margin: 1.4rem 0; border-left: 4px solid var(--orange); padding: 0.3rem 0 0.3rem 1rem; color: #5b4030; background: #fff6ee; }
.doc-body pre { overflow-x: auto; background: #102f33; color: #fff; padding: 16px; border-radius: var(--radius); }
.doc-table-wrap { overflow-x: auto; margin: 1.2rem 0; border: 1px solid var(--line); border-radius: var(--radius); }
.doc-body table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.doc-body th { background: #f3f8f7; text-align: left; color: #24474a; }
.doc-body th, .doc-body td { border-top: 1px solid var(--line); padding: 10px; vertical-align: top; }
@media (max-width: 980px) {
  .hero, .section-head, .split { grid-template-columns: 1fr; }
  .hero-visual { min-height: 470px; }
  .journey-grid, .gate-grid, .delivery-grid, .docs-grid, .next-grid, .provocation-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .status-row, .rule-card { grid-template-columns: 1fr; }
}
@media (max-width: 680px) {
  .site-header, .site-footer { flex-direction: column; align-items: flex-start; }
  .site-nav { justify-content: flex-start; }
  .journey-grid, .gate-grid, .delivery-grid, .docs-grid, .next-grid, .provocation-list, .trigger-box { grid-template-columns: 1fr; }
  .shot-main { width: 100%; }
  .shot-small { width: 68%; }
}`;
}

function buildJs() {
  return `const segmentIds = ${JSON.stringify(segmentIds)};
const segments = ${JSON.stringify(segments)};
const rules = ${JSON.stringify(rules)};
const sections = ${JSON.stringify(sections)};
const questions = ${JSON.stringify(questions)};
const provocations = ${JSON.stringify(provocations)};
let activeSegment = 'all';
function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function renderRules() {
  const root = document.getElementById('ruleList');
  if (!root) return;
  root.innerHTML = rules.map((rule) => '<article class="rule-card"><div class="rank">' + rule.rank + '</div><div><strong>' + rule.id + ': ' + escapeHtml(rule.label) + '</strong></div><div class="predicate"><code>' + escapeHtml(rule.predicate) + '</code><br>' + escapeHtml(rule.description) + '</div></article>').join('');
}
function renderToolbar() {
  const root = document.getElementById('segmentToolbar');
  if (!root) return;
  root.innerHTML = ['all', ...segmentIds].map((id) => '<button type="button" data-segment="' + id + '" aria-pressed="' + String(activeSegment === id) + '">' + (id === 'all' ? 'All segments' : id) + '</button>').join('');
  root.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    activeSegment = button.dataset.segment || 'all';
    renderToolbar();
    renderRoutePanel();
    renderMatrix();
    renderProvocations();
  }));
}
function renderRoutePanel() {
  const root = document.getElementById('routePanel');
  if (!root) return;
  if (activeSegment === 'all') {
    root.innerHTML = '<h3>All segments visible</h3><p>Pick a segment to highlight the route and filter the example provocation list.</p>';
    return;
  }
  const segment = segments.find((s) => s.id === activeSegment);
  const index = segmentIds.indexOf(activeSegment);
  const y = questions.filter((q) => q.cells[index] === 'Y').map((q) => q.id).join(', ') || 'None';
  const c = questions.filter((q) => q.cells[index] === 'C').map((q) => q.id).join(', ') || 'None';
  const n = questions.filter((q) => q.cells[index] === 'N').map((q) => q.id).join(', ') || 'None';
  root.innerHTML = '<h3>' + segment.id + ': ' + escapeHtml(segment.name) + '</h3><p>' + escapeHtml(segment.description) + '</p><p><strong>Always shown:</strong> ' + y + '</p><p><strong>Conditional:</strong> ' + c + '</p><p><strong>Skipped:</strong> ' + n + '</p>';
}
function renderMatrix() {
  const table = document.getElementById('matrixTable');
  if (!table) return;
  let html = '<thead><tr><th>Question</th>' + segmentIds.map((id) => '<th>' + id + '</th>').join('') + '</tr></thead><tbody>';
  for (const section of sections) {
    const rows = questions.filter((q) => q.section === section.id);
    if (!rows.length) continue;
    html += '<tr class="section-row"><td colspan="10">' + escapeHtml(section.label) + '</td></tr>';
    for (const q of rows) {
      html += '<tr><td><span class="qid">' + q.id + '</span>' + escapeHtml(q.label) + '</td>';
      q.cells.forEach((cell, index) => {
        const dim = activeSegment !== 'all' && activeSegment !== segmentIds[index] ? ' dim' : '';
        html += '<td><span class="matrix-cell ' + cell.toLowerCase() + dim + '">' + cell + '</span></td>';
      });
      html += '</tr>';
    }
  }
  table.innerHTML = html + '</tbody>';
}
function renderProvocations() {
  const root = document.getElementById('provocationList');
  if (!root) return;
  const rows = provocations.filter((p) => activeSegment === 'all' || p.segments.includes('all') || p.segments.includes(activeSegment));
  root.innerHTML = rows.map((p) => '<article class="provocation-card"><h3>' + escapeHtml(p.name) + '</h3><p><code>' + escapeHtml(p.trigger) + '</code></p><p>' + p.segments.map(escapeHtml).join(', ') + '</p></article>').join('');
}
renderRules();
renderToolbar();
renderRoutePanel();
renderMatrix();
renderProvocations();`;
}

function copyAsset(from, toName) {
  if (!existsSync(from)) {
    console.warn(`Missing asset: ${from}`);
    return;
  }
  copyFileSync(from, join(assetsDir, toName));
}

function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(docsDir, { recursive: true });
  mkdirSync(assetsDir, { recursive: true });

  copyAsset(join(parentRoot, 'Lead Magnet App', 'flow-q1.1.png'), 'question-screen.png');
  copyAsset(join(parentRoot, 'Lead Magnet App', 'PHASE-C-summary-S3-urgency.png'), 'summary-screen.png');

  writeFileSync(join(outDir, 'site.css'), buildCss(), 'utf8');
  writeFileSync(join(outDir, 'app.js'), buildJs(), 'utf8');
  writeFileSync(join(outDir, 'index.html'), buildIndex(), 'utf8');

  for (const doc of docs) {
    if (!existsSync(doc.source)) {
      console.warn(`Missing doc: ${doc.source}`);
      continue;
    }
    writeFileSync(join(docsDir, `${doc.slug}.html`), buildDocPage(doc), 'utf8');
  }

  console.log(`Client review site written to ${outDir}`);
}

main();
