import type { SupabaseClient } from '@supabase/supabase-js';
import type { LibExercise } from '@/lib/programmes/edit';
import { EXERCISES } from '@/lib/programmes/starters';

// Makes sure every exercise in the starter library is in Kyle's library, then
// returns the whole library. Run as the coach (staff can write exercises).
export async function ensureLibrary(sb: SupabaseClient, orgId: string): Promise<(LibExercise & { slug: string })[] | null> {
  const { data: have } = await sb.from('exercises').select('slug').eq('org_id', orgId);
  const missing = EXERCISES.filter(e => !(have ?? []).some(h => h.slug === e.slug));
  if (missing.length) {
    const { error } = await sb.from('exercises').upsert(missing.map(e => ({
      org_id: orgId, slug: e.slug, name: e.name, movement_pattern: e.pattern, load_type: e.load, primary_muscles: e.muscles,
      load_increment_kg: e.inc, setup_minutes: e.setup, cues: e.cues, measure: e.measure ?? 'reps',
    })), { onConflict: 'org_id,slug' });
    if (error) return null;
  }
  const { data } = await sb.from('exercises').select('id, slug, name, movement_pattern, measure, primary_muscles').eq('org_id', orgId).is('archived_at', null).order('name');
  return (data ?? []).map(e => ({ id: e.id, slug: e.slug, name: e.name, pattern: e.movement_pattern, measure: e.measure === 'distance' ? 'distance' : 'reps', muscles: e.primary_muscles ?? [] }));
}
