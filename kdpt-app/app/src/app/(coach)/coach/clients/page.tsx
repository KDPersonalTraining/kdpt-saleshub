import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { DemoClients } from './demo-clients';
import { LiveClients, type LiveClient } from './live-clients';

export default async function ClientsPage() {
  if (isDemo()) return <DemoClients />;
  const me = await requireArea('coach');
  const supabase = await createClient();
  const [{ data: people }, { data: details }, { data: states }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, created_at').eq('org_id', me.orgId!).eq('role', 'client').is('archived_at', null).order('full_name'),
    supabase.from('client_details').select('client_id, coaching_type'),
    supabase.from('client_app_state').select('client_id, updated_at, state->onb->done'),
  ]);
  const rows: LiveClient[] = (people ?? []).map(p => {
    const st = (states ?? []).find(x => x.client_id === p.id) as { updated_at: string; done?: boolean } | undefined;
    return { id: p.id, name: p.full_name, type: (details ?? []).find(d => d.client_id === p.id)?.coaching_type ?? null, signedUp: !!st?.done, lastActive: st?.updated_at ?? null, added: p.created_at };
  });
  return <LiveClients rows={rows} />;
}
