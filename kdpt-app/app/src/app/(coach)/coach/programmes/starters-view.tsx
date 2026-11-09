'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { AssignModal, type ClientOption } from '@/components/coach/assign';
import { Head, Sec, Tag } from '@/components/coach/ui';
import { STARTERS, phasesOf } from '@/lib/programmes/starters';

// Kyle's starter programmes, and who is on what.
export function StartersView({ clients, demo }: { clients: ClientOption[]; demo: boolean }) {
  const [assign, setAssign] = useState<string | null>(null);
  const onOne = clients.filter(c => c.programme);
  return (
    <>
      <Head title="Programmes" sub="Starter programmes to give to clients. Each client gets their own copy, so changing one person’s plan never changes anyone else’s." />
      <div className="cards3">{STARTERS.map(s => (
        <div className="card prog" key={s.key}>
          <div><b>{s.name}</b><small>{s.level} · {s.weeks} weeks · {s.daysPerWeek}</small></div>
          <p style={{ margin: 0, color: 'var(--fg2)', fontSize: 13, lineHeight: 1.5 }}>{s.summary}</p>
          {phasesOf(s).length > 1 && <small>{phasesOf(s).length} phases: {phasesOf(s).map(p => p[0]).join(' → ')}</small>}
          <div className="foot"><Link className="btn line" href={`/coach/programmes/starter/${s.key}`}>View</Link>
            <button className="btn mint" onClick={() => setAssign(s.key)}>Give to a client</button></div>
        </div>
      ))}</div>

      <section>
        <Sec title="Who’s on what" right={`${onOne.length} of ${clients.length} clients`} />
        <div className="card">{clients.length ? clients.map(c => (
          <Link key={c.id} href={`/coach/clients/${c.id}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto 20px', gap: 12, alignItems: 'center', padding: '14px 18px', borderTop: '1px solid var(--hair)' }}>
            <b style={{ fontWeight: 600 }}>{c.name}</b>{c.programme ? <Tag c="mint">{c.programme}</Tag> : <Tag c="amber">No programme yet</Tag>}<Icon name="right" className="sm" />
          </Link>
        )) : <p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>No clients yet. Add one on the Clients page, then give them a programme here.</p>}</div>
      </section>
      {assign && <AssignModal clients={clients} fixedKey={assign} demo={demo} onClose={() => setAssign(null)} />}
    </>
  );
}
