'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { Chev, Empty, Explain, Li, Switch } from '@/components/client/ui';
import { CONSISTENCY, LIFTS, MEASUREMENTS, RECORDS, WEEKLY_TOTALS, WEIGHT_7DAY } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';
import { estimateOneRepMax } from '@/lib/rules';

const e1rm = (w: number, r: number) => Math.round(estimateOneRepMax(w, r) ?? w);
const TABS = ['Strength', 'Records', 'Body', 'Consistency'];

export default function ProgressPage() {
  return <Suspense><Progress /></Suspense>;
}

function Progress() {
  const sp = useSearchParams();
  const [tab, setTab] = useState(Number(sp.get('tab') ?? 0));
  const [lift, setLift] = useState(sp.get('lift') && LIFTS[sp.get('lift')!] ? sp.get('lift')! : 'Leg Press');
  const s = useClient();
  if (s.preview.fresh) return (
    <div className="page fade">
      <div className="greet" style={{ paddingTop: 6 }}><div className="eyebrow">Your progress</div><h1>Progress</h1></div>
      <Empty icon="progress" color="var(--mint)" title="Your progress starts here">After your first few workouts you&apos;ll see your lifts climb, your records and how consistent you&apos;ve been.</Empty>
    </div>
  );
  return (
    <div className="page fade">
      <div className="greet" style={{ paddingTop: 6 }}><div className="eyebrow">Since 1 September</div><h1>Progress</h1><p className="headline">Stronger on every main lift, and 5 cm off your waist.</p></div>
      <div className="seg four" role="tablist">{TABS.map((t, i) => <button key={t} role="tab" className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{t}</button>)}</div>
      {tab === 0 ? <Strength lift={lift} setLift={setLift} /> : tab === 1 ? <Records /> : tab === 2 ? <Body /> : <Consistency />}
    </div>
  );
}

function Strength({ lift, setLift }: { lift: string; setLift: (l: string) => void }) {
  const rows = LIFTS[lift], f = rows[0], l = rows[rows.length - 1];
  const rev = rows.slice().reverse();
  return (
    <>
      <div className="liftchips">{Object.keys(LIFTS).map(k => <button key={k} className={lift === k ? 'on' : ''} onClick={() => setLift(k)}>{k}</button>)}</div>
      <div className="card big-stat"><div className="eyebrow">{lift} · top set each session, kg</div>
        <div className="delta num">+{l[1] - f[1]} kg</div>
        <div className="lbl num">{f[1]} kg × {f[2]} on {f[0]} → {l[1]} kg × {l[2]} on {l[0]}</div>
        <LiftChart rows={rows} /></div>
      <div><div className="sec-head" style={{ marginBottom: 10 }}><h2>Every session</h2></div>
        <div className="group" style={{ '--inset': '14px' } as React.CSSProperties}>{rev.map((x, i) => {
          const prev = rev[i + 1], ch = prev ? x[1] - prev[1] : 0, rc = prev && ch === 0 ? x[2] - prev[2] : 0;
          return (
            <div className="sess" key={x[0]}><time>{x[0]}</time><span><b className="num">{x[1]} kg × {x[2]}</b><small className="num">Est. 1-rep max {e1rm(x[1], x[2])} kg</small></span>
              <span className="chg num" style={{ color: ch > 0 || rc > 0 ? 'var(--mint)' : 'var(--fg3)' }}>{!prev ? 'Start' : ch > 0 ? `+${ch} kg` : rc > 0 ? `+${rc} rep${rc > 1 ? 's' : ''}` : 'Same'}</span></div>
          );
        })}</div></div>
      <div className="card big-stat"><div className="eyebrow">Total lifted this week</div><div className="delta num" style={{ color: 'var(--sky)', fontSize: 40 }}>{WEEKLY_TOTALS[7][1].toLocaleString('en-GB')} kg</div>
        <div className="vbars">{WEEKLY_TOTALS.map(([d, v]) => <div key={d}><i style={{ height: Math.round(v / 8420 * 70) }} />{d}</div>)}</div>
        <Explain style={{ marginTop: 12 }}>Every set&apos;s weight × reps, added up. If it climbs week to week you&apos;re doing more work, and that&apos;s what builds strength and muscle.</Explain></div>
    </>
  );
}

function LiftChart({ rows }: { rows: [string, number, number][] }) {
  const W = 320, H = 180, L = 34, B = 24, T = 26, R = 16;
  const v = rows.map(x => x[1]), lo = Math.floor(Math.min(...v) / 10) * 10, hi = Math.ceil(Math.max(...v) / 10) * 10 || lo + 10;
  const X = (i: number) => L + i * (W - L - R) / (rows.length - 1), Y = (n: number) => T + (hi - n) / (hi - lo || 1) * (H - T - B);
  const d = rows.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x[1]).toFixed(1)}`).join(' ');
  const last = rows.length - 1;
  return (
    <svg className="chart2" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Top set weight each session">
      {[lo, (lo + hi) / 2, hi].map(t => <g key={t}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="rgba(255,255,255,.07)" /><text x={L - 6} y={Y(t) + 4} textAnchor="end" fill="var(--fg3)" fontSize="10" fontFamily="Poppins">{t}</text></g>)}
      <path d={d} fill="none" stroke="var(--mint)" strokeWidth="2.5" strokeLinejoin="round" />
      {rows.map((x, i) => <circle key={i} cx={X(i)} cy={Y(x[1])} r={i === last ? 5.5 : 3.5} fill={i === last ? 'var(--mint)' : '#151716'} stroke="var(--mint)" strokeWidth="2" />)}
      <text x={X(last)} y={Y(rows[last][1]) - 11} textAnchor="middle" fill="var(--fg)" fontSize="11" fontWeight="700" fontFamily="Montserrat">{rows[last][1]}</text>
      {[0, Math.floor(last / 2), last].map(i => <text key={i} x={X(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'} fill="var(--fg3)" fontSize="10" fontFamily="Poppins">{rows[i][0]}</text>)}
    </svg>
  );
}

function Records() {
  return (
    <>
      <div className="card big-stat"><div className="eyebrow">Records set in October</div><div className="delta num">{RECORDS.length}</div><div className="lbl">Your own personal bests, compared only with you.</div></div>
      <div className="group">{RECORDS.map(([lift, type, v, d, ch]) => (
        <div className="rec" key={lift + type}><Li icon="trophy" color="var(--amber)" /><span className="t"><b>{lift}</b><small>{type} · {d}</small></span><span className="v num">{v}<small>{ch}</small></span></div>
      ))}</div>
      <div><div className="eyebrow" style={{ marginBottom: 10 }}>What counts as a record?</div>
        <div className="group" style={{ '--inset': '14px' } as React.CSSProperties}>{[['Heaviest weight', 'The most you\'ve lifted for your planned reps.'], ['Est. 1-rep max', 'The most you could lift once, worked out from your sets. You never have to test it.'],
          ['Most reps', 'More reps than ever at the same weight.'], ['Best session total', 'Your biggest total lifted (weight × reps) in one workout.']].map(([t, d]) => (
          <div className="rec" key={t}><span className="t"><b>{t}</b><small style={{ fontSize: 13 }}>{d}</small></span></div>
        ))}</div></div>
    </>
  );
}

const GUIDES = {
  measure: ['How to measure', ['Measure first thing in the morning, before eating or drinking.', 'Use a soft tape, snug but not pulling the skin in.', 'Waist: level with your belly button, relaxed, after breathing out.', 'Hips: the widest point around your bum.', 'Arm and thigh: the widest point, always on the same side.', 'Every 2–4 weeks is plenty.']],
  photo: ['How to take progress photos', ['Same place, same light, same time of day.', 'Phone at chest height, about 2 metres away, or use a timer.', 'Front, side and back, standing relaxed.', 'Wear the same fitted clothes each time.', 'Once a month. Only you and your coach ever see them.']],
} as const;

function Body() {
  const s = useClient(), { toast } = useUI();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <>
      <Explain>Measurements and photos pick up changes the scales miss. Everything here is optional and private to you and your coach.</Explain>
      <div><div className="sec-head" style={{ marginBottom: 10 }}><h2>Measurements</h2><button onClick={() => toast('Add today\'s measurements')}>+ Add</button></div>
        <div className="group">{MEASUREMENTS.map(([n, v, ch]) => <div className="rec" key={n}><Li icon="body" color="var(--violet)" /><span className="t"><b>{n}</b><small>Since 1 September</small></span><span className="v num">{v}<small>{ch}</small></span></div>)}</div></div>
      <div><div className="sec-head" style={{ marginBottom: 10 }}><h2>Photos</h2></div>
        <div className="photos3">{['Front', 'Side', 'Back'].map(x => <button key={x} onClick={() => toast('Camera opens · photos stay private')}><Icon name="camera" />{x}</button>)}</div></div>
      <div className="group">{(Object.keys(GUIDES) as (keyof typeof GUIDES)[]).map(k => { const [t, steps] = GUIDES[k]; return (
        <div key={k}><button className="optrow" onClick={() => setOpen({ ...open, [k]: !open[k] })}><Li icon={k === 'measure' ? 'clip' : 'camera'} color="var(--sky)" /><span className="t"><b>{t}</b><small>{steps.length} quick steps</small></span><Chev open={open[k]} /></button>
          {open[k] && <ol className="guide">{steps.map(x => <li key={x}>{x}</li>)}</ol>}</div>
      ); })}</div>
      <div className="group"><div className="optrow"><Li icon="weight" color="#c9cfcb" /><span className="t"><b>Show my weight</b><small>Off by default. It&apos;s one number among many</small></span>
        <Switch on={s.showWeight} label="Show my weight" onChange={() => setState({ showWeight: !s.showWeight })} /></div>
        {s.showWeight && <div style={{ padding: '0 14px 14px' }}><LineChart pts={WEIGHT_7DAY} color="#a99bff" /><div className="lbl num" style={{ color: 'var(--fg2)', fontSize: 13 }}>7-day average: 71.2 → 67.8 kg</div></div>}</div>
    </>
  );
}

function LineChart({ pts, color, w = 320, h = 120 }: { pts: number[]; color: string; w?: number; h?: number }) {
  const min = Math.min(...pts), max = Math.max(...pts), pad = 8;
  const xy = pts.map((v, i) => [pad + i * (w - 2 * pad) / (pts.length - 1), h - pad - (v - min) / (max - min || 1) * (h - 2 * pad - 14)]);
  const d = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = xy[xy.length - 1];
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs><linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="rgba(255,255,255,.05)" />)}
      <path d={`${d} L${last[0]} ${h} L${xy[0][0]} ${h} Z`} fill="url(#wgrad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="6" fill={color} stroke="#151716" strokeWidth="3" />
    </svg>
  );
}

function Consistency() {
  const label = (v: string) => (v === 'w' ? 'Workout done' : v === 'pt' ? 'PT session' : v === 'x' ? 'Missed' : 'Rest day');
  return (
    <>
      <Explain>Each square is one day, each row is one week. It shows what you planned with your coach and what you did.</Explain>
      <div className="card"><div className="cal8"><span />{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="h">{d}</span>)}
        {CONSISTENCY.map(([wk, days]) => [<span key={wk} className="num">{wk}</span>, ...days.split(',').map((v, i) => <i key={wk + i} className={v} title={label(v)} />)])}</div>
        <div className="legend2"><span><i style={{ background: 'var(--mint)' }} />Workout done</span><span><i style={{ background: 'var(--sky)' }} />PT session</span><span><i style={{ boxShadow: 'inset 0 0 0 1.5px var(--coral)' }} />Missed</span><span><i style={{ background: 'var(--s3)' }} />Rest day</span></div></div>
      <div className="group">{[['train', 'var(--mint)', 'Workouts done', '19 of 20 planned', '95%'], ['cal', 'var(--sky)', 'PT sessions', '9 of 9 attended', '100%'],
        ['clip', 'var(--violet)', 'Check-ins', '6 of 7 sent', '86%'], ['flame', 'var(--amber)', 'Streak', 'Weeks with every planned workout done', '4 wks']].map(([i, c, t, d, v]) => (
        <div className="rec" key={t}><Li icon={i} color={c} /><span className="t"><b>{t}</b><small>{d}</small></span><span className="v num">{v}</span></div>
      ))}</div>
    </>
  );
}
