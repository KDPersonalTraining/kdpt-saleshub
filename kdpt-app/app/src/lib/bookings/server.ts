import type { SupabaseClient } from '@supabase/supabase-js';

// The business's places to train. A first one ("Studio") is made when needed.
export async function ensureLocations(sb: SupabaseClient, orgId: string): Promise<{ id: string; name: string }[]> {
  const { data } = await sb.from('locations').select('id, name').eq('org_id', orgId).eq('active', true).order('name');
  if (data?.length) return data;
  const { data: made } = await sb.from('locations').insert({ org_id: orgId, name: 'Studio' }).select('id, name');
  return made ?? [];
}
