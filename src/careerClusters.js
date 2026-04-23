const POSITION_WEIGHTS = [1, 0.78, 0.6];
const VALID_RIASEC_CODES = ['R', 'I', 'A', 'S', 'E', 'C'];

const WORK_STYLE_TRAITS = ['team_orientation', 'variety_preference', 'pressure_tolerance'];
const CONSTRAINT_TRAITS = [
  'education_length',
  'salary_priority',
  'onsite_preference',
  'people_facing_preference'
];

const DEFAULT_PROFILE = {
  riasecMeans: { R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 },
  workStyleMeans: {
    team_orientation: 3,
    variety_preference: 3,
    pressure_tolerance: 3
  },
  constraintMeans: {
    education_length: 3,
    salary_priority: 3,
    onsite_preference: 3,
    people_facing_preference: 3
  }
};

const WEIGHT_PROFILES = [
  { id: 'balanced_v1', riasec: 0.55, workStyle: 0.25, constraint: 0.2 },
  { id: 'riasec_heavy_v1', riasec: 0.65, workStyle: 0.2, constraint: 0.15 },
  { id: 'work_style_focus_v1', riasec: 0.45, workStyle: 0.35, constraint: 0.2 },
  { id: 'constraint_focus_v1', riasec: 0.45, workStyle: 0.2, constraint: 0.35 }
];

const METRICS_STORAGE_KEY = 'pathfinder_metrics_v2';

function makeCareer(title, riasec, workStyle, constraints) {
  return { title, riasec, workStyle, constraints };
}

const CAREERS_BY_PRIMARY_TYPE = {
  R: [
    makeCareer('Mechanical Technician', ['R', 'I', 'C'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 2, salary_priority: 3, onsite_preference: 5, people_facing_preference: 2 }),
    makeCareer('Electrician', ['R', 'I', 'C'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 4 }, { education_length: 2, salary_priority: 4, onsite_preference: 5, people_facing_preference: 2 }),
    makeCareer('Field Service Technician', ['R', 'I', 'C'], { team_orientation: 3, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 2, salary_priority: 3, onsite_preference: 5, people_facing_preference: 3 }),
    makeCareer('Construction Supervisor', ['R', 'E', 'C'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 3, salary_priority: 4, onsite_preference: 5, people_facing_preference: 4 }),
    makeCareer('Emergency Responder', ['R', 'S', 'E'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 5 }, { education_length: 2, salary_priority: 3, onsite_preference: 5, people_facing_preference: 4 }),
    makeCareer('Logistics Technician', ['R', 'C', 'E'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 2, salary_priority: 3, onsite_preference: 4, people_facing_preference: 2 })
  ],
  I: [
    makeCareer('Data Scientist', ['I', 'C', 'R'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 4, salary_priority: 5, onsite_preference: 2, people_facing_preference: 2 }),
    makeCareer('Software Engineer', ['I', 'C', 'R'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 3, salary_priority: 5, onsite_preference: 2, people_facing_preference: 2 }),
    makeCareer('AI Engineer', ['I', 'C', 'R'], { team_orientation: 3, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 4, salary_priority: 5, onsite_preference: 2, people_facing_preference: 2 }),
    makeCareer('Cybersecurity Analyst', ['I', 'C', 'R'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 4 }, { education_length: 3, salary_priority: 4, onsite_preference: 3, people_facing_preference: 2 }),
    makeCareer('Researcher', ['I', 'A', 'R'], { team_orientation: 2, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 5, salary_priority: 3, onsite_preference: 3, people_facing_preference: 2 }),
    makeCareer('Environmental Scientist', ['I', 'R', 'S'], { team_orientation: 3, variety_preference: 4, pressure_tolerance: 3 }, { education_length: 4, salary_priority: 3, onsite_preference: 4, people_facing_preference: 3 })
  ],
  A: [
    makeCareer('Animator', ['A', 'I', 'C'], { team_orientation: 3, variety_preference: 4, pressure_tolerance: 3 }, { education_length: 3, salary_priority: 3, onsite_preference: 3, people_facing_preference: 2 }),
    makeCareer('UX/UI Designer', ['A', 'I', 'C'], { team_orientation: 3, variety_preference: 4, pressure_tolerance: 3 }, { education_length: 3, salary_priority: 4, onsite_preference: 2, people_facing_preference: 3 }),
    makeCareer('Graphic Designer', ['A', 'E', 'C'], { team_orientation: 3, variety_preference: 4, pressure_tolerance: 3 }, { education_length: 2, salary_priority: 3, onsite_preference: 2, people_facing_preference: 3 }),
    makeCareer('Brand Strategist', ['A', 'E', 'C'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 3, salary_priority: 4, onsite_preference: 3, people_facing_preference: 4 }),
    makeCareer('Content Creator', ['A', 'E', 'S'], { team_orientation: 3, variety_preference: 5, pressure_tolerance: 4 }, { education_length: 2, salary_priority: 3, onsite_preference: 2, people_facing_preference: 4 }),
    makeCareer('Creative Producer', ['A', 'E', 'C'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 3, salary_priority: 4, onsite_preference: 3, people_facing_preference: 4 })
  ],
  S: [
    makeCareer('Doctor', ['S', 'I', 'R'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 5 }, { education_length: 5, salary_priority: 4, onsite_preference: 5, people_facing_preference: 5 }),
    makeCareer('Therapist', ['S', 'I', 'A'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 4, salary_priority: 3, onsite_preference: 3, people_facing_preference: 5 }),
    makeCareer('Nurse', ['S', 'I', 'R'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 5 }, { education_length: 3, salary_priority: 4, onsite_preference: 5, people_facing_preference: 5 }),
    makeCareer('Teacher', ['S', 'A', 'I'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 3 }, { education_length: 4, salary_priority: 2, onsite_preference: 5, people_facing_preference: 5 }),
    makeCareer('Social Worker', ['S', 'E', 'A'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 4, salary_priority: 2, onsite_preference: 4, people_facing_preference: 5 }),
    makeCareer('Counselor', ['S', 'I', 'A'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 4, salary_priority: 3, onsite_preference: 3, people_facing_preference: 5 })
  ],
  E: [
    makeCareer('Sales Specialist', ['E', 'S', 'C'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 2, salary_priority: 5, onsite_preference: 4, people_facing_preference: 5 }),
    makeCareer('Business Development Manager', ['E', 'S', 'C'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 3, salary_priority: 5, onsite_preference: 4, people_facing_preference: 5 }),
    makeCareer('Entrepreneur', ['E', 'A', 'S'], { team_orientation: 3, variety_preference: 5, pressure_tolerance: 5 }, { education_length: 3, salary_priority: 5, onsite_preference: 3, people_facing_preference: 4 }),
    makeCareer('Marketing Manager', ['E', 'A', 'C'], { team_orientation: 4, variety_preference: 4, pressure_tolerance: 4 }, { education_length: 3, salary_priority: 4, onsite_preference: 3, people_facing_preference: 4 }),
    makeCareer('Product Manager', ['E', 'I', 'C'], { team_orientation: 4, variety_preference: 5, pressure_tolerance: 4 }, { education_length: 3, salary_priority: 5, onsite_preference: 3, people_facing_preference: 4 }),
    makeCareer('Operations Manager', ['E', 'C', 'S'], { team_orientation: 4, variety_preference: 3, pressure_tolerance: 4 }, { education_length: 3, salary_priority: 4, onsite_preference: 4, people_facing_preference: 4 })
  ],
  C: [
    makeCareer('Accountant', ['C', 'I', 'E'], { team_orientation: 3, variety_preference: 2, pressure_tolerance: 3 }, { education_length: 3, salary_priority: 4, onsite_preference: 3, people_facing_preference: 2 }),
    makeCareer('Financial Analyst', ['C', 'I', 'E'], { team_orientation: 3, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 4, salary_priority: 5, onsite_preference: 3, people_facing_preference: 2 }),
    makeCareer('Project Coordinator', ['C', 'E', 'S'], { team_orientation: 4, variety_preference: 3, pressure_tolerance: 3 }, { education_length: 3, salary_priority: 3, onsite_preference: 4, people_facing_preference: 4 }),
    makeCareer('Compliance Specialist', ['C', 'E', 'I'], { team_orientation: 3, variety_preference: 2, pressure_tolerance: 3 }, { education_length: 3, salary_priority: 4, onsite_preference: 3, people_facing_preference: 2 }),
    makeCareer('Data Operations Analyst', ['C', 'I', 'R'], { team_orientation: 3, variety_preference: 2, pressure_tolerance: 3 }, { education_length: 3, salary_priority: 4, onsite_preference: 2, people_facing_preference: 2 }),
    makeCareer('Administrative Specialist', ['C', 'S', 'E'], { team_orientation: 3, variety_preference: 2, pressure_tolerance: 2 }, { education_length: 2, salary_priority: 3, onsite_preference: 4, people_facing_preference: 3 })
  ]
};

export const CAREER_CATALOG = Object.values(CAREERS_BY_PRIMARY_TYPE).flat();

for (const career of CAREER_CATALOG) {
  if (!career.riasec.every((typeCode) => VALID_RIASEC_CODES.includes(typeCode))) {
    throw new Error(`Invalid RIASEC code for career: ${career.title}`);
  }
}

const primaryTypeCounts = Object.values(CAREERS_BY_PRIMARY_TYPE).map((careers) => careers.length);
if (new Set(primaryTypeCounts).size !== 1) {
  throw new Error('CAREERS_BY_PRIMARY_TYPE must stay balanced across all primary RIASEC types.');
}

const uniqueTitles = new Set(CAREER_CATALOG.map((career) => career.title));
if (uniqueTitles.size !== CAREER_CATALOG.length) {
  throw new Error('Duplicate career titles found in CAREER_CATALOG.');
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function normalizeLikert(value) {
  const safeValue = Number.isFinite(value) ? value : 3;
  return clamp01((Math.min(5, Math.max(1, safeValue)) - 1) / 4);
}

function getSafeProfile(profile) {
  return {
    riasecMeans: { ...DEFAULT_PROFILE.riasecMeans, ...(profile?.riasecMeans ?? {}) },
    workStyleMeans: { ...DEFAULT_PROFILE.workStyleMeans, ...(profile?.workStyleMeans ?? {}) },
    constraintMeans: { ...DEFAULT_PROFILE.constraintMeans, ...(profile?.constraintMeans ?? {}) }
  };
}

function getWeightProfileById(profileId) {
  return WEIGHT_PROFILES.find((profile) => profile.id === profileId) ?? WEIGHT_PROFILES[0];
}

function getDefaultMetrics() {
  return {
    version: 2,
    sessions: 0,
    top3AcceptanceSum: 0,
    top3AcceptanceRate: 0,
    weightProfiles: Object.fromEntries(
      WEIGHT_PROFILES.map((profile) => [profile.id, { trials: 0, scoreSum: 0 }])
    )
  };
}

function loadMetrics() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getDefaultMetrics();
  }

  try {
    const raw = window.localStorage.getItem(METRICS_STORAGE_KEY);
    if (!raw) {
      return getDefaultMetrics();
    }

    const parsed = JSON.parse(raw);
    const defaults = getDefaultMetrics();
    return {
      ...defaults,
      ...parsed,
      weightProfiles: {
        ...defaults.weightProfiles,
        ...(parsed?.weightProfiles ?? {})
      }
    };
  } catch (_error) {
    return getDefaultMetrics();
  }
}

function saveMetrics(metrics) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch (_error) {
    // Ignore storage errors and keep app flow intact.
  }
}

function getTop3OverlapRatio(firstTitles, secondTitles) {
  const firstSet = new Set(firstTitles);
  if (firstSet.size === 0) {
    return 0;
  }

  let overlapCount = 0;
  for (const title of secondTitles) {
    if (firstSet.has(title)) {
      overlapCount += 1;
    }
  }

  return overlapCount / 3;
}

export function getActiveWeightProfileId() {
  const metrics = loadMetrics();

  let bestProfileId = WEIGHT_PROFILES[0].id;
  let bestScore = -Infinity;

  for (const profile of WEIGHT_PROFILES) {
    const stats = metrics.weightProfiles[profile.id] ?? { trials: 0, scoreSum: 0 };
    const smoothedScore = (stats.scoreSum + 1) / (stats.trials + 2);

    if (smoothedScore > bestScore) {
      bestScore = smoothedScore;
      bestProfileId = profile.id;
    }
  }

  return bestProfileId;
}

function getRiasecFit(profile, career) {
  const safeProfile = getSafeProfile(profile);
  const totalWeight = career.riasec.reduce((sum, _typeCode, index) => sum + (POSITION_WEIGHTS[index] ?? 0), 0);

  if (totalWeight === 0) {
    return 0.5;
  }

  const weightedScore = career.riasec.reduce((sum, typeCode, index) => {
    const userValue = normalizeLikert(safeProfile.riasecMeans[typeCode]);
    const positionWeight = POSITION_WEIGHTS[index] ?? 0;
    return sum + userValue * positionWeight;
  }, 0);

  return weightedScore / totalWeight;
}

function getTraitFit(userMeans, careerProfile, traitKeys) {
  if (traitKeys.length === 0) {
    return 0.5;
  }

  const sum = traitKeys.reduce((score, trait) => {
    const userValue = normalizeLikert(userMeans[trait]);
    const careerValue = normalizeLikert(careerProfile[trait]);
    return score + (1 - Math.abs(userValue - careerValue));
  }, 0);

  return sum / traitKeys.length;
}

export function getTopCareerMatches(profile, limit = 3, options = {}) {
  const safeProfile = getSafeProfile(profile);
  const selectedProfileId = options.weightProfileId ?? getActiveWeightProfileId();
  const weights = getWeightProfileById(selectedProfileId);

  return CAREER_CATALOG.map((career) => {
    const riasecFit = getRiasecFit(safeProfile, career);
    const workStyleFit = getTraitFit(safeProfile.workStyleMeans, career.workStyle, WORK_STYLE_TRAITS);
    const constraintFit = getTraitFit(safeProfile.constraintMeans, career.constraints, CONSTRAINT_TRAITS);

    const totalScore =
      riasecFit * weights.riasec +
      workStyleFit * weights.workStyle +
      constraintFit * weights.constraint;

    return {
      ...career,
      riasecFit,
      workStyleFit,
      constraintFit,
      totalScore,
      weightProfileId: selectedProfileId
    };
  })
    .sort(
      (first, second) =>
        second.totalScore - first.totalScore ||
        second.riasecFit - first.riasecFit ||
        first.title.localeCompare(second.title)
    )
    .slice(0, limit);
}

export function getMatchConfidence(matches) {
  if (!matches || matches.length === 0) {
    return 0;
  }

  const top1 = matches[0].totalScore ?? 0;
  const top2 = matches[1]?.totalScore ?? top1;
  const top3 = matches[2]?.totalScore ?? top2;
  const spreadScore = clamp01(((top1 - top2) * 0.6 + (top1 - top3) * 0.4) / 0.18);

  const componentAverage =
    ((matches[0].riasecFit ?? 0) + (matches[0].workStyleFit ?? 0) + (matches[0].constraintFit ?? 0)) / 3;
  const componentVariance =
    ((matches[0].riasecFit - componentAverage) ** 2 +
      (matches[0].workStyleFit - componentAverage) ** 2 +
      (matches[0].constraintFit - componentAverage) ** 2) /
    3;
  const componentBalance = clamp01(1 - componentVariance * 6);

  return clamp01(spreadScore * 0.75 + componentBalance * 0.25);
}

export function getConfidenceLabel(confidence) {
  if (confidence < 0.4) {
    return 'Low confidence';
  }

  if (confidence < 0.7) {
    return 'Medium confidence';
  }

  return 'High confidence';
}

export function evaluateWeightProfiles(checkpointProfile, finalProfile) {
  return WEIGHT_PROFILES.map((profile) => {
    const checkpointTop3 = getTopCareerMatches(checkpointProfile, 3, {
      weightProfileId: profile.id
    }).map((career) => career.title);
    const finalTop3 = getTopCareerMatches(finalProfile, 3, {
      weightProfileId: profile.id
    }).map((career) => career.title);

    return {
      profileId: profile.id,
      score: getTop3OverlapRatio(checkpointTop3, finalTop3)
    };
  });
}

export function recordSessionMetrics({ checkpointTop3 = [], finalTop3 = [], profileEvaluations = [] }) {
  const metrics = loadMetrics();
  const acceptanceScore = getTop3OverlapRatio(checkpointTop3, finalTop3);

  metrics.sessions += 1;
  metrics.top3AcceptanceSum += acceptanceScore;
  metrics.top3AcceptanceRate = metrics.top3AcceptanceSum / metrics.sessions;

  for (const evaluation of profileEvaluations) {
    const current = metrics.weightProfiles[evaluation.profileId] ?? { trials: 0, scoreSum: 0 };
    metrics.weightProfiles[evaluation.profileId] = {
      trials: current.trials + 1,
      scoreSum: current.scoreSum + evaluation.score
    };
  }

  saveMetrics(metrics);
  return metrics;
}

export function getMetricsSnapshot() {
  return loadMetrics();
}
