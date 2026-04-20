import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Particles from './Particles';
import { QUESTIONS } from './questions';
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

export default function Quiz() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('question');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersById, setAnswersById] = useState({});

  const currentQuestion = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;
  const currentAnswer = currentQuestion ? answersById[currentQuestion.id] : undefined;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  const resultSummary = useMemo(() => {
    const totals = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    for (const question of QUESTIONS) {
      totals[question.type] += answersById[question.id] ?? 0;
    }

    const topTypes = Object.entries(totals)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3)
      .map(([code, score]) => ({
        code,
        score,
        name: TYPE_NAMES[code]
      }));

    return { totals, topTypes };
  }, [answersById]);

  const handleReset = () => {
    setStage('question');
    setCurrentIndex(0);
    setAnswersById({});
  };

  const handleSelectAnswer = (value) => {
    setAnswersById((previous) => ({
      ...previous,
      [currentQuestion.id]: value
    }));

    if (currentIndex === totalQuestions - 1) {
      setStage('results');
      return;
    }

    setCurrentIndex((previous) => previous + 1);
  };

  const handleBack = () => {
    if (currentIndex === 0) {
      navigate('/');
      return;
    }

    setCurrentIndex((previous) => previous - 1);
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
                Question {currentIndex + 1} / {totalQuestions}
              </p>
              <div className="quiz-card__progress" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <button className="quiz-icon-btn" type="button" onClick={handleReset} aria-label="Restart quiz">
                ↺
              </button>
            </div>

            <p className="quiz-card__question-text">{currentQuestion.text}</p>

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
          <section className="quiz-card quiz-card--results" aria-labelledby="quiz-results-title">
            <h2 id="quiz-results-title">Top RIASEC Matches</h2>
            <ol className="quiz-card__results-list">
              {resultSummary.topTypes.map((result) => (
                <li key={result.code}>
                  <strong>{result.name}</strong>
                  <span>
                    {result.code}: {result.score} points
                  </span>
                </li>
              ))}
            </ol>
            <div className="quiz-card__intro-actions">
              <Link className="quiz-button quiz-button--ghost" to="/">
                Back Home
              </Link>
              <button className="quiz-button" type="button" onClick={handleReset}>
                Retake Quiz
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
