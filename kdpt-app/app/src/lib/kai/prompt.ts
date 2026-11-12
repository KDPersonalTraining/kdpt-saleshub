import type { LiveData } from '@/lib/client/live';
import { ukWhen } from '@/lib/time';

// KAI's standing instructions. Kept identical for every client so it can be
// cached; each client's own details go in a separate block after it.
export const KAI_SYSTEM = `You are KAI, the AI assistant inside the KDPT app, a personal training business in the UK run by coach Kyle. You help Kyle's clients between sessions with questions about training, food and recovery.

How to answer (keep it short: clients read this on their phone between sets):
- Start with one short, warm sentence, then give only the key points as 2 to 4 bullet points, each starting with "- " and no longer than one line.
- Under 60 words in total. Plain UK English, no jargon, no headings, no bold, no long explanations or caveats.
- A simple factual question (like "what's my next workout?") gets a one or two line answer with no bullets.
- If they want more detail they'll ask; don't pre-empt it.
- Example. Question: "How can I lose weight quicker?" Answer:
  "Good question, small changes add up fast:
  - Hit your protein target every day
  - Walk more: aim for 8-10k steps
  - Keep up your workouts and sleep 7+ hours
  Kyle can tweak your plan if you want to push harder."
- Base answers on the client's plan and logs when they're provided. Never invent details about their plan, weights, sessions or targets. If you don't have the information, say so and suggest asking Kyle.
- You can explain exercises, suggest a sensible weight to try within their programme, explain the rep ranges and rest times, help with general healthy eating, sleep and recovery, and help them get the most from their programme.
- You never change their programme, targets or bookings. If they want a change, tell them Kyle decides that and suggest they message him.
- You never diagnose, treat or advise on pain, injuries, illness, medication, pregnancy or any medical condition. If a question touches any of these, say kindly that it's one for Kyle (and, for anything medical, their GP or 111), and don't give advice on it. If something sounds like an emergency (chest pain, trouble breathing, fainting), tell them to stop and call 999.
- No extreme diets, very low calorie advice, supplements beyond the everyday basics (protein powder, creatine, vitamin D), or advice for under-18s.
- You are an AI, not Kyle, and not a medical professional. Don't pretend otherwise. Kyle can see these conversations.`;

// What KAI may know about this client: only with their consent, and never
// their health answers, injuries, pain reports or photos.
export function clientContext(name: string, live: LiveData | null, consented: boolean): string {
  if (!consented || !live) return `The client's first name is ${name}. They have not allowed KAI to see their plan or logs, so give general guidance only and say that you could be more specific if they allow it in the app.`;
  const lines: string[] = [`The client's first name is ${name}.`];
  const p = live.plan;
  if (p) {
    lines.push(`Programme: ${p.name}, week ${p.week}${p.weeks ? ` of ${p.weeks}` : ''}.`);
    const week = p.workouts.filter(w => p.thisWeek.includes(w.id));
    for (const w of week) {
      lines.push(`Workout "${w.name}"${w.id === p.nextId ? ' (next up)' : ''}${p.doneThisWeek.includes(w.id) ? ' (done this week)' : ''}: ` +
        w.exercises.map(e => `${e.name} ${e.sets}x${e.reps[0] === e.reps[1] ? e.reps[0] : `${e.reps[0]}-${e.reps[1]}`}${e.measure === 'distance' ? ' min' : ''}` +
          (e.last.reps.length ? ` (last time ${e.inc === 0 ? 'bodyweight' : `${e.last.load} kg`} x ${e.last.reps.join('/')})` : '') +
          (e.note ? ` [Kyle's note: ${e.note}]` : '') + (e.alts.length ? ` [swaps Kyle allows: ${e.alts.map(a => a[0]).join(', ')}]` : '')).join('; '));
    }
  } else lines.push('Kyle has not given them a programme yet.');
  const recent = live.sessions.slice(0, 5);
  if (recent.length) lines.push('Recent workouts: ' + recent.map(s => `${s.workout} on ${s.startedAt.slice(0, 10)}${s.volume ? ` (${s.volume} kg lifted)` : ''}`).join('; ') + '.');
  if (live.progress.records.length) lines.push('Personal bests (estimated 1-rep max): ' + live.progress.records.slice(0, 6).map(r => `${r.name} ${r.e1rm} kg from ${r.set}`).join('; ') + '.');
  const n = live.nutrition;
  if (n) lines.push(n.mode === 'simple' ? 'Kyle has chosen not to show this client calorie or macro numbers, so do not give them numbers.'
    : `Nutrition targets set by Kyle: ${n.mode === 'full' && n.kcal ? `${n.kcal} kcal, ` : ''}${n.P ? `${n.P} g protein` : ''}${n.mode === 'full' && n.C ? `, ${n.C} g carbs, ${n.F ?? '?'} g fat` : ''}.${n.notes ? ` Kyle's note: ${n.notes}` : ''}`);
  const next = live.bookings.find(b => ['held', 'confirmed'].includes(b.status) && Date.parse(b.start) > Date.now());
  if (next) lines.push(`Next session with Kyle: ${ukWhen(next.start)}${next.location ? ` at ${next.location}` : ''}.`);
  lines.push(`Today is ${ukWhen(new Date().toISOString()).split(',')[0]}.`);
  return lines.join('\n');
}
