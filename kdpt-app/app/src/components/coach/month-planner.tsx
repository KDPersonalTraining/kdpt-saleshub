'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { generateMonth, hhmm, toMinutes, type Hours, type Proposal } from '@/lib/rules';
import { ALLOWANCE, DAYNAMES, NOV_TIME_OFF, REGULAR, SENDS_AVAILABILITY, TRAVEL, byId } from '@/lib/coach/sample-data';
import { Avatar, Modal, Tag } from './ui';

const fmtDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

// Builds next month from everyone's regular slots, shows anything that can't
// go ahead as it is, and sends the rest to clients to accept.
export function MonthPlanner({ hours, onClose, onSend }: { hours: Record<string, [number, number] | null>; onClose: () => void; onSend: (n: number) => void }) {
  const [decided, setDecided] = useState<Record<string, 'drop' | 'keep'>>({});
  const proposals = useMemo(() => {
    const h = Object.fromEntries(DAYNAMES.map((d, i) => [i, hours[d] ? [hours[d]![0] * 60, hours[d]![1] * 60] : null])) as Hours;
    return generateMonth({ year: 2026, month: 11, hours: h, busy: NOV_TIME_OFF, allowance: ALLOWANCE,
      patterns: REGULAR.map(r => ({ client: r.client, weekday: r.weekday, start: toMinutes(r.time), minutes: r.minutes, location: r.location })),
      travel: (a, b) => (a === 'Online' || b === 'Online' ? 0 : TRAVEL[`${a}>${b}`] ?? 0) });
  }, [hours]);
  const key = (p: Proposal) => `${p.client}|${p.date}|${p.start}`;
  const problems = proposals.filter(p => p.problem && p.problem !== 'over_allowance');
  const extra = proposals.filter(p => p.problem === 'over_allowance');
  const clients = [...new Set(REGULAR.map(r => r.client))];
  const toSend = proposals.filter(p => !p.problem || decided[key(p)] === 'keep').length;
  const open = problems.filter(p => !decided[key(p)]).length;
  return (
    <Modal title="November sessions" onClose={onClose} wide>
      <span style={{ color: 'var(--fg3)' }}>Built from each client&apos;s regular slots, checked against your hours and time off. Clients accept or ask for changes; nothing is confirmed until you confirm it.</span>
      <div className="plan-clients">{clients.map(c => {
        const ok = proposals.filter(p => p.client === c && (!p.problem || decided[key(p)] === 'keep')).length;
        const slots = REGULAR.filter(r => r.client === c).map(r => `${DAYNAMES[r.weekday]} ${r.time}`).join(' · ');
        return <div key={c}><Avatar c={byId(c)} size={30} /><span><b>{byId(c).name}</b><small>{slots} · {REGULAR.find(r => r.client === c)!.location}</small></span>
          <span className="num" style={{ color: ok === ALLOWANCE[c] ? 'var(--mint)' : 'var(--amber)' }}>{ok}/{ALLOWANCE[c]}</span></div>;
      })}
        {SENDS_AVAILABILITY.map(c => <div key={c}><Avatar c={byId(c)} size={30} /><span><b>{byId(c).name}</b><small>Sends availability · you place her sessions</small></span><span /></div>)}
      </div>
      {problems.length > 0 && (
        <div><div className="lbl2">Needs a decision · {open} left</div>
          <div className="plan-problems">{problems.map(p => { const k = key(p), d = decided[k]; return (
            <div key={k} className={d ? 'decided' : ''}>
              <span><b>{byId(p.client).name.split(' ')[0]} · {fmtDate(p.date)} · {hhmm(p.start)}</b><small>{p.detail}</small></span>
              {d ? <Tag c={d === 'keep' ? 'amber' : 'grey'}>{d === 'keep' ? 'Proposing anyway' : 'Left out'}</Tag> : (
                <span style={{ display: 'flex', gap: 6 }}><button className="btn line" onClick={() => setDecided({ ...decided, [k]: 'drop' })}>Leave out</button>
                  {p.problem !== 'clash' && <button className="btn ghost" onClick={() => setDecided({ ...decided, [k]: 'keep' })}>Propose anyway</button>}</span>)}
            </div>
          ); })}</div></div>
      )}
      {extra.length > 0 && <div className="sumline"><Icon name="info" className="sm" /><span>{extra.length} extra slot{extra.length > 1 ? 's' : ''} left out because {extra.length > 1 ? 'they go' : 'it goes'} beyond the package ({[...new Set(extra.map(p => byId(p.client).name.split(' ')[0]))].join(', ')}). Some months have five of the same weekday.</span></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn mint" disabled={open > 0} onClick={() => onSend(toSend)}><Icon name="send" className="sm" />Send {toSend} sessions to clients</button>
        {open > 0 && <span className="muted" style={{ color: 'var(--fg3)', fontSize: 13 }}>Decide the {open} above first</span>}
      </div>
    </Modal>
  );
}
