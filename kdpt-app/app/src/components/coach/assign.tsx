'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { assignStarter } from '@/app/(coach)/coach/programmes/actions';
import { STARTERS, starterByKey } from '@/lib/programmes/starters';
import { useToast } from './shell';
import { Modal } from './ui';

export type ClientOption = { id: string; name: string; programme: string | null };

// Next Monday, or today if it is Monday: the natural day to start a week 1.
const nextMonday = () => {
  const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Give a starter programme to a client. Either can be fixed in advance (from a
// starter's page, or a client's record).
export function AssignModal({ clients, fixedKey, fixedClient, demo, onClose }: {
  clients: ClientOption[]; fixedKey?: string; fixedClient?: string; demo?: boolean; onClose: () => void;
}) {
  const toast = useToast(), router = useRouter();
  const [key, setKey] = useState(fixedKey ?? STARTERS[0].key);
  const [client, setClient] = useState(fixedClient ?? clients[0]?.id ?? '');
  const [start, setStart] = useState(nextMonday);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const cur = clients.find(c => c.id === client), st = starterByKey(key)!;
  const go = async () => {
    if (demo) { toast('Demo: nothing is saved. In the live app, this gives them the programme.'); onClose(); return; }
    setBusy(true); setErr(null);
    const e = await assignStarter({ clientId: client, key, startsOn: start });
    setBusy(false);
    if (e) { setErr(e); return; }
    toast(`${st.name} given to ${cur?.name.split(' ')[0] ?? 'your client'}. It’s on their Train screen now.`);
    router.refresh(); onClose();
  };
  return (
    <Modal title="Give a programme" onClose={onClose}>
      <div className="fields">
        {!fixedKey && <label className="full">Programme<select value={key} onChange={e => setKey(e.target.value)}>{STARTERS.map(s => <option key={s.key} value={s.key}>{s.name} · {s.weeks} weeks · {s.daysPerWeek}</option>)}</select></label>}
        {!fixedClient && <label className="full">Client<select value={client} onChange={e => setClient(e.target.value)}>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.programme ? ` (on ${c.programme})` : ''}</option>)}</select></label>}
        <label className="full">Week 1 starts<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
      </div>
      {!clients.length && !fixedClient && <p className="muted" style={{ margin: 0 }}>Add a client first, on the Clients page.</p>}
      {cur?.programme && <p style={{ margin: 0, color: 'var(--amber)', fontSize: 13 }}>{cur.name.split(' ')[0]} is on {cur.programme}. That one is archived (their logged workouts stay) and this replaces it.</p>}
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>They get their own copy, so you can change it for them later without changing the starter.</p>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn line" onClick={onClose}>Cancel</button>
        <button className="btn mint" disabled={busy || !client || !start} onClick={go}>{busy ? 'Saving…' : `Give ${st.name}`}</button></div>
    </Modal>
  );
}
