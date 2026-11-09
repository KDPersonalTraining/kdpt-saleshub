import type { ClientOption } from '@/components/coach/assign';
import { requireArea } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

// Every client with the programme they're on now.
export async function clientOptions(): Promise<ClientOption[]> {
  const me = await requireArea('coach');
  const sb = await createClient();
  const [{ data: people }, { data: progs }] = await Promise.all([
    sb.from('profiles').select('id, full_name').eq('org_id', me.orgId!).eq('role', 'client').is('archived_at', null).order('full_name'),
    sb.from('programmes').select('client_id, name').eq('status', 'active').not('client_id', 'is', null),
  ]);
  return (people ?? []).map(p => ({ id: p.id, name: p.full_name, programme: (progs ?? []).find(x => x.client_id === p.id)?.name ?? null }));
}
