'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { InviteModal } from '@/components/coach/invite';
import { Avatar, Head, Tag } from '@/components/coach/ui';
import { CLIENTS } from '@/lib/coach/sample-data';

export default function Clients() {
  const [f, setF] = useState('All');
  const [q, setQ] = useState('');
  const [invite, setInvite] = useState(false);
  const list = CLIENTS.filter(c => (f === 'All' || c.type === f) && c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Head title="Clients" sub={`${CLIENTS.length} active`}><button className="btn mint" onClick={() => setInvite(true)}><Icon name="plus" className="sm" />Add client</button></Head>
      <div className="toolbar">
        <div className="chips">{['All', 'In-person', 'Hybrid', 'Online'].map(x => <button key={x} className={`chipbtn ${f === x ? 'on' : ''}`} onClick={() => setF(x)}>{x}</button>)}</div>
        <label className="search"><Icon name="search" className="sm" /><input placeholder="Search clients" value={q} onChange={e => setQ(e.target.value)} aria-label="Search clients" /></label>
      </div>
      <div className="card ctable">
        <div className="crow th"><span>Client</span><span>Programme</span><span>Adherence</span><span>Last workout</span><span>Status</span><span /></div>
        {list.map(c => { const col = c.adh >= 85 ? 'var(--mint)' : c.adh >= 65 ? 'var(--amber)' : 'var(--coral)'; return (
          <Link key={c.id} className="crow" href={`/coach/clients/${c.id}`}>
            <span className="nm"><Avatar c={c} /><span><b>{c.name}</b><small>{c.type} · {c.pkg}</small></span></span>
            <span style={{ color: 'var(--fg2)' }}>{c.prog}</span>
            <span className="meter num"><span className="track"><i style={{ width: `${c.adh}%`, background: col }} /></span>{c.adh}%</span>
            <span style={{ color: 'var(--fg2)' }}>{c.last}</span>
            <span><Tag c={c.status[0]}>{c.status[1]}</Tag></span>
            <span style={{ color: 'var(--fg3)' }}><Icon name="right" className="sm" /></span>
          </Link>
        ); })}
        {!list.length && <p style={{ padding: 20, color: 'var(--fg3)' }}>No clients match.</p>}
      </div>
      {invite && <InviteModal onClose={() => setInvite(false)} />}
    </>
  );
}
