import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { DemoProfile } from './demo-profile';
import { LiveProfile } from './live-profile';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemo()) return <DemoProfile id={id} />;
  await requireArea('coach');
  const supabase = await createClient();
  const [{ data: p }, { data: d }, { data: st }, { data: onb }, { data: cons }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, created_at').eq('id', id).eq('role', 'client').maybeSingle(),
    supabase.from('client_details').select('coaching_type, started_on').eq('client_id', id).maybeSingle(),
    supabase.from('client_app_state').select('state, updated_at').eq('client_id', id).maybeSingle(),
    supabase.from('onboarding_responses').select('answers, submitted_at').eq('client_id', id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('current_consents').select('kind, granted').eq('client_id', id),
  ]);
  if (!p) notFound();
  return <LiveProfile name={p.full_name} added={p.created_at} type={d?.coaching_type ?? null} lastActive={st?.updated_at ?? null}
    state={(st?.state ?? null) as Record<string, unknown> | null} answers={(onb?.answers ?? null) as Record<string, unknown> | null} submitted={onb?.submitted_at ?? null}
    consents={(cons ?? []) as { kind: string; granted: boolean }[]} />;
}
