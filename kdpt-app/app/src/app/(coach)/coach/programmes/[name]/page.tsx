'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { Icon } from '@/components/icon';
import { PlanEditor } from '@/components/coach/plan-editor';
import { useToast } from '@/components/coach/shell';
import { Tile } from '@/components/coach/ui';
import { TEMPLATES, planMinutes, type Template } from '@/lib/coach/sample-data';

const start = (name: string): Template => {
  const t = TEMPLATES[name];
  return t ? JSON.parse(JSON.stringify({ ...t, name })) : { name: 'New template', weeks: 6, goal: 'General fitness', clients: [], days: { 'Day 1': [], 'Day 2': [], 'Day 3': [] } };
};

export default function TemplateEditor({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const toast = useToast();
  const [t, setT] = useState(() => start(decodeURIComponent(name)));
  const [day, setDay] = useState(Object.keys(t.days)[0]);
  const rows = t.days[day];
  return (
    <>
      <div className="head"><div><Link className="crumb" href="/coach/programmes"><Icon name="back" className="sm" />Programmes</Link>
          <input className="tname" value={t.name} onChange={e => setT({ ...t, name: e.target.value })} aria-label="Template name" /></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn line" onClick={() => toast(`Pick a client to assign ${t.name}`)}><Icon name="clients" className="sm" />Assign</button>
          <button className="btn mint" onClick={() => toast(t.clients.length ? 'Template saved · client plans unchanged' : 'Template saved')}><Icon name="check" className="sm" />Save template</button></div></div>
      <div className="card pad"><div className="fields four">
        <label>Length<select value={t.weeks} onChange={e => setT({ ...t, weeks: +e.target.value })}>{[4, 6, 8, 10, 12].map(w => <option key={w} value={w}>{w}</option>)}</select></label>
        <label>Goal<select value={t.goal} onChange={e => setT({ ...t, goal: e.target.value })}>{['Strength', 'Muscle', 'Fat loss', 'General fitness', 'Return to training'].map(g => <option key={g}>{g}</option>)}</select></label>
        <label>Progression<select defaultValue="double"><option value="double">Double progression</option><option>Same load all block</option><option>Add reps, then load</option></select></label>
        <label>Deload<select defaultValue="None"><option>None</option><option>Week 4</option><option>Last week</option></select></label></div>
        <p className="hint"><Icon name="info" className="sm" />Double progression: when every set hits the top of the rep range, the next session adds that exercise&apos;s load jump. Clients see why.</p></div>
      <div className="toolbar">
        <div className="days">{Object.keys(t.days).map(d => <button key={d} className={`day ${day === d ? 'on' : ''}`} onClick={() => setDay(d)}>{d}<small className="num"> · {t.days[d].length}</small></button>)}
          <button className="day" aria-label="Add a day" onClick={() => { const k = `Day ${Object.keys(t.days).length + 1}`; setT({ ...t, days: { ...t.days, [k]: [] } }); setDay(k); }}><Icon name="plus" className="sm" /></button></div>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--fg2)' }}><Icon name="clock" className="sm" /><span className="num">~{planMinutes(rows)} min</span></span>
      </div>
      <PlanEditor template rows={rows} onChange={r => setT({ ...t, days: { ...t.days, [day]: r } })}
        emptyNote={<div className="eempty"><Tile icon="library" c="grey" /><span><b>No exercises on {day} yet</b><small>Add from your library. Starting loads are set per client when you assign.</small></span></div>} />
      {t.clients.length > 0 && <div className="flag" style={{ borderColor: 'rgba(110,198,255,.3)', background: 'rgba(110,198,255,.06)' }}><span style={{ color: 'var(--sky)' }}><Icon name="info" /></span>
        <span><b>{t.clients.length} clients use this template.</b> Saving changes the template only. Their live plans stay as they are until you push the change to each one.</span></div>}
    </>
  );
}
