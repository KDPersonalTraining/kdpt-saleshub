'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Head, Modal, Tile } from '@/components/coach/ui';
import { EXTRA, LIB, lib, tint } from '@/lib/coach/sample-data';

const PATS = ['All', 'Squat', 'Hinge', 'Lunge', 'Isolation', 'Core'];

export default function Library() {
  const [f, setF] = useState('All');
  const [edit, setEdit] = useState<string | null>(null);
  const list = LIB.filter(x => f === 'All' || x.pat === f);
  const filmed = LIB.filter(x => x.filmed).length;
  return (
    <>
      <Head title="Exercise library" sub="Each exercise stores its pattern, kit, load jump and approved swaps.">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="tag t-amber" style={{ height: 40, padding: '0 14px', borderRadius: 12 }}><Icon name="film" className="sm" />{filmed} of {LIB.length} filmed</span>
          <button className="btn mint" onClick={() => setEdit('new')}><Icon name="plus" className="sm" />Add</button></div></Head>
      <div className="chips">{PATS.map(p => <button key={p} className={`chipbtn ${f === p ? 'on' : ''}`} onClick={() => setF(p)}>{p}</button>)}</div>
      <div className="lib">{list.map(x => { const [bg, fg] = tint(x.c); return (
        <button className="card lx" key={x.id} onClick={() => setEdit(x.id)}>
          <span className="vid" style={{ background: bg, color: fg }}>{x.filmed ? <><img src="/assets/gym.jpg" alt="" /><span className="play"><Icon name="video" className="sm" /></span></> : <Icon name="film" />}</span>
          <span><b>{x.name}</b></span><span className="chips"><span className="tag" style={{ background: bg, color: fg }}>{x.pat}</span><span className="tag t-grey">{x.kit}</span>{!x.filmed && <span className="tag t-amber">To film</span>}</span></button>
      ); })}</div>
      {edit && <ExerciseEditor id={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function ExerciseEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const toast = useToast();
  const isNew = id === 'new', x = isNew ? { id: 'new', name: '', pat: 'Squat', kit: 'Machine', filmed: false } : lib(id);
  const ex = EXTRA[x.id] ?? { inc: x.kit === 'Bodyweight' ? 0 : x.kit === 'Machine' ? 5 : 2, muscles: '', cues: ['', '', ''], swaps: [] };
  const [pat, setPat] = useState(x.pat);
  const [swaps, setSwaps] = useState<Record<string, boolean>>(Object.fromEntries(ex.swaps.map(k => [k, true])));
  const same = LIB.filter(y => y.pat === pat && y.id !== x.id);
  return (
    <Modal title={isNew ? 'New exercise' : x.name} onClose={onClose} wide>
      <button className={`drop ${x.filmed ? 'has' : ''}`} onClick={() => toast(x.filmed ? 'Replace the video' : 'Choose a video from your phone or computer')}>
        {x.filmed ? <><img src="/assets/gym.jpg" alt="" /><span className="play"><Icon name="video" className="sm" /></span><span className="cap">Demo · 0:18 · tap to replace</span></>
          : <><Tile icon="film" c="amber" /><span><b>Upload the demo</b><small>MP4 or MOV, under 60 seconds. Film it side-on, at gym speed. Until then clients see the written steps.</small></span></>}</button>
      <div className="fields">
        <label className="full">Name<input defaultValue={x.name} placeholder="e.g. Bulgarian Split Squat" /></label>
        <label>Movement pattern<select value={pat} onChange={e => { setPat(e.target.value); setSwaps({}); }}>{['Squat', 'Hinge', 'Lunge', 'Push', 'Pull', 'Isolation', 'Core'].map(p => <option key={p}>{p}</option>)}</select></label>
        <label>Kit<select defaultValue={x.kit}>{['Machine', 'Barbell', 'Dumbbell', 'Cable', 'Bodyweight', 'Kettlebell'].map(k => <option key={k}>{k}</option>)}</select></label>
        <label>Load jump (kg)<input inputMode="decimal" defaultValue={ex.inc} /></label>
        <label>Muscles worked<input defaultValue={ex.muscles} placeholder="e.g. Quads, glutes" /></label></div>
      <div><div className="lbl2">Coaching cues · what clients read under the video</div>
        <div className="cuelist">{ex.cues.map((c, i) => <label key={i}><span className="n num">{i + 1}</span><input defaultValue={c} placeholder={['Set-up', 'The movement', 'The finish'][i] ?? 'Another cue'} /></label>)}</div></div>
      <div><div className="lbl2">Approved swaps · same pattern ({pat}). KAI and the client can only swap to these</div>
        <div className="chips">{same.length ? same.map(y => (
          <button key={y.id} className={`swapt ${swaps[y.id] ? 'on' : ''}`} aria-pressed={!!swaps[y.id]} onClick={() => setSwaps({ ...swaps, [y.id]: !swaps[y.id] })}><Icon name={swaps[y.id] ? 'check' : 'plus'} className="sm" />{y.name}</button>
        )) : <span style={{ color: 'var(--fg3)', fontSize: 13 }}>Nothing else in this pattern yet.</span>}</div></div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button className="btn mint" onClick={() => { onClose(); toast(isNew ? 'Added · marked To film' : 'Saved · clients see it straight away'); }}><Icon name="check" className="sm" />{isNew ? 'Add to library' : 'Save'}</button>
        {!isNew && <button className="btn line" onClick={() => toast('Archived · hidden from new programmes')}>Archive</button>}</div>
    </Modal>
  );
}
