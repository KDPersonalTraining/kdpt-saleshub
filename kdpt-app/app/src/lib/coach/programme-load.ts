import type { SupabaseClient } from '@supabase/supabase-js';
import type { EdProgramme } from '@/lib/programmes/edit';

type WoRow = { id: string; name: string; focus: string | null; phase: string | null; day_order: number; week_from: number | null; week_to: number | null;
  workout_exercises: { id: string; exercise_id: string; position: number; working_sets: number; rep_min: number; rep_max: number; rest_seconds: number; priority: EdProgramme['workouts'][number]['items'][number]['priority']; coach_note: string | null }[] };

// A programme (a client's or one of Kyle's own) in the shape the editor uses.
export async function loadForEditing(sb: SupabaseClient, id: string): Promise<EdProgramme | null> {
  const { data: prog } = await sb.from('programmes').select('id, name, weeks, starts_on').eq('id', id).maybeSingle();
  if (!prog) return null;
  const { data: wos } = await sb.from('workouts').select('id, name, focus, phase, day_order, week_from, week_to, workout_exercises(id, exercise_id, position, working_sets, rep_min, rep_max, rest_seconds, priority, coach_note)')
    .eq('programme_id', id).order('day_order');
  return {
    id: prog.id, name: prog.name, weeks: prog.weeks ?? 8, startsOn: prog.starts_on ?? new Date().toISOString().slice(0, 10),
    workouts: ((wos ?? []) as unknown as WoRow[]).map(w => ({
      id: w.id, name: w.name, focus: w.focus ?? '', phase: w.phase ?? '', weekFrom: w.week_from, weekTo: w.week_to,
      items: [...w.workout_exercises].sort((a, b) => a.position - b.position).map(x => ({
        id: x.id, exerciseId: x.exercise_id, sets: x.working_sets, repMin: x.rep_min, repMax: x.rep_max, rest: x.rest_seconds, priority: x.priority, note: x.coach_note ?? '' })),
    })),
  };
}
