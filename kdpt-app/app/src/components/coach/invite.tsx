'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { DEFAULT_HOURS, gbp, hhmm, pkgById } from '@/lib/coach/sample-data';
import { Modal, Tile } from './ui';
import { useToast } from './shell';

const WORKDAYS = Object.keys(DEFAULT_HOURS).filter(d => DEFAULT_HOURS[d]);
const slotTimes = (d: string) => { const [a, b] = DEFAULT_HOURS[d]!, o: number[] = []; for (let h = a; h <= b - 1; h += 0.25) o.push(h); return o; };
const PROGS = ['Strength Block 1', 'Hypertrophy', 'Fat Loss Phase 1', 'Return to Training', 'Full Body 3x'];

// Add a client: creates their account and emails a sign-in code. Regular
// slots are proposed to them every month; Kyle still confirms each one.
export function InviteModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ first: '', last: '', email: '', type: 'In-person', pkg: 'pt8', prog: 'later', slots: {} as Record<string, number> });
  const [sent, setSent] = useState(false);
  const pk = v.type === 'Online' ? ['online'] : ['pt2', 'pt4', 'pt8', 'duo8'];
  const pkg = pk.includes(v.pkg) ? v.pkg : pk[pk.length > 1 ? 2 : 0], p = pkgById(pkg);
  const nSlots = Object.keys(v.slots).length;
  if (sent) return (
    <Modal onClose={onClose}>
      <div className="done"><Tile icon="send" c="mint" style={{ width: 56, height: 56 }} /><h2>Invite sent to {v.first}</h2>
        <p>{v.email} gets an email with a link and a 6-digit code. In the app they answer the health questions, agree the consents, then pick their goal and check-in day.</p></div>
      <div className="steps3">{([['Sign-up', 'Health questions and consents', 'clip', 'violet'], ['Plan', v.prog === 'later' ? 'You choose a programme' : 'Programme is ready', 'programmes', 'mint'],
        ['Sessions', nSlots ? `${nSlots} regular slot${nSlots > 1 ? 's' : ''} proposed. You confirm` : 'They send availability', 'schedule', 'sky']] as const).map(([t, d, i, c]) => (
        <div key={t}><Tile icon={i} c={c} /><b>{t}</b><small>{d}</small></div>
      ))}</div>
      <div style={{ display: 'flex', gap: 8 }}><button className="btn white" onClick={onClose}>Done</button><button className="btn line" onClick={() => toast('Invite link copied')}>Copy invite link</button></div>
    </Modal>
  );
  return (
    <Modal title="Add a client" onClose={onClose} wide>
      <div className="fields">
        <label>First name<input value={v.first} placeholder="e.g. Hannah" onChange={e => setV({ ...v, first: e.target.value })} /></label>
        <label>Last name<input value={v.last} onChange={e => setV({ ...v, last: e.target.value })} /></label>
        <label className="full">Email<input type="email" value={v.email} placeholder="Their sign-in code goes here" onChange={e => setV({ ...v, email: e.target.value })} /></label></div>
      <div><div className="lbl2">Coaching</div><div className="seg3">{['In-person', 'Hybrid', 'Online'].map(t => <button key={t} className={v.type === t ? 'on' : ''} onClick={() => setV({ ...v, type: t })}>{t}</button>)}</div></div>
      <div className="fields">
        <label>Package<select value={pkg} onChange={e => setV({ ...v, pkg: e.target.value })}>{pk.map(id => { const q = pkgById(id); return <option key={id} value={id}>{q.name}{q.price ? ' · ' + gbp(q.price) : ' · price not set'}</option>; })}</select></label>
        <label>Programme<select value={v.prog} onChange={e => setV({ ...v, prog: e.target.value })}>{PROGS.map(n => <option key={n}>{n}</option>)}<option value="later">Decide after their health questions</option></select></label></div>
      {p.duo && <div className="flag" style={{ borderColor: 'rgba(255,180,94,.3)', background: 'rgba(255,180,94,.06)' }}><span style={{ color: 'var(--amber)' }}><Icon name="info" /></span><span>Duo price isn&apos;t set yet. Set it in Payments, then choose whether it&apos;s split 50/50 or paid by one person.</span></div>}
      {v.type !== 'Online' && (
        <div><div className="lbl2">Regular slots · proposed to them every month, you still confirm</div>
          <div className="slots">{WORKDAYS.map(d => (
            <div key={d} className={`slot ${v.slots[d] != null ? 'on' : ''}`}>
              <button onClick={() => { const s = { ...v.slots }; if (s[d] != null) delete s[d]; else s[d] = 7; setV({ ...v, slots: s }); }}>{d}</button>
              {v.slots[d] != null && <select value={v.slots[d]} aria-label={`${d} time`} onChange={e => setV({ ...v, slots: { ...v.slots, [d]: +e.target.value } })}>{slotTimes(d).map(h => <option key={h} value={h}>{hhmm(h)}</option>)}</select>}
            </div>
          ))}</div>
          <small className="hint">Leave empty if their times change month to month. They&apos;ll send rough availability instead.</small></div>
      )}
      <div className="sumline"><Icon name="card" className="sm" /><span>{p.price ? `${gbp(p.price)} a month from the 1st, paid by card in the app.` : 'They pay once you set the duo price.'} You can add a discount in Payments.</span></div>
      <button className="btn mint" style={{ justifySelf: 'start' }} onClick={() => {
        if (!/.+@.+\..+/.test(v.email) || !v.first.trim()) { toast('Add a first name and email'); return; }
        setSent(true);
      }}><Icon name="send" className="sm" />Send invite</button>
    </Modal>
  );
}
