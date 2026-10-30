import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions';

export default async function CoachToday() {
  const me = (await getMe())!;
  const supabase = await createClient();
  // Row-level security limits this to the coach's own organisation.
  const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client').is('archived_at', null);
  return (
    <main className="page" style={{ maxWidth: 960 }}>
      <div className="top">
        <img src="/kd-mark.png" alt="KD Personal Training" />
        <form action={signOut}><button className="muted">Sign out</button></form>
      </div>
      <div>
        <div className="eyebrow">Coach · {me.role === 'coach' ? 'Head coach' : 'Assistant coach'}</div>
        <h1>Today</h1>
      </div>
      <div className="card row">
        <span className="tile" style={{ color: 'var(--sky)', borderColor: 'var(--sky)' }}>{count ?? 0}</span>
        <span><b>Active clients</b><br /><small>Invite clients from the Clients page once it&apos;s built.</small></span>
      </div>
    </main>
  );
}
