import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { ensureLocations } from '@/lib/bookings/server';
import { createClient } from '@/lib/supabase/server';
import { DemoSchedule } from './demo-schedule';
import { LiveSchedule, type SchedBooking, type SchedRequest } from './live-schedule';

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  if (isDemo()) return <DemoSchedule />;
  const me = await requireArea('coach');
  const sb = await createClient();
  const from = new Date(Date.now() - 14 * 86400000).toISOString(), to = new Date(Date.now() + 70 * 86400000).toISOString();
  const [{ data: people }, locations, { data: bks }, { data: reqs }] = await Promise.all([
    sb.from('profiles').select('id, full_name').eq('org_id', me.orgId!).eq('role', 'client').is('archived_at', null).order('full_name'),
    ensureLocations(sb, me.orgId!),
    sb.from('bookings').select('id, client_id, starts_at, ends_at, status, location_id').gte('starts_at', from).lte('starts_at', to).order('starts_at'),
    sb.from('booking_change_requests').select('id, booking_id, client_id, requested_starts_at, client_note, created_at').eq('status', 'pending').order('created_at'),
  ]);
  const name = (id: string) => (people ?? []).find(p => p.id === id)?.full_name ?? 'Client';
  const loc = (id: string) => locations.find(l => l.id === id)?.name ?? '';
  const pendingFor = new Set((reqs ?? []).map(r => r.booking_id));
  const bookings: SchedBooking[] = (bks ?? []).map(b => ({ id: b.id, clientId: b.client_id, name: name(b.client_id), start: b.starts_at, end: b.ends_at, status: b.status, location: loc(b.location_id), pending: pendingFor.has(b.id) }));
  const requests: SchedRequest[] = (reqs ?? []).map(r => { const b = (bks ?? []).find(x => x.id === r.booking_id); return { id: r.id, name: name(r.client_id), from: b?.starts_at ?? null, to: r.requested_starts_at, note: r.client_note }; });
  return <LiveSchedule clients={(people ?? []).map(p => ({ id: p.id, name: p.full_name }))} locations={locations} bookings={bookings} requests={requests} initialClient={(await searchParams).c ?? null} />;
}
