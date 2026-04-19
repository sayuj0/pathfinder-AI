import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Particles from './Particles';
import './Intro.css';

export default function Intro() {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);

  useEffect(() => {
    if (!isLearnMoreOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsLearnMoreOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isLearnMoreOpen]);

  return (
    <div className="intro-page">
      <div className="intro-page__background" aria-hidden="true">
        <Particles
          particleColors={['#ffffff']}
          particleCount={500}
          particleSpread={20}
          speed={0.1}
          particleBaseSize={200}
          cameraDistance={40}
          alphaParticles={true}
          pixelRatio={1}
        />
      </div>

      <main className="intro-page__content">
        <section className="intro-card" aria-labelledby="intro-title">
          <h1 id="intro-title">Find Your Career Path</h1>
          <p>
            This assessment uses the RIASEC model to help you discover career paths that match
            your interests and work style.
          </p>

          <h2>What is RIASEC?</h2>
          <p>
            RIASEC is a career interest model that connects your preferences to different work
            environments. After you get your results, the AI chatbot can help you explore careers,
            compare options, and learn more about each path.{` `}
            <button
              className="intro-card__learn-more-inline"
              type="button"
              onClick={() => setIsLearnMoreOpen(true)}
            >
              Learn More
            </button>
          </p>

          <Link className="button intro-card__cta" to="/quiz">
            <span>Start Quiz</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 43" aria-hidden="true" focusable="false">
              <polygon points="39.58,4.46 44.11,0 66,21.5 44.11,43 39.58,38.54 56.94,21.5" />
              <polygon points="19.79,4.46 24.32,0 46.21,21.5 24.32,43 19.79,38.54 37.15,21.5" />
              <polygon points="0,4.46 4.53,0 26.42,21.5 4.53,43 0,38.54 17.36,21.5" />
            </svg>
          </Link>
        </section>
      </main>

      {isLearnMoreOpen
        ? createPortal(
            <div
              className="riasec-modal-overlay"
              role="presentation"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setIsLearnMoreOpen(false);
                }
              }}
            >
              <section
                className="riasec-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="riasec-modal-title"
              >
                <button
                  className="riasec-modal__close"
                  type="button"
                  onClick={() => setIsLearnMoreOpen(false)}
                  aria-label="Close learn more dialog"
                >
                  &times;
                </button>

                <h2 id="riasec-modal-title" className="riasec-modal__section-heading">
                  What is RIASEC?
                </h2>
                <p>
                  RIASEC is a career-interest model used in tools like O*NET&apos;s Interest
                  Profiler. It organizes interests into six areas that help connect people with work
                  environments and occupations that may fit them well. Realistic focuses on hands-on
                  and practical work, often involving tools, equipment, physical tasks, or outdoor
                  settings. Investigative focuses on analyzing, researching, solving problems, and
                  understanding how things work. Artistic focuses on creativity, self-expression,
                  design, and open-ended work. Social focuses on helping, teaching, supporting, and
                  working closely with people. Enterprising focuses on leading, persuading, starting
                  projects, and working toward goals or results. Conventional focuses on structure,
                  organization, planning, and working with clear systems or procedures.
                </p>

                <hr className="riasec-modal__divider" />
                <h3 className="riasec-modal__section-heading">About this quiz</h3>
                <p>
                  This quiz is based on the RIASEC model and asks about the kinds of activities and
                  work styles you are most interested in. Your responses are scored across the six
                  RIASEC areas, and your highest-scoring areas are used to suggest career paths
                  that may fit your interests. O*NET&apos;s Interest Profiler works similarly by
                  measuring the same six areas and linking results to occupations.
                </p>

                <hr className="riasec-modal__divider" />
                <h3 className="riasec-modal__section-heading">What your results mean</h3>
                <p>
                  Your results are not a final answer or a guarantee of the perfect career. They
                  are meant to help you explore career paths that may match your interests and
                  preferences. ONET describes these tools as career exploration tools, and ONET
                  OnLine lets users browse occupations using one-, two-, or three-letter RIASEC
                  combinations.
                </p>

                <hr className="riasec-modal__divider" />
                <h3 className="riasec-modal__section-heading">How the AI fits in</h3>
                <p>
                  After you get your results, the AI chatbot helps you learn more about the career
                  paths shown to you. It can help answer questions about career fit, typical
                  education, salary, and job outlook based on the paths your quiz matched you with.
                  The quiz determines the result, and the AI helps you explore it further. This use
                  is consistent with O*NET&apos;s model of using RIASEC results to guide career
                  exploration.
                </p>
              </section>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
