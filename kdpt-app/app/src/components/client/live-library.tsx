'use client';

import { ChevronDown, ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useLive } from '@/lib/client/live';

const GROUPS: [string, string][] = [['all', 'All'], ['squat', 'Squat'], ['hinge', 'Hinge'], ['lunge', 'Lunge'], ['push', 'Push'], ['pull', 'Pull'], ['isolation', 'Arms'], ['core', 'Core'], ['conditioning', 'Cardio']];
const inGroup = (p: string, g: string) => g === 'all' || (g === 'push' ? p.endsWith('_push') : g === 'pull' ? p.endsWith('_pull') : g === 'core' ? p.startsWith('core') || p === 'carry' : p.startsWith(g));

// Kyle's exercise library, with how to do each one and your best on it.
export function LiveLibrary() {
  const live = useLive()!;
  const [q, setQ] = useState(''), [g, setG] = useState('all'), [open, setOpen] = useState<string | null>(null);
  const list = live.library.filter(e => inGroup(e.pattern, g) && e.name.toLowerCase().includes(q.trim().toLowerCase()));
  const best = (name: string) => live.progress.records.find(r => r.name === name);
  return (
    <div className="ds ds-page fade">
      <div><Link href="/train" className="ds-back"><ChevronLeft size={20} strokeWidth={1.75} />Train</Link><h1 className="ds-title">Exercises</h1></div>
      <label style={{ position: 'relative', display: 'block' }}><Search size={18} strokeWidth={1.75} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--fg3)' }} />
        <input className="ds-input" style={{ paddingLeft: 42 }} placeholder={`Search ${live.library.length} exercises`} value={q} onChange={e => setQ(e.target.value)} aria-label="Search exercises" /></label>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>{GROUPS.map(([k, l]) => <button key={k} className="ds-choice" style={{ minHeight: 40, padding: '0 14px', flex: 'none' }} aria-pressed={g === k} onClick={() => setG(k)}>{l}</button>)}</div>
      <div className="ds-list">{list.map(e => { const b = best(e.name), on = open === e.id; return (
        <div key={e.id}>
          <button className="ds-row noicon" onClick={() => setOpen(on ? null : e.id)} aria-expanded={on}>
            <span className="t"><b>{e.name}</b><small>{e.measure === 'distance' ? 'Cardio · logged as km and minutes' : e.muscles.join(', ')}</small></span>
            <span className="end"><ChevronDown size={20} strokeWidth={1.75} style={{ transform: on ? 'rotate(180deg)' : undefined }} /></span></button>
          {on && <div style={{ padding: '4px 0 16px', display: 'grid', gap: 8 }}>
            {e.cues.length ? <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--fg2)', display: 'grid', gap: 6 }}>{e.cues.map(c => <li key={c}>{c}</li>)}</ol> : <p style={{ margin: 0, color: 'var(--fg3)' }}>Ask Kyle how to do this one.</p>}
            {b && <p style={{ margin: 0, color: 'var(--mint)', fontSize: 14 }}>Your best: {b.set} (est. 1-rep max {b.e1rm} kg)</p>}
            <p style={{ margin: 0, color: 'var(--fg3)', fontSize: 14 }}>Kyle’s video for this is coming soon.</p>
          </div>}
        </div>
      ); })}</div>
      {!list.length && <p style={{ color: 'var(--fg3)' }}>Nothing found. Ask Kyle to add it.</p>}
    </div>
  );
}
