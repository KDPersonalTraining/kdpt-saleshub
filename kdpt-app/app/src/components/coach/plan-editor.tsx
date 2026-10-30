'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { LIB, PRIO, lib, type Row } from '@/lib/coach/sample-data';
import { suggestLoad } from '@/lib/rules';
import { Modal, Tile } from './ui';

const REST = [45, 60, 75, 90, 120, 150, 180];
const restLabel = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `0:${s}`);

// Same rule the client app uses, shown so the coach sees what comes next.
function nextLoad(row: Row) {
  const [load, reps] = row.last;
  if (row.inc === 0) return { txt: 'BW', up: false, why: '' };
  const s = suggestLoad({ sets: row.sets, repRange: row.r, increment: row.inc }, { load, reps });
  return { txt: `${s.load} kg`, up: s.increased, why: s.reason };
}

// The exercise table for a client's plan (with "next session") or a template.
export function PlanEditor({ rows, onChange, saved, template, footNote, emptyNote }: {
  rows: Row[]; onChange: (rows: Row[]) => void; saved?: Row[]; template?: boolean; footNote?: string; emptyNote?: React.ReactNode;
}) {
  const [modal, setModal] = useState<{ mode: 'swap' | 'add'; i?: number } | null>(null);
  const set = (i: number, patch: Partial<Row>) => onChange(rows.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= rows.length) return; const n = rows.slice(); [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  const changed = (x: Row, i: number) => !!saved && JSON.stringify(x) !== JSON.stringify(saved[i]);
  const cur = modal?.mode === 'swap' ? lib(rows[modal.i!].ex) : null;
  const opts = LIB.filter(x => !cur || (x.pat === cur.pat && x.id !== cur.id));
  const cls = `erow ${template ? 'tpl' : ''}`;
  return (
    <>
      <div className="card editor">
        <div className={`${cls} th`}><span /><span>Exercise</span><span>Sets</span><span>Reps</span><span>Rest</span><span>If short on time</span>{!template && <span>Next session</span>}<span /></div>
        {rows.map((x, i) => { const e = lib(x.ex), n = nextLoad(x); return (
          <div key={i} className={`${cls} ${changed(x, i) ? 'changed' : ''}`}>
            <span className="move"><button onClick={() => move(i, -1)} aria-label="Move up"><Icon name="up" className="sm" /></button><button onClick={() => move(i, 1)} aria-label="Move down"><Icon name="down" className="sm" /></button></span>
            <button className="exname" onClick={() => setModal({ mode: 'swap', i })} title="Swap exercise"><Tile icon="library" c={e.c} /><span><b>{e.name}</b><small>{e.pat} · {e.kit} <Icon name="swap" className="sm" /></small></span></button>
            <span className="stepper"><button onClick={() => set(i, { sets: Math.max(1, x.sets - 1) })} aria-label="Fewer sets">−</button><span className="num">{x.sets}</span><button onClick={() => set(i, { sets: Math.min(8, x.sets + 1) })} aria-label="More sets">+</button></span>
            <span className="reps">
              <input className="num" value={x.r[0]} aria-label="Min reps" onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) set(i, { r: [v, x.r[1]] }); }} />–
              <input className="num" value={x.r[1]} aria-label="Max reps" onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) set(i, { r: [x.r[0], v] }); }} /></span>
            <select className="rest num" value={x.rest} aria-label="Rest" onChange={e => set(i, { rest: +e.target.value })}>{REST.map(s => <option key={s} value={s}>{restLabel(s)}</option>)}</select>
            <span className="prio">{PRIO.map((p, k) => <button key={p} className={`p${k} ${x.prio === k ? 'on' : ''}`} onClick={() => set(i, { prio: k })}>{p}</button>)}</span>
            {!template && <span className="nextload num" title={n.why}>{n.up ? <span style={{ color: 'var(--mint)' }}><Icon name="arrowup" className="sm" /></span> : <span style={{ color: 'var(--fg3)' }}><Icon name="equal" className="sm" /></span>}
              <span>{n.txt}<small>last {x.last[0] ? x.last[0] + ' kg' : 'BW'} × {x.last[1].join('/')}</small></span></span>}
            <button className="iconbtn" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove"><Icon name="trash" className="sm" /></button>
          </div>
        ); })}
        {!rows.length && (emptyNote ?? <p style={{ padding: '20px 16px', color: 'var(--fg3)' }}>No exercises yet.</p>)}
        <div className="efoot"><button className="btn ghost" onClick={() => setModal({ mode: 'add' })}><Icon name="plus" className="sm" />Add exercise</button>{footNote && <span style={{ color: 'var(--fg3)', fontSize: 12 }}>{footNote}</span>}</div>
      </div>
      {modal && (
        <Modal title={modal.mode === 'swap' ? `Swap ${cur!.name}` : 'Add exercise'} onClose={() => setModal(null)}>
          {cur && <span style={{ color: 'var(--fg3)' }}>Same movement pattern: {cur.pat}</span>}
          <div style={{ display: 'grid', gap: 8 }}>{opts.map(x => (
            <button key={x.id} className="opt" onClick={() => {
              if (modal.mode === 'swap') set(modal.i!, { ex: x.id });
              else onChange([...rows, { ex: x.id, sets: 3, r: [10, 12], rest: 90, prio: 1, last: [0, []], inc: 0 }]);
              setModal(null);
            }}><Tile icon="library" c={x.c} /><span><b>{x.name}</b><small>{x.pat} · {x.kit}</small></span></button>
          ))}</div>
        </Modal>
      )}
    </>
  );
}
