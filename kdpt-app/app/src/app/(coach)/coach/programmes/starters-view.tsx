'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { AssignModal, type ClientOption, type MyProgramme } from '@/components/coach/assign';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/coach/ui';
import { newTemplate } from './actions';
import { Head, Sec, Tag } from '@/components/coach/ui';
import { STARTERS, phasesOf } from '@/lib/programmes/starters';

// Kyle's starter programmes, and who is on what.
export function StartersView({ clients, demo, mine = [] }: { clients: ClientOption[]; demo: boolean; mine?: MyProgramme[] }) {
  const [assign, setAssign] = useState<string | null>(null);
  const [making, setMaking] = useState(false);
  const onOne = clients.filter(c => c.programme);
  return (
    <>
      <Head title="Programmes" sub="Give a programme to a client and they get their own copy, so changing one person’s plan never changes anyone else’s.">
        {!demo && <button className="btn mint" onClick={() => setMaking(true)}><Icon name="plus" className="sm" />New programme</button>}</Head>
      {!demo && (
        <section><Sec title="My programmes" right={mine.length ? `${mine.length}` : undefined} />
          {mine.length ? <div className="cards3">{mine.map(m => (
            <div className="card prog" key={m.id}><div><b>{m.name}</b><small>{m.weeks ? `${m.weeks} weeks · ` : ''}{m.workouts} workout{m.workouts === 1 ? '' : 's'}</small></div>
              <div className="foot"><Link className="btn line" href={`/coach/programmes/mine/${m.id}`}>Edit</Link><button className="btn mint" onClick={() => setAssign(`mine:${m.id}`)}>Give to a client</button></div></div>
          ))}</div> : <div className="card"><p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>Build your own from scratch or from a starter, or save any client’s programme here from their programme page.</p></div>}
        </section>
      )}
      <Sec title="Starters" />
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
      {assign && <AssignModal clients={clients} fixedKey={assign} demo={demo} mine={mine} onClose={() => setAssign(null)} />}
      {making && <NewModal onClose={() => setMaking(false)} />}
    </>
  );
}

function NewModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(''), [from, setFrom] = useState(''), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  return (
    <Modal title="New programme" onClose={onClose}>
      <div className="fields">
        <label className="full">Name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Glute Focus, 6 weeks" autoFocus /></label>
        <label className="full">Start from<select value={from} onChange={e => setFrom(e.target.value)}><option value="">Nothing: I’ll build it</option>{STARTERS.map(s => <option key={s.key} value={s.key}>A copy of {s.name}</option>)}</select></label>
      </div>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn line" onClick={onClose}>Cancel</button>
        <button className="btn mint" disabled={busy || !name.trim()} onClick={async () => { setBusy(true); const r = await newTemplate({ name, fromStarter: from || null }); setBusy(false); if (r.error) setErr(r.error); else router.push(`/coach/programmes/mine/${r.id}`); }}>{busy ? 'Creating…' : 'Create and edit'}</button></div>
    </Modal>
  );
}
