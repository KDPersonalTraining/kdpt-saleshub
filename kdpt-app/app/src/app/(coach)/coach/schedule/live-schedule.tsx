'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Head, Modal, Sec, Tag } from '@/components/coach/ui';
import { COACH_LABEL, shownState } from '@/lib/bookings/states';
import { prettyDate } from '@/lib/programmes/plan';
import { isoToUk, ukWhen } from '@/lib/time';
import { addLocation, addSessions, decideChange, setSession } from './actions';

export type SchedBooking = { id: string; clientId: string; name: string; start: string; end: string; status: string; location: string; pending: boolean };
export type SchedRequest = { id: string; name: string; from: string | null; to: string; note: string | null };
const row = { display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--hair)' } as const;
const field = { background: 'var(--s1)', border: '1px solid var(--hair)', borderRadius: 8, padding: '0 10px', height: 40, color: 'var(--fg)', font: 'inherit' } as const;

// Kyle's diary: requests to answer, sessions coming up (by day), and past
// sessions waiting for "done" or "no-show".
export function LiveSchedule({ clients, locations, bookings, requests, initialClient }: {
  clients: { id: string; name: string }[]; locations: { id: string; name: string }[]; bookings: SchedBooking[]; requests: SchedRequest[]; initialClient: string | null;
}) {
  const toast = useToast(), router = useRouter();
  const [adding, setAdding] = useState(!!initialClient);
  const [req, setReq] = useState<SchedRequest | null>(null);
  const [act, setAct] = useState<SchedBooking | null>(null);
  const now = Date.now();
  const live = bookings.filter(b => ['held', 'confirmed'].includes(b.status));
  const upcoming = live.filter(b => Date.parse(b.end) >= now);
  const toClose = live.filter(b => Date.parse(b.end) < now && b.status === 'confirmed');
  const days = [...new Set(upcoming.map(b => isoToUk(b.start).date))];
  const ok = (m: string) => { toast(m); router.refresh(); };
  return (
    <>
      <Head title="Schedule" sub={`${upcoming.length} session${upcoming.length === 1 ? '' : 's'} coming up`}>
        <button className="btn mint" onClick={() => setAdding(true)}><Icon name="plus" className="sm" />Add sessions</button></Head>

      {requests.length > 0 && (
        <section><Sec title="Asked to move" right={`${requests.length}`} />
          <div className="card">{requests.map(r => (
            <button key={r.id} style={{ ...row, gridTemplateColumns: 'minmax(0,1fr) auto', width: '100%', textAlign: 'left' }} onClick={() => setReq(r)}>
              <span><b>{r.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{r.from ? `${ukWhen(r.from)} → ` : ''}<b style={{ color: 'var(--fg)' }}>{ukWhen(r.to)}</b>{r.note ? ` · “${r.note}”` : ''}</small></span>
              <Tag c="violet">Answer</Tag></button>
          ))}</div></section>
      )}

      {toClose.length > 0 && (
        <section><Sec title="How did these go?" />
          <div className="card">{toClose.map(b => (
            <div key={b.id} style={row}><span className="num">{isoToUk(b.start).time}</span>
              <span><b>{b.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{ukWhen(b.start)} · {b.location}</small></span>
              <span style={{ display: 'flex', gap: 6 }}><button className="btn ghost" onClick={async () => { const e = await setSession(b.id, 'completed'); if (e) toast(e); else ok('Marked as done'); }}>Done</button>
                <button className="btn line" onClick={async () => { const e = await setSession(b.id, 'no_show'); if (e) toast(e); else ok('Marked as a no-show'); }}>No-show</button></span></div>
          ))}</div></section>
      )}

      <section><Sec title="Coming up" />
        {days.length ? days.map(d => (
          <div key={d} style={{ marginBottom: 14 }}><div className="muted" style={{ fontSize: 13, margin: '0 0 6px 4px' }}>{prettyDate(d)}</div>
            <div className="card">{upcoming.filter(b => isoToUk(b.start).date === d).map(b => { const [l, c] = COACH_LABEL[shownState(b, b.pending)]; return (
              <button key={b.id} style={{ ...row, width: '100%', textAlign: 'left' }} onClick={() => setAct(b)}>
                <span className="num">{isoToUk(b.start).time}<small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60000)} min</small></span>
                <span><b>{b.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{b.location}</small></span><Tag c={c}>{l}</Tag></button>
            ); })}</div></div>
        )) : <div className="card"><p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>Nothing booked. Add sessions for a client, once or every week.</p></div>}
      </section>

      <Locations locations={locations} onAdded={() => ok('Place added')} />
      {adding && <AddModal clients={clients} locations={locations} initialClient={initialClient} onClose={() => setAdding(false)} onDone={m => { setAdding(false); ok(m); }} />}
      {req && <RequestModal r={req} onClose={() => setReq(null)} onDone={m => { setReq(null); ok(m); }} />}
      {act && <SessionModal b={act} onClose={() => setAct(null)} onDone={m => { setAct(null); ok(m); }} />}
    </>
  );
}

const nextHour = () => { const d = new Date(Date.now() + 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function AddModal({ clients, locations, initialClient, onClose, onDone }: { clients: { id: string; name: string }[]; locations: { id: string; name: string }[]; initialClient: string | null; onClose: () => void; onDone: (m: string) => void }) {
  const [v, setV] = useState({ clientId: initialClient ?? clients[0]?.id ?? '', date: nextHour(), time: '07:00', minutes: 60, locationId: locations[0]?.id ?? '', weeks: 1, needsOk: true, message: true });
  const [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const go = async () => {
    setBusy(true); setErr(null);
    const r = await addSessions(v);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    if (r.clashes.length && !r.added) { setErr(`Not added: you already have something at ${r.clashes.join(', ')}.`); return; }
    onDone(`${r.added} session${r.added === 1 ? '' : 's'} added${r.clashes.length ? `. Skipped (clash or past): ${r.clashes.join(', ')}` : ''}`);
  };
  return (
    <Modal title="Add sessions" onClose={onClose}>
      <div className="fields">
        <label className="full">Client<select value={v.clientId} onChange={e => setV({ ...v, clientId: e.target.value })}>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Date<input type="date" value={v.date} onChange={e => setV({ ...v, date: e.target.value })} /></label>
        <label>Time<input type="time" step={900} value={v.time} onChange={e => setV({ ...v, time: e.target.value })} /></label>
        <label>Length<select value={v.minutes} onChange={e => setV({ ...v, minutes: +e.target.value })}>{[30, 45, 60, 75, 90].map(m => <option key={m} value={m}>{m} min</option>)}</select></label>
        <label>Where<select value={v.locationId} onChange={e => setV({ ...v, locationId: e.target.value })}>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        <label className="full">Repeat<select value={v.weeks} onChange={e => setV({ ...v, weeks: +e.target.value })}>{[1, 2, 3, 4, 5, 6, 8, 10, 12].map(w => <option key={w} value={w}>{w === 1 ? 'Just this once' : `Same time for ${w} weeks`}</option>)}</select></label>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}><input type="checkbox" checked={v.needsOk} onChange={e => setV({ ...v, needsOk: e.target.checked })} />Ask them to confirm in the app (otherwise it’s confirmed now)</label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}><input type="checkbox" checked={v.message} onChange={e => setV({ ...v, message: e.target.checked })} />Send them a message about it</label>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn line" onClick={onClose}>Cancel</button>
        <button className="btn mint" disabled={busy || !v.clientId || !v.locationId} onClick={go}>{busy ? 'Adding…' : v.weeks > 1 ? `Add ${v.weeks} sessions` : 'Add session'}</button></div>
    </Modal>
  );
}

function RequestModal({ r, onClose, onDone }: { r: SchedRequest; onClose: () => void; onDone: (m: string) => void }) {
  const [reply, setReply] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const go = async (approve: boolean) => { setBusy(true); setErr(null); const e = await decideChange(r.id, approve, reply); setBusy(false); if (e) setErr(e); else onDone(approve ? 'Moved. They’ve been told.' : 'Declined. They’ve been told.'); };
  return (
    <Modal title={`${r.name} asked to move`} onClose={onClose}>
      <div className="kv"><span>Now</span><b>{r.from ? ukWhen(r.from) : '–'}</b><span>Asked for</span><b>{ukWhen(r.to)}</b>{r.note && <><span>Their note</span><b>{r.note}</b></>}</div>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--fg3)' }}>Note to them (optional)<input style={field} value={reply} onChange={e => setReply(e.target.value)} placeholder="e.g. Could you do 7:30 instead?" /></label>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn line" disabled={busy} onClick={() => go(false)}>Decline</button><button className="btn mint" disabled={busy} onClick={() => go(true)}>Move it</button></div>
    </Modal>
  );
}

function SessionModal({ b, onClose, onDone }: { b: SchedBooking; onClose: () => void; onDone: (m: string) => void }) {
  const [note, setNote] = useState(''), [busy, setBusy] = useState(false), [sure, setSure] = useState(false);
  const [l] = COACH_LABEL[shownState(b, b.pending)];
  return (
    <Modal title={`${b.name} · ${ukWhen(b.start)}`} onClose={onClose}>
      <div className="kv"><span>Where</span><b>{b.location}</b><span>Length</span><b>{Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60000)} min</b><span>Status</span><b>{l}</b></div>
      {sure && <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--fg3)' }}>Reason, sent to them (optional)<input style={field} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. I’m unwell" /></label>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <a className="btn line" href={`/coach/messages?c=${b.clientId}`}>Message</a>
        {!sure ? <button className="btn line" style={{ color: 'var(--coral)' }} onClick={() => setSure(true)}>Cancel session…</button>
          : <button className="btn line" style={{ color: 'var(--coral)' }} disabled={busy} onClick={async () => { setBusy(true); const e = await setSession(b.id, 'cancelled', note); setBusy(false); if (!e) onDone('Cancelled. They’ve been told, and it doesn’t count against them.'); }}>Yes, cancel it</button>}
        <button className="btn mint" onClick={onClose}>Close</button></div>
    </Modal>
  );
}

function Locations({ locations, onAdded }: { locations: { id: string; name: string }[]; onAdded: () => void }) {
  const [name, setName] = useState('');
  return (
    <section><Sec title="Places" right={locations.map(l => l.name).join(' · ')} />
      <div style={{ display: 'flex', gap: 8 }}><input style={{ ...field, flex: 1 }} value={name} onChange={e => setName(e.target.value)} placeholder="Add a place, e.g. Gym, Online, Park" aria-label="New place" />
        <button className="btn ghost" disabled={!name.trim()} onClick={async () => { if (!(await addLocation(name))) { setName(''); onAdded(); } }}>Add</button></div></section>
  );
}
