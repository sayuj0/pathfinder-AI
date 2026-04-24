import { QUESTIONS, CONSTRAINT_TRAITS, WORK_STYLE_TRAITS } from '../src/questions.js';
import { getTopCareerMatches } from '../src/careerClusters.js';

const TYPE_NAMES = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional'
};

const RIASEC_TYPES = ['R', 'I', 'A', 'S', 'E', 'C'];
const NORMALIZE_TEXT_PATTERN = /[^a-z0-9 ]/g;

function normalizeQuestionText(text) {
  return String(text).toLowerCase().replace(NORMALIZE_TEXT_PATTERN, '').replace(/\s+/g, ' ').trim();
}

function reverseIfNeeded(question, value) {
  return question.reverse ? 6 - value : value;
}

function getInitialProfile() {
  return {
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
    },
    riasecSums: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    riasecCounts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    workStyleCounts: Object.fromEntries(WORK_STYLE_TRAITS.map((trait) => [trait, 0])),
    constraintCounts: Object.fromEntries(CONSTRAINT_TRAITS.map((trait) => [trait, 0])),
    answeredCount: 0
  };
}

function getProfileFromAnswers(answerRows) {
  const summary = getInitialProfile();

  const questionByNormalizedText = new Map(
    QUESTIONS.map((question) => [normalizeQuestionText(question.text), question])
  );

  for (const row of answerRows) {
    const questionText = row?.questionText ?? '';
    const rawAnswer = Number(row?.answerValue);
    const question = questionByNormalizedText.get(normalizeQuestionText(questionText));

    if (!question) {
      throw new Error(`Question not found for text: ${questionText}`);
    }

    if (!Number.isFinite(rawAnswer) || rawAnswer < 1 || rawAnswer > 5) {
      throw new Error(`Invalid answer value for question "${questionText}": ${row?.answerValue}`);
    }

    const answer = reverseIfNeeded(question, rawAnswer);
    summary.answeredCount += 1;

    if (question.type) {
      summary.riasecSums[question.type] += answer;
      summary.riasecCounts[question.type] += 1;
    }

    if (question.traitGroup === 'work_style') {
      summary.workStyleMeans[question.trait] += answer;
      summary.workStyleCounts[question.trait] += 1;
    }

    if (question.traitGroup === 'constraint') {
      summary.constraintMeans[question.trait] += answer;
      summary.constraintCounts[question.trait] += 1;
    }
  }

  for (const typeCode of RIASEC_TYPES) {
    const count = summary.riasecCounts[typeCode];
    summary.riasecMeans[typeCode] = count > 0 ? summary.riasecSums[typeCode] / count : 3;
  }

  for (const trait of WORK_STYLE_TRAITS) {
    const count = summary.workStyleCounts[trait];
    summary.workStyleMeans[trait] = count > 0 ? summary.workStyleMeans[trait] / count : 3;
  }

  for (const trait of CONSTRAINT_TRAITS) {
    const count = summary.constraintCounts[trait];
    summary.constraintMeans[trait] = count > 0 ? summary.constraintMeans[trait] / count : 3;
  }

  return summary;
}

function getTopTypeMatches(riasecMeans) {
  return Object.entries(riasecMeans)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 3)
    .map(([code]) => TYPE_NAMES[code]);
}

function main() {
  const payloadRaw = process.argv[2];
  if (!payloadRaw) {
    throw new Error('Missing JSON payload argument.');
  }

  const answerRows = JSON.parse(payloadRaw);
  const profile = getProfileFromAnswers(answerRows);

  const topTraits = getTopTypeMatches(profile.riasecMeans);
  const topCareers = getTopCareerMatches(profile, 3).map((career) => career.title);

  process.stdout.write(
    JSON.stringify(
      {
        top_traits: topTraits,
        top_careers: topCareers
      },
      null,
      2
    )
  );
}

main();