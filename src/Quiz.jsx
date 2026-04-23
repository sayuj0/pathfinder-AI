import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import {
  getCareerHighlights,
  getTopCareerMatches
} from './careerClusters';
import Particles from './Particles';
import {
  CONSTRAINT_TRAITS,
  DISAMBIGUATION_CATEGORY,
  QUESTIONS,
  WORK_STYLE_TRAITS
} from './questions';
import { selectNextQuestion } from './selectNextQuestion';
import './Quiz.css';

const ANSWER_OPTIONS = [
  { label: 'Strongly Disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly Agree', value: 5 }
];

const TYPE_NAMES = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional'
};

const RIASEC_TYPES = ['R', 'I', 'A', 'S', 'E', 'C'];
const CHECKPOINT_INDEX = 12;
const BASE_QUESTION_COUNT = 24;
const CHAT_API_PATH = '/api/chat';
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_pathfinder';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

const FOUNDATION_PLAN = [
  'interest',
  'interest',
  'interest',
  'interest',
  'interest',
  'interest',
  'work_style',
  'work_style',
  'work_style',
  'constraint',
  'constraint',
  'constraint'
];

const REFINEMENT_PLAN = [
  'interest',
  'work_style',
  'interest',
  'constraint',
  'interest',
  'work_style',
  'interest',
  'constraint',
  'interest',
  'work_style',
  'interest',
  'constraint'
];

const QUESTION_BY_ID = new Map(QUESTIONS.map((question) => [question.id, question]));
const QUESTIONS_BY_CATEGORY = QUESTIONS.reduce((grouped, question) => {
  grouped[question.category] = grouped[question.category] ?? [];
  grouped[question.category].push(question);
  return grouped;
}, {});
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

function getProfileFromAnswers(questionIds, answersById) {
  const summary = getInitialProfile();

  for (const questionId of questionIds) {
    const question = QUESTION_BY_ID.get(questionId);
    const rawAnswer = answersById[questionId];

    if (!question || rawAnswer === undefined) {
      continue;
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
    .map(([code, score]) => ({
      code,
      score,
      name: TYPE_NAMES[code]
    }));
}

function getQuestionContext(askedQuestionIds, answersById) {
  const profile = getProfileFromAnswers(askedQuestionIds, answersById);
  const interestCountsByType = Object.fromEntries(RIASEC_TYPES.map((typeCode) => [typeCode, 0]));
  const postCheckpointInterestTypes = [];

  askedQuestionIds.forEach((questionId, index) => {
    const question = QUESTION_BY_ID.get(questionId);
    if (!question) {
      return;
    }

    if (question.category === 'interest' && question.type) {
      interestCountsByType[question.type] += 1;
      if (index >= CHECKPOINT_INDEX) {
        postCheckpointInterestTypes.push(question.type);
      }
    }
  });

  return { profile, interestCountsByType, postCheckpointInterestTypes };
}

function getDeterministicIndex(seed, length) {
  const safeLength = Math.max(1, length);
  const value = Math.sin(seed * 12.9898) * 43758.5453123;
  return Math.floor((value - Math.floor(value)) * safeLength) % safeLength;
}

function getQuestionSeed(askedQuestionIds, extra = 0) {
  return askedQuestionIds.reduce((sum, questionId, index) => sum + questionId * (index + 3), 17) + extra;
}

function pickByTraitUncertainty(candidates, traitMeans, traitCounts, askedQuestionIds) {
  if (candidates.length === 0) {
    return null;
  }

  const scored = candidates.map((question) => {
    const trait = question.trait;
    const mean = traitMeans[trait] ?? 3;
    const count = traitCounts[trait] ?? 0;
    const uncertainty = 1 - Math.abs(mean - 3) / 2;
    const coverageGap = 1 / (count + 1);
    const score = uncertainty * 0.65 + coverageGap * 0.35;
    return { question, score };
  });

  scored.sort((first, second) => second.score - first.score || first.question.id - second.question.id);
  const topScore = scored[0].score;
  const topBand = scored.filter((entry) => entry.score >= topScore - 0.03).map((entry) => entry.question);
  const seed = getQuestionSeed(askedQuestionIds, topBand.length * 11);
  return topBand[getDeterministicIndex(seed, topBand.length)];
}

function selectInterestQuestion(candidates, context, askedQuestionIds, nextStepIndex) {
  if (candidates.length === 0) {
    return null;
  }

  let allowedTypes = null;

  if (nextStepIndex < CHECKPOINT_INDEX) {
    const minimumAskedCount = Math.min(
      ...RIASEC_TYPES.map((typeCode) => context.interestCountsByType[typeCode] ?? 0)
    );
    allowedTypes = RIASEC_TYPES.filter(
      (typeCode) => (context.interestCountsByType[typeCode] ?? 0) === minimumAskedCount
    );
  } else {
    const rankedTypes = RIASEC_TYPES.map((typeCode) => ({
      typeCode,
      score: context.profile.riasecMeans[typeCode]
    })).sort((first, second) => second.score - first.score);

    const focusTypes = rankedTypes.slice(0, 3).map((entry) => entry.typeCode);
    const nonFocusTypes = RIASEC_TYPES.filter((typeCode) => !focusTypes.includes(typeCode));
    const postCheckpointCount = context.postCheckpointInterestTypes.length;
    const lastWindow = context.postCheckpointInterestTypes.slice(-3);
    const forceNonFocusByWindow =
      lastWindow.length === 3 && lastWindow.every((typeCode) => focusTypes.includes(typeCode));
    const forceNonFocusByCadence = postCheckpointCount > 0 && postCheckpointCount % 3 === 2;

    allowedTypes = forceNonFocusByWindow || forceNonFocusByCadence ? nonFocusTypes : focusTypes;
  }

  const selected =
    selectNextQuestion(candidates, askedQuestionIds, context.profile.riasecMeans, { allowedTypes }) ??
    selectNextQuestion(candidates, askedQuestionIds, context.profile.riasecMeans);

  return selected;
}

function selectDisambiguationQuestion(candidates, context, askedQuestionIds) {
  if (candidates.length === 0) {
    return null;
  }

  const topCareerTitles = getTopCareerMatches(context.profile, 3).map((career) => career.title);
  const targeted = candidates.filter((question) => {
    if (!Array.isArray(question.targets) || question.targets.length === 0) {
      return false;
    }

    return question.targets.some((title) => topCareerTitles.includes(title));
  });

  const pool = targeted.length > 0 ? targeted : candidates;
  return pickByTraitUncertainty(
    pool,
    {
      ...context.profile.workStyleMeans,
      ...context.profile.constraintMeans,
      ...context.profile.riasecMeans
    },
    {
      ...context.profile.workStyleCounts,
      ...context.profile.constraintCounts,
      ...context.profile.riasecCounts
    },
    askedQuestionIds
  );
}

function chooseCategoryForStep(stepIndex) {
  if (stepIndex < CHECKPOINT_INDEX) {
    return FOUNDATION_PLAN[stepIndex];
  }

  if (stepIndex < BASE_QUESTION_COUNT) {
    return REFINEMENT_PLAN[stepIndex - CHECKPOINT_INDEX];
  }

  return null;
}

function getNextQuestionId(askedQuestionIds, answersById, stepIndex) {
  const context = getQuestionContext(askedQuestionIds, answersById);
  const category = chooseCategoryForStep(stepIndex);

  if (!category) {
    return null;
  }

  const askedTextKeys = new Set(
    askedQuestionIds
      .map((questionId) => QUESTION_BY_ID.get(questionId))
      .filter(Boolean)
      .map((question) => normalizeQuestionText(question.text))
  );

  const categoryQuestions = (QUESTIONS_BY_CATEGORY[category] ?? []).filter(
    (question) =>
      !askedQuestionIds.includes(question.id) &&
      !askedTextKeys.has(normalizeQuestionText(question.text))
  );

  if (categoryQuestions.length === 0) {
    return null;
  }

  if (category === 'interest') {
    return selectInterestQuestion(categoryQuestions, context, askedQuestionIds, stepIndex)?.id ?? null;
  }

  if (category === 'work_style') {
    return pickByTraitUncertainty(
      categoryQuestions,
      context.profile.workStyleMeans,
      context.profile.workStyleCounts,
      askedQuestionIds
    )?.id ?? null;
  }

  if (category === 'constraint') {
    return pickByTraitUncertainty(
      categoryQuestions,
      context.profile.constraintMeans,
      context.profile.constraintCounts,
      askedQuestionIds
    )?.id ?? null;
  }

  if (category === DISAMBIGUATION_CATEGORY) {
    return selectDisambiguationQuestion(categoryQuestions, context, askedQuestionIds)?.id ?? null;
  }

  return null;
}

function createInitialQuestionIds() {
  const firstQuestion = selectNextQuestion(QUESTIONS_BY_CATEGORY.interest ?? [], [], {
    R: 3,
    I: 3,
    A: 3,
    S: 3,
    E: 3,
    C: 3
  });

  return firstQuestion ? [firstQuestion.id] : [];
}

function buildResultsEmailMessage(topTraits, careerMatches) {
  const traitSection =
    topTraits.length > 0 ? topTraits.map((trait) => trait.name).join('\n') : 'No top traits available yet.';

  const matchSection =
    careerMatches.length > 0
      ? careerMatches
          .map((career) => {
            const highlights = getCareerHighlights(career);
            const highlightsText = highlights.length > 0 ? highlights.join('\n') : 'No description available.';
            return `${career.title}\n${highlightsText}`;
          })
          .join('\n\n')
      : 'No top career matches available yet.';

  return [
    'Your Career Profile',
    '',
    'Top Traits:',
    '',
    traitSection,
    '',
    'Top Career Matches:',
    '',
    matchSection
  ].join('\n');
}

function buildInitialChatMessage() {
  return 'Ask about salary, skills, or next steps.';
}

export default function Quiz() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('question');
  const [currentStep, setCurrentStep] = useState(0);
  const [answersById, setAnswersById] = useState({});
  const [askedQuestionIds, setAskedQuestionIds] = useState(() => createInitialQuestionIds());
  const [checkpointCount, setCheckpointCount] = useState(0);
  const [resultsEmail, setResultsEmail] = useState('');
  const [resultsEmailNotice, setResultsEmailNotice] = useState('');
  const [resultsEmailNoticeType, setResultsEmailNoticeType] = useState('');
  const [isSendingResultsEmail, setIsSendingResultsEmail] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatNotice, setChatNotice] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const totalQuestions = BASE_QUESTION_COUNT;

  const currentQuestionId = askedQuestionIds[currentStep];
  const currentQuestion = currentQuestionId === undefined ? null : QUESTION_BY_ID.get(currentQuestionId);
  const currentAnswer = currentQuestion ? answersById[currentQuestion.id] : undefined;
  const isSecondProgressPhase = currentStep >= CHECKPOINT_INDEX;
  const progressDisplayTotal = isSecondProgressPhase ? totalQuestions : CHECKPOINT_INDEX;
  const progressDisplayValue = isSecondProgressPhase ? currentStep : currentStep + 1;
  const progressPercent =
    (Math.max(0, Math.min(progressDisplayValue, progressDisplayTotal)) / progressDisplayTotal) * 100;
  const checkpointProgressPercent =
    (Math.max(0, Math.min(checkpointCount, CHECKPOINT_INDEX)) / CHECKPOINT_INDEX) * 100;

  const profileSummary = useMemo(() => {
    return getProfileFromAnswers(askedQuestionIds, answersById);
  }, [answersById, askedQuestionIds]);

  const resultsTopTypes = useMemo(() => getTopTypeMatches(profileSummary.riasecMeans), [profileSummary.riasecMeans]);
  const exploreCareerMatches = useMemo(() => getTopCareerMatches(profileSummary, 3), [profileSummary]);
  const isFinalResults = profileSummary.answeredCount >= totalQuestions;
  const chatCareerContext = useMemo(
    () =>
      exploreCareerMatches.map((career) => ({
        title: career.title,
        highlights: getCareerHighlights(career)
      })),
    [exploreCareerMatches]
  );

  const checkpointTopCareer = useMemo(() => getTopCareerMatches(profileSummary, 1)[0] ?? null, [profileSummary]);

  const clearResultsEmailState = () => {
    setResultsEmail('');
    setResultsEmailNotice('');
    setResultsEmailNoticeType('');
    setIsSendingResultsEmail(false);
  };

  const resetChatState = () => {
    setChatMessages([
      {
        role: 'assistant',
        content: buildInitialChatMessage()
      }
    ]);
    setChatInput('');
    setChatNotice('');
    setIsSendingChat(false);
  };

  useEffect(() => {
    if (stage === 'results') {
      resetChatState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, chatCareerContext]);

  const handleReset = () => {
    const initialQuestionIds = createInitialQuestionIds();
    setStage('question');
    setCurrentStep(0);
    setAskedQuestionIds(initialQuestionIds);
    setAnswersById({});
    setCheckpointCount(0);
    clearResultsEmailState();
  };

  const handleSelectAnswer = (value) => {
    if (!currentQuestion) {
      return;
    }

    const nextAnswers = {
      ...answersById,
      [currentQuestion.id]: value
    };
    setAnswersById(nextAnswers);

    const nextStep = currentStep + 1;
    if (nextStep >= totalQuestions) {
      clearResultsEmailState();
      setStage('results');
      return;
    }

    let nextAskedQuestionIds = askedQuestionIds;

    if (!nextAskedQuestionIds[nextStep]) {
      const nextQuestionId = getNextQuestionId(
        askedQuestionIds,
        nextAnswers,
        nextStep
      );

      if (nextQuestionId === null) {
        clearResultsEmailState();
        setStage('results');
        return;
      }

      nextAskedQuestionIds = [...askedQuestionIds, nextQuestionId];
      setAskedQuestionIds(nextAskedQuestionIds);
    }

    if (nextStep === CHECKPOINT_INDEX) {
      setCheckpointCount(nextStep);
      setCurrentStep(nextStep);
      setStage('checkpoint');
      return;
    }

    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigate('/');
      return;
    }

    setStage('question');
    setCurrentStep((previous) => previous - 1);
  };

  const handleContinueQuizFromResults = () => {
    clearResultsEmailState();
    setStage('question');
  };

  const handleEmailCopySubmit = (event) => {
    event.preventDefault();
    const email = resultsEmail.trim();

    if (isSendingResultsEmail) {
      return;
    }

    if (!EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setResultsEmailNoticeType('error');
      setResultsEmailNotice('Email is not configured yet. Add EmailJS template ID and public key in .env.');
      return;
    }

    if (!email) {
      setResultsEmailNoticeType('error');
      setResultsEmailNotice('Enter an email address to continue.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setResultsEmailNoticeType('error');
      setResultsEmailNotice('Enter a valid email address.');
      return;
    }

    const message = buildResultsEmailMessage(resultsTopTypes, exploreCareerMatches);

    setIsSendingResultsEmail(true);
    setResultsEmailNoticeType('');
    setResultsEmailNotice('');

    emailjs
      .send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          subject: 'Your Career Match Results',
          message,
          reply_to: email
        },
        {
          publicKey: EMAILJS_PUBLIC_KEY
        }
      )
      .then(() => {
        setResultsEmailNoticeType('success');
        setResultsEmailNotice(`Sent. Check ${email} for "Your Career Match Results".`);
      })
      .catch(() => {
        setResultsEmailNoticeType('error');
        setResultsEmailNotice('Unable to send right now. Please try again.');
      })
      .finally(() => {
        setIsSendingResultsEmail(false);
      });
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    const message = chatInput.trim();

    if (!message || isSendingChat) {
      return;
    }

    const userMessage = { role: 'user', content: message };
    const historyForRequest = [...chatMessages, userMessage];

    setChatMessages(historyForRequest);
    setChatInput('');
    setChatNotice('');
    setIsSendingChat(true);

    try {
      const response = await fetch(CHAT_API_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          history: historyForRequest.slice(-10),
          topTraits: resultsTopTypes.map((trait) => trait.name),
          careerMatches: chatCareerContext
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Chat request failed.');
      }

      const reply = String(payload?.reply ?? '').trim();
      if (!reply) {
        throw new Error('Chat service returned an empty response.');
      }

      setChatMessages((previous) => [...previous, { role: 'assistant', content: reply }]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to send your message right now.';
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: `I could not complete that request. ${errorMessage}`
        }
      ]);
      setChatNotice(errorMessage);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="quiz-page">
      <div className="quiz-page__background" aria-hidden="true">
        <Particles
          particleColors={['#ffffff']}
          particleCount={1000}
          particleSpread={20}
          speed={0.1}
          particleBaseSize={200}
          cameraDistance={80}
          alphaParticles
          pixelRatio={1}
        />
      </div>

      <main className="quiz-page__content">
        {stage === 'question' && (
          <section className="quiz-card quiz-card--question" aria-live="polite">
            <div className="quiz-card__top">
              <button className="quiz-chip-btn" type="button" onClick={handleBack}>
                Back
              </button>
              <p className="quiz-card__question-count">
                Progress {progressDisplayValue} / {progressDisplayTotal}
              </p>
              <div className="quiz-card__progress" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <button className="quiz-icon-btn" type="button" onClick={handleReset} aria-label="Restart quiz">
                &#8635;
              </button>
            </div>

            <p className="quiz-card__question-text">
              {currentQuestion ? currentQuestion.text : 'No question available.'}
            </p>

            <div className="quiz-card__options">
              {ANSWER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`quiz-option ${currentAnswer === option.value ? 'is-selected' : ''}`}
                  type="button"
                  onClick={() => handleSelectAnswer(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {stage === 'results' && (
          <section className="quiz-card quiz-card--explore" aria-labelledby="quiz-explore-title">
              <div className="quiz-explore__layout">
              <div className="quiz-explore__left-column">
                <section className="quiz-explore__panel quiz-explore__profile-panel">
                  <p className="quiz-explore__eyebrow">{isFinalResults ? 'Assessment Complete' : 'Checkpoint Profile'}</p>
                  <h2 id="quiz-explore-title">Your Career Profile</h2>
                  <p className="quiz-explore__subcopy">Based on {profileSummary.answeredCount} questions</p>

                  <h3>Your Top Traits</h3>
                  <ul className="quiz-explore__traits">
                    {resultsTopTypes.map((result) => (
                      <li key={result.code}>
                        <div className="quiz-explore__trait-header">
                          <span>{result.name}</span>
                          <span>{result.score.toFixed(2)} / 5</span>
                        </div>
                        <div className="quiz-explore__trait-bar" aria-hidden="true">
                          <span style={{ width: `${Math.max(0, Math.min(100, (result.score / 5) * 100))}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="quiz-explore__panel quiz-explore__chatbot-panel" aria-labelledby="quiz-chatbot-title">
                  <h3 id="quiz-chatbot-title">Career Chatbot</h3>
                  <div className="quiz-explore__chatbot-window" aria-live="polite">
                    {chatMessages.map((entry, index) => (
                      <p
                        key={`${entry.role}-${index}`}
                        className={`quiz-explore__chatbot-message ${
                          entry.role === 'assistant'
                            ? 'quiz-explore__chatbot-message--assistant'
                            : 'quiz-explore__chatbot-message--user'
                        }`}
                      >
                        {entry.content}
                      </p>
                    ))}
                    {isSendingChat && (
                      <p className="quiz-explore__chatbot-message quiz-explore__chatbot-message--assistant">
                        Thinking...
                      </p>
                    )}
                  </div>
                  <form className="quiz-explore__chatbot-input-row" onSubmit={handleChatSubmit}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Ask about salary, skills, or next steps."
                      aria-label="Chat input"
                      disabled={isSendingChat}
                    />
                    <button className="quiz-button" type="submit" disabled={isSendingChat || !chatInput.trim()}>
                      {isSendingChat ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                  {chatNotice && <p className="quiz-explore__chatbot-notice">{chatNotice}</p>}
                </section>

                <div className="quiz-explore__actions">
                  {isFinalResults ? (
                    <>
                      <Link className="quiz-button quiz-button--ghost" to="/">
                        Back Home
                      </Link>
                      <button className="quiz-button" type="button" onClick={handleReset}>
                        Retake Quiz
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="quiz-button quiz-button--ghost" type="button" onClick={() => setStage('checkpoint')}>
                        Back
                      </button>
                      <button className="quiz-button" type="button" onClick={handleContinueQuizFromResults}>
                        Continue Quiz
                      </button>
                    </>
                  )}
                </div>
              </div>

              <section className="quiz-explore__panel quiz-explore__matches-panel" aria-labelledby="quiz-matches-title">
                <h3 id="quiz-matches-title">My Career Matches</h3>
                <ul className="quiz-explore__matches-list">
                  {exploreCareerMatches.map((career, index) => (
                    <li key={career.title}>
                      <div>
                        <strong>{career.title}</strong>
                        <ul className="quiz-explore__career-bullets" aria-label={`What ${career.title} does`}>
                          {getCareerHighlights(career).map((bullet) => (
                            <li key={`${career.title}-${bullet}`}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                      <span className="quiz-explore__rank">#{index + 1}</span>
                    </li>
                  ))}
                </ul>

                <div className="quiz-explore__email-card" aria-labelledby="quiz-email-copy-title">
                  <h4 id="quiz-email-copy-title">Want a copy?</h4>
                  <p>Email your top matches to yourself so you can review them later.</p>
                  <form className="quiz-explore__email-form" onSubmit={handleEmailCopySubmit}>
                    <input
                      type="email"
                      value={resultsEmail}
                      onChange={(event) => {
                        setResultsEmail(event.target.value);
                        if (resultsEmailNotice) {
                          setResultsEmailNotice('');
                          setResultsEmailNoticeType('');
                        }
                      }}
                      placeholder="you@example.com"
                      aria-label="Email address"
                      disabled={isSendingResultsEmail}
                    />
                    <button className="quiz-button" type="submit" disabled={isSendingResultsEmail}>
                      {isSendingResultsEmail ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                  {resultsEmailNotice && (
                    <p className={`quiz-explore__email-notice ${resultsEmailNoticeType === 'error' ? 'is-error' : 'is-success'}`}>
                      {resultsEmailNotice}
                    </p>
                  )}
                </div>
              </section>
            </div>
          </section>
        )}

        {stage === 'checkpoint' && (
          <section className="quiz-card quiz-card--checkpoint" aria-labelledby="quiz-checkpoint-title">
            <div className="quiz-card__top">
              <button className="quiz-chip-btn" type="button" onClick={handleBack}>
                Back
              </button>
              <p className="quiz-card__question-count">
                Progress {checkpointCount} / {CHECKPOINT_INDEX}
              </p>
              <div className="quiz-card__progress" aria-hidden="true">
                <span style={{ width: `${checkpointProgressPercent}%` }} />
              </div>
              <button className="quiz-icon-btn" type="button" onClick={handleReset} aria-label="Restart quiz">
                &#8635;
              </button>
            </div>

            <div className="quiz-card__checkpoint-body">
              <h2 id="quiz-checkpoint-title">Checkpoint Reached</h2>
              <p>
                You&apos;ve completed {checkpointCount} of {totalQuestions} questions. Continue for a
                more confident match.
              </p>
              {checkpointTopCareer && (
                <div className="quiz-card__checkpoint-career" aria-live="polite">
                  <p className="quiz-card__checkpoint-career-label">Top Career Right Now</p>
                  <p className="quiz-card__checkpoint-career-title">{checkpointTopCareer.title}</p>
                  <p className="quiz-card__checkpoint-career-meta">{checkpointTopCareer.riasec.join('')} profile match</p>
                </div>
              )}
              <div className="quiz-card__intro-actions quiz-card__checkpoint-actions">
                <button className="quiz-button quiz-button--ghost" type="button" onClick={() => setStage('results')}>
                  Explore Careers
                </button>
                <button className="quiz-button" type="button" onClick={() => setStage('question')}>
                  Continue Quiz
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
