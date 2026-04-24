import assert from 'node:assert/strict';
import { selectNextQuestion } from '../src/selectNextQuestion.js';

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run('returns null when every question is already asked', () => {
  const available = [
    { id: 1, type: 'R' },
    { id: 2, type: 'I' }
  ];
  const asked = [1, 2];
  const scores = { R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 };

  const next = selectNextQuestion(available, asked, scores);
  assert.equal(next, null);
});

run('honors allowedTypes when valid candidates exist', () => {
  const available = [
    { id: 1, type: 'R' },
    { id: 2, type: 'I' }
  ];
  const asked = [];
  const scores = { R: 5, I: 1, A: 3, S: 3, E: 3, C: 3 };

  const next = selectNextQuestion(available, asked, scores, { allowedTypes: ['I'] });
  assert.equal(next?.id, 2);
});

run('falls back to all types if allowedTypes has no available candidates', () => {
  const available = [{ id: 7, type: 'R' }];
  const asked = [];
  const scores = { R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 };

  const next = selectNextQuestion(available, asked, scores, { allowedTypes: ['A'] });
  assert.equal(next?.id, 7);
});

run('does not return an already asked question', () => {
  const available = [
    { id: 1, type: 'R' },
    { id: 2, type: 'R' }
  ];
  const asked = [1];
  const scores = { R: 4, I: 3, A: 3, S: 3, E: 3, C: 3 };

  const next = selectNextQuestion(available, asked, scores);
  assert.equal(next?.id, 2);
});

console.log('All unit tests passed.');
