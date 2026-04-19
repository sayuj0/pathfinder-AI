import Particles from './Particles';
import './Quiz.css';

export default function Quiz() {
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
    </div>
  );
}
