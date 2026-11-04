'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { InviteModal } from '@/components/coach/invite';
import { Head, Tag } from '@/components/coach/ui';
import { addClient } from './actions';

export type LiveClient = { id: string; name: string; type: string | null; signedUp: boolean; lastActive: string | null; added: string };
const TYPE: Record<string, string> = { in_person: 'In-person', hybrid: 'Hybrid', online: 'Online' };
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '–');

// The coach's real clients, from the database.
export function LiveClients({ rows }: { rows: LiveClient[] }) {
  const [invite, setInvite] = useState(false);
  return (
    <>
      <Head title="Clients" sub={`${rows.length} client${rows.length === 1 ? '' : 's'}`}><button className="btn mint" onClick={() => setInvite(true)}><Icon name="plus" className="sm" />Add client</button></Head>
      <div className="card ctable">
        <div className="crow th live"><span>Client</span><span>Coaching</span><span>Signed up</span><span>Last active</span><span /></div>
        {rows.map(c => (
          <Link key={c.id} className="crow live" href={`/coach/clients/${c.id}`}>
            <span className="nm"><span className="av" style={{ background: 'var(--s3)', color: 'var(--fg2)' }}>{c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span><span><b>{c.name}</b><small>Added {when(c.added)}</small></span></span>
            <span style={{ color: 'var(--fg2)' }}>{c.type ? TYPE[c.type] : '–'}</span>
            <span>{c.signedUp ? <Tag c="mint" icon="check">Done</Tag> : <Tag c="amber">Not yet</Tag>}</span>
            <span style={{ color: 'var(--fg2)' }}>{when(c.lastActive)}</span>
            <span style={{ color: 'var(--fg3)' }}><Icon name="right" className="sm" /></span>
          </Link>
        ))}
        {!rows.length && <p style={{ padding: 20, color: 'var(--fg3)' }}>No clients yet. Add your first one: they&apos;ll get an email with a sign-in code.</p>}
      </div>
      {invite && <InviteModal onClose={() => setInvite(false)} onSend={addClient} />}
    </>
  );
}
