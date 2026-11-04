import { requireArea } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { ClientShell } from '@/components/client/shell';
import './client.css';
import './ds.css';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const me = await requireArea('client');
  if (me.demo) return <ClientShell me={me}>{children}</ClientShell>;
  // Live: load the client's saved copy. No copy yet means they haven't signed up.
  const supabase = await createClient();
  const { data } = await supabase.from('client_app_state').select('state').eq('client_id', me.id).maybeSingle();
  return <ClientShell me={{ ...me, isNew: !data }} remote={{ orgId: me.orgId!, state: data?.state ?? null }}>{children}</ClientShell>;
}
