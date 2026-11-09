'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Modal, Sec } from '@/components/coach/ui';
import type { EdItem, EdProgramme, EdWorkout, LibExercise } from '@/lib/programmes/edit';
import { saveProgramme } from './actions';

const PRIO: [EdItem['priority'], string][] = [['must_keep', 'Always keep'], ['keep_if_time', 'Keep if time'], ['first_to_cut', 'Cut first']];
const REST = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const PATTERNS: [string, string][] = [['all', 'All'], ['squat', 'Squat'], ['hinge', 'Hinge'], ['lunge', 'Lunge'], ['push', 'Push'], ['pull', 'Pull'], ['isolation', 'Arms & small muscles'], ['core', 'Core & carries'], ['conditioning', 'Cardio']];
const inGroup = (p: string, g: string) => g === 'all' || (g === 'push' ? p.endsWith('_push') : g === 'pull' ? p.endsWith('_pull') : g === 'core' ? p.startsWith('core') || p === 'carry' : p.startsWith(g));
const restLabel = (s: number) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : 'None');
const field = { background: 'var(--s1)', border: '1px solid var(--hair)', borderRadius: 8, padding: '0 10px', height: 38, color: 'var(--fg)', font: 'inherit', fontSize: 14, minWidth: 0 } as const;

// Kyle edits one client's programme: its workouts and, in each, the
// exercises, sets, reps (or minutes for cardio), rest, priority and notes.
// clientId null: one of Kyle's own programmes (a template), not a client's.
export function ProgrammeEditor({ clientId, clientName, start, library, backHref, extra }: { clientId: string | null; clientName: string; start: EdProgramme; library: LibExercise[]; backHref?: string; extra?: React.ReactNode }) {
  const toast = useToast(), router = useRouter();
  const [p, setP] = useState<EdProgramme>(start);
  const [wi, setWi] = useState(0);
  const [picker, setPicker] = useState<{ replace?: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty = JSON.stringify(p) !== JSON.stringify(start);
  const lib = useMemo(() => new Map(library.map(e => [e.id, e])), [library]);
  const w = p.workouts[Math.min(wi, p.workouts.length - 1)];
  const first = clientId ? clientName.split(' ')[0] : 'the client';

  const setW = (patch: Partial<EdWorkout>) => setP({ ...p, workouts: p.workouts.map((x, i) => (i === wi ? { ...x, ...patch } : x)) });
  const setItem = (j: number, patch: Partial<EdItem>) => setW({ items: w.items.map((x, k) => (k === j ? { ...x, ...patch } : x)) });
  const moveItem = (j: number, d: number) => { const k = j + d; if (k < 0 || k >= w.items.length) return; const n = w.items.slice(); [n[j], n[k]] = [n[k], n[j]]; setW({ items: n }); };
  const addWorkout = () => { setP({ ...p, workouts: [...p.workouts, { name: `Workout ${p.workouts.length + 1}`, focus: '', phase: '', weekFrom: null, weekTo: null, items: [] }] }); setWi(p.workouts.length); };
  const copyWorkout = () => { setP({ ...p, workouts: [...p.workouts, { ...w, id: undefined, name: `${w.name} (copy)`, items: w.items.map(({ id: _, ...it }) => it) }] }); setWi(p.workouts.length); };
  const removeWorkout = () => { if (p.workouts.length < 2) { toast('A programme needs at least one workout'); return; } setP({ ...p, workouts: p.workouts.filter((_, i) => i !== wi) }); setWi(Math.max(0, wi - 1)); };
  const moveWorkout = (d: number) => { const k = wi + d; if (k < 0 || k >= p.workouts.length) return; const n = p.workouts.slice(); [n[wi], n[k]] = [n[k], n[wi]]; setP({ ...p, workouts: n }); setWi(k); };
  const pick = (e: LibExercise) => {
    const cardio = e.measure === 'distance';
    if (picker?.replace != null) setItem(picker.replace, { exerciseId: e.id, ...(cardio !== (lib.get(w.items[picker.replace].exerciseId)?.measure === 'distance') ? (cardio ? { repMin: 10, repMax: 20 } : { repMin: 8, repMax: 12 }) : {}) });
    else setW({ items: [...w.items, cardio ? { exerciseId: e.id, sets: 1, repMin: 10, repMax: 20, rest: 60, priority: 'keep_if_time', note: '' } : { exerciseId: e.id, sets: 3, repMin: 8, repMax: 12, rest: 90, priority: 'keep_if_time', note: '' }] });
    setPicker(null);
  };
  const save = async () => {
    setBusy(true); setErr(null);
    const e = await saveProgramme(clientId, p);
    setBusy(false);
    if (e) { setErr(e); return; }
    toast(clientId ? `Saved. ${first} sees the changes next time they open the app.` : 'Saved. Clients already on it keep their own copy.');
    router.refresh();
  };

  return (
    <>
      <div className="head"><div><Link className="crumb" href={backHref ?? `/coach/clients/${clientId}`}><Icon name="back" className="sm" />{clientName}</Link>
        <input className="tname" value={p.name} onChange={e => setP({ ...p, name: e.target.value })} aria-label="Programme name" /></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{extra}<button className="btn mint" disabled={!dirty || busy} onClick={save}><Icon name="check" className="sm" />{busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button></div></div>
      {err && <div className="flag" role="alert"><Icon name="info" /><span>{err}</span></div>}

      <div className="card pad"><div className="fields">
        <label>Length (weeks)<input type="number" min={1} max={52} value={p.weeks} onChange={e => setP({ ...p, weeks: Math.max(1, Math.min(52, +e.target.value || 1)) })} /></label>
        {clientId && <label>Week 1 starts<input type="date" value={p.startsOn} onChange={e => setP({ ...p, startsOn: e.target.value })} /></label>}
      </div></div>

      <div className="toolbar">
        <div className="days">{p.workouts.map((x, i) => (
          <button key={x.id ?? `new-${i}`} className={`day ${i === wi ? 'on' : ''}`} onClick={() => setWi(i)}>{x.name}
            <small className="num"> · {x.weekFrom || x.weekTo ? `wk ${x.weekFrom ?? 1}–${x.weekTo ?? p.weeks}` : `${x.items.length}`}</small></button>
        ))}<button className="day" onClick={addWorkout} aria-label="Add a workout"><Icon name="plus" className="sm" /></button></div>
      </div>

      {w && (
        <section className="card pad" style={{ display: 'grid', gap: 16 }}>
          <div className="fields" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <label>Workout name<input value={w.name} onChange={e => setW({ name: e.target.value })} /></label>
            <label>Focus (optional)<input value={w.focus} placeholder="e.g. Lower body" onChange={e => setW({ focus: e.target.value })} /></label>
            <label>Phase name (optional)<input value={w.phase} placeholder="e.g. Build on it" onChange={e => setW({ phase: e.target.value })} /></label>
            <label>From week<select value={w.weekFrom ?? ''} onChange={e => setW({ weekFrom: e.target.value ? +e.target.value : null })}><option value="">Every week</option>{Array.from({ length: p.weeks }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
            <label>To week<select value={w.weekTo ?? ''} onChange={e => setW({ weekTo: e.target.value ? +e.target.value : null })}><option value="">The end</option>{Array.from({ length: p.weeks }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Workouts rotate in this order. Use the weeks to swap in a new version later (e.g. “Full Body A” for weeks 1–3, then a harder one for weeks 4–6).</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn line" onClick={() => moveWorkout(-1)} disabled={wi === 0}><Icon name="up" className="sm" />Earlier</button>
            <button className="btn line" onClick={() => moveWorkout(1)} disabled={wi === p.workouts.length - 1}><Icon name="down" className="sm" />Later</button>
            <button className="btn line" onClick={copyWorkout}><Icon name="layers" className="sm" />Copy</button>
            <button className="btn line" style={{ color: 'var(--coral)' }} onClick={removeWorkout}><Icon name="trash" className="sm" />Remove workout</button>
          </div>

          <Sec title="Exercises" right={`${w.items.length}`} style={{ margin: '8px 0 0' }} />
          <div style={{ display: 'grid', gap: 10 }}>{w.items.map((it, j) => {
            const e = lib.get(it.exerciseId), cardio = e?.measure === 'distance';
            return (
              <div key={it.id ?? `n${j}`} style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 10, background: 'var(--s1)', border: '1px solid var(--hair)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="num muted" style={{ width: 18 }}>{j + 1}</span>
                  <button style={{ flex: 1, textAlign: 'left', minWidth: 0 }} onClick={() => setPicker({ replace: j })} title="Change exercise">
                    <b style={{ display: 'block' }}>{e?.name ?? 'Unknown exercise'}</b><small className="muted" style={{ fontSize: 12 }}>{cardio ? 'Cardio · logged as km and minutes' : e?.muscles.join(', ')} · tap to change</small></button>
                  <button className="iconbtn" onClick={() => moveItem(j, -1)} aria-label="Move up"><Icon name="up" className="sm" /></button>
                  <button className="iconbtn" onClick={() => moveItem(j, 1)} aria-label="Move down"><Icon name="down" className="sm" /></button>
                  <button className="iconbtn" onClick={() => setW({ items: w.items.filter((_, k) => k !== j) })} aria-label="Remove"><Icon name="trash" className="sm" /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, fontSize: 12, color: 'var(--fg3)' }}>
                  <label style={{ display: 'grid', gap: 4 }}>{cardio ? 'Rounds' : 'Sets'}<input style={field} type="number" min={1} max={10} value={it.sets} onChange={ev => setItem(j, { sets: +ev.target.value })} /></label>
                  <label style={{ display: 'grid', gap: 4 }}>{cardio ? 'Minutes, from' : 'Reps, from'}<input style={field} type="number" min={1} value={it.repMin} onChange={ev => setItem(j, { repMin: +ev.target.value })} /></label>
                  <label style={{ display: 'grid', gap: 4 }}>to<input style={field} type="number" min={1} value={it.repMax} onChange={ev => setItem(j, { repMax: +ev.target.value })} /></label>
                  <label style={{ display: 'grid', gap: 4 }}>Rest<select style={field} value={it.rest} onChange={ev => setItem(j, { rest: +ev.target.value })}>{[...new Set([...REST, it.rest])].sort((a, b) => a - b).map(r => <option key={r} value={r}>{restLabel(r)}</option>)}</select></label>
                  <label style={{ display: 'grid', gap: 4 }}>Short on time<select style={field} value={it.priority} onChange={ev => setItem(j, { priority: ev.target.value as EdItem['priority'] })}>{PRIO.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                </div>
                <input style={{ ...field, width: '100%' }} value={it.note} maxLength={300} placeholder={`Note for ${first} (optional)`} onChange={ev => setItem(j, { note: ev.target.value })} aria-label="Note" />
              </div>
            );
          })}</div>
          <button className="btn ghost" style={{ justifySelf: 'start' }} onClick={() => setPicker({})}><Icon name="plus" className="sm" />Add exercise</button>
        </section>
      )}
      {dirty && (
        <div style={{ position: 'sticky', bottom: 12, zIndex: 5, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: 'var(--s3)', border: '1px solid var(--hair)' }}>
          <span className="muted" style={{ fontSize: 13 }}>Not saved yet.{clientId ? ` ${first}’s logged workouts are kept whatever you change.` : ''}</span>
          <button className="btn mint" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      )}
      {picker && <Picker library={library} title={picker.replace != null ? 'Change exercise' : 'Add an exercise'} onPick={pick} onClose={() => setPicker(null)} />}
    </>
  );
}

function Picker({ library, title, onPick, onClose }: { library: LibExercise[]; title: string; onPick: (e: LibExercise) => void; onClose: () => void }) {
  const [q, setQ] = useState(''), [g, setG] = useState('all');
  const shown = library.filter(e => inGroup(e.pattern, g) && e.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Modal title={title} onClose={onClose}>
      <input style={{ ...field, width: '100%' }} placeholder="Search" value={q} onChange={e => setQ(e.target.value)} autoFocus aria-label="Search exercises" />
      <div className="days">{PATTERNS.map(([k, l]) => <button key={k} className={`day ${g === k ? 'on' : ''}`} style={{ height: 32 }} onClick={() => setG(k)}>{l}</button>)}</div>
      <div style={{ display: 'grid', gap: 6, maxHeight: '50vh', overflowY: 'auto' }}>{shown.map(e => (
        <button key={e.id} className="opt" onClick={() => onPick(e)}><span><b>{e.name}</b><small>{e.measure === 'distance' ? 'Cardio · km and minutes' : e.muscles.join(', ')}</small></span></button>
      ))}{!shown.length && <p className="muted">Nothing matches.</p>}</div>
    </Modal>
  );
}
