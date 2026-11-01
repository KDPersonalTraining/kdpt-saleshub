'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Ring, fmtSecs } from '@/components/client/ui';
import { parseLoad, parseReps } from '@/lib/client/summary';
import { setState, useClient, type ClientState, type SetLog } from '@/lib/client/store';
import { planFor, repRange, suggestionFor } from '@/lib/client/workout';
import type { Exercise } from '@/lib/client/sample-data';

const blankSets = (ex: Exercise, n: number, cur: SetLog[] = []): SetLog[] => {
  const load = ex.inc === 0 ? '0' : String(suggestionFor(ex).load);
  return Array.from({ length: n }, (_, i) => cur[i] ?? { load, reps: '', done: false });
};
// Every tap selects the whole number, so typing replaces it instead of adding to it.
const selectAll = (e: React.SyntheticEvent<HTMLInputElement>) => {
  const el = e.currentTarget, v = el.value;
  el.select();
  // iOS Safari drops a selection made during the tap, so make it again just after, unless they've started typing.
  requestAnimationFrame(() => { if (el.value === v && document.activeElement === el) el.setSelectionRange(0, v.length); });
};
const restLeft = (r: NonNullable<ClientState['rest']>, now: number) => (r.pausedLeft ?? Math.max(0, Math.ceil((r.endsAt - now) / 1000)));

export default function Workout() {
  const s = useClient(), { openSheet, toast } = useUI(), router = useRouter();
  const { items, minutes } = planFor(s.duration);
  const idx = Math.min(s.idx, items.length - 1);
  const { ex, sets: n } = items[idx];
  const sets = s.logs[ex.id]?.length === n ? s.logs[ex.id] : blankSets(ex, n, s.logs[ex.id]);
  const sug = suggestionFor(ex), sw = s.swaps[ex.id], bw = ex.inc === 0, range = repRange(ex);
  const meta = s.exNotes[ex.id] ?? { rpe: null, note: '' };
  const skipped = !!s.skipped[ex.id];
  const [why, setWhy] = useState(false);
  const [more, setMore] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // No programme yet for a brand-new client.
  useEffect(() => { if (s.preview.fresh) router.replace('/train'); }, [s.preview.fresh, router]);
  // The workout's clock starts the first time it's opened.
  useEffect(() => { if (!s.startedAt && !s.preview.fresh) setState({ startedAt: Date.now() }); }, [s.startedAt, s.preview.fresh]);
  // The rest timer is stored as an end time, so it keeps counting while away.
  useEffect(() => {
    if (!s.rest) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [s.rest]);
  const left = s.rest ? restLeft(s.rest, now) : 0;
  useEffect(() => {
    if (s.rest && s.rest.pausedLeft === null && left <= 0) { setState({ rest: null }); try { navigator.vibrate?.(200); } catch { /* not supported */ } }
  }, [left, s.rest]);

  const saveSets = (next: SetLog[]) => setState({ logs: { ...s.logs, [ex.id]: next } });
  const update = (i: number, patch: Partial<SetLog>) => saveSets(sets.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const tick = (i: number) => {
    const x = sets[i];
    if (x.done) { update(i, { done: false }); setState({ rest: null }); return; }
    const reps = x.reps || String(ex.reps[1]);
    if (!bw && parseLoad(x.load) === null) { toast('Check the weight: numbers only, up to 500 kg'); return; }
    if (parseReps(reps) === null) { toast('Check the reps: a whole number from 1 to 100'); return; }
    const next = sets.map((y, j) => (j === i ? { ...y, reps, done: true } : y));
    setState({ logs: { ...s.logs, [ex.id]: next }, rest: next.some(y => !y.done) ? { endsAt: Date.now() + ex.rest * 1000, total: ex.rest, pausedLeft: null } : null });
  };
  const goNext = (skip = false) => {
    setWhy(false); setMore(false);
    const patch: Partial<ClientState> = { rest: null, ...(skip ? { skipped: { ...s.skipped, [ex.id]: true } } : {}) };
    if (idx < items.length - 1) setState({ ...patch, idx: idx + 1 });
    else { setState({ ...patch, finishedAt: Date.now() }); router.push('/workout/done'); }
  };
  const setMeta = (patch: Partial<typeof meta>) => setState({ exNotes: { ...s.exNotes, [ex.id]: { ...meta, ...patch } } });
  const nextSet = sets.findIndex(x => !x.done);
  const bad = (v: string, kind: 'load' | 'reps') => v !== '' && (kind === 'load' ? parseLoad(v) : parseReps(v)) === null;

  return (
    <>
      <div className="fade">
        <div className="media">
          <img src="/assets/gym.jpg" alt="" />
          <div className="ctl">
            <Link className="round glass" href="/home" aria-label="Leave workout (your progress is saved)" style={{ color: '#fff' }}><Icon name="back" /></Link>
            <div className="dots">{items.map((it, i) => <i key={i} className={i === idx ? 'on' : s.skipped[it.ex.id] ? 'skip' : i < idx ? 'done' : ''} />)}</div>
            <button className="timebtn num" onClick={() => openSheet('time')} aria-label="Change session length"><Icon name="clock" /> {minutes} MIN</button>
          </div>
          <Link className="chip glass playing" href={`/library/${ex.lib}`}><Icon name="film" /> How to do it</Link>
        </div>
        <div className="page flush" style={{ paddingBottom: 130 }}>
          <div className="ex-title">
            <div className="eyebrow">Exercise {idx + 1} of {items.length}</div>
            <h1>{sw || ex.name}</h1>
            <div className="ex-meta num">
              <span className="chip"><Icon name="layers" /> {n} sets × {range} reps</span>
              <span className="chip"><Icon name="clock" /> {fmtSecs(ex.rest)} rest</span>
              {sw && <span className="chip" style={{ color: 'var(--sky)' }}><Icon name="swap" /> Swapped</span>}
              {skipped && <span className="chip" style={{ color: 'var(--amber)' }}>Skipped</span>}
            </div>
          </div>
          {!sw && !bw && (
            <>
              <button className={`target ${sug.increased ? 'up' : 'hold'}`} onClick={() => setWhy(!why)} aria-expanded={why}>
                <span className="arrow"><Icon name={sug.increased ? 'up' : 'equal'} /></span>
                <span><small style={{ marginTop: 0 }}>Today&apos;s target</small><b className="num">{sug.load} kg × {range}</b><small>{sug.increased ? `Up ${ex.inc} kg from last time` : 'Same weight as last time'}</small></span>
                <span className="why"><Icon name="info" /></span>
              </button>
              {why && <p className="why-text">{sug.reason}</p>}
            </>
          )}
          <div className="sets">
            <div className="sethead"><span>Set</span><span>{bw ? '' : 'kg'}</span><span>Reps</span><span /></div>
            {sets.map((x, i) => (
              <div key={i} className={`setrow ${x.done ? 'done' : ''}`}>
                <span className="n">{i + 1}</span>
                <label className="val"><input inputMode="decimal" enterKeyHint="next" value={bw ? 'BW' : x.load} readOnly={bw || x.done} aria-label={`Set ${i + 1} weight in kg`} aria-invalid={bad(x.load, 'load')}
                  className={bad(x.load, 'load') ? 'bad' : ''} onFocus={selectAll} onClick={selectAll} onMouseUp={e => e.preventDefault()} onChange={e => update(i, { load: e.target.value })} />
                  <small className="num">{bw ? 'bodyweight' : `last ${ex.last.load}`}</small></label>
                <label className="val"><input inputMode="numeric" enterKeyHint="done" value={x.reps} placeholder={range} readOnly={x.done} aria-label={`Set ${i + 1} reps`} aria-invalid={bad(x.reps, 'reps')}
                  className={bad(x.reps, 'reps') ? 'bad' : ''} onFocus={selectAll} onClick={selectAll} onMouseUp={e => e.preventDefault()} onChange={e => update(i, { reps: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
                  <small className="num">last {ex.last.reps[i] ?? '–'}</small></label>
                <button className="tick" onClick={() => tick(i)} aria-pressed={x.done} aria-label={x.done ? `Undo set ${i + 1}` : `Complete set ${i + 1}`}><Icon name="check" /></button>
              </div>
            ))}
          </div>
          <div className="exmore">
            <button onClick={() => setMore(!more)} aria-expanded={more}><Icon name="clip" />{meta.rpe || meta.note ? `RPE ${meta.rpe ?? '–'}${meta.note ? ' · note' : ''}` : 'How hard? Add a note'}</button>
            <button onClick={() => goNext(true)}><Icon name="skip" />Skip exercise</button>
          </div>
          {more && (
            <div className="rpe">
              <div className="eyebrow">How hard was it? Optional</div>
              <div className="rpe-scale">{[6, 7, 8, 9, 10].map(v => <button key={v} aria-pressed={meta.rpe === v} onClick={() => setMeta({ rpe: meta.rpe === v ? null : v })}>{v}</button>)}</div>
              <div className="rpe-ends"><span>Easy</span><span>Nothing left</span></div>
              <textarea className="words" style={{ minHeight: 70 }} placeholder="Note for Kyle, e.g. seat on 4" value={meta.note} onChange={e => setMeta({ note: e.target.value.slice(0, 280) })} />
            </div>
          )}
        </div>
      </div>

      <div className="dock">
        <button className="round" onClick={() => openSheet('swap')} aria-label="Swap exercise"><Icon name="swap" /></button>
        <button className="round pain" onClick={() => openSheet('pain')} aria-label="I have pain or discomfort"><Icon name="pain" /></button>
        <button className="pill-btn mint" onClick={() => goNext()}>{idx === items.length - 1 ? 'Finish' : 'Next'} <Icon name="right" /></button>
      </div>

      {s.rest && (
        <div className="rest" role="timer" aria-live="off">
          <div className="eyebrow">{s.rest.pausedLeft !== null ? 'Paused' : 'Rest'}</div>
          <div className="ringwrap"><svg viewBox="0 0 240 240" width="240" height="240"><Ring size={240} stroke={12} pct={left / s.rest.total} color="var(--mint)" track="rgba(255,255,255,.08)" /></svg>
            <div className="c"><b>{fmtSecs(left)}</b></div></div>
          {nextSet >= 0 && <div className="nextup">Next · <b>Set {nextSet + 1}</b> · <b className="num">{bw ? 'BW' : `${sets[nextSet].load} kg`}</b></div>}
          <div className="btns three">
            <button className="pill-btn dark" onClick={() => setState({ rest: { ...s.rest!, endsAt: s.rest!.endsAt + 30000, total: s.rest!.total + 30, pausedLeft: s.rest!.pausedLeft === null ? null : s.rest!.pausedLeft + 30 } })}>+30s</button>
            <button className="pill-btn dark" onClick={() => setState({ rest: s.rest!.pausedLeft === null ? { ...s.rest!, pausedLeft: left } : { ...s.rest!, endsAt: Date.now() + s.rest!.pausedLeft * 1000, pausedLeft: null } })}>
              {s.rest.pausedLeft === null ? 'Pause' : 'Resume'}</button>
            <button className="pill-btn white" onClick={() => setState({ rest: null })}>Skip</button>
          </div>
        </div>
      )}
    </>
  );
}
