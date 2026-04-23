const PRIORITY_WEIGHTS = {
  uncertainty: 0.34,
  closeness: 0.24,
  coverage: 0.18,
  lowScore: 0.14,
  responseStyle: 0.1
};
const TYPE_RESPONSE_STYLE = {
  R: 0.66,
  I: 0.5,
  A: 0.58,
  S: 0.56,
  E: 0.82,
  C: 0.36
};

/**
 * @param {unknown} value
 * @returns {number}
 */
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {number} value
 * @returns {number}
 */
function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/**
 * @param {Record<string, number>} riasecScores
 * @param {number} answeredCount
 * @returns {number}
 */
function getResponseStyleSignal(riasecScores, answeredCount) {
  if (answeredCount <= 0) {
    return 0.5;
  }

  const scoreSum = Object.values(riasecScores).reduce((sum, score) => sum + toNumber(score), 0);
  const averageAnswer = scoreSum / answeredCount;
  return clamp01((averageAnswer - 1) / 4);
}

/**
 * @param {number} seed
 * @returns {number}
 */
function pseudoRandom01(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Optional per-question discrimination:
 * - question.discrimination
 * - question.weight
 *
 * @param {{discrimination?: number, weight?: number}} question
 * @returns {number}
 */
function getQuestionDiscrimination(question) {
  const discrimination = toNumber(question.discrimination);
  if (discrimination !== 0) {
    return discrimination;
  }

  return toNumber(question.weight);
}

/**
 * Selects next question using adaptive priorities:
 * - uncertainty (fewer asked in a type => higher priority)
 * - closeness to current top score (better rank separation)
 * - coverage balance (avoid over-asking same type)
 * - low-score boost (still explores weak dimensions)
 *
 * Within the chosen type, prefers high-discrimination questions
 * with deterministic variety.
 *
 * @param {Array<{id:number,type:string,discrimination?:number,weight?:number}>} availableQuestions
 * @param {number[]} askedQuestionIds
 * @param {Record<string, number>} riasecScores
 * @param {{allowedTypes?: string[]}} [options]
 * @returns {{id:number,type:string,discrimination?:number,weight?:number}|null}
 */
export function selectNextQuestion(availableQuestions, askedQuestionIds, riasecScores, options = {}) {
  const askedIdSet = new Set(askedQuestionIds);
  const allowedTypeSet = Array.isArray(options.allowedTypes) ? new Set(options.allowedTypes) : null;
  const questionsInScope = allowedTypeSet
    ? availableQuestions.filter((q) => allowedTypeSet.has(q.type))
    : availableQuestions;

  let unaskedQuestions = questionsInScope.filter((q) => !askedIdSet.has(q.id));

  if (unaskedQuestions.length === 0 && allowedTypeSet) {
    unaskedQuestions = availableQuestions.filter((q) => !askedIdSet.has(q.id));
  }

  if (unaskedQuestions.length === 0) {
    return null;
  }

  const types = Array.from(
    new Set([
      ...Object.keys(riasecScores),
      ...unaskedQuestions.map((q) => q.type).filter(Boolean)
    ])
  );

  if (types.length === 0) {
    return unaskedQuestions[0];
  }

  const askedCountByType = Object.fromEntries(types.map((type) => [type, 0]));
  const unaskedCountByType = Object.fromEntries(types.map((type) => [type, 0]));

  for (const question of availableQuestions) {
    if (!question?.type) {
      continue;
    }

    if (askedIdSet.has(question.id)) {
      askedCountByType[question.type] = (askedCountByType[question.type] ?? 0) + 1;
    }
  }

  for (const question of unaskedQuestions) {
    if (!question?.type) {
      continue;
    }

    if (!askedIdSet.has(question.id)) {
      unaskedCountByType[question.type] = (unaskedCountByType[question.type] ?? 0) + 1;
    }
  }

  const scores = types.map((type) => toNumber(riasecScores[type]));
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = Math.max(1, maxScore - minScore);
  const totalAsked = Math.max(1, askedQuestionIds.length);
  const responseStyleSignal = getResponseStyleSignal(riasecScores, askedQuestionIds.length);

  const typePriorities = types
    .map((type) => {
      const score = toNumber(riasecScores[type]);
      const askedCount = askedCountByType[type] ?? 0;
      const unaskedCount = unaskedCountByType[type] ?? 0;

      const uncertainty = 1 / (askedCount + 1);
      const closenessToTop = 1 - Math.abs(maxScore - score) / scoreRange;
      const coveragePenalty = askedCount / totalAsked;
      const lowScoreBoost = 1 - (score - minScore) / scoreRange;
      const responseStyleMatch = 1 - Math.abs((TYPE_RESPONSE_STYLE[type] ?? 0.5) - responseStyleSignal);

      const priority =
        PRIORITY_WEIGHTS.uncertainty * uncertainty +
        PRIORITY_WEIGHTS.closeness * clamp01(closenessToTop) +
        PRIORITY_WEIGHTS.coverage * (1 - clamp01(coveragePenalty)) +
        PRIORITY_WEIGHTS.lowScore * clamp01(lowScoreBoost) +
        PRIORITY_WEIGHTS.responseStyle * clamp01(responseStyleMatch);

      return { type, score, askedCount, unaskedCount, priority, responseStyleMatch };
    })
    .sort((a, b) => {
      return (
        b.priority - a.priority ||
        b.responseStyleMatch - a.responseStyleMatch ||
        a.askedCount - b.askedCount ||
        a.score - b.score ||
        a.type.localeCompare(b.type)
      );
    });

  const selectedType = typePriorities.find((entry) => entry.unaskedCount > 0)?.type;
  const candidateQuestions = selectedType
    ? unaskedQuestions.filter((q) => q.type === selectedType)
    : unaskedQuestions;

  if (candidateQuestions.length === 1) {
    return candidateQuestions[0];
  }

  const discriminations = candidateQuestions.map((q) => getQuestionDiscrimination(q));
  const minDiscrimination = Math.min(...discriminations);
  const maxDiscrimination = Math.max(...discriminations);
  const discriminationRange = Math.max(1, maxDiscrimination - minDiscrimination);
  const scoreSignal = Math.round(
    Object.values(riasecScores).reduce((sum, score) => sum + toNumber(score), 0) * 37
  );
  const seedBase = askedQuestionIds.reduce((sum, id, index) => sum + (index + 1) * id, 17) + scoreSignal;

  return [...candidateQuestions].sort((a, b) => {
    const aDisc = getQuestionDiscrimination(a);
    const bDisc = getQuestionDiscrimination(b);
    const aDiscNorm = (aDisc - minDiscrimination) / discriminationRange;
    const bDiscNorm = (bDisc - minDiscrimination) / discriminationRange;

    const aNoise = pseudoRandom01(seedBase + a.id * 101);
    const bNoise = pseudoRandom01(seedBase + b.id * 101);

    const aScore = aDiscNorm * 0.7 + aNoise * 0.3;
    const bScore = bDiscNorm * 0.7 + bNoise * 0.3;

    return bScore - aScore || a.id - b.id;
  })[0];
}
