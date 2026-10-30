'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { Icon } from '@/components/icon';
import { PlanEditor } from '@/components/coach/plan-editor';
import { useToast } from '@/components/coach/shell';
import { Avatar, Sec, Switch, Tag, Tile } from '@/components/coach/ui';
import { CHECKIN, CHECKIN_ROWS, MEAL_PHOTOS, PAY, SARAH_PLAN, TIMELINE, WEEK_LOG, byId, planMinutes, tint, type Client, type Row } from '@/lib/coach/sample-data';

const TABS = [['overview', 'Overview', 'user'], ['training', 'Training', 'train'], ['nutrition', 'Nutrition', 'fuel'], ['checkins', 'Check-ins', 'clip']] as const;
const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

export default function ClientProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const c = byId(id);
  const [tab, setTab] = useState<string>(c.id === 'sarah' ? 'training' : 'overview');
  return (
    <>
      <div className="prof">
        <Avatar c={c} />
        <div className="grow"><h1>{c.name}</h1>
          <div className="meta"><Tag c="grey">{c.type}</Tag><Tag c="grey">{c.pkg}</Tag><Tag c="mint" icon="train">{c.prog}</Tag><Tag c="violet" icon="clip">{CHECKIN[c.id]}</Tag><Tag c={PAY[c.id][0]} icon="card">{PAY[c.id][1]}</Tag></div></div>
        <div style={{ display: 'flex', gap: 8 }}><Link className="btn ghost" href={`/coach/messages?c=${c.id}`}><Icon name="messages" className="sm" />Message</Link><Link className="btn line" href="/coach/schedule"><Icon name="schedule" className="sm" />Book</Link></div>
      </div>
      {c.id === 'sarah' && <div className="flag"><Icon name="pain" /><span><b>Left knee</b> · history of patellar pain. Keep squat depth comfortable; no deep lunges.</span></div>}
      <div className="tabs" role="tablist">{TABS.map(([k, l, i]) => <button key={k} role="tab" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon name={i} className="sm" />{l}</button>)}</div>
      {tab === 'training' ? <Training c={c} /> : tab === 'nutrition' ? <Nutrition c={c} /> : tab === 'checkins' ? <Checkins c={c} /> : <Overview />}
    </>
  );
}

function Overview() {
  return (
    <>
      <div className="statrow">
        <div className="card"><b className="num" style={{ color: 'var(--mint)' }}>92%</b><small>Sessions completed · 8 wks</small></div>
        <div className="card"><b className="num" style={{ color: 'var(--violet)' }}>−5 cm</b><small>Waist since 1 Sep</small></div>
        <div className="card"><b className="num" style={{ color: 'var(--amber)' }}>4</b><small>New bests this block</small></div>
      </div>
      <div className="card pad"><Sec title="Timeline" right="Everything, newest first" />
        <div className="timeline">{TIMELINE.map(([i, c, t, s, w]) => <div className="ev" key={t}><Tile icon={i} c={c} /><span><b>{t}</b><small>{s}</small></span><time>{w}</time></div>)}</div></div>
    </>
  );
}

function Training({ c }: { c: Client }) {
  const toast = useToast();
  const [saved, setSaved] = useState(() => clone(SARAH_PLAN));
  const [prog, setProg] = useState(() => clone(SARAH_PLAN));
  const [day, setDay] = useState('Lower A');
  const first = c.name.split(' ')[0];
  const changed = Object.keys(prog).filter(d => JSON.stringify(prog[d]) !== JSON.stringify(saved[d])).length;
  return (
    <>
      <div className="toolbar">
        <div className="days">{Object.keys(prog).map(d => <button key={d} className={`day ${day === d ? 'on' : ''}`} onClick={() => setDay(d)}>{d}</button>)}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--fg2)' }}><Icon name="clock" className="sm" /><span className="num">~{planMinutes(prog[day])} min</span>
          <button className="btn violet" onClick={() => toast('KAI drafts the next block for your approval')}><Icon name="spark" className="sm" />KAI: next block</button></div>
      </div>
      <PlanEditor rows={prog[day]} saved={saved[day]} onChange={(rows: Row[]) => setProg({ ...prog, [day]: rows })} footNote={`Priorities decide what ${first}'s 30 / 45 minute options remove first.`} />
      {changed > 0 && (
        <div className="publish"><span><b>{changed} day{changed > 1 ? 's' : ''} changed</b> · <span>{first} sees this from her next session</span></span>
          <span style={{ display: 'flex', gap: 8 }}><button className="btn line" onClick={() => setProg(clone(saved))}>Discard</button>
            <button className="btn mint" onClick={() => { setSaved(clone(prog)); toast(`Published · ${first} sees it next session`); }}><Icon name="check" className="sm" />Publish</button></span></div>
      )}
    </>
  );
}

type Targets = { kcal: number; protein: number; carbs: number; fat: number };
function Nutrition({ c }: { c: Client }) {
  const toast = useToast(), first = c.name.split(' ')[0];
  const [n, setN] = useState<Targets>({ kcal: 2100, protein: 140, carbs: 210, fat: 70 });
  const [show, setShow] = useState(true);
  const [reacted, setReacted] = useState<Record<number, boolean>>({ 0: true });
  const [sent, setSent] = useState(false);
  const T = [n.kcal, n.protein, n.carbs, n.fat];
  const col = (v: number, t: number) => { const r = v / t; return r < 0.9 ? 'var(--amber)' : r > 1.1 ? 'var(--coral)' : 'var(--mint)'; };
  const logged = WEEK_LOG.filter(d => d[1] !== null) as [string, number, number, number, number][];
  const avg = [1, 2, 3, 4].map(i => Math.round(logged.reduce((a, d) => a + (d[i] as number), 0) / logged.length));
  const Cell = ({ v, i }: { v: number; i: number }) => <span className="c num" style={{ color: col(v, T[i]) }}>{v.toLocaleString('en-GB')}<small>{i ? 'g' : ''}</small></span>;
  const Tgt = ({ k, label, icon, color, unit, step }: { k: keyof Targets; label: string; icon: string; color: string; unit: string; step: number }) => (
    <div className="tgt"><span className="lbl" style={{ color }}><Icon name={icon} className="sm" /><span style={{ color: 'var(--fg2)' }}>{label}</span></span>
      <span className="val"><b className="num">{n[k].toLocaleString('en-GB')}<small>{unit}</small></b>
        <span className="stepper"><button onClick={() => setN({ ...n, [k]: Math.max(0, n[k] - step) })} aria-label="Decrease">−</button><button onClick={() => setN({ ...n, [k]: n[k] + step })} aria-label="Increase">+</button></span></span></div>
  );
  return (
    <>
      <div className="card pad">
        <Sec title="Targets" right={<Switch on={show} onChange={() => setShow(!show)} label="Show numbers to client" text={`Show numbers to ${first}`} />} />
        <div className="targets four"><Tgt k="kcal" label="Calories" icon="flame" color="var(--fg)" unit="kcal" step={50} /><Tgt k="protein" label="Protein" icon="fuel" color="var(--amber)" unit="g" step={5} />
          <Tgt k="carbs" label="Carbs" icon="bolt" color="var(--sky)" unit="g" step={5} /><Tgt k="fat" label="Fat" icon="drop" color="var(--violet)" unit="g" step={5} /></div>
      </div>
      <div className="grid2">
        <section style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <div>
            <Sec title="Week in review" right={<span className="muted"><span style={{ color: 'var(--mint)' }}>●</span> on target <span style={{ color: 'var(--amber)' }}>●</span> under <span style={{ color: 'var(--coral)' }}>●</span> over (±10%)</span>} />
            <div className="card ntable">
              <div className="nr th"><span>Day</span><span>Calories</span><span>Protein</span><span>Carbs</span><span>Fat</span><span /></div>
              {WEEK_LOG.map(d => d[1] === null
                ? <div className="nr" key={d[0]}><span>{d[0]}</span><span style={{ gridColumn: '2 / -1', color: 'var(--fg3)' }}>Nothing logged</span></div>
                : <div className="nr" key={d[0]}><span>{d[0]}</span>{[1, 2, 3, 4].map(i => <Cell key={i} v={d[i] as number} i={i - 1} />)}<button className="iconbtn" onClick={() => toast(`Opens ${d[0]}: every food and photo`)} aria-label="Open day"><Icon name="right" className="sm" /></button></div>)}
              <div className="nr avg"><span>Average</span>{avg.map((v, i) => <Cell key={i} v={v} i={i} />)}<span /></div>
            </div>
          </div>
          <div>
            <Sec title="Photos logged this week" right={`${MEAL_PHOTOS.length} photos · tap ♥ to react`} />
            <div className="photos">{MEAL_PHOTOS.map(([img, t, p], i) => (
              <div className="ph" key={i}><img src={`/assets/${img}.jpg`} alt={t} /><button className={`react ${reacted[i] ? 'on' : ''}`} onClick={() => setReacted({ ...reacted, [i]: !reacted[i] })} aria-label="React"><Icon name="heart" className="sm" /></button><div className="cap"><b>{t}</b><small>{p}</small></div></div>
            ))}</div>
          </div>
        </section>
        <section className="card pad" style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Sec style={{ margin: 0 }} title="Weekly feedback" right={<span className="sc-label"><span className="orb"><Icon name="spark" /></span>KAI draft</span>} />
          {sent ? <div className="flag" style={{ background: 'rgba(126,213,151,.08)', borderColor: 'rgba(126,213,151,.25)' }}><Icon name="check" /><span>Sent to {first} · shows at the bottom of her Fuel tab</span></div> : (<>
            <textarea className="fb" aria-label="Feedback" defaultValue={`Protein's up to ${avg[1]}g on average, ${first}, nice work. Friday ran over on calories and carbs and protein dipped, so plan Friday's dinner ahead. Dinners are light on veg: add a side salad or frozen veg.`} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn mint" onClick={() => setSent(true)}><Icon name="send" className="sm" />Send</button><button className="btn line" onClick={() => toast('Redrafting from this week\'s food log')}><Icon name="spark" className="sm" />Redraft</button></div>
          </>)}
          <div className="statrow" style={{ marginTop: 6 }}>
            <div className="card" style={{ background: 'var(--s1)' }}><b className="num" style={{ color: 'var(--amber)' }}>{avg[1]}g</b><small>Avg protein</small></div>
            <div className="card" style={{ background: 'var(--s1)' }}><b className="num">{avg[0].toLocaleString('en-GB')}</b><small>Avg kcal</small></div>
            <div className="card" style={{ background: 'var(--s1)' }}><b className="num">{logged.length}/7</b><small>Days logged</small></div>
          </div>
        </section>
      </div>
    </>
  );
}

function Checkins({ c }: { c: Client }) {
  return (
    <>
      <div className="flag" style={{ background: 'rgba(169,155,255,.07)', borderColor: 'rgba(169,155,255,.25)' }}><Icon name="clip" /><span><b>{CHECKIN[c.id]} check-ins</b> · chosen at onboarding. Feelings and wins first; weight is optional.</span></div>
      <div className="card cilist">{CHECKIN_ROWS.map(([d, mood, words, wins, m, need]) => (
        <div className="cirow" key={d}>
          <div className="when"><b>{d}</b><Tag c={mood[1]}>Feeling {mood[0].toLowerCase()}</Tag></div>
          <div><p className="feel">“{words}”</p><div className="winlist">{wins.length ? wins.map(w => <span key={w}>{w}</span>) : <span style={{ color: 'var(--fg3)' }}>No wins ticked</span>}</div></div>
          <div className="mets">{Object.entries(m).map(([k, [v, cl]]) => <div key={k}><span>{k}</span><span className="dots">{[1, 2, 3, 4, 5].map(i => <i key={i} style={i <= v ? { background: tint(cl)[1] } : undefined} />)}</span></div>)}</div>
          <div className="need"><small>Wants</small><b style={{ color: tint(need[0])[1] }}>{need[1]}</b></div>
        </div>
      ))}</div>
    </>
  );
}
