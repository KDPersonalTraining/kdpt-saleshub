'use server';

import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export type ExerciseInput = { id?: string; name: string; pattern: string; load: string; measure: 'reps' | 'distance'; inc: number; muscles: string; cues: string };
const PATTERNS = ['squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'carry', 'core_anti_extension', 'core_anti_rotation', 'core_flexion', 'isolation_upper', 'isolation_lower', 'conditioning', 'mobility'];
const LOADS = ['barbell', 'dumbbell', 'kettlebell', 'machine_stack', 'machine_plate', 'cable', 'bodyweight', 'band', 'smith', 'other'];
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

// Kyle adds or changes an exercise in his library.
export async function saveExercise(v: ExerciseInput): Promise<string | null> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return 'Only the coach can change the library.';
  const name = v.name.trim().slice(0, 60);
  if (!name) return 'Give it a name.';
  if (!PATTERNS.includes(v.pattern)) return 'Choose a movement.';
  if (!LOADS.includes(v.load)) return 'Choose the equipment.';
  const cardio = v.measure === 'distance';
  const inc = cardio || v.load === 'bodyweight' ? 0 : Number(v.inc);
  if (!(inc >= 0 && inc <= 50)) return 'The weight jump must be 0 to 50 kg.';
  const row = { name, movement_pattern: v.pattern, load_type: v.load, measure: v.measure, load_increment_kg: inc,
    primary_muscles: v.muscles.split(',').map(m => m.trim()).filter(Boolean).slice(0, 6), cues: v.cues.split('\n').map(c => c.trim()).filter(Boolean).slice(0, 8) };
  const sb = await createClient();
  const { error } = v.id ? await sb.from('exercises').update(row).eq('id', v.id).eq('org_id', me.orgId)
    : await sb.from('exercises').insert({ ...row, org_id: me.orgId, slug: `${slugify(name)}-${Date.now().toString(36)}` });
  revalidatePath('/coach/library');
  return error ? 'Couldn’t save. Try again.' : null;
}

// Removed exercises stay on old programmes and logs; they just can't be added again.
export async function archiveExercise(id: string): Promise<string | null> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return 'Only the coach can change the library.';
  const { error } = await (await createClient()).from('exercises').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('org_id', me.orgId);
  revalidatePath('/coach/library');
  return error ? 'Couldn’t remove it. Try again.' : null;
}
