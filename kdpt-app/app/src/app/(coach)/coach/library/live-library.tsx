'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Head, Modal } from '@/components/coach/ui';
import { archiveExercise, saveExercise, type ExerciseInput } from './actions';

const PATTERN: Record<string, string> = { squat: 'Squat', hinge: 'Hinge', lunge: 'Lunge', horizontal_push: 'Push (forwards)', vertical_push: 'Push (overhead)', horizontal_pull: 'Pull (row)', vertical_pull: 'Pull (down)',
  carry: 'Carry', core_anti_extension: 'Core (bracing)', core_anti_rotation: 'Core (anti-rotation)', core_flexion: 'Core (crunch)', isolation_upper: 'Arms & shoulders', isolation_lower: 'Legs (isolation)', conditioning: 'Cardio', mobility: 'Mobility' };
const LOAD: Record<string, string> = { barbell: 'Barbell', dumbbell: 'Dumbbells', kettlebell: 'Kettlebell', machine_stack: 'Machine (pin)', machine_plate: 'Machine (plates)', cable: 'Cable', bodyweight: 'Bodyweight', band: 'Band', smith: 'Smith machine', other: 'Other' };
type Row = Required<Pick<ExerciseInput, 'id'>> & ExerciseInput;

// Kyle's exercise library: what clients can be given, swapped to, and see.
export function LiveLibrary({ rows }: { rows: Row[] }) {
  const toast = useToast(), router = useRouter();
  const [q, setQ] = useState(''), [edit, setEdit] = useState<ExerciseInput | null>(null);
  const list = rows.filter(r => r.name.toLowerCase().includes(q.trim().toLowerCase()) || PATTERN[r.pattern]?.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <Head title="Exercise library" sub={`${rows.length} exercises. Clients see the steps; swaps come from the same movement.`}>
        <button className="btn mint" onClick={() => setEdit({ name: '', pattern: 'squat', load: 'dumbbell', measure: 'reps', inc: 2, muscles: '', cues: '' })}><Icon name="plus" className="sm" />Add exercise</button></Head>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or movement" aria-label="Search" style={{ height: 40, borderRadius: 8, background: 'var(--s1)', border: '1px solid var(--hair)', padding: '0 12px', color: 'var(--fg)' }} />
      <div className="card">{list.map(r => (
        <button key={r.id} onClick={() => setEdit(r)} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--hair)', width: '100%', textAlign: 'left' }}>
          <span><b>{r.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{PATTERN[r.pattern] ?? r.pattern} · {LOAD[r.load] ?? r.load}{r.measure === 'distance' ? ' · logged as km and minutes' : r.muscles ? ` · ${r.muscles}` : ''}</small></span>
          <span className="muted" style={{ fontSize: 12 }}>{r.cues ? `${r.cues.split('\n').length} steps` : 'No steps yet'}</span></button>
      ))}</div>
      {edit && <EditModal v={edit} onClose={() => setEdit(null)} onDone={m => { setEdit(null); toast(m); router.refresh(); }} />}
    </>
  );
}

function EditModal({ v: start, onClose, onDone }: { v: ExerciseInput; onClose: () => void; onDone: (m: string) => void }) {
  const [v, setV] = useState(start), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const cardio = v.measure === 'distance';
  return (
    <Modal title={v.id ? `Edit ${start.name}` : 'Add an exercise'} onClose={onClose}>
      <div className="fields">
        <label className="full">Name<input value={v.name} onChange={e => setV({ ...v, name: e.target.value })} /></label>
        <label>Movement<select value={v.pattern} onChange={e => setV({ ...v, pattern: e.target.value, ...(e.target.value === 'conditioning' ? { measure: 'distance', load: 'other' } : {}) })}>{Object.entries(PATTERN).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Equipment<select value={v.load} onChange={e => setV({ ...v, load: e.target.value })}>{Object.entries(LOAD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Logged as<select value={v.measure} onChange={e => setV({ ...v, measure: e.target.value as ExerciseInput['measure'] })}><option value="reps">Weight and reps</option><option value="distance">Distance and minutes</option></select></label>
        {!cardio && v.load !== 'bodyweight' && <label>Weight jump (kg)<input inputMode="decimal" value={v.inc} onChange={e => setV({ ...v, inc: Number(e.target.value) || 0 })} /></label>}
        <label className="full">Main muscles (comma between)<input value={v.muscles} onChange={e => setV({ ...v, muscles: e.target.value })} placeholder="e.g. Glutes, hamstrings" /></label>
        <label className="full">Steps for the client (one per line)<textarea rows={4} value={v.cues} onChange={e => setV({ ...v, cues: e.target.value })} style={{ background: 'var(--s1)', border: '1px solid var(--hair)', borderRadius: 8, padding: 10, color: 'var(--fg)', font: 'inherit' }} /></label>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>The weight jump is how much the app adds when they hit the top of the reps on every set.</p>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {v.id && <button className="btn line" style={{ color: 'var(--coral)' }} disabled={busy} onClick={async () => { const e = await archiveExercise(v.id!); if (e) setErr(e); else onDone('Removed from your library'); }}>Remove</button>}
        <button className="btn line" onClick={onClose}>Cancel</button>
        <button className="btn mint" disabled={busy} onClick={async () => { setBusy(true); const e = await saveExercise(v); setBusy(false); if (e) setErr(e); else onDone(v.id ? 'Saved' : 'Added to your library'); }}>Save</button></div>
    </Modal>
  );
}
