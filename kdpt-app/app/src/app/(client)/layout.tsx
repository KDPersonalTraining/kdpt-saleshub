import { requireArea } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { ClientShell } from '@/components/client/shell';
import { LiveProvider } from '@/lib/client/live';
import { loadLive } from '@/lib/client/load-live';
import './client.css';
import './ds.css';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const me = await requireArea('client');
  if (me.demo) return <LiveProvider value={null}><ClientShell me={me}>{children}</ClientShell></LiveProvider>;
  // Live: load the client's saved copy. No copy yet means they haven't signed up.
  const supabase = await createClient();
  const [{ data }, live] = await Promise.all([
    supabase.from('client_app_state').select('state').eq('client_id', me.id).maybeSingle(),
    loadLive(supabase, { id: me.id, orgId: me.orgId! }),
  ]);
  return (
    <LiveProvider value={live}>
      <ClientShell me={{ ...me, isNew: !data }} remote={{ orgId: me.orgId!, state: data?.state ?? null }}>{children}</ClientShell>
    </LiveProvider>
  );
}
