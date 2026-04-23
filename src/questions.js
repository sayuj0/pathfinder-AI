const INTEREST_QUESTIONS = [
  { text: 'I enjoy fixing mechanical problems with tools and equipment.', category: 'interest', type: 'R' },
  { text: 'I like work where I build or install things with my hands.', category: 'interest', type: 'R' },
  { text: 'I prefer practical tasks over long planning discussions.', category: 'interest', type: 'R' },
  { text: 'I like troubleshooting physical systems to get them working again.', category: 'interest', type: 'R' },
  { text: 'I enjoy jobs with visible, concrete results at the end of the day.', category: 'interest', type: 'R' },
  { text: 'I would choose active field work over mostly desk work.', category: 'interest', type: 'R' },

  { text: 'I enjoy analyzing data to find patterns and insights.', category: 'interest', type: 'I' },
  { text: 'I like solving complex problems with logic and evidence.', category: 'interest', type: 'I' },
  { text: 'I enjoy research tasks where answers are not obvious at first.', category: 'interest', type: 'I' },
  { text: 'I like testing ideas to see whether they are true or false.', category: 'interest', type: 'I' },
  { text: 'I enjoy technical work that requires deep focus and reasoning.', category: 'interest', type: 'I' },
  { text: 'I like understanding how systems work under the surface.', category: 'interest', type: 'I' },

  { text: 'I enjoy creating original visual or written content.', category: 'interest', type: 'A' },
  { text: 'I like experimenting with style and presentation to express ideas.', category: 'interest', type: 'A' },
  { text: 'I enjoy work that gives freedom to be imaginative.', category: 'interest', type: 'A' },
  { text: 'I like translating abstract ideas into creative output.', category: 'interest', type: 'A' },
  { text: 'I enjoy making design choices that shape how people feel.', category: 'interest', type: 'A' },
  { text: 'I prefer projects where originality is valued over strict rules.', category: 'interest', type: 'A' },

  { text: 'I enjoy helping people through personal or practical problems.', category: 'interest', type: 'S' },
  { text: 'I like work where empathy and listening are important.', category: 'interest', type: 'S' },
  { text: 'I enjoy teaching, mentoring, or coaching others.', category: 'interest', type: 'S' },
  { text: "I feel energized when my work improves someone else's life.", category: 'interest', type: 'S' },
  { text: 'I enjoy roles that involve regular person-to-person support.', category: 'interest', type: 'S' },
  { text: 'I like collaborative work focused on people and community impact.', category: 'interest', type: 'S' },

  { text: 'I enjoy leading teams toward ambitious goals.', category: 'interest', type: 'E' },
  { text: 'I like persuading others to support an idea or plan.', category: 'interest', type: 'E' },
  { text: 'I enjoy taking ownership of outcomes and decisions.', category: 'interest', type: 'E' },
  { text: 'I like competitive environments where performance matters.', category: 'interest', type: 'E' },
  { text: 'I enjoy pitching, presenting, and negotiating.', category: 'interest', type: 'E' },
  { text: 'I feel comfortable being accountable for business results.', category: 'interest', type: 'E' },

  { text: 'I enjoy organizing information and keeping systems tidy.', category: 'interest', type: 'C' },
  { text: 'I like clear procedures, checklists, and standards.', category: 'interest', type: 'C' },
  { text: 'I enjoy work that requires careful accuracy and follow-through.', category: 'interest', type: 'C' },
  { text: 'I like planning schedules and coordinating details.', category: 'interest', type: 'C' },
  { text: 'I prefer predictable workflows over constant ambiguity.', category: 'interest', type: 'C' },
  { text: 'I enjoy improving processes so fewer mistakes happen.', category: 'interest', type: 'C' }
];

const WORK_STYLE_QUESTIONS = [
  {
    text: 'I prefer working with a team rather than working mostly alone.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'team_orientation'
  },
  {
    text: 'I like frequent collaboration during the workday.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'team_orientation'
  },
  {
    text: 'I am more productive when I can bounce ideas off others.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'team_orientation'
  },
  {
    text: 'I prefer shared responsibility over fully independent tasks.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'team_orientation'
  },
  {
    text: 'I enjoy regular meetings that align people on next steps.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'team_orientation'
  },
  {
    text: 'I like roles where communication with others is constant.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'team_orientation'
  },

  {
    text: 'I prefer variety in tasks rather than doing the same routine each day.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'variety_preference'
  },
  {
    text: 'I enjoy switching between different kinds of problems.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'variety_preference'
  },
  {
    text: 'I get bored when work is too repetitive.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'variety_preference'
  },
  {
    text: 'I like fast-changing work environments with new challenges.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'variety_preference'
  },
  {
    text: 'I enjoy jobs where priorities can shift during the week.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'variety_preference'
  },
  {
    text: 'I prefer dynamic projects over fixed, repetitive workflows.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'variety_preference'
  },

  {
    text: 'I stay effective even when deadlines are tight.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'pressure_tolerance'
  },
  {
    text: 'I am comfortable making decisions under pressure.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'pressure_tolerance'
  },
  {
    text: 'High-stakes situations usually bring out my best work.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'pressure_tolerance'
  },
  {
    text: 'I can manage stress without losing focus.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'pressure_tolerance'
  },
  {
    text: 'I am comfortable with roles that carry high responsibility.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'pressure_tolerance'
  },
  {
    text: 'I can maintain quality when pace and expectations are high.',
    category: 'work_style',
    traitGroup: 'work_style',
    trait: 'pressure_tolerance'
  }
];

const CONSTRAINT_QUESTIONS = [
  {
    text: 'I am open to spending many years in education for the right career.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'education_length'
  },
  {
    text: 'I am willing to complete advanced training if it improves career fit.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'education_length'
  },
  {
    text: 'Long-term study requirements would not stop me from a career I want.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'education_length'
  },
  {
    text: 'I am comfortable delaying full-time income to pursue higher qualifications.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'education_length'
  },
  {
    text: 'I prefer careers with shorter training paths.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'education_length',
    reverse: true
  },

  {
    text: 'High salary is a top priority in my career choice.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'salary_priority'
  },
  {
    text: 'I would choose a higher-paying role even if the work is tougher.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'salary_priority'
  },
  {
    text: 'Income growth is one of my main decision factors.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'salary_priority'
  },
  {
    text: 'I am willing to trade flexibility for stronger compensation.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'salary_priority'
  },
  {
    text: 'Meaningful work matters more to me than salary.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'salary_priority',
    reverse: true
  },

  {
    text: 'I prefer working on-site rather than fully remote.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'onsite_preference'
  },
  {
    text: 'I like being physically present where the work happens.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'onsite_preference'
  },
  {
    text: 'I work better when I can interact face-to-face in person.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'onsite_preference'
  },
  {
    text: 'I prefer remote work over on-site work.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'onsite_preference',
    reverse: true
  },

  {
    text: 'I want a career with regular interaction with people.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'people_facing_preference'
  },
  {
    text: 'I prefer jobs where communication is a major part of the day.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'people_facing_preference'
  },
  {
    text: 'I would rather work directly with people than mostly with systems.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'people_facing_preference'
  },
  {
    text: 'I prefer low-interaction roles with minimal people contact.',
    category: 'constraint',
    traitGroup: 'constraint',
    trait: 'people_facing_preference',
    reverse: true
  }
];

const DISAMBIGUATION_QUESTIONS = [
  {
    text: 'I would rather ship features for users than run long experiments.',
    category: 'disambiguation',
    traitGroup: 'work_style',
    trait: 'variety_preference',
    targets: ['Software Engineer', 'Researcher', 'Product Manager']
  },
  {
    text: 'I would rather investigate open-ended questions than manage product deadlines.',
    category: 'disambiguation',
    type: 'I',
    targets: ['Researcher', 'Software Engineer', 'Product Manager']
  },
  {
    text: 'I would rather define roadmap priorities than write most of the implementation code.',
    category: 'disambiguation',
    type: 'E',
    targets: ['Product Manager', 'Software Engineer', 'Data Scientist']
  },
  {
    text: 'I would rather analyze data deeply than present strategy to stakeholders.',
    category: 'disambiguation',
    type: 'I',
    targets: ['Data Scientist', 'Marketing Manager', 'Product Manager']
  },
  {
    text: 'I would rather counsel individuals than coordinate large projects.',
    category: 'disambiguation',
    type: 'S',
    targets: ['Therapist', 'Counselor', 'Operations Manager']
  },
  {
    text: 'I would rather lead business growth than specialize in technical analysis.',
    category: 'disambiguation',
    type: 'E',
    targets: ['Business Development Manager', 'Data Scientist', 'Financial Analyst']
  },
  {
    text: 'I would rather work in patient care than in laboratory or data-focused research.',
    category: 'disambiguation',
    type: 'S',
    targets: ['Doctor', 'Nurse', 'Researcher']
  },
  {
    text: 'I would rather solve cybersecurity risks than design user-facing product features.',
    category: 'disambiguation',
    type: 'I',
    targets: ['Cybersecurity Analyst', 'Software Engineer', 'Product Manager']
  },
  {
    text: 'I would rather create communication campaigns than optimize internal operations.',
    category: 'disambiguation',
    type: 'A',
    targets: ['Marketing Manager', 'Brand Strategist', 'Operations Manager']
  },
  {
    text: 'I would rather improve systems and process quality than pursue aggressive sales targets.',
    category: 'disambiguation',
    type: 'C',
    targets: ['Compliance Specialist', 'Data Operations Analyst', 'Sales Specialist']
  },
  {
    text: 'I would rather teach and mentor people than work mostly with technical systems.',
    category: 'disambiguation',
    type: 'S',
    targets: ['Teacher', 'Software Engineer', 'Data Scientist']
  },
  {
    text: 'I would rather build technical expertise than manage people and budgets.',
    category: 'disambiguation',
    type: 'I',
    targets: ['Software Engineer', 'Researcher', 'Operations Manager']
  }
];

function withIds(rawQuestions, startId) {
  return rawQuestions.map((question, index) => ({
    id: startId + index,
    ...question
  }));
}

const interestQuestions = withIds(INTEREST_QUESTIONS, 1);
const workStyleQuestions = withIds(WORK_STYLE_QUESTIONS, interestQuestions.length + 1);
const constraintQuestions = withIds(CONSTRAINT_QUESTIONS, interestQuestions.length + workStyleQuestions.length + 1);
const disambiguationQuestions = withIds(
  DISAMBIGUATION_QUESTIONS,
  interestQuestions.length + workStyleQuestions.length + constraintQuestions.length + 1
);

export const QUESTIONS = [
  ...interestQuestions,
  ...workStyleQuestions,
  ...constraintQuestions,
  ...disambiguationQuestions
];

export const WORK_STYLE_TRAITS = ['team_orientation', 'variety_preference', 'pressure_tolerance'];
export const CONSTRAINT_TRAITS = [
  'education_length',
  'salary_priority',
  'onsite_preference',
  'people_facing_preference'
];
export const DISAMBIGUATION_CATEGORY = 'disambiguation';
