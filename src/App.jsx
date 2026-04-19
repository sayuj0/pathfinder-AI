import { Navigate, Route, Routes } from 'react-router-dom';
import Intro from './Intro';
import Quiz from './Quiz';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
