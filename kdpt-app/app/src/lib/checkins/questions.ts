// Check-in questions. Kyle's usual set lives in the database (check_in_forms)
// and any round can have its own copy, changed for that client.
export type QuestionType = 'mood' | 'scale' | 'text' | 'pick' | 'number';
export type CheckInQuestion = { id: string; type: QuestionType; q: string; req: boolean; ends?: [string, string]; opts?: string[]; unit?: string };
export type Answer = number | string | string[] | null;

export const TYPE_LABEL: Record<QuestionType, [string, string]> = {
  mood: ['Mood', 'A slider from Rough to Great'],
  scale: ['1–5 scale', 'Five taps, with words at each end'],
  text: ['Written answer', 'A sentence or two'],
  pick: ['Tick any', 'A list they tick'],
  number: ['Number', 'Steps, waist, weight…'],
};
export const MOOD_WORDS = ['Rough', 'Low', 'Okay', 'Good', 'Great'];

export const DEFAULT_QUESTIONS: CheckInQuestion[] = [
  { id: 'mood', type: 'mood', q: 'How are you feeling overall?', req: true },
  { id: 'week', type: 'text', q: 'How was your week, in a few words?', req: false },
  { id: 'sleep', type: 'scale', q: 'Sleep', req: true, ends: ['Poor', 'Great'] },
  { id: 'energy', type: 'scale', q: 'Energy', req: true, ends: ['Flat', 'Buzzing'] },
  { id: 'stress', type: 'scale', q: 'Stress', req: true, ends: ['Calm', 'Maxed out'] },
  { id: 'food', type: 'scale', q: 'How was your food?', req: true, ends: ['Off track', 'Spot on'] },
  { id: 'wins', type: 'pick', q: 'What went well?', req: false, opts: ['Clothes fit better', 'More energy', 'Sleeping better', 'Lifting heavier', 'Feeling confident', 'Stuck to my plan'] },
  { id: 'weight', type: 'number', q: 'Weight, if you want to share it', req: false, unit: 'kg' },
  { id: 'help', type: 'pick', q: 'What would help most next week?', req: false, opts: ['Keep things as they are', 'More accountability', 'Help with food', 'Change my training', 'A call with my coach'] },
  { id: 'note', type: 'text', q: 'Anything else for your coach?', req: false },
];

// Checks a question list before it's saved: something to ask, sensible types,
// options where needed. Returns the cleaned list, or an error.
export function cleanQuestions(input: unknown): { ok: true; questions: CheckInQuestion[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || !input.length) return { ok: false, error: 'Add at least one question.' };
  if (input.length > 30) return { ok: false, error: 'Keep it to 30 questions or fewer.' };
  const out: CheckInQuestion[] = [], ids = new Set<string>();
  for (const raw of input) {
    const r = raw as Partial<CheckInQuestion>;
    const q = String(r.q ?? '').trim().slice(0, 200);
    if (!q) return { ok: false, error: 'Every question needs some words.' };
    if (!r.type || !(r.type in TYPE_LABEL)) return { ok: false, error: `“${q}” needs a type.` };
    const id = String(r.id ?? '').slice(0, 40) || `q${out.length + 1}`;
    if (ids.has(id)) return { ok: false, error: 'Two questions share an id.' };
    ids.add(id);
    const item: CheckInQuestion = { id, type: r.type, q, req: !!r.req };
    if (r.type === 'pick') {
      const opts = (r.opts ?? []).map(o => String(o).trim().slice(0, 80)).filter(Boolean);
      if (opts.length < 2) return { ok: false, error: `“${q}” needs at least two choices.` };
      item.opts = opts.slice(0, 12);
    }
    if (r.type === 'scale') item.ends = [String(r.ends?.[0] ?? 'Low').slice(0, 30), String(r.ends?.[1] ?? 'High').slice(0, 30)];
    if (r.type === 'number' && r.unit) item.unit = String(r.unit).slice(0, 10);
    out.push(item);
  }
  return { ok: true, questions: out };
}

// Checks a client's answers against the questions: required ones answered,
// values in range. Returns the cleaned answers, or an error naming the question.
export function cleanAnswers(questions: CheckInQuestion[], input: Record<string, unknown>): { ok: true; answers: Record<string, Answer> } | { ok: false; error: string } {
  const out: Record<string, Answer> = {};
  for (const q of questions) {
    const v = input[q.id];
    let a: Answer = null;
    if (q.type === 'mood' || q.type === 'scale') {
      const n = Number(v), max = q.type === 'mood' ? 4 : 5, min = q.type === 'mood' ? 0 : 1;
      a = v !== null && v !== undefined && v !== '' && Number.isInteger(n) && n >= min && n <= max ? n : null;
    } else if (q.type === 'text') {
      const t = String(v ?? '').trim().slice(0, 2000); a = t || null;
    } else if (q.type === 'number') {
      const t = String(v ?? '').trim().replace(',', '.');
      if (t && !/^\d+(\.\d+)?$/.test(t)) return { ok: false, error: `“${q.q}”: enter a number.` };
      a = t ? Number(t) : null;
    } else if (q.type === 'pick') {
      const picked = Array.isArray(v) ? v.map(String).filter(o => q.opts?.includes(o)) : [];
      a = picked.length ? picked : null;
    }
    if (q.req && (a === null)) return { ok: false, error: `Please answer “${q.q}”.` };
    out[q.id] = a;
  }
  return { ok: true, answers: out };
}

// One line per answer, for the coach's list and messages.
export function describeAnswer(q: CheckInQuestion, a: Answer): string {
  if (a === null || a === undefined) return '–';
  if (q.type === 'mood') return MOOD_WORDS[Number(a)] ?? '–';
  if (q.type === 'scale') return `${a} of 5${q.ends ? ` (${q.ends[0]} → ${q.ends[1]})` : ''}`;
  if (q.type === 'number') return `${a}${q.unit ? ` ${q.unit}` : ''}`;
  if (Array.isArray(a)) return a.join(', ');
  return String(a);
}
