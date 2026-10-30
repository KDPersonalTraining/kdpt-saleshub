'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Ring, fmtSecs } from '@/components/client/ui';
import { setState, useClient, type SetLog } from '@/lib/client/store';
import { planFor, repRange, suggestionFor } from '@/lib/client/workout';
import type { Exercise } from '@/lib/client/sample-data';

const blankSets = (ex: Exercise, n: number, cur: SetLog[] = []): SetLog[] => {
  const load = String(suggestionFor(ex).load);
  return Array.from({ length: n }, (_, i) => cur[i] ?? { load, reps: '', done: false });
};

export default function Workout() {
  const s = useClient(), { openSheet } = useUI(), router = useRouter();
  const { items, minutes } = planFor(s.duration);
  const idx = Math.min(s.idx, items.length - 1);
  const { ex, sets: n } = items[idx];
  const sets = s.logs[ex.id]?.length === n ? s.logs[ex.id] : blankSets(ex, n, s.logs[ex.id]);
  const sug = suggestionFor(ex), sw = s.swaps[ex.id], bw = ex.inc === 0, range = repRange(ex);
  const [why, setWhy] = useState(false);
  const [rest, setRest] = useState<{ left: number; total: number } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!rest) return;
    timer.current = setInterval(() => setRest(r => (r && r.left > 1 ? { ...r, left: r.left - 1 } : null)), 1000);
    return () => clearInterval(timer.current);
  }, [rest !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSets = (next: SetLog[]) => setState({ logs: { ...s.logs, [ex.id]: next } });
  const update = (i: number, patch: Partial<SetLog>) => saveSets(sets.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const tick = (i: number) => {
    const next = sets.map((x, j) => (j === i ? { ...x, reps: x.reps || String(ex.reps[1]), done: !x.done } : x));
    saveSets(next);
    setRest(next[i].done && next.some(x => !x.done) ? { left: ex.rest, total: ex.rest } : null);
  };
  const goNext = () => {
    setRest(null); setWhy(false);
    if (idx < items.length - 1) setState({ idx: idx + 1 });
    else { setState({ finishedAt: Date.now() }); router.push('/workout/done'); }
  };
  const nextSet = sets.findIndex(x => !x.done);

  return (
    <>
      <div className="fade">
        <div className="media">
          <img src="/assets/gym.jpg" alt={`Demo of ${sw || ex.name}`} />
          <div className="ctl">
            <Link className="round glass" href="/home" aria-label="Leave workout" style={{ color: '#fff' }}><Icon name="back" /></Link>
            <div className="dots">{items.map((_, i) => <i key={i} className={i === idx ? 'on' : i < idx ? 'done' : ''} />)}</div>
            <button className="timebtn num" onClick={() => openSheet('time')} aria-label="Change session length"><Icon name="clock" /> {minutes} MIN</button>
          </div>
          <span className="chip glass playing"><Icon name="play" /> Kyle&apos;s demo</span>
        </div>
        <div className="page flush" style={{ paddingBottom: 130 }}>
          <div className="ex-title">
            <h1>{sw || ex.name}</h1>
            <div className="ex-meta num">
              <span className="chip"><Icon name="layers" /> {n} × {range}</span>
              <span className="chip"><Icon name="clock" /> {fmtSecs(ex.rest)}</span>
              {sw && <span className="chip" style={{ color: 'var(--sky)' }}><Icon name="swap" /> Swapped</span>}
            </div>
          </div>
          {!sw && !bw && (
            <>
              <button className={`target ${sug.increased ? 'up' : 'hold'}`} onClick={() => setWhy(!why)} aria-expanded={why}>
                <span className="arrow"><Icon name={sug.increased ? 'up' : 'equal'} /></span>
                <span><b className="num">{sug.load} kg</b><small>{sug.increased ? `+${ex.inc} kg from last time` : 'Same as last time'}</small></span>
                <span className="why"><Icon name="info" /></span>
              </button>
              {why && <p className="why-text">{sug.reason}</p>}
            </>
          )}
          <div className="sets">{sets.map((x, i) => (
            <div key={i} className={`setrow ${x.done ? 'done' : ''}`}>
              <span className="n">{i + 1}</span>
              <label className="val"><input inputMode="decimal" value={bw ? 'BW' : x.load} readOnly={bw} aria-label={`Set ${i + 1} weight`} onChange={e => update(i, { load: e.target.value })} />
                <small className="num">{bw ? 'bodyweight' : `kg · last ${ex.last.load}`}</small></label>
              <label className="val"><input inputMode="numeric" value={x.reps} placeholder={range} aria-label={`Set ${i + 1} reps`} onChange={e => update(i, { reps: e.target.value })} />
                <small className="num">reps · last {ex.last.reps[i] ?? '–'}</small></label>
              <button className="tick" onClick={() => tick(i)} aria-label={`Complete set ${i + 1}`}><Icon name="check" /></button>
            </div>
          ))}</div>
        </div>
      </div>

      <div className="dock">
        <button className="round" onClick={() => openSheet('swap')} aria-label="Swap exercise"><Icon name="swap" /></button>
        <button className="round pain" onClick={() => openSheet('pain')} aria-label="Report pain"><Icon name="pain" /></button>
        <button className="pill-btn mint" onClick={goNext}>{idx === items.length - 1 ? 'Finish' : 'Next'} <Icon name="right" /></button>
      </div>

      {rest && (
        <div className="rest" role="timer">
          <div className="eyebrow">Rest</div>
          <div className="ringwrap"><svg viewBox="0 0 240 240" width="240" height="240"><Ring size={240} stroke={12} pct={rest.left / rest.total} color="var(--mint)" track="rgba(255,255,255,.08)" /></svg>
            <div className="c"><b>{fmtSecs(rest.left)}</b></div></div>
          {nextSet >= 0 && <div className="nextup">Next · <b>Set {nextSet + 1}</b> · <b className="num">{bw ? 'BW' : `${sets[nextSet].load} kg`}</b></div>}
          <div className="btns">
            <button className="pill-btn dark" onClick={() => setRest(r => r && { left: r.left + 30, total: r.total + 30 })}>+30s</button>
            <button className="pill-btn white" onClick={() => setRest(null)}>Skip</button>
          </div>
        </div>
      )}
    </>
  );
}
