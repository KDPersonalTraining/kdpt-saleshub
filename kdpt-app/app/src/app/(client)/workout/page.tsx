'use client';

import { ArrowLeftRight, Check, ChevronDown, CirclePlay, Minus, Pause, Play, Plus, SkipForward, TriangleAlert, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/components/client/shell';
import { Ring, fmtSecs } from '@/components/client/ui';
import { EXLIB, type Exercise } from '@/lib/client/sample-data';
import { useCurrentWorkout, useLive, type CurrentWorkout } from '@/lib/client/live';
import { sessionJob, uuid } from '@/lib/client/record';
import { queueSession } from '@/lib/client/sync';
import { clock, elapsedMs, nextSetIndex, stepKm, stepLoad, stepMins, stepReps } from '@/lib/client/session';
import { KIND_LABEL, KIND_SHORT, firstStep, setLoad, setsOf, type PlannedSet } from '@/lib/programmes/sets';
import { parseKm, parseLoad, parseMins, parseReps } from '@/lib/client/summary';
import { setState, updateOnceLoaded, useClient, type ClientState, type SetLog } from '@/lib/client/store';
import { planFor, repRange, suggestionFor } from '@/lib/client/workout';

// Workout mode: a full-screen training environment. One set at a time, large
// controls, everything else one tap away. Progress is saved as it happens, so
// leaving, pausing or closing the app never loses anything.
const I = { size: 22, strokeWidth: 1.75 } as const;

// Each set starts filled in: the suggested weight from last time (or Kyle's
// starting weight), lighter for warm-ups and drop sets, and the set's target
// reps. Cardio distance starts empty, to read off the machine.
const prefill = (ex: Exercise, n: number, cur: SetLog[] = []): SetLog[] => {
  const plan = setsOf(n, ex.reps, ex.plan);
  const base = ex.inc === 0 ? 0 : ex.last.reps.length ? suggestionFor(ex).load : ex.start ?? null;
  return Array.from({ length: n }, (_, i) => cur[i] ?? {
    load: ex.measure === 'distance' ? '' : ex.inc === 0 ? '0' : String(setLoad(plan[i]?.kind ?? 'working', base, ex.inc) ?? ''),
    reps: String(plan[i] ? (plan[i].kind === 'amrap' ? plan[i].reps[0] : plan[i].reps[1]) : ex.reps[1]), done: false,
  });
};
const target = (p: PlannedSet, unit: string) => (p.kind === 'amrap' ? `${p.reps[0]}+ ${unit}` : `${p.reps[0] === p.reps[1] ? p.reps[0] : `${p.reps[0]}–${p.reps[1]}`} ${unit}`);
const restLeft = (r: NonNullable<ClientState['rest']>, now: number) => (r.pausedLeft ?? Math.min(r.total, Math.max(0, Math.ceil((r.endsAt - now) / 1000))));

export default function Workout() {
  const s = useClient(), router = useRouter();
  const w = useCurrentWorkout(s);
  useEffect(() => { if (!w) router.replace('/train'); }, [w, router]);
  return w ? <WorkoutMode w={w} /> : null;
}

function WorkoutMode({ w }: { w: CurrentWorkout }) {
  const s = useClient(), { openSheet, toast, me } = useUI(), router = useRouter(), live = useLive();
  const { items } = planFor(s.duration, w);
  const idx = Math.min(s.idx, items.length - 1);
  const { ex, sets: n } = items[idx];
  const sets = s.logs[ex.id]?.length === n ? s.logs[ex.id] : prefill(ex, n, s.logs[ex.id]);
  const [editing, setEditing] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'exit' | 'howto' | 'list' | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const paused = s.pausedAt != null;

  useEffect(() => { updateOnceLoaded(st => (st.startedAt == null ? { startedAt: Date.now(), wid: w.id, sid: uuid() } : null)); }, [s, w.id]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const left = s.rest ? restLeft(s.rest, now) : 0;
  useEffect(() => {
    if (s.rest && s.rest.pausedLeft === null && left <= 0) { setState({ rest: null }); try { navigator.vibrate?.(200); } catch { /* not supported */ } }
  }, [left, s.rest]);

  const cur = editing ?? nextSetIndex(sets);
  const dist = ex.measure === 'distance', bw = ex.inc === 0 && !dist, name = s.swaps[ex.id] ?? ex.name, sug = suggestionFor(ex);
  const unit = dist ? 'min' : 'reps';
  const plan = setsOf(n, ex.reps, ex.plan), ps = cur != null ? plan[cur] : null;
  const save = (next: SetLog[]) => setState({ logs: { ...s.logs, [ex.id]: next } });
  const change = (i: number, patch: Partial<SetLog>) => save(sets.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const complete = () => {
    if (cur == null) return;
    const x = sets[cur];
    if (dist) {
      if (parseKm(x.load) === null) { toast('Check the distance: in km, e.g. 2.4'); return; }
      if (parseMins(x.reps) === null) { toast('Check the time: whole minutes, 1 to 600'); return; }
    } else {
      if (!bw && parseLoad(x.load) === null) { toast('Check the weight: a number up to 500 kg'); return; }
      if (parseReps(x.reps) === null) { toast('Check the reps: a whole number from 1 to 100'); return; }
    }
    // The weight just lifted carries into the sets still to do (a drop set
    // gets about 20% less). Warm-up weights don't carry forward.
    // Sets still showing the starting suggestion (or empty) follow the change;
    // anything the client typed themselves is left alone.
    const k = plan[cur]?.kind ?? 'working', carry = parseLoad(x.load), defaults = prefill(ex, n);
    const next = sets.map((y, j) => {
      if (j === cur) return { ...y, done: true };
      const kj = plan[j]?.kind ?? 'working', untouched = y.load === '' || y.load === defaults[j]?.load;
      if (j > cur && !y.done && untouched && carry !== null && k !== 'warmup' && kj !== 'warmup') return { ...y, load: String(kj === 'drop' ? setLoad('drop', carry, ex.inc) : carry) };
      return y;
    });
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
  const finish = () => {
    const now = Date.now();
    setState({ finishedAt: now, between: null, rest: null, pausedAt: null, pausedMs: s.pausedMs + (paused ? now - s.pausedAt! : 0) });
    // Live: send the workout to the database (it waits on the phone if there's no signal).
    const job = live && sessionJob({ ...s, finishedAt: now }, w, { clientId: me.id, orgId: live.orgId });
    if (job) void queueSession(job);
    router.push('/workout/done');
  };
  const skip = () => {
    setState({ skipped: { ...s.skipped, [ex.id]: true }, rest: null, between: null, ...(idx < items.length - 1 ? { idx: idx + 1 } : {}) });
    if (idx === items.length - 1) finish(); else toast(`${name} skipped`);
  };
  // After a pain report: skip the exercise, stop the workout, or choose a swap.
  useEffect(() => {
    if (!s.pain.sent || s.pain.handled) return;
    setState({ pain: { ...s.pain, handled: true } });
    if (s.pain.act === 'skip') skip();
    else if (s.pain.act === 'stop') finish();
    else if (s.pain.act === 'swap' && ex.alts.length) openSheet('swap');
  }, [s.pain]); // eslint-disable-line react-hooks/exhaustive-deps
  // Jump to any exercise, back or forward. Nothing logged is lost.
  const go = (i: number) => { setEditing(null); setSheet(null); setState({ idx: i, between: null, rest: null, skipped: { ...s.skipped, [items[i].ex.id]: false } }); };
  const togglePause = () => setState(paused ? { pausedMs: s.pausedMs + (Date.now() - s.pausedAt!), pausedAt: null } : { pausedAt: Date.now() });

  const doneSets = sets.filter(x => x.done).length;
  const lib = EXLIB.find(e => e.id === ex.lib);
  const cues = w.exercises.find(e => e.id === ex.id)?.cues?.length ? w.exercises.find(e => e.id === ex.id)!.cues! : lib?.cues ?? [];
  const note = w.exercises.find(e => e.id === ex.id)?.note;
  const first = !bw && !dist && ex.last.reps.length === 0;

  return (
    <div className="wm">
      <header className="wm-top">
        <button className="wm-text" onClick={() => setSheet('exit')}><X {...I} />Exit</button>
        <button className="wm-where" onClick={() => setSheet('list')} aria-label="All exercises in this workout"><span className="num">{clock(elapsedMs(s, now))}</span><small>Exercise {idx + 1} of {items.length} <ChevronDown size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: -1 }} /></small></button>
        <button className="wm-text" onClick={togglePause} aria-pressed={paused}>{paused ? <Play {...I} /> : <Pause {...I} />}{paused ? 'Resume' : 'Pause'}</button>
      </header>
      <div className="wm-progress">{items.map((it, i) => (
        <button key={it.ex.id} aria-label={`Go to ${s.swaps[it.ex.id] ?? it.ex.name}`} onClick={() => go(i)}
          className={s.skipped[it.ex.id] ? 'skip' : (s.logs[it.ex.id] ?? []).length && (s.logs[it.ex.id] ?? []).every(x => x.done) ? 'done' : i === idx ? 'now' : ''} />
      ))}</div>

      {s.between === ex.id ? (
        <Between ex={ex} name={name} sets={sets} rest={s.rest ? left : 0} isLast={idx === items.length - 1} next={items[idx + 1]?.ex}
          nextName={items[idx + 1] ? s.swaps[items[idx + 1].ex.id] ?? items[idx + 1].ex.name : ''} onNext={startNext}
          onBack={() => setState({ between: null })} />
      ) : (
        <main className="wm-main" key={ex.id}>
          <div className="wm-ex">
            <h1>{name}</h1>
            <p className="wm-meta num">{cur == null ? (dist ? 'All rounds done' : 'All sets done') : <>{`${dist ? 'Round' : 'Set'} ${cur + 1} of ${n}`}{ps && ps.kind !== 'working' ? <b style={{ color: ps.kind === 'warmup' ? 'var(--amber)' : 'var(--violet)' }}> · {KIND_LABEL[ps.kind]}</b> : ''} · {ps ? target(ps, unit) : `${repRange(ex)} ${unit}`}</>} · rest {fmtSecs(ex.rest)}</p>
            {note && <p className="wm-meta">Kyle: {note}</p>}
          </div>

          {cur != null && (
            <section className="wm-set" aria-label={`Set ${cur + 1}`}>
              <div className="wm-values">
                {dist ? (<>
                  <Value label="km" value={sets[cur].load} kind="km" onChange={v => change(cur, { load: v })} onStep={d => change(cur, { load: stepKm(sets[cur].load, d * 0.1) })} />
                  <Value label="min" value={sets[cur].reps} kind="mins" onChange={v => change(cur, { reps: v })} onStep={d => change(cur, { reps: stepMins(sets[cur].reps, d) })} />
                </>) : (<>
                {!bw && <Value label="kg" value={sets[cur].load} kind="load" onChange={v => change(cur, { load: v })} onStep={d => change(cur, { load: sets[cur].load === '' && d > 0 ? String(firstStep(ex.kit, ex.inc)) : stepLoad(sets[cur].load, d * (ex.inc || 2.5)) })} />}
                <Value label="reps" value={sets[cur].reps} kind="reps" onChange={v => change(cur, { reps: v })} onStep={d => change(cur, { reps: stepReps(sets[cur].reps, d) })} />
                </>)}
              </div>
              <p className="wm-target">
                {dist ? <>Aim for {repRange(ex)} minutes · log the distance from the machine or your watch</>
                  : bw ? <>Bodyweight · aim for {repRange(ex)} reps</> : s.swaps[ex.id] ? <>Swapped exercise · pick a weight you can do {repRange(ex)} reps with</>
                  : ps?.kind === 'warmup' ? <>Warm-up · a light weight, smooth reps. It doesn&apos;t count towards your progress.</>
                  : ps?.kind === 'drop' ? <>Drop set · take some weight off and go again straight away</>
                  : ps?.kind === 'amrap' ? <>As many good reps as you can, at least {ps.reps[0]}</>
                  : first ? <>First time · {ex.start ? <>Kyle suggests starting at <b className="num">{ex.start} kg</b>. </> : null}Pick a weight you could do <b>{(ps?.reps[1] ?? ex.reps[1]) + 2}</b> reps with</>
                  : <>Target <b className="num">{sug.load} kg × {ps ? target(ps, '').trim() : repRange(ex)}</b>{sug.increased ? ` · up ${ex.inc} kg` : ''}</>}
                {ex.last.reps.length > 0 && <><br /><span className="num">Last time {bw ? 'BW' : `${ex.last.load} kg`} × {ex.last.reps.join(', ')}</span></>}
              </p>
              <button className="wm-primary" onClick={complete}><Check {...I} size={24} />{`${editing != null ? 'Save' : 'Complete'} ${dist ? 'round' : 'set'} ${cur + 1}`}</button>
              {editing != null && <button className="wm-text center" onClick={() => setEditing(null)}>Cancel edit</button>}
            </section>
          )}
          {cur == null && <button className="wm-primary" onClick={() => setState({ between: ex.id })}>Continue</button>}

          {/* Every set of this exercise: done, now, and still to come. Tap any to change it. */}
          <ol className="wm-sets" aria-label="Sets">{sets.map((x, i) => { const p = plan[i]; const isNow = i === cur; return (
            <li key={i} className={isNow ? 'now' : x.done ? 'done' : ''}><button onClick={() => setEditing(x.done || !isNow ? i : null)} aria-label={`${x.done ? 'Edit' : 'Go to'} set ${i + 1}`}>
              <span className="n">{p?.kind && p.kind !== 'working' ? <em className={p.kind}>{KIND_SHORT[p.kind]}</em> : i + 1}</span>
              <span className="num tgt">{p ? target(p, unit) : `${repRange(ex)} ${unit}`}</span>
              <span className="num val">{x.done ? (dist ? `${x.load} km · ${x.reps} min` : <>{bw ? 'BW' : `${x.load} kg`} × {x.reps}</>) : dist ? '' : bw ? '' : x.load ? `${x.load} kg` : '–'}</span>
              {x.done ? <Check {...I} size={18} className="ok" /> : isNow ? <span className="nowtag">Now</span> : <span />}</button></li>
          ); })}</ol>

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
          {cur != null && <p className="wm-next num">Next: {dist ? `round ${cur + 1} · ${sets[cur].reps} min` : <>set {cur + 1} · {bw ? 'bodyweight' : `${sets[cur].load} kg`} × {sets[cur].reps}</>}</p>}
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
            {sheet === 'list' ? (<>
              <h2>{w.name}</h2>
              <ol className="wm-list-ex">{items.map((it, i) => { const lg = s.logs[it.ex.id] ?? [], d = lg.filter(x => x.done).length; return (
                <li key={it.ex.id}><button onClick={() => go(i)} aria-current={i === idx ? 'step' : undefined}>
                  <span className="n num">{i + 1}</span><span><b>{s.swaps[it.ex.id] ?? it.ex.name}</b><small className="num">{s.skipped[it.ex.id] ? 'Skipped' : `${d} of ${it.sets} ${it.ex.measure === 'distance' ? 'rounds' : 'sets'} done`}</small></span>
                  {d === it.sets ? <Check {...I} size={18} style={{ color: 'var(--mint)' }} /> : i === idx ? <span className="nowtag">Now</span> : null}</button></li>
              ); })}</ol>
              <button className="wm-secondary" onClick={() => setSheet(null)}>Close</button>
            </>) : sheet === 'exit' ? (<>
              <h2>Leave the workout?</h2>
              <p>Everything you&apos;ve logged is saved. You can carry on from Home whenever you&apos;re ready.</p>
              <button className="wm-primary" onClick={() => { if (!paused) togglePause(); router.push('/home'); }}>Save and leave</button>
              <button className="wm-secondary" onClick={() => { setSheet(null); finish(); }}>Finish now</button>
              <button className="wm-text center" onClick={() => setSheet(null)}>Keep going</button>
            </>) : (<>
              <h2>{name}</h2>
              <div className="wm-video"><CirclePlay {...I} size={28} /><span>Kyle&apos;s video is coming soon</span></div>
              {cues.length > 0 && <ol className="wm-cues">{cues.map(c => <li key={c}>{c}</li>)}</ol>}
              <button className="wm-secondary" onClick={() => setSheet(null)}>Close</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}

// A big number with − and + either side. Tapping the number lets you type it.
const CHECK = { load: parseLoad, reps: parseReps, km: parseKm, mins: parseMins };
function Value({ label, value, kind, onChange, onStep }: { label: string; value: string; kind: keyof typeof CHECK; onChange: (v: string) => void; onStep: (d: number) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const bad = value !== '' && CHECK[kind](value) === null;
  const select = () => { const el = ref.current; if (!el) return; const v = el.value; el.select(); requestAnimationFrame(() => { if (el.value === v && document.activeElement === el) el.setSelectionRange(0, v.length); }); };
  return (
    <div className={`wm-value ${bad ? 'bad' : ''}`}>
      <button className="step" onClick={() => onStep(-1)} aria-label={`Less ${label}`}><Minus {...I} size={26} /></button>
      <label><input ref={ref} className="num" inputMode={kind === 'load' || kind === 'km' ? 'decimal' : 'numeric'} value={value} placeholder="–" aria-label={label} aria-invalid={bad}
        onFocus={select} onClick={select} onMouseUp={e => e.preventDefault()}
        onChange={e => onChange(kind === 'reps' || kind === 'mins' ? e.target.value.replace(/\D/g, '').slice(0, 3) : e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))} /><span>{label}</span></label>
      <button className="step" onClick={() => onStep(1)} aria-label={`More ${label}`}><Plus {...I} size={26} /></button>
    </div>
  );
}

// Between exercises: what you just did, how hard it felt, and what's next.
function Between({ ex, name, sets, rest, isLast, next, nextName, onNext, onBack }: {
  ex: Exercise; name: string; sets: SetLog[]; rest: number; isLast: boolean; next?: Exercise; nextName: string; onNext: () => void; onBack: () => void;
}) {
  const s = useClient(), meta = s.exNotes[ex.id] ?? { rpe: null, note: '' };
  const dist = ex.measure === 'distance';
  const vol = dist ? 0 : Math.round(sets.filter(x => x.done).reduce((t, x) => t + (parseLoad(x.load) ?? 0) * (parseReps(x.reps) ?? 0), 0));
  const km = dist ? Math.round(sets.filter(x => x.done).reduce((t, x) => t + (parseKm(x.load) ?? 0), 0) * 10) / 10 : 0;
  const setMeta = (patch: Partial<typeof meta>) => setState({ exNotes: { ...s.exNotes, [ex.id]: { ...meta, ...patch } } });
  return (
    <main className="wm-main wm-between">
      <div className="wm-ex"><span className="wm-cap ok"><Check {...I} size={16} />Done</span><h1>{name}</h1>
        <p className="wm-meta num">{sets.filter(x => x.done).length} {dist ? 'rounds' : 'sets'}{vol ? ` · ${vol.toLocaleString('en-GB')} kg lifted` : ''}{km ? ` · ${km} km` : ''}</p></div>
      <div className="wm-rpe">
        <span className="wm-cap">How hard was it? Optional</span>
        <div>{[6, 7, 8, 9, 10].map(v => <button key={v} aria-pressed={meta.rpe === v} onClick={() => setMeta({ rpe: meta.rpe === v ? null : v })}>{v}</button>)}</div>
        <p className="num"><span>6 · plenty left</span><span>10 · nothing left</span></p>
        <input className="wm-note" placeholder="Note for Kyle (optional)" value={meta.note} onChange={e => setMeta({ note: e.target.value.slice(0, 280) })} />
      </div>
      <div className="wm-upnext">
        {isLast ? <><span className="wm-cap">That was the last exercise</span><h2>Ready to finish?</h2></>
          : <><span className="wm-cap">Up next{rest > 0 ? <> · rest <b className="num">{fmtSecs(rest)}</b></> : ''}</span><h2>{nextName}</h2>
            {next && <p className="num">{next.sets} {next.measure === 'distance' ? (next.sets === 1 ? 'round' : 'rounds') : next.sets === 1 ? 'set' : 'sets'} · {repRange(next)} {next.measure === 'distance' ? 'min' : 'reps'}</p>}</>}
      </div>
      <button className="wm-primary" onClick={onNext}>{isLast ? 'Finish workout' : `Start ${nextName}`}</button>
      <button className="wm-text center" onClick={onBack}>Back to {name}</button>
    </main>
  );
}
