'use client';

import { ArrowLeftRight, Check, CirclePlay, Minus, Pause, Play, Plus, SkipForward, TriangleAlert, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/components/client/shell';
import { Ring, fmtSecs } from '@/components/client/ui';
import { EXLIB, type Exercise } from '@/lib/client/sample-data';
import { clock, elapsedMs, nextSetIndex, stepLoad, stepReps } from '@/lib/client/session';
import { parseLoad, parseReps } from '@/lib/client/summary';
import { setState, updateOnceLoaded, useClient, type ClientState, type SetLog } from '@/lib/client/store';
import { planFor, repRange, suggestionFor } from '@/lib/client/workout';

// Workout mode: a full-screen training environment. One set at a time, large
// controls, everything else one tap away. Progress is saved as it happens, so
// leaving, pausing or closing the app never loses anything.
const I = { size: 22, strokeWidth: 1.75 } as const;

const prefill = (ex: Exercise, n: number, cur: SetLog[] = []): SetLog[] => {
  const load = ex.inc === 0 ? '0' : String(suggestionFor(ex).load);
  return Array.from({ length: n }, (_, i) => cur[i] ?? { load, reps: String(ex.reps[1]), done: false });
};
const restLeft = (r: NonNullable<ClientState['rest']>, now: number) => (r.pausedLeft ?? Math.min(r.total, Math.max(0, Math.ceil((r.endsAt - now) / 1000))));

export default function Workout() {
  const s = useClient(), { openSheet, toast } = useUI(), router = useRouter();
  const { items } = planFor(s.duration);
  const idx = Math.min(s.idx, items.length - 1);
  const { ex, sets: n } = items[idx];
  const sets = s.logs[ex.id]?.length === n ? s.logs[ex.id] : prefill(ex, n, s.logs[ex.id]);
  const [editing, setEditing] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'exit' | 'howto' | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const paused = s.pausedAt != null;

  useEffect(() => { if (s.preview.fresh) router.replace('/train'); }, [s.preview.fresh, router]);
  useEffect(() => { updateOnceLoaded(st => (st.startedAt == null && !st.preview.fresh ? { startedAt: Date.now() } : null)); }, [s]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const left = s.rest ? restLeft(s.rest, now) : 0;
  useEffect(() => {
    if (s.rest && s.rest.pausedLeft === null && left <= 0) { setState({ rest: null }); try { navigator.vibrate?.(200); } catch { /* not supported */ } }
  }, [left, s.rest]);

  const cur = editing ?? nextSetIndex(sets);
  const bw = ex.inc === 0, name = s.swaps[ex.id] ?? ex.name, sug = suggestionFor(ex);
  const save = (next: SetLog[]) => setState({ logs: { ...s.logs, [ex.id]: next } });
  const change = (i: number, patch: Partial<SetLog>) => save(sets.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const complete = () => {
    if (cur == null) return;
    const x = sets[cur];
    if (!bw && parseLoad(x.load) === null) { toast('Check the weight: a number up to 500 kg'); return; }
    if (parseReps(x.reps) === null) { toast('Check the reps: a whole number from 1 to 100'); return; }
    const next = sets.map((y, j) => (j === cur ? { ...y, done: true } : y));
    const wasEditing = editing != null;
    setEditing(null);
    if (wasEditing) { save(next); return; }
    const allDone = next.every(y => y.done);
    setState({ logs: { ...s.logs, [ex.id]: next }, rest: { endsAt: Date.now() + ex.rest * 1000, total: ex.rest, pausedLeft: null }, ...(allDone ? { between: ex.id } : {}) });
  };
  const startNext = () => {
    setEditing(null);
    if (idx < items.length - 1) setState({ idx: idx + 1, between: null, rest: null });
    else finish();
  };
  const finish = () => { setState({ finishedAt: Date.now(), between: null, rest: null, pausedAt: null, pausedMs: s.pausedMs + (paused ? Date.now() - s.pausedAt! : 0) }); router.push('/workout/done'); };
  const skip = () => {
    setState({ skipped: { ...s.skipped, [ex.id]: true }, rest: null, between: null, ...(idx < items.length - 1 ? { idx: idx + 1 } : {}) });
    if (idx === items.length - 1) finish(); else toast(`${name} skipped`);
  };
  const togglePause = () => setState(paused ? { pausedMs: s.pausedMs + (Date.now() - s.pausedAt!), pausedAt: null } : { pausedAt: Date.now() });

  const doneSets = sets.filter(x => x.done).length;
  const lib = EXLIB.find(e => e.id === ex.lib);

  return (
    <div className="wm">
      <header className="wm-top">
        <button className="wm-text" onClick={() => setSheet('exit')}><X {...I} />Exit</button>
        <div className="wm-where"><span className="num">{clock(elapsedMs(s, now))}</span><small>Exercise {idx + 1} of {items.length}</small></div>
        <button className="wm-text" onClick={togglePause} aria-pressed={paused}>{paused ? <Play {...I} /> : <Pause {...I} />}{paused ? 'Resume' : 'Pause'}</button>
      </header>
      <div className="wm-progress" aria-hidden="true">{items.map((it, i) => (
        <i key={it.ex.id} className={s.skipped[it.ex.id] ? 'skip' : i < idx || (i === idx && s.between) ? 'done' : i === idx ? 'now' : ''} />
      ))}</div>

      {s.between === ex.id ? (
        <Between ex={ex} name={name} sets={sets} rest={s.rest ? left : 0} isLast={idx === items.length - 1} next={items[idx + 1]?.ex}
          nextName={items[idx + 1] ? s.swaps[items[idx + 1].ex.id] ?? items[idx + 1].ex.name : ''} onNext={startNext}
          onBack={() => setState({ between: null })} />
      ) : (
        <main className="wm-main" key={ex.id}>
          <div className="wm-ex">
            <h1>{name}</h1>
            <p className="wm-meta num">{cur == null ? 'All sets done' : `Set ${cur + 1} of ${n}`} · {repRange(ex)} reps · rest {fmtSecs(ex.rest)}</p>
          </div>

          {cur != null && (
            <section className="wm-set" aria-label={`Set ${cur + 1}`}>
              <div className="wm-values">
                {!bw && <Value label="kg" value={sets[cur].load} kind="load" onChange={v => change(cur, { load: v })} onStep={d => change(cur, { load: stepLoad(sets[cur].load, d * (ex.inc || 2.5)) })} />}
                <Value label="reps" value={sets[cur].reps} kind="reps" onChange={v => change(cur, { reps: v })} onStep={d => change(cur, { reps: stepReps(sets[cur].reps, d) })} />
              </div>
              <p className="wm-target">
                {bw ? <>Bodyweight · aim for {repRange(ex)} reps</> : s.swaps[ex.id] ? <>Swapped exercise · pick a weight you can do {repRange(ex)} reps with</>
                  : <>Target <b className="num">{sug.load} kg × {repRange(ex)}</b>{sug.increased ? ` · up ${ex.inc} kg` : ''}</>}
                <br /><span className="num">Last time {bw ? 'BW' : `${ex.last.load} kg`} × {ex.last.reps.join(', ')}</span>
              </p>
              <button className="wm-primary" onClick={complete}><Check {...I} size={24} />{editing != null ? `Save set ${cur + 1}` : `Complete set ${cur + 1}`}</button>
              {editing != null && <button className="wm-text center" onClick={() => setEditing(null)}>Cancel edit</button>}
            </section>
          )}
          {cur == null && <button className="wm-primary" onClick={() => setState({ between: ex.id })}>Continue</button>}

          {doneSets > 0 && (
            <ol className="wm-done">{sets.map((x, i) => x.done && (
              <li key={i}><button onClick={() => setEditing(i)} aria-label={`Edit set ${i + 1}`}>
                <span className="n">{i + 1}</span><span className="num">{bw ? 'BW' : `${x.load} kg`} × {x.reps}</span><Check {...I} size={18} className="ok" /><span className="edit">Edit</span></button></li>
            ))}</ol>
          )}

          <nav className="wm-actions" aria-label="More for this exercise">
            <button onClick={() => setSheet('howto')}><CirclePlay {...I} />How to</button>
            {ex.alts.length > 0 && <button onClick={() => openSheet('swap')}><ArrowLeftRight {...I} />Swap</button>}
            <button className="pain" onClick={() => openSheet('pain')}><TriangleAlert {...I} />Pain</button>
            <button onClick={skip}><SkipForward {...I} />Skip</button>
          </nav>
        </main>
      )}

      {s.rest && !s.between && (
        <div className="wm-rest" role="timer">
          <span className="wm-cap">{s.rest.pausedLeft !== null ? 'Rest paused' : 'Rest'}</span>
          <div className="wm-ring"><svg viewBox="0 0 260 260" width="260" height="260"><Ring size={260} stroke={6} pct={left / s.rest.total} color="var(--mint)" track="rgba(255,255,255,.08)" /></svg>
            <b className="num">{fmtSecs(left)}</b></div>
          {cur != null && <p className="wm-next num">Next: set {cur + 1} · {bw ? 'bodyweight' : `${sets[cur].load} kg`} × {sets[cur].reps}</p>}
          <div className="wm-rest-btns">
            <button onClick={() => setState({ rest: { ...s.rest!, endsAt: s.rest!.endsAt + 30000, total: s.rest!.total + 30, pausedLeft: s.rest!.pausedLeft === null ? null : s.rest!.pausedLeft + 30 } })}>+30 s</button>
            <button onClick={() => setState({ rest: s.rest!.pausedLeft === null ? { ...s.rest!, pausedLeft: left } : { ...s.rest!, endsAt: Date.now() + s.rest!.pausedLeft * 1000, pausedLeft: null } })}>{s.rest.pausedLeft === null ? 'Pause' : 'Resume'}</button>
            <button className="go" onClick={() => setState({ rest: null })}>Skip rest</button>
          </div>
        </div>
      )}

      {paused && (
        <div className="wm-paused">
          <span className="wm-cap">Paused</span><b className="num">{clock(elapsedMs(s, now))}</b>
          <p>Your progress is saved. The clock is stopped.</p>
          <button className="wm-primary" onClick={togglePause}><Play {...I} />Resume</button>
          <button className="wm-text center" onClick={() => setSheet('exit')}>Exit workout</button>
        </div>
      )}

      {sheet && (
        <div className="wm-scrim" onClick={e => { if (e.target === e.currentTarget) setSheet(null); }}>
          <div className="wm-sheet" role="dialog" aria-modal="true">
            {sheet === 'exit' ? (<>
              <h2>Leave the workout?</h2>
              <p>Everything you&apos;ve logged is saved. You can carry on from Home whenever you&apos;re ready.</p>
              <button className="wm-primary" onClick={() => { if (!paused) togglePause(); router.push('/home'); }}>Save and leave</button>
              <button className="wm-secondary" onClick={() => { setSheet(null); finish(); }}>Finish now</button>
              <button className="wm-text center" onClick={() => setSheet(null)}>Keep going</button>
            </>) : (<>
              <h2>{lib?.name ?? name}</h2>
              <div className="wm-video"><CirclePlay {...I} size={28} /><span>Kyle&apos;s video is coming soon</span></div>
              {lib && <ol className="wm-cues">{lib.cues.map(c => <li key={c}>{c}</li>)}</ol>}
              <button className="wm-secondary" onClick={() => setSheet(null)}>Close</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}

// A big number with − and + either side. Tapping the number lets you type it.
function Value({ label, value, kind, onChange, onStep }: { label: string; value: string; kind: 'load' | 'reps'; onChange: (v: string) => void; onStep: (d: number) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const bad = value !== '' && (kind === 'load' ? parseLoad(value) : parseReps(value)) === null;
  const select = () => { const el = ref.current; if (!el) return; const v = el.value; el.select(); requestAnimationFrame(() => { if (el.value === v && document.activeElement === el) el.setSelectionRange(0, v.length); }); };
  return (
    <div className={`wm-value ${bad ? 'bad' : ''}`}>
      <button className="step" onClick={() => onStep(-1)} aria-label={`Less ${label}`}><Minus {...I} size={26} /></button>
      <label><input ref={ref} className="num" inputMode={kind === 'load' ? 'decimal' : 'numeric'} value={value} aria-label={label} aria-invalid={bad}
        onFocus={select} onClick={select} onMouseUp={e => e.preventDefault()}
        onChange={e => onChange(kind === 'reps' ? e.target.value.replace(/\D/g, '').slice(0, 3) : e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))} /><span>{label}</span></label>
      <button className="step" onClick={() => onStep(1)} aria-label={`More ${label}`}><Plus {...I} size={26} /></button>
    </div>
  );
}

// Between exercises: what you just did, how hard it felt, and what's next.
function Between({ ex, name, sets, rest, isLast, next, nextName, onNext, onBack }: {
  ex: Exercise; name: string; sets: SetLog[]; rest: number; isLast: boolean; next?: Exercise; nextName: string; onNext: () => void; onBack: () => void;
}) {
  const s = useClient(), meta = s.exNotes[ex.id] ?? { rpe: null, note: '' };
  const vol = Math.round(sets.filter(x => x.done).reduce((t, x) => t + (parseLoad(x.load) ?? 0) * (parseReps(x.reps) ?? 0), 0));
  const setMeta = (patch: Partial<typeof meta>) => setState({ exNotes: { ...s.exNotes, [ex.id]: { ...meta, ...patch } } });
  return (
    <main className="wm-main wm-between">
      <div className="wm-ex"><span className="wm-cap ok"><Check {...I} size={16} />Done</span><h1>{name}</h1>
        <p className="wm-meta num">{sets.filter(x => x.done).length} sets{vol ? ` · ${vol.toLocaleString('en-GB')} kg lifted` : ''}</p></div>
      <div className="wm-rpe">
        <span className="wm-cap">How hard was it? Optional</span>
        <div>{[6, 7, 8, 9, 10].map(v => <button key={v} aria-pressed={meta.rpe === v} onClick={() => setMeta({ rpe: meta.rpe === v ? null : v })}>{v}</button>)}</div>
        <p className="num"><span>6 · plenty left</span><span>10 · nothing left</span></p>
        <input className="wm-note" placeholder="Note for Kyle (optional)" value={meta.note} onChange={e => setMeta({ note: e.target.value.slice(0, 280) })} />
      </div>
      <div className="wm-upnext">
        {isLast ? <><span className="wm-cap">That was the last exercise</span><h2>Ready to finish?</h2></>
          : <><span className="wm-cap">Up next{rest > 0 ? <> · rest <b className="num">{fmtSecs(rest)}</b></> : ''}</span><h2>{nextName}</h2>
            {next && <p className="num">{next.sets} sets · {repRange(next)} reps</p>}</>}
      </div>
      <button className="wm-primary" onClick={onNext}>{isLast ? 'Finish workout' : `Start ${nextName}`}</button>
      <button className="wm-text center" onClick={onBack}>Back to {name}</button>
    </main>
  );
}
