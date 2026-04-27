/**
 * Narrative content for PDF report pages 05, 07, 08.
 *
 * Page 08's CTA content comes from `content/segments/S[n]-*.md` — real authored
 * markdown (Headline / Body / Button / Helper / button_link). Parsed at SSG time.
 *
 * Pages 05 ("Where you are today") and 07 ("Silent gaps + Planner's read") have
 * no authored markdown yet — the per-segment narrative content lives INLINE here
 * as a placeholder layer. It's segment-keyed so each of the 9 reports renders
 * with representative copy. The intent is that a content author later migrates
 * this structure into markdown files and we swap the in-line maps for a markdown
 * loader (same pattern as tile-content).
 *
 * IMPORTANT: this is placeholder / working-draft prose. It's representative of
 * the final tone and structure but has NOT been through compliance review. Do
 * not ship to real clients until an author passes over each segment's content.
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { canPublishInProduction } from '../content/compliance';

// ---------------------------------------------------------------------------
// Page 08 — Segment CTA from content/segments/S[n]-*.md
// ---------------------------------------------------------------------------

export interface SegmentCta {
  headline: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  helper: string;
  /** `compliance_status` from segment markdown frontmatter, if present. */
  compliance_status?: string;
}

let _segmentCtaCache: Map<string, SegmentCta> | null = null;

function loadSegmentCtasOnce(): Map<string, SegmentCta> {
  if (_segmentCtaCache) return _segmentCtaCache;

  const out = new Map<string, SegmentCta>();
  const segmentsDir = path.join(process.cwd(), 'content', 'segments');
  if (!fs.existsSync(segmentsDir)) {
    _segmentCtaCache = out;
    return out;
  }

  const files = fs.readdirSync(segmentsDir).filter(f => /^S\d-.+\.md$/.test(f));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(segmentsDir, file), 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data as {
      id?: string;
      segment?: string;
      button_link?: string;
      compliance_status?: string;
    };

    const segmentId = fm.segment ?? fm.id;
    if (!segmentId || !/^S\d$/.test(segmentId)) continue;

    // Parse H1 sections from the body: `# Headline\nFoo\n\n# Body\nBar\n...`
    const body = parsed.content;
    const sections = new Map<string, string>();
    const sectionRe = /^# +(.+?)\s*$/gm;
    const matches = [...body.matchAll(sectionRe)];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const name = m[1].trim();
      const start = m.index! + m[0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
      sections.set(name, body.slice(start, end).trim());
    }

    const cta: SegmentCta = {
      headline: sections.get('Headline') ?? 'A first conversation.',
      body: sections.get('Body') ?? '',
      buttonLabel: sections.get('Button') ?? 'Book a call',
      buttonHref: fm.button_link
        ? (fm.button_link.startsWith('http') ? fm.button_link : `https://${fm.button_link}`)
        : 'https://calendly.com/realwealth/intro',
      helper: sections.get('Helper') ?? '',
      compliance_status: fm.compliance_status,
    };
    out.set(segmentId, cta);
  }

  _segmentCtaCache = out;
  return out;
}

/**
 * Load the per-segment CTA block (page 08). Returns null if segment file is
 * missing or unapproved in production. Callers fall back to a generic CTA.
 */
export function loadSegmentCta(segmentId: string): SegmentCta | null {
  const cta = loadSegmentCtasOnce().get(segmentId);
  if (!cta) return null;
  if (!canPublishInProduction(cta.compliance_status)) return null;
  return cta;
}

// ---------------------------------------------------------------------------
// Page 05 — Where you are today (placeholder narrative, segment-keyed)
// ---------------------------------------------------------------------------

export interface WhereYouAreContent {
  /** 2-paragraph opening reflection on the client's life stage. */
  openingParagraphs: string[];
  /** Pull-quote styled serif-italic teal — typically from Q2.4 happy-place. */
  pullQuote: string;
  /** Segment-tailored 1-paragraph closing position. */
  segmentClose: string;
}

const WHERE_YOU_ARE: Record<string, WhereYouAreContent> = {
  S1: {
    openingParagraphs: [
      'You\u2019re early in the long build. That\u2019s the honest headline — not behind, not ahead, just early. The things you\u2019re doing now are shaped more by habit than by numbers, and that\u2019s the right way round at your stage.',
      'From what you\u2019ve told us, you\u2019ve got the habits in motion: a pension ticking over, a little saved, the big spending stretches still ahead of you rather than behind. At 28, time is the single biggest lever you have, and you\u2019re already using it.',
    ],
    pullQuote: '\u201CTime for running and cooking. The basics sorted.\u201D',
    segmentClose: 'Our honest read: the things that move the dial for you now are small, repeated, boring — maximising the employer pension match, clearing any short-term debt before investing, keeping an emergency fund that covers three months. None of these are glamorous. All of them compound.',
  },
  S2: {
    openingParagraphs: [
      'You\u2019re in the decade where everything lands at once. Mortgage, kids, two careers trying to move forward together, parents getting older in the background. The money question at your stage is less about how much, and more about whether the shape of things is right for what you want next.',
      'From what you\u2019ve told us, you\u2019re broadly on track — a pension that\u2019s building, an ISA that\u2019s in use, a mortgage on a credible timeline. The gaps aren\u2019t gaping; they\u2019re specific. The planning question now is sequencing: what to do first, second, third, so time does the work for you.',
    ],
    pullQuote: '\u201CBreakfast on the porch, walking the dog, a quiet Sunday.\u201D',
    segmentClose: 'Our honest read: the three things that would change your numbers most — a small increase in pension contribution, a will and an LPA in place, a protection policy that isn\u2019t just the work group-life — are all documents and decisions, not markets-and-magic. They\u2019re the kind of thing a 30-minute conversation solves.',
  },
  S3: {
    openingParagraphs: [
      'You\u2019re in one of the most under-planned stages in UK wealth. Higher-rate taxpayer, a strong earning curve, not yet senior enough for the big tax structuring questions — and almost nobody tells you that the \u00a3100k trap is a real thing until you\u2019re in it.',
      'From what you\u2019ve told us, the income is doing the work. The pension is building. The ISA is in use. What usually gets missed at this stage isn\u2019t the investing — it\u2019s the structuring. Carry-forward, bed-and-ISA, spousal allowance, salary sacrifice. Small moves that stack.',
    ],
    pullQuote: '\u201CLong weekends, the kids settled, and time to read.\u201D',
    segmentClose: 'Our honest read: the £100k personal-allowance trap alone is worth a structured conversation every year. Carry-forward could close most of your contribution gap in one move. And the rental-property tax picture shifted materially under Section 24 — worth a second look.',
  },
  S4: {
    openingParagraphs: [
      'You\u2019re in the home straight of the accumulation phase, and the planning questions are changing. Not \u201chow do I build it\u201d any more — \u201chow do I protect it, extract it, and hand it on.\u201d',
      'From what you\u2019ve told us, the numbers work. The pension is well-funded, the mortgage is clearing on time, the estate is material. The interesting conversations at your stage are about structure, sequencing, and timing — when to crystallise, what to take first, and what shape the estate is in for the next generation.',
    ],
    pullQuote: '\u201CA long walk with the family after Sunday lunch.\u201D',
    segmentClose: 'Our honest read: the drawdown order question and the IHT question dominate from here. Both reward planning started 5+ years out. The 2027 pension-IHT rule change and the RNRB taper above \u00a32m both materially affect what you\u2019ll pass on, and both have options that close if you leave it too late.',
  },
  S5: {
    openingParagraphs: [
      'You\u2019re running a growing business and a personal balance sheet at the same time. The two compete for capital, attention, and tax reliefs — and the planning question nobody in the day-to-day asks you is: what does financial independence from the business look like?',
      'From what you\u2019ve told us, the business is doing well, and most of your net worth is currently inside it. That\u2019s normal at this stage, and not a problem in itself — but it\u2019s a concentration that warrants an active plan, not a passive one.',
    ],
    pullQuote: '\u201CSaturday in the garden with the kids.\u201D',
    segmentClose: 'Our honest read: employer pension contributions from your company are one of the most tax-efficient tools you have, and at your income level they tend to be underused. A 12-month review of the salary-dividend-pension extraction mix typically moves \u00a310\u201320,000 a year in personal tax alone.',
  },
  S6: {
    openingParagraphs: [
      'You\u2019re in the window where the single most valuable financial decision of your career is on the horizon — the sale of the business. Everything from the last 20 years of financial life reshapes around it, and almost nothing from the last 20 years directly prepares you for it.',
      'From what you\u2019ve told us, the exit is real and dated. That\u2019s rarer than you\u2019d think — most business owners don\u2019t have a written plan. You do. The planning questions now are entirely about structure: the shape of the deal, the BADR position, the pensions and ISAs full ahead of completion, the life after.',
    ],
    pullQuote: '\u201CA clean handover and time to sail.\u201D',
    segmentClose: 'Our honest read: most business sales take 18\u201324 months from decision to close, and the tax structure at the moment the contracts are signed determines hundreds of thousands of pounds of outcome. The two years before the exit are where the meaningful planning happens. The year after is mostly cleanup.',
  },
  S7: {
    openingParagraphs: [
      'You\u2019re 18\u201324 months from a transition most people spend a decade worrying about. The numbers look manageable. The questions shift from \u201cam I building enough\u201d to \u201cam I confident enough to stop.\u201d',
      'From what you\u2019ve told us, you\u2019re in the comfortable part of the readiness range. The pension is funded. The house is sorted. The big financial decisions from here are sequencing and confidence — the order you draw from, the income mix you want, the permission to actually spend it.',
    ],
    pullQuote: '\u201CA slow morning, coffee, and a long book.\u201D',
    segmentClose: 'Our honest read: the drawdown order question is the one that quietly costs people five figures a year at your stage — which pot to draw from first, and in what order, against the tax bands and the state-pension timing. Worth a conversation, because once you\u2019re two years into a drawdown pattern it\u2019s harder to change.',
  },
  S8: {
    openingParagraphs: [
      'You\u2019re drawing down. The plan that got you here is not the plan that keeps you here — and that\u2019s worth saying out loud. The investment question changes. The tax question changes. The estate question gets louder.',
      'From what you\u2019ve told us, the withdrawals are sustainable on current numbers, but \u201ccurrent numbers\u201d in retirement usually means \u201cfor now\u201d. Longevity, care, inflation, and the 2027 pension-IHT change are the four forces worth reviewing even when the daily picture looks settled.',
    ],
    pullQuote: '\u201CA quiet Sunday, the grandchildren visiting later.\u201D',
    segmentClose: 'Our honest read: a second-opinion pass at your drawdown plan every 3\u20135 years tends to find between 4 and 10 percentage points of avoidable tax, usually in the order-of-withdrawal decision. And the 2027 pension-IHT change is worth actively planning around — not panicking, but planning.',
  },
  S9: {
    openingParagraphs: [
      'You\u2019re in the part of wealth where the financial question and the family question become the same question. What happens to this estate, in what order, on whose authority, with what liability attached.',
      'From what you\u2019ve told us, the numbers are more than sufficient for any reasonable lifetime spend. The planning questions at your stage are almost entirely structural: trusts, timed gifting, Business Relief where it applies, the pension-IHT rule coming in 2027, and the RNRB taper that applies above \u00a32m.',
    ],
    pullQuote: '\u201CFamily Christmases at the cottage.\u201D',
    segmentClose: 'Our honest read: at this level of estate, the dominant financial cost your family will face is almost always IHT, not investment underperformance. Planning tools that take 7+ years to fully work (gifts, trusts) reward being started early. Starting the conversation in your 60s tends to change the outcome more than finishing it in your 80s.',
  },
};

export function getWhereYouAre(segmentId: string): WhereYouAreContent {
  return WHERE_YOU_ARE[segmentId] ?? WHERE_YOU_ARE.S2;
}

// ---------------------------------------------------------------------------
// Page 07 — Silent gaps + Planner's read (placeholder, segment-keyed)
// ---------------------------------------------------------------------------

export interface SilentGap {
  title: string;
  body: string;
}

export interface PlannersRead {
  insight: string;
  context: string;
  move: string;
}

export interface SilentGapsAndRead {
  gaps: SilentGap[];
  plannersRead: PlannersRead;
}

const SILENT_GAPS_AND_READ: Record<string, SilentGapsAndRead> = {
  S1: {
    gaps: [
      { title: 'Workplace pension opt-out', body: 'If you\u2019ve ever opted out to free up cash, re-enrolling is usually the best-return decision you can make — the employer match is free money you\u2019re leaving behind.' },
      { title: 'No LPA at 28 is fine — but the habit isn\u2019t', body: 'No rush at your stage, but building the habit of formal financial paperwork now is how people in their 40s end up with clean affairs rather than catch-up stress.' },
    ],
    plannersRead: {
      insight: 'The habit of saving is already in place. The shape of the habit matters more than the size — automation beats willpower at every stage, especially yours.',
      context: 'Early-career compounding is the one financial superpower you will ever have that you cannot buy back later. A 3% contribution increase now is worth more than every investment decision you\u2019ll make in your 40s combined.',
      move: 'Automate a 3% pension contribution uplift to trigger on your next pay rise. You won\u2019t notice the cash; the graph will.',
    },
  },
  S2: {
    gaps: [
      { title: 'Group life cover ends with the job', body: 'Most workplace life cover is 4x salary and stops the day you leave. With a mortgage and dependants, a personal policy at your stage is one of the cheapest protection decisions you\u2019ll make.' },
      { title: 'Couples\u2019 allowance-splitting', body: 'The way household assets split between you and your partner can keep more of your returns out of higher tax brackets — it\u2019s a paperwork exercise, not an investment one.' },
      { title: 'Will currency', body: 'A will written before the kids arrived tends to read differently when they\u2019re school-age. Worth a 15-minute review, not a re-draft.' },
    ],
    plannersRead: {
      insight: 'The shape of your finances is right for the stage; the gaps are all documents and protections, not numbers.',
      context: 'Single-earner households with dependants and a mortgage sit in one of the highest-consequence protection gaps in UK financial planning. The right cover typically costs \u00a330\u201360 a month for someone your age.',
      move: 'Get an independent protection review alongside the pension conversation — same meeting, same planner. The two usually inform each other.',
    },
  },
  S3: {
    gaps: [
      { title: 'Section 24 rental-mortgage interest', body: 'The rules on deducting mortgage interest from rental income changed materially after 2015. Most portfolio landlords we meet are still working off the old picture.' },
      { title: 'VCT/EIS for higher-rate taxpayers', body: 'Not for everyone, but once standard pension allowances are tapered, the alternative tax reliefs designed for high earners usually become relevant to review.' },
      { title: 'Unused annual allowance from previous tax years', body: 'Pension carry-forward lets you bring forward up to three years of unused allowance. In a good year, it\u2019s often the single most valuable single decision available.' },
    ],
    plannersRead: {
      insight: 'The income is doing the work. The structuring is the lever that moves your numbers most — and it\u2019s the one almost nobody at your stage actively manages.',
      context: 'At the £100k\u2013£125,140 band, the effective marginal rate sits around 60%. Every £1,000 of pension contribution in that band saves \u00a3600 of tax. Most higher-earners don\u2019t realise this is how the maths works.',
      move: 'Run a carry-forward calculation and a 100k-trap projection before the end of the tax year — not after. Both are time-bound.',
    },
  },
  S4: {
    gaps: [
      { title: 'RNRB taper above \u00a32m', body: 'The residence nil-rate band tapers away once the estate crosses \u00a32m. At your estate size, this is live and specific — not hypothetical.' },
      { title: 'Pension-IHT rule change (April 2027)', body: 'Unused pension wealth is set to count as part of the estate for IHT from April 2027. This materially changes the order-of-drawdown calculation for the next few years.' },
      { title: 'Tapered annual allowance', body: 'Above \u00a3260k adjusted income, the annual allowance tapers. Below \u00a3200k, it does not. Most people in this band are quietly inside the taper and don\u2019t know it.' },
    ],
    plannersRead: {
      insight: 'The accumulation work is done. The planning conversation now is structure, timing, and legacy — three questions that compound if started early and hurt if left late.',
      context: 'Clients in your segment who start serious IHT planning 5+ years before retirement typically preserve 15\u201325% more for the next generation than those who start in their 70s. The tools reward runway.',
      move: 'A full structural review — drawdown order, IHT trajectory, extraction mix, pension protection — is worth the 90 minutes at your stage. It\u2019s the meeting that shapes the next decade.',
    },
  },
  S5: {
    gaps: [
      { title: 'Employer pension contributions from the company', body: 'One of the most tax-efficient levers business owners have. Often underused at your stage because the company is still retaining cash for growth — worth re-reviewing every year.' },
      { title: 'Spouse on the payroll (or as a shareholder)', body: 'If your partner is involved in the business, the extraction mix changes materially. If they\u2019re not but could be, it\u2019s often worth a structured look.' },
      { title: 'Business Relief for IHT', body: 'A qualifying trading business attracts 100% Business Relief — but the rules are strict and the exit strategy matters. Start the conversation long before the exit, not during.' },
    ],
    plannersRead: {
      insight: 'Your financial independence is tied to the business performing. Building personal wealth alongside the business is the real planning goal — not growing the business harder.',
      context: 'Business owners at your stage who actively build personal wealth outside the business (pensions, ISAs, diversified investments) typically sell with 40\u201360% more net worth in the bank than those who don\u2019t. The difference is not the business — it\u2019s the parallel plan.',
      move: 'A quarterly review of the extraction mix, against the Budget changes, at your accountant\u2019s office. Bring a financial planner. They talk to each other.',
    },
  },
  S6: {
    gaps: [
      { title: 'BADR rate transition', body: 'Business Asset Disposal Relief is set to change. The specific date the contracts are signed materially affects the final tax outcome — by hundreds of thousands in some cases.' },
      { title: 'Pension contributions before completion', body: 'Final employer pension contributions from the company before the sale can shelter significant proceeds. The window is short and worth using.' },
      { title: 'Post-exit liquidity plan', body: 'Clients tell us they underestimate how much the post-sale liquidity event changes decision-making. Having a plan for the proceeds before the money hits the account saves a surprising amount of mistake.' },
    ],
    plannersRead: {
      insight: 'The exit is the financial event of your career. The two years around it — one before, one after — reward more planning per pound than any other window you\u2019ll ever have.',
      context: 'Most business owners we work with through an exit find that the tax and structuring decisions in the six months before completion are where 80% of the long-term difference is made. The deal itself matters; the structure of the deal matters more.',
      move: 'If you don\u2019t have both a pre-exit tax plan and a post-exit wealth plan, we\u2019d do them together before contracts are signed. This is the defining planning meeting of the next two years.',
    },
  },
  S7: {
    gaps: [
      { title: 'Defer-or-claim state pension', body: 'The decision at age 67 to claim or defer the state pension looks simple and isn\u2019t. The maths depends on your tax band, other income timing, and expected longevity.' },
      { title: 'ISA order in drawdown', body: 'Conventional wisdom says draw ISAs first, pensions later. From 2027, that wisdom changes for many clients because of the pension-IHT rule. Worth revisiting.' },
      { title: 'Partner\u2019s pension alignment', body: 'Household planning tends to beat individual planning at your stage. The order of withdrawals across two pots can materially reduce the lifetime tax bill.' },
    ],
    plannersRead: {
      insight: 'The accumulation is done. The next two years shape the next 25 — and the decisions you make now about drawdown order are hard to reverse later.',
      context: 'Clients entering drawdown typically review their plan every 3\u20135 years. The initial setup matters disproportionately because changing a drawdown pattern mid-retirement can trigger tax events that weren\u2019t obvious at the start.',
      move: 'A full drawdown-order model for both of you, run against the 2027 pension-IHT change, before the state-pension decision at 67. Worth doing now, not later.',
    },
  },
  S8: {
    gaps: [
      { title: 'Care-fee planning', body: 'Not because it will happen, but because the financial products that cap care-cost liability are most effective when set up before the need arises, not during.' },
      { title: 'Pension-IHT (April 2027)', body: 'From April 2027, unused pension wealth may form part of the estate. Worth a structural review of drawdown rate against estate size, this year.' },
      { title: 'LPA urgency', body: 'A Lasting Power of Attorney takes 6+ months via the Court of Protection route if something happens without one in place. The earlier it\u2019s set up, the less it matters that it was.' },
    ],
    plannersRead: {
      insight: 'The plan is working. The risk at this stage isn\u2019t the numbers — it\u2019s the unmodelled events (longevity, care, rule changes) that a regular review catches early.',
      context: 'Clients in drawdown for 5+ years typically find that a second-opinion review surfaces one or two structural tweaks worth between 0.5% and 1.5% of the pot per year. Compounded across a 20-year retirement, that\u2019s meaningful.',
      move: 'A second-opinion review against the 2027 pension-IHT change and your current care-risk exposure. 30 minutes, at no cost, for confidence the plan still fits.',
    },
  },
  S9: {
    gaps: [
      { title: 'Pension as IHT shelter (until 2027)', body: 'Unused pension wealth sits outside the estate for IHT purposes until April 2027. The drawdown order for the next three years is a material planning decision at your estate size.' },
      { title: 'Gifting strategy + 7-year clock', body: 'Gifts outside the \u00a33k annual exemption start a 7-year clock. At your estate size, structured gifting tends to be the single most valuable IHT-mitigation lever — and it rewards starting early.' },
      { title: 'Family investment company / trust structures', body: 'Not the right answer for everyone, but at your estate size these structures are worth a genuine evaluation. Getting them wrong is expensive; getting them right is materially better than not having them.' },
    ],
    plannersRead: {
      insight: 'The wealth is more than sufficient. The planning conversation is almost entirely about legacy and structure — and both reward starting the work a decade before it\u2019s needed.',
      context: 'At estates above \u00a35m, IHT is typically the single largest financial cost the next generation will face. Planning tools that take 7+ years to work fully (gifts, trusts, Business Relief) often move the outcome by 30\u201350%.',
      move: 'A structural IHT and legacy review, with the family in the room for at least part of it. The plan is only as good as the understanding of the people who will inherit the decisions.',
    },
  },
};

export function getSilentGapsAndRead(segmentId: string): SilentGapsAndRead {
  return SILENT_GAPS_AND_READ[segmentId] ?? SILENT_GAPS_AND_READ.S2;
}
