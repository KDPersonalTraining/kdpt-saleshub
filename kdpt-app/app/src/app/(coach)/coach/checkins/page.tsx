'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Head, Modal, Sec, Switch, Tile } from '@/components/coach/ui';
import { CHECKIN_FORM, CHECKIN_STEPS, QTYPES, type Question } from '@/lib/coach/sample-data';

const HELP: Record<string, string> = { mood: 'A slider from Rough to Great', scale: 'Five taps, with words at each end', text: 'A sentence or two', pick: 'A list they tick', number: 'e.g. steps, waist, weight', photo: 'Front, side and back' };

export default function CheckinBuilder() {
  const toast = useToast();
  const [Q, setQ] = useState<Question[]>(CHECKIN_FORM);
  const [selId, setSel] = useState('q1');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ q: '', step: CHECKIN_STEPS[0] });
  const sel = Q.find(q => q.id === selId) ?? Q[0];
  const steps = [...new Set(Q.map(q => q.step))];
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= Q.length || Q[j].step !== Q[i].step) return; const n = Q.slice(); [n[i], n[j]] = [n[j], n[i]]; setQ(n); };
  return (
    <>
      <Head title="Check-ins" sub="One form for everyone. Each client picked how often they get it when they signed up.">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn ghost" onClick={() => setAdding(true)}><Icon name="plus" className="sm" />Add question</button>
          <button className="btn mint" onClick={() => toast('Saved · used from each client\'s next check-in')}><Icon name="check" className="sm" />Save</button></div></Head>
      <div className="kpis three">{([['Weekly', 3, 'mint'], ['Every 2 weeks', 2, 'sky'], ['Monthly', 3, 'violet']] as const).map(([l, n, c]) => (
        <div className="card kpi" key={l}><Tile icon="clip" c={c} /><span><b className="num">{n}</b><small>{l}</small></span></div>
      ))}</div>
      <div className="grid2">
        <section style={{ display: 'grid', gap: 18, alignContent: 'start' }}>{steps.map((st, si) => (
          <div key={st}>
            <Sec title={<><span className="stepn num">{si + 1}</span>{st}</>} right={`${Q.filter(q => q.step === st).length} questions`} />
            <div className="card qlist">{Q.filter(q => q.step === st).map(q => { const [tl, ti, tc] = QTYPES[q.type]; const i = Q.indexOf(q); return (
              <div key={q.id} className={`qrow ${sel.id === q.id ? 'on' : ''}`}>
                <span className="move"><button onClick={() => move(i, -1)} aria-label="Move up"><Icon name="up" className="sm" /></button><button onClick={() => move(i, 1)} aria-label="Move down"><Icon name="down" className="sm" /></button></span>
                <button className="qmain" onClick={() => setSel(q.id)}><Tile icon={ti} c={tc} /><span><b>{q.q}</b><small>{tl}{q.mom ? ' · counts towards Momentum' : ''}</small></span></button>
                <Switch on={q.req} label="Required" text="Required" onChange={() => setQ(Q.map(x => (x.id === q.id ? { ...x, req: !x.req } : x)))} />
                <button className="iconbtn" onClick={() => setQ(Q.filter(x => x.id !== q.id))} aria-label="Remove"><Icon name="trash" className="sm" /></button>
              </div>
            ); })}</div>
          </div>
        ))}</section>
        <aside style={{ display: 'grid', gap: 14, alignContent: 'start', position: 'sticky', top: 20 }}>
          <Sec style={{ margin: 0 }} title="Client preview" right={sel.step} />
          <div className="phone"><div className="pq"><small>{sel.step}</small><b>{sel.q}</b><Preview q={sel} /></div></div>
          <div className="flag" style={{ borderColor: 'rgba(169,155,255,.3)', background: 'rgba(169,155,255,.06)' }}><span style={{ color: 'var(--violet)' }}><Icon name="info" /></span>
            <span>Weight and photos are never required. Questions marked Momentum feed the Recovery ring, so keep at least one.</span></div>
        </aside>
      </div>
      {adding && (
        <Modal title="Add a question" onClose={() => setAdding(false)}>
          <div className="fields"><label className="full">Question<input value={draft.q} placeholder="e.g. How many steps did you average?" onChange={e => setDraft({ ...draft, q: e.target.value })} /></label>
            <label className="full">Step<select value={draft.step} onChange={e => setDraft({ ...draft, step: e.target.value })}>{CHECKIN_STEPS.map(s => <option key={s}>{s}</option>)}</select></label></div>
          <div style={{ display: 'grid', gap: 8 }}>{Object.entries(QTYPES).map(([k, [l, i, c]]) => (
            <button key={k} className="opt" onClick={() => {
              if (!draft.q.trim()) { toast('Write the question first'); return; }
              const id = 'q' + Date.now(), last = Q.map(x => x.step).lastIndexOf(draft.step);
              const n = Q.slice(); n.splice(last + 1, 0, { id, step: draft.step, q: draft.q.trim(), type: k, req: false, opts: k === 'pick' ? ['Option 1', 'Option 2', 'Option 3'] : undefined });
              setQ(n); setSel(id); setAdding(false); setDraft({ q: '', step: CHECKIN_STEPS[0] });
            }}><Tile icon={i} c={c} /><span><b>{l}</b><small>{HELP[k]}</small></span></button>
          ))}</div>
        </Modal>
      )}
    </>
  );
}

function Preview({ q }: { q: Question }) {
  if (q.type === 'mood') return <><div className="pmood"><i /></div><div className="pends"><span>Rough</span><span>Great</span></div></>;
  if (q.type === 'scale') return <><div className="pscale">{[1, 2, 3, 4, 5].map(n => <span key={n} className={n === 4 ? 'on' : ''}>{n}</span>)}</div><div className="pends"><span>{q.ends?.[0] ?? 'Low'}</span><span>{q.ends?.[1] ?? 'High'}</span></div></>;
  if (q.type === 'text') return <div className="ptext">Type here…</div>;
  if (q.type === 'pick') return <div className="ppick">{(q.opts ?? ['Option 1', 'Option 2']).map((o, i) => <span key={o} className={i === 1 ? 'on' : ''}>{o}</span>)}</div>;
  if (q.type === 'number') return <div className="ptext num">e.g. 74</div>;
  return <div className="pphoto">{['Front', 'Side', 'Back'].map(x => <span key={x}><Icon name="camera" className="sm" />{x}</span>)}</div>;
}
