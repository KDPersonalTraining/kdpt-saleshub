'use client';

import { useState } from 'react';
import { AssignModal } from '@/components/coach/assign';
import { Sec, Tag } from '@/components/coach/ui';
import { prettyDate } from '@/lib/programmes/plan';
import { liftedLike } from '@/lib/client/lifted';

export type CoachSession = { id: string; workout: string; date: string; minutes: number | null; rpe: number | null; note: string | null; sets: [string, [number | null, number][]][] };

const volume = (x: CoachSession) => Math.round(x.sets.reduce((t, [, sets]) => t + sets.reduce((a, [w, r]) => a + (w ?? 0) * r, 0), 0));

// A client's programme and their logged workouts, on their record.
export function Training({ clientId, name, programme, sessions }: {
  clientId: string; name: string; programme: { name: string; week: number; weeks: number | null; startsOn: string | null } | null; sessions: CoachSession[];
}) {
  const [assign, setAssign] = useState(false);
  const [open, setOpen] = useState<string | null>(sessions[0]?.id ?? null);
  const first = name.split(' ')[0];
  return (
    <div className="grid2">
      <div className="card pad">
        <Sec title="Recent workouts" right={sessions.length ? `${sessions.length} logged` : undefined} />
        {!sessions.length && <p style={{ margin: 0, color: 'var(--fg3)' }}>{programme ? `Nothing logged yet. Finished workouts show here with every set ${first} did.` : `Give ${first} a programme first.`}</p>}
        <div style={{ display: 'grid', gap: 4 }}>{sessions.map(x => (
          <div key={x.id} style={{ borderTop: '1px solid var(--hair)', paddingTop: 10 }}>
            <button onClick={() => setOpen(open === x.id ? null : x.id)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: 12, textAlign: 'left', padding: '4px 0' }} aria-expanded={open === x.id}>
              <span><b>{x.workout}</b> <span className="muted num" style={{ fontSize: 13 }}>{x.date}{x.minutes ? ` · ${x.minutes} min` : ''}{volume(x) ? ` · ${volume(x).toLocaleString('en-GB')} kg${liftedLike(volume(x)) ? ` (${liftedLike(volume(x))!.words})` : ''}` : ''}</span></span>
              {x.rpe ? <Tag c="grey">RPE {x.rpe}</Tag> : null}
            </button>
            {open === x.id && <div style={{ display: 'grid', gap: 6, padding: '6px 0 10px' }}>
              {x.sets.map(([n, sets]) => <div key={n} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}><span>{n}</span><span className="num" style={{ color: 'var(--fg2)' }}>{sets.map(([w, r]) => (w ? `${w}×${r}` : `${r} reps`)).join('  ')}</span></div>)}
              {x.note && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--amber)', whiteSpace: 'pre-line' }}>{x.note}</p>}
            </div>}
          </div>
        ))}</div>
      </div>
      <div className="card pad">
        <Sec title="Programme" />
        {programme ? <div className="kv"><span>On</span><b>{programme.name}</b><span>Week</span><b className="num">{programme.week}{programme.weeks ? ` of ${programme.weeks}` : ''}</b>
          <span>Started</span><b>{programme.startsOn ? prettyDate(programme.startsOn) : '–'}</b></div>
          : <p style={{ margin: 0, color: 'var(--fg2)' }}>No programme yet. Their Train screen says it’s on its way.</p>}
        <button className="btn mint" style={{ marginTop: 16 }} onClick={() => setAssign(true)}>{programme ? 'Change programme' : 'Give a programme'}</button>
      </div>
      {assign && <AssignModal clients={[{ id: clientId, name, programme: programme?.name ?? null }]} fixedClient={clientId} onClose={() => setAssign(false)} />}
    </div>
  );
}
