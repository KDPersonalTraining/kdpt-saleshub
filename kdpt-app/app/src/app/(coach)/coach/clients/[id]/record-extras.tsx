'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Modal, Sec, Tag } from '@/components/coach/ui';
import { normaliseLog, portionLabel, resolveFood, scaled, totals } from '@/lib/client/food';
import { shortDate } from '@/lib/programmes/plan';
import { ukWhen } from '@/lib/time';
import { addNote, saveNutrition, setArchived, updateDetails, updateNote, type Details, type Nutrition } from './actions';

export type Extras = {
  details: Details & { archived: boolean };
  notes: { id: string; body: string; pinned: boolean; at: string }[];
  nutrition: Nutrition | null;
  sessions: { id: string; start: string; status: string; location: string }[];
  weights: { date: string; kg: number }[];
  log: Record<string, unknown[]> | null;
};
const field = { background: 'var(--s1)', border: '1px solid var(--hair)', borderRadius: 8, padding: '8px 10px', color: 'var(--fg)', font: 'inherit', fontSize: 14, width: '100%' } as const;
const TYPE: Record<string, string> = { in_person: 'In-person', hybrid: 'Hybrid', online: 'Online' };

// The rest of a client's record: details, private notes, sessions, food and
// weight, and archiving.
export function RecordExtras({ clientId, x }: { clientId: string; x: Extras }) {
  const toast = useToast(), router = useRouter();
  const [editing, setEditing] = useState(false), [archiving, setArchiving] = useState(false);
  const first = x.details.preferredName || x.details.fullName.split(' ')[0];
  const ok = (m: string) => { toast(m); router.refresh(); };
  const w = x.weights, wChange = w.length > 1 ? Math.round((w[w.length - 1].kg - w[0].kg) * 10) / 10 : null;
  return (
    <>
      {x.details.archived && <div className="flag"><Icon name="info" /><span><b>Archived.</b> {first} can’t sign in and doesn’t appear in your lists. <button style={{ textDecoration: 'underline' }} onClick={async () => { const e = await setArchived(clientId, false); if (e) toast(e); else ok('Back in your client list'); }}>Bring them back</button></span></div>}
      <div className="grid2">
        <div className="card pad"><Sec title="Details" right={<button className="btn line" onClick={() => setEditing(true)}>Edit</button>} />
          <div className="kv"><span>Name</span><b>{x.details.fullName}{x.details.preferredName ? ` (${x.details.preferredName})` : ''}</b><span>Phone</span><b>{x.details.phone || '–'}</b>
            <span>Coaching</span><b>{TYPE[x.details.coachingType] ?? '–'}</b><span>Goals</span><b>{x.details.goals || '–'}</b><span>Things to work around</span><b>{x.details.restrictions || '–'}</b></div></div>
        <div className="card pad"><Sec title="Sessions" right={<Link className="btn line" href={`/coach/schedule?c=${clientId}`}>Book</Link>} />
          {x.sessions.length ? <div style={{ display: 'grid', gap: 8 }}>{x.sessions.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14 }}><span>{ukWhen(s.start)}{s.location ? ` · ${s.location}` : ''}</span>{s.status === 'held' ? <Tag c="amber">Not confirmed</Tag> : <Tag c="mint">Confirmed</Tag>}</div>
          ))}</div> : <p style={{ margin: 0, color: 'var(--fg3)' }}>Nothing booked.</p>}</div>
      </div>

      <Notes clientId={clientId} notes={x.notes} onDone={ok} />

      <div className="grid2">
        <NutritionCard clientId={clientId} first={first} n={x.nutrition} log={x.log} onDone={ok} />
        <div className="card pad"><Sec title="Weight" right={w.length ? `${w.length} weigh-ins` : undefined} />
          {w.length ? <div className="kv"><span>Latest</span><b className="num">{w[w.length - 1].kg} kg · {shortDate(w[w.length - 1].date)}</b>
            {wChange !== null && <><span>Since {shortDate(w[0].date)}</span><b className="num">{wChange > 0 ? '+' : ''}{wChange} kg</b></>}</div>
            : <p style={{ margin: 0, color: 'var(--fg3)' }}>No weigh-ins yet. They can add one on Progress, or in a check-in.</p>}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{!x.details.archived && <button className="btn line" style={{ color: 'var(--coral)' }} onClick={() => setArchiving(true)}>Archive client…</button>}</div>
      {editing && <DetailsModal clientId={clientId} d={x.details} onClose={() => setEditing(false)} onDone={m => { setEditing(false); ok(m); }} />}
      {archiving && <Modal title={`Archive ${x.details.fullName}?`} onClose={() => setArchiving(false)}>
        <p style={{ margin: 0 }}>They won’t be able to sign in, and they drop off your lists. Their history is kept, and you can bring them back from this page.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn line" onClick={() => setArchiving(false)}>Cancel</button>
          <button className="btn line" style={{ color: 'var(--coral)' }} onClick={async () => { const e = await setArchived(clientId, true); setArchiving(false); if (e) toast(e); else ok('Archived'); }}>Archive</button></div></Modal>}
    </>
  );
}

function Notes({ clientId, notes, onDone }: { clientId: string; notes: Extras['notes']; onDone: (m: string) => void }) {
  const [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const sorted = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.localeCompare(a.at));
  return (
    <div className="card pad"><Sec title="Private notes" right="Only you see these" />
      <div style={{ display: 'flex', gap: 8 }}><textarea style={{ ...field, minHeight: 44 }} rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Prefers early mornings. Knee is better on the leg press than squats." aria-label="New note" />
        <button className="btn mint" disabled={busy || !text.trim()} onClick={async () => { setBusy(true); const e = await addNote(clientId, text); setBusy(false); if (!e) { setText(''); onDone('Note saved'); } }}>Add</button></div>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{sorted.map(n => (
        <div key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderTop: '1px solid var(--hair)', paddingTop: 8 }}>
          <span style={{ flex: 1, whiteSpace: 'pre-line', fontSize: 14 }}>{n.pinned && <b style={{ color: 'var(--amber)' }}>Pinned · </b>}{n.body}<small className="muted" style={{ display: 'block', fontSize: 12 }}>{shortDate(n.at)}</small></span>
          <button className="btn line" style={{ height: 30 }} onClick={async () => { await updateNote(clientId, n.id, { pinned: !n.pinned }); onDone(n.pinned ? 'Unpinned' : 'Pinned to the top'); }}>{n.pinned ? 'Unpin' : 'Pin'}</button>
          <button className="iconbtn" aria-label="Delete note" onClick={async () => { await updateNote(clientId, n.id, { remove: true }); onDone('Note deleted'); }}><Icon name="trash" className="sm" /></button>
        </div>
      ))}</div>
    </div>
  );
}

function DetailsModal({ clientId, d, onClose, onDone }: { clientId: string; d: Details; onClose: () => void; onDone: (m: string) => void }) {
  const [v, setV] = useState<Details>(d), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  return (
    <Modal title="Edit details" onClose={onClose}>
      <div className="fields">
        <label>Full name<input value={v.fullName} onChange={e => setV({ ...v, fullName: e.target.value })} /></label>
        <label>What they like to be called<input value={v.preferredName} onChange={e => setV({ ...v, preferredName: e.target.value })} /></label>
        <label>Phone<input type="tel" value={v.phone} onChange={e => setV({ ...v, phone: e.target.value })} /></label>
        <label>Coaching<select value={v.coachingType} onChange={e => setV({ ...v, coachingType: e.target.value })}>{Object.entries(TYPE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="full">Goals<input value={v.goals} onChange={e => setV({ ...v, goals: e.target.value })} /></label>
        <label className="full">Injuries or things to work around<input value={v.restrictions} onChange={e => setV({ ...v, restrictions: e.target.value })} /></label>
      </div>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn line" onClick={onClose}>Cancel</button>
        <button className="btn mint" disabled={busy} onClick={async () => { setBusy(true); const e = await updateDetails(clientId, v); setBusy(false); if (e) setErr(e); else onDone('Details saved'); }}>Save</button></div>
    </Modal>
  );
}

function NutritionCard({ clientId, first, n, log, onDone }: { clientId: string; first: string; n: Nutrition | null; log: Extras['log']; onDone: (m: string) => void }) {
  const [v, setV] = useState<Nutrition>(n ?? { mode: 'protein', kcal: null, protein: null, carbs: null, fat: null, notes: '' });
  const [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const num = (s: string) => (s.trim() ? Math.round(Number(s)) : null);
  const items = log ? Object.entries(normaliseLog(log)).flatMap(([slot, list]) => list.map(it => ({ slot, it, f: resolveFood(it.food) })).filter(r => r.f)) : [];
  const t = log ? totals(normaliseLog(log)) : null;
  return (
    <div className="card pad"><Sec title="Nutrition" right={n ? undefined : 'Not set yet'} />
      <div className="fields">
        <label className="full">What {first} sees in Fuel<select value={v.mode} onChange={e => setV({ ...v, mode: e.target.value as Nutrition['mode'] })}>
          <option value="full">Calories and all macros</option><option value="protein">Protein only</option><option value="simple">No numbers, just what they ate</option></select></label>
        {v.mode === 'full' && <label>Calories<input inputMode="numeric" value={v.kcal ?? ''} onChange={e => setV({ ...v, kcal: num(e.target.value) })} /></label>}
        {v.mode !== 'simple' && <label>Protein (g)<input inputMode="numeric" value={v.protein ?? ''} onChange={e => setV({ ...v, protein: num(e.target.value) })} /></label>}
        {v.mode === 'full' && <><label>Carbs (g)<input inputMode="numeric" value={v.carbs ?? ''} onChange={e => setV({ ...v, carbs: num(e.target.value) })} /></label>
          <label>Fat (g)<input inputMode="numeric" value={v.fat ?? ''} onChange={e => setV({ ...v, fat: num(e.target.value) })} /></label></>}
        <label className="full">Note shown at the top of their Fuel (optional)<input value={v.notes} maxLength={300} placeholder="e.g. Aim for 30 g protein at breakfast" onChange={e => setV({ ...v, notes: e.target.value })} /></label>
      </div>
      {err && <p role="alert" style={{ margin: '8px 0 0', color: 'var(--coral)' }}>{err}</p>}
      <button className="btn mint" style={{ marginTop: 12 }} disabled={busy} onClick={async () => { setBusy(true); setErr(null); const e = await saveNutrition(clientId, v); setBusy(false); if (e) setErr(e); else onDone(`Saved. ${first} sees it next time they open Fuel.`); }}>Save targets</button>
      <div style={{ marginTop: 16, borderTop: '1px solid var(--hair)', paddingTop: 12 }}>
        <b style={{ fontSize: 14 }}>Their food log right now</b>
        {t && <span className="muted num" style={{ fontSize: 13 }}> · {Math.round(t.kcal)} kcal · {Math.round(t.P)} g protein</span>}
        {items.length ? <div style={{ display: 'grid', gap: 4, marginTop: 8, fontSize: 13 }}>{items.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span>{r.slot}: {r.f!.n} <span className="muted">({portionLabel(r.f!, r.it.qty)})</span></span><span className="num muted">{Math.round(scaled(r.f!, r.it.qty).kcal)} kcal</span></div>
        ))}</div> : <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>Nothing logged.</p>}
      </div>
    </div>
  );
}
