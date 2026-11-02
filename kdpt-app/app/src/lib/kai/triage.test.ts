import { describe, expect, it } from 'vitest';
import { kaiContext, triage } from './triage';

describe('triage', () => {
  it('sends possible emergencies to "get help now"', () => {
    for (const q of ['I have chest pain after my run', 'I fainted at the gym', "I can't breathe properly"]) expect(triage(q).to).toBe('urgent');
  });
  it('sends pain and injury to the coach', () => {
    for (const q of ['My knee aches during lunges', 'I think I pulled my hamstring', 'Shoulder hurts on press', 'slight niggle in my back']) expect(triage(q)).toEqual({ to: 'coach', reason: 'pain' });
  });
  it('sends medical questions to the coach', () => {
    for (const q of ['Can I train while pregnant?', 'Will my blood pressure tablets affect this?', 'I feel dizzy']) expect(triage(q)).toEqual({ to: 'coach', reason: 'medical' });
  });
  it('sends plan changes to the coach', () => {
    for (const q of ['Can you change my programme?', 'I want to drop my calories', 'Can I add sessions?', 'I need to cancel Thursday']) expect(triage(q)).toEqual({ to: 'coach', reason: 'plan' });
  });
  it('lets KAI answer everyday questions', () => {
    for (const q of ['What should I eat before a 7am session?', 'How do I do a goblet squat?', 'Can I swap leg press today?', 'How much water should I drink?']) expect(triage(q).to).toBe('kai');
  });
});

describe('kaiContext', () => {
  it('never shares health answers or photos', () => {
    expect(kaiContext(true)).toMatchObject({ healthAnswers: false, photos: false, plan: true });
  });
  it('uses nothing personal without consent', () => {
    expect(Object.values(kaiContext(false)).every(v => v === false)).toBe(true);
  });
});
