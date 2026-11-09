import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { ensureLibrary } from '@/lib/coach/library';
import { createClient } from '@/lib/supabase/server';
import { DemoLibrary } from './demo-library';
import { LiveLibrary } from './live-library';

export default async function LibraryPage() {
  if (isDemo()) return <DemoLibrary />;
  const me = await requireArea('coach');
  const sb = await createClient();
  await ensureLibrary(sb, me.orgId!);
  const { data } = await sb.from('exercises').select('id, name, movement_pattern, load_type, measure, load_increment_kg, primary_muscles, cues').eq('org_id', me.orgId!).is('archived_at', null).order('name');
  return <LiveLibrary rows={(data ?? []).map(e => ({ id: e.id, name: e.name, pattern: e.movement_pattern, load: e.load_type, measure: e.measure === 'distance' ? 'distance' : 'reps', inc: Number(e.load_increment_kg), muscles: (e.primary_muscles ?? []).join(', '), cues: (e.cues ?? []).join('\n') }))} />;
}
