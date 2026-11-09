import { describe, expect, it } from 'vitest';
import { cleanAnswers, cleanQuestions, DEFAULT_QUESTIONS, describeAnswer } from './questions';

describe('check-in questions', () => {
  it('accepts the usual questions as they are', () => {
    const r = cleanQuestions(DEFAULT_QUESTIONS);
    expect(r.ok && r.questions).toEqual(DEFAULT_QUESTIONS);
  });
  it('rejects empty lists, blank questions and pick lists without choices', () => {
    expect(cleanQuestions([]).ok).toBe(false);
    expect(cleanQuestions([{ id: 'a', type: 'text', q: '  ', req: false }]).ok).toBe(false);
    expect(cleanQuestions([{ id: 'a', type: 'pick', q: 'Which?', req: false, opts: ['One', ''] }]).ok).toBe(false);
    expect(cleanQuestions([{ id: 'a', type: 'video', q: 'Hm', req: false }]).ok).toBe(false);
  });
  it('gives new questions an id and default scale words', () => {
    const r = cleanQuestions([{ type: 'scale', q: 'Steps' }]);
    expect(r.ok && r.questions[0]).toMatchObject({ id: 'q1', ends: ['Low', 'High'], req: false });
  });
});

describe('check-in answers', () => {
  const qs = DEFAULT_QUESTIONS;
  const full = { mood: 3, sleep: 4, energy: 2, stress: 5, food: 1 };
  it('needs the required ones', () => {
    expect(cleanAnswers(qs, {}).ok).toBe(false);
    const r = cleanAnswers(qs, full);
    expect(r.ok).toBe(true);
  });
  it('keeps values in range and drops picks that are not choices', () => {
    expect(cleanAnswers(qs, { ...full, sleep: 6 }).ok).toBe(false);
    expect(cleanAnswers(qs, { ...full, mood: -1 }).ok).toBe(false);
    const r = cleanAnswers(qs, { ...full, wins: ['More energy', 'Hacked'], weight: '72,5', note: '  ' });
    expect(r.ok && r.answers).toMatchObject({ wins: ['More energy'], weight: 72.5, note: null });
    expect(cleanAnswers(qs, { ...full, weight: 'heavy' }).ok).toBe(false);
  });
  it('reads back in words', () => {
    expect(describeAnswer(qs[0], 4)).toBe('Great');
    expect(describeAnswer(qs[2], 2)).toBe('2 of 5 (Poor → Great)');
    expect(describeAnswer(qs[7], 72.5)).toBe('72.5 kg');
    expect(describeAnswer(qs[6], null)).toBe('–');
  });
});
