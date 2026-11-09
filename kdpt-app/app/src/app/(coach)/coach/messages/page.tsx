import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { DemoMessages } from './demo-messages';
import { LiveMessages } from './live-messages';

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  if (isDemo()) return <DemoMessages />;
  const me = await requireArea('coach');
  const sb = await createClient();
  const { data } = await sb.from('profiles').select('id, full_name').eq('org_id', me.orgId!).eq('role', 'client').is('archived_at', null).order('full_name');
  return <LiveMessages coachId={me.id} orgId={me.orgId!} clients={(data ?? []).map(p => ({ id: p.id, name: p.full_name }))} initial={(await searchParams).c ?? null} />;
}
