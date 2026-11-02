'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { BILLING, CHECKIN_ROWS, SARAH_PLAN, byId, gbp, lib, type Alert } from '@/lib/coach/sample-data';
import { Avatar, Modal, Tag, Tile } from './ui';

// Everything needed to deal with one alert, without leaving Today.
export function AlertPanel({ a, onClose, onResolve }: { a: Alert; onClose: () => void; onResolve: (label: string) => void }) {
  const c = byId(a.c), first = c.name.split(' ')[0];
  const [reply, setReply] = useState(DRAFTS[a.kind]?.(first) ?? '');
  const [sent, setSent] = useState(false);
  const send = (label: string) => { if (!reply.trim()) return; setSent(true); onResolve(label); };
  return (
    <Modal onClose={onClose} wide>
      <div className="ap-head"><Avatar c={c} /><span><b>{c.name}</b><small>{c.type} · {c.pkg}</small></span><Tag c={a.tag[0]} icon={a.tag[1]}>{a.tag[2]}</Tag>
        <button className="iconbtn" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
      <p className="ap-why">{a.why} <span>· {a.when}</span></p>

      {a.kind === 'pain' && (
        <>
          <div className="ap-facts">
            <div><small>Where</small><b>Left knee</b></div><div><small>How bad</small><b className="num">4 / 10</b></div>
            <div><small>During</small><b>Leg Press, set 2</b></div><div><small>What she did</small><b>Swapped to Box Squat</b></div>
          </div>
          <div className="flag"><Icon name="pain" /><span><b>On file:</b> history of patellar pain. Keep squat depth comfortable; no deep lunges.</span></div>
          <div><div className="lbl2">Her knee-heavy exercises in Lower A</div>
            <div className="ap-rows">{SARAH_PLAN['Lower A'].filter(r => ['lp', 'lun'].includes(r.ex)).map(r => (
              <div key={r.ex}><Tile icon="library" c={lib(r.ex).c} /><span><b>{lib(r.ex).name}</b><small className="num">{r.sets} × {r.r[0]}–{r.r[1]} · last {r.last[0]} kg × {r.last[1].join('/')}</small></span></div>
            ))}</div></div>
        </>
      )}
      {a.kind === 'payment' && (() => { const b = BILLING.find(x => x[0] === a.c)!; return (
        <div className="ap-facts"><div><small>Amount</small><b className="num">{gbp(b[2] ?? 0)}</b></div><div><small>How they pay</small><b>{b[4]}</b></div><div><small>Status</small><b style={{ color: 'var(--coral)' }}>{b[5]}</b></div></div>
      ); })()}
      {a.kind === 'checkin' && (() => { const r = CHECKIN_ROWS[3]; return (
        <div className="ap-facts"><div><small>Feeling</small><b>Low</b></div><div><small>Sleep</small><b className="num">2 / 5</b></div><div><small>Stress</small><b className="num">{r[4].Stress[0]} / 5</b></div><div><small>Wants</small><b>A call with you</b></div></div>
      ); })()}
      {a.kind === 'missed' && <div className="ap-facts"><div><small>Last workout</small><b>Thu 22 Oct</b></div><div><small>Usual gap</small><b>2–3 days</b></div><div><small>This month</small><b className="num">4 of 12</b></div></div>}

      {!sent && DRAFTS[a.kind] && (
        <div className="ap-reply">
          <div className="lbl2">{a.kind === 'reply' ? 'Your reply' : `Message ${first}`} <span className="sc-label" style={{ marginLeft: 6 }}><span className="orb"><Icon name="spark" /></span>KAI draft, edit before sending</span></div>
          <textarea className="fb" value={reply} onChange={e => setReply(e.target.value)} aria-label="Message" />
        </div>
      )}
      {sent && <div className="flag ok"><Icon name="check" /><span>Sent to {first}. Marked as dealt with.</span></div>}

      {!sent && (
        <div className="ap-actions">
          {a.kind === 'pain' && <><button className="btn mint" onClick={() => send('Replied')}><Icon name="send" className="sm" />Send</button><Link className="btn ghost" href={`/coach/clients/${a.c}`}>Adjust her programme</Link></>}
          {a.kind === 'payment' && <><button className="btn mint" onClick={() => onResolve('Marked as paid')}><Icon name="check" className="sm" />Mark as paid</button><button className="btn ghost" onClick={() => send('Reminder sent')}>Send reminder</button></>}
          {a.kind === 'checkin' && <><button className="btn mint" onClick={() => send('Call offered')}><Icon name="send" className="sm" />Send</button><Link className="btn ghost" href="/coach/schedule">Book a call</Link></>}
          {a.kind === 'reply' && <button className="btn mint" onClick={() => send('Replied')}><Icon name="send" className="sm" />Send reply</button>}
          {a.kind === 'missed' && <button className="btn mint" onClick={() => send('Checked in')}><Icon name="send" className="sm" />Send</button>}
          {a.kind === 'meals' && <Link className="btn mint" href={`/coach/clients/${a.c}`}>Review his meals</Link>}
          {a.kind === 'block' && <Link className="btn mint" href={`/coach/clients/${a.c}`}>Plan the next block</Link>}
          {a.kind === 'renewal' && <button className="btn mint" onClick={() => send('Asked about renewing')}><Icon name="send" className="sm" />Send</button>}
          <span style={{ flex: 1 }} />
          <button className="btn line" onClick={() => onResolve('Snoozed 3 days')}>Snooze 3 days</button>
          <button className="btn line" onClick={() => onResolve('Dealt with')}>Mark dealt with</button>
        </div>
      )}
    </Modal>
  );
}

const DRAFTS: Partial<Record<Alert['kind'], (n: string) => string>> = {
  pain: n => `Thanks for flagging that, ${n}. Good call swapping to box squats. Skip leg press and lunges until we've had a look on Thursday, and let me know if it gets worse or feels sharp.`,
  payment: n => `Hi ${n}, just a nudge that October's £120 is still outstanding. Can you send it over when you get a chance? Shout if anything's changed.`,
  checkin: n => `Thanks for being honest in your check-in, ${n}. Sounds like a tough couple of weeks. Fancy a quick 15-minute call this week? Send me a time that suits.`,
  reply: n => `Good luck Sunday, ${n}! Keep the day after easy: do the upper-body session and we'll move legs to Wednesday.`,
  missed: n => `Hey ${n}, not seen a workout come through for a bit. All okay? If time's tight, the 30-minute version still counts.`,
  renewal: n => `Hi ${n}, Wednesday's your last session of this block. Do you want to book in another 4?`,
};
