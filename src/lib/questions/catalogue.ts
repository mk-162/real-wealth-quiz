/**
 * Question catalogue — the 35-question library from
 * Question Design Options.md §6 (Tier A).
 *
 * Shorter tiers (B, C) are derived by filtering this catalogue; they are not
 * separate data. Add questions here, never in the rules file.
 *
 * Copy is taken verbatim from Question Design Options.md. Do not rewrite
 * question stems without a voice-and-tone review.
 */
import type { QuestionId } from '../segmentation/types';

export type QuestionInputType =
  | 'card_select'
  | 'radio'
  | 'multi_select'
  | 'slider'
  | 'numeric'
  | 'short_text'
  | 'likert_5';

export type QuestionSection =
  | 'set_the_tone'
  | 'life_shape'
  | 'money_today'
  | 'assets'
  | 'business'
  | 'people_and_legacy'
  | 'retirement_horizon'
  | 'protection'
  | 'advice_today'
  | 'priorities';

export interface Option {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: QuestionId;
  section: QuestionSection;
  stem: string; /* Shown in the serif question face */
  micro?: string; /* Optional one-line helper below the stem */
  input: QuestionInputType;
  options?: Option[]; /* Radio / card_select / multi_select only */
  sensitive?: boolean; /* Adds the "Skip if you'd rather" micro-copy */
}

/**
 * The catalogue. Keep ids stable — they are the data contract with the
 * provocation library and any future Compass export.
 */
export const questions: Question[] = [
  /* Section 1 — Set the tone ---------------------------------------- */
  {
    id: 'Q1.1',
    section: 'set_the_tone',
    stem: 'What brought you here today?',
    input: 'card_select',
    options: [
      { value: 'curious', label: 'Curious to see what comes up' },
      { value: 'specific', label: 'Specific question in mind' },
      { value: 'life_change', label: 'A life change coming up' },
      { value: 'on_track', label: "Checking I'm on track" },
      { value: 'suggested', label: 'Partner or adviser suggested it' },
    ],
  },
  {
    id: 'Q1.2',
    section: 'set_the_tone',
    stem: 'When you picture a life that feels genuinely wealthy to you, what best captures it?',
    input: 'card_select',
    options: [
      { value: 'freedom_time', label: 'Freedom over my time' },
      { value: 'security_family', label: 'Security for my family' },
      { value: 'choice_work', label: 'Choice in how I work' },
      { value: 'experiences', label: 'Experiences and travel' },
      { value: 'legacy', label: 'Legacy and impact' },
      { value: 'peace', label: 'Peace of mind' },
      { value: 'other', label: 'Other — tell us' },
    ],
  },

  /* Section 2 — Life shape ------------------------------------------ */
  {
    id: 'Q2.1',
    section: 'life_shape',
    stem: 'How old are you?',
    input: 'slider',
  },
  {
    id: 'Q2.2',
    section: 'life_shape',
    stem: 'Who else is part of the plan?',
    input: 'multi_select',
    options: [
      { value: 'partner', label: 'A partner' },
      { value: 'dependent_children', label: 'Dependent children' },
      { value: 'adult_children', label: 'Adult children' },
      {
        value: 'elderly_parent',
        label: 'An elderly parent or relative we support',
      },
      { value: 'solo', label: "Nobody else — it's just me" },
    ],
  },
  {
    id: 'Q2.3',
    section: 'life_shape',
    stem: 'How would you describe your working life right now?',
    input: 'radio',
    options: [
      { value: 'employed', label: 'Employed' },
      { value: 'self_employed', label: 'Self-employed' },
      { value: 'business_owner', label: 'Business owner' },
      { value: 'partly_retired', label: 'Partly retired — still working some' },
      { value: 'fully_retired', label: 'Fully retired' },
      { value: 'between_roles', label: 'Between roles or taking a break' },
    ],
  },
  {
    id: 'Q2.4',
    section: 'life_shape',
    stem: 'Describe your ideal normal week. Not a holiday — just your ordinary life at its best.',
    micro:
      'e.g. "Mornings outside, lunch with my wife, the grandchildren round on Sundays, no work after four."',
    input: 'short_text',
  },

  /* Section 3 — Money today ---------------------------------------- */
  {
    id: 'Q3.1',
    section: 'money_today',
    stem: "Roughly what is your household's income, before tax, per year?",
    input: 'radio',
    options: [
      { value: 'lt50k', label: 'Under £50,000' },
      { value: '50to100k', label: '£50,000 — £100,000' },
      { value: '100to125k', label: '£100,000 — £125,000' },
      { value: '125to200k', label: '£125,000 — £200,000' },
      { value: 'gt200k', label: 'Over £200,000' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'Q3.2',
    section: 'money_today',
    stem: 'Roughly what does your household spend each month on the essentials?',
    micro: 'Mortgage or rent, bills, food, transport, childcare.',
    input: 'radio',
    options: [
      { value: 'lt2k', label: 'Under £2,000' },
      { value: '2to3_5k', label: '£2,000 — £3,500' },
      { value: '3_5to5k', label: '£3,500 — £5,000' },
      { value: '5to7_5k', label: '£5,000 — £7,500' },
      { value: '7_5to12k', label: '£7,500 — £12,000' },
      { value: 'gt12k', label: 'Over £12,000' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'Q3.4',
    section: 'money_today',
    stem: "How confident are you that you're saving enough to fund the life you want?",
    input: 'likert_5',
  },
  {
    id: 'Q3.5',
    section: 'money_today',
    stem: 'When you think about money, which feels closest?',
    input: 'card_select',
    sensitive: true,
    options: [
      { value: 'tool_freedom', label: 'A tool for freedom' },
      { value: 'security', label: 'Security for the people I love' },
      {
        value: 'rather_not',
        label: "Something I'd rather not think about too much",
      },
      { value: 'scorecard', label: "A scorecard of what I've built" },
      { value: 'stress', label: 'A source of stress' },
      { value: 'neutral', label: 'Not something I have strong feelings about' },
    ],
  },

  /* Section 4 — Assets --------------------------------------------- */
  {
    id: 'Q4.3',
    section: 'assets',
    stem: 'Roughly how many separate pension pots do you have across your career so far?',
    input: 'radio',
    options: [
      { value: 'none', label: 'None' },
      { value: 'one', label: 'One' },
      { value: 'two_three', label: 'Two or three' },
      { value: 'four_six', label: 'Four to six' },
      { value: 'more', label: 'More than six' },
      { value: 'no_idea', label: 'I genuinely have no idea' },
    ],
  },
  {
    id: 'Q4.4',
    section: 'assets',
    stem: "Outside of pensions and property, roughly what's the combined value of your savings and investments?",
    micro: 'ISAs, general investments, cash in the bank.',
    input: 'radio',
    options: [
      { value: 'lt50k', label: 'Under £50,000' },
      { value: '50to250k', label: '£50,000 — £250,000' },
      { value: '250k_1m', label: '£250,000 — £1m' },
      { value: '1m_3m', label: '£1m — £3m' },
      { value: 'gt3m', label: 'Over £3m' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'Q4.5',
    section: 'assets',
    stem: 'If you added everything up — home, pensions, investments, business — where would your total estate sit?',
    input: 'radio',
    options: [
      { value: 'lt500k', label: 'Under £500,000' },
      { value: '500k_to_1m', label: '£500,000 — £1m' },
      { value: '1m_to_2m', label: '£1m — £2m' },
      { value: '2m_to_3m', label: '£2m — £3m' },
      { value: '3m_to_5m', label: '£3m — £5m' },
      { value: 'gt5m', label: 'Over £5m' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },

  /* Section 5 — Business (conditional) ----------------------------- */
  {
    id: 'Q5.2',
    section: 'business',
    stem: 'How are you currently taking money out of the business?',
    input: 'multi_select',
    options: [
      { value: 'salary', label: 'Salary' },
      { value: 'dividends', label: 'Dividends' },
      { value: 'pension', label: 'Employer pension contributions' },
      { value: 'directors_loan', label: "Director's loan" },
      { value: 'leave_in', label: 'I leave it in the business' },
      { value: 'accountant', label: "My accountant handles it — I'm not sure" },
    ],
  },
  {
    id: 'Q5.3',
    section: 'business',
    stem: 'When you think about what happens to the business next, which feels closest?',
    input: 'card_select',
    options: [
      { value: 'documented', label: 'Documented plan, reviewed recently' },
      { value: 'informal', label: "Informal plan, we've talked about it" },
      {
        value: 'no_plan_thinking',
        label: "No plan — but I've been thinking about it",
      },
      { value: 'no_plan_low', label: "No plan — and it's not a priority" },
      { value: 'exit_5', label: 'I want out in the next 5 years' },
      { value: 'never', label: "I'll never leave until I have to" },
    ],
  },

  /* Section 6 — People and legacy ---------------------------------- */
  {
    id: 'Q6.2',
    section: 'people_and_legacy',
    stem: "When you think about what you'd want to pass on, which feels closest?",
    input: 'card_select',
    options: [
      { value: 'max_family', label: 'As much as possible to family' },
      {
        value: 'boost',
        label: 'Enough to give them a boost, not a free ride',
      },
      { value: 'experiences', label: 'Experiences and memories more than money' },
      { value: 'charity', label: 'A charity or cause matters to me' },
      { value: 'not_thought', label: "I haven't thought about it much yet" },
      {
        value: 'complicated',
        label: "It's complicated — I need help thinking about this",
      },
    ],
  },
  {
    id: 'Q6.3',
    section: 'people_and_legacy',
    stem: 'Which of these do you currently have in place?',
    input: 'multi_select',
    options: [
      { value: 'will_fresh', label: 'A will, reviewed in the last 2 years' },
      { value: 'will_old', label: 'A will, older than that' },
      { value: 'no_will', label: 'No will' },
      { value: 'lpa_health', label: 'Lasting Power of Attorney (health)' },
      { value: 'lpa_finance', label: 'Lasting Power of Attorney (finance)' },
      { value: 'lpa_unsure', label: 'Not sure what LPA is' },
    ],
  },

  /* Section 7 — Retirement horizon --------------------------------- */
  {
    id: 'Q7.1',
    section: 'retirement_horizon',
    stem: 'At what age would you ideally stop needing to work for money?',
    input: 'slider',
  },
  {
    id: 'Q7.2',
    section: 'retirement_horizon',
    stem: "When you picture not working, what's the first feeling that comes up?",
    input: 'card_select',
    options: [
      { value: 'cant_wait', label: "Can't wait" },
      { value: 'mixed', label: 'A mix of excitement and worry' },
      {
        value: 'uneasy',
        label: "A bit uneasy — I don't know who I am without work",
      },
      { value: 'hard', label: "Hard to imagine — I'll never fully stop" },
      { value: 'already_good', label: "I'm already there and it's good" },
      {
        value: 'already_less',
        label: "I'm already there and it's less than I hoped",
      },
    ],
  },

  /* Section 10 — Priorities ---------------------------------------- */
  {
    id: 'Q10.1',
    section: 'priorities',
    stem: 'If you had to choose, which would you lean towards?',
    input: 'card_select',
    options: [
      { value: 'enjoy_now', label: 'Enjoy more now' },
      { value: 'retire_earlier', label: 'Retire earlier' },
      { value: 'leave_family', label: 'Leave more to family' },
      { value: 'spend_us', label: 'Spend more on us' },
      { value: 'simplify', label: 'Simplify my life' },
      { value: 'grow_pot', label: 'Grow the pot' },
    ],
  },
  {
    id: 'Q10.2',
    section: 'priorities',
    stem: 'If you could only tackle one financial area in the next 12 months, which would matter most?',
    input: 'radio',
    options: [
      { value: 'one_picture', label: 'Pull everything into one picture' },
      { value: 'tax', label: 'Reduce my tax' },
      { value: 'retirement', label: 'Sort retirement properly' },
      { value: 'estate', label: 'Sort the estate / what happens next' },
      { value: 'protect', label: 'Protect my family' },
      { value: 'exit', label: 'Plan the exit from my business' },
      { value: 'dont_know', label: "I don't know — that's why I'm here" },
    ],
  },
  {
    id: 'Q10.3',
    section: 'priorities',
    stem: 'And when would you ideally want to have this conversation?',
    input: 'radio',
    options: [
      { value: 'this_week', label: 'This week' },
      { value: 'within_month', label: 'Within a month' },
      { value: 'within_3m', label: 'Within three months' },
      { value: 'this_year', label: 'Sometime this year' },
      { value: 'exploring', label: 'Not sure yet — just exploring' },
    ],
  },
];

/** Lookup helper — used by the engine and by the UI. */
export function questionById(id: QuestionId): Question | undefined {
  return questions.find((q) => q.id === id);
}
