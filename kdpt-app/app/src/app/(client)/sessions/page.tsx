'use client';

import { CalendarClock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUI } from '@/components/client/shell';
import { Empty } from '@/components/client/ui';
import { CLIENT_LABEL, isUpcoming, shownState } from '@/lib/bookings/states';
import { useLive, type LiveBooking } from '@/lib/client/live';
import { isoToUk, ukWhen } from '@/lib/time';
import { acceptSession, cancelMine, requestChange } from './actions';

const I = { size: 20, strokeWidth: 1.75 } as const;

// Sessions with Kyle: confirm the ones he's proposed, ask to move one, or
// cancel (free with 24 hours' notice; later than that it counts as used).
export default function Sessions() {
  const live = useLive(), router = useRouter(), { toast } = useUI();
  const [open, setOpen] = useState<LiveBooking | null>(null);
  if (!live) return <div className="ds ds-page"><h1 className="ds-title">Sessions</h1><p>Sessions appear here once your coach books them.</p></div>;
  const now = Date.now();
  const coming = live.bookings.filter(b => isUpcoming(shownState(b, b.pending)) && Date.parse(b.end) >= now);
  const past = live.bookings.filter(b => !coming.includes(b)).reverse().slice(0, 8);
  const toConfirm = coming.filter(b => shownState(b, b.pending) === 'awaiting_client');
  const confirmAll = async () => { for (const b of toConfirm) await acceptSession(b.id); toast(`${toConfirm.length} session${toConfirm.length === 1 ? '' : 's'} confirmed`); router.refresh(); };
  return (
    <div className="ds ds-page fade">
      <div><Link href="/home" className="ds-back"><ChevronLeft {...I} />Home</Link><h1 className="ds-title">Sessions with Kyle</h1></div>
      {toConfirm.length > 1 && <button className="ds-btn primary" onClick={confirmAll}>Confirm all {toConfirm.length}</button>}
      <section className="ds-section"><header><h2 className="ds-h2">Coming up</h2></header>
        {coming.length ? <div className="ds-list">{coming.map(b => { const [l, c] = CLIENT_LABEL[shownState(b, b.pending)]; return (
          <button key={b.id} className="ds-row" onClick={() => setOpen(b)}><CalendarClock {...I} />
            <span className="t"><b>{ukWhen(b.start)}</b><small>{Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60000)} min{b.location ? ` · ${b.location}` : ''}</small></span>
            <span className="end"><span className={`ds-tag ${c}`}>{l}</span></span></button>
        ); })}</div> : <Empty icon="cal" color="var(--mint)" title="Nothing booked yet">Kyle adds your sessions here. You&apos;ll get a message when he does.</Empty>}
      </section>
      {past.length > 0 && <section className="ds-section"><header><h2 className="ds-h2">Recent</h2></header>
        <div className="ds-list">{past.map(b => { const [l, c] = CLIENT_LABEL[shownState(b, b.pending)]; return (
          <div key={b.id} className="ds-row noicon"><span className="t"><b>{ukWhen(b.start)}</b><small>{b.location}</small></span><span className="end"><span className={`ds-tag ${c}`}>{Date.parse(b.end) < now && b.status === 'confirmed' ? 'Done' : l}</span></span></div>
        ); })}</div></section>}
      <p style={{ margin: 0, color: 'var(--fg3)', fontSize: 14 }}>Cancelling with at least 24 hours&apos; notice is free. Later than that, the session counts as used.</p>
      {open && <SessionSheet b={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SessionSheet({ b, onClose }: { b: LiveBooking; onClose: () => void }) {
  const router = useRouter(), { toast } = useUI();
  const st = shownState(b, b.pending), u = isoToUk(b.start);
  const [mode, setMode] = useState<'view' | 'move' | 'cancel'>('view');
  const [date, setDate] = useState(u.date), [time, setTime] = useState(u.time), [text, setText] = useState('');
  const [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const late = Date.parse(b.start) - Date.now() < 24 * 3600000 && b.status === 'confirmed';
  const done = (m: string) => { toast(m); router.refresh(); onClose(); };
  const run = async (f: () => Promise<string | null>, m: string) => { setBusy(true); setErr(null); const e = await f(); setBusy(false); if (e) setErr(e); else done(m); };
  return (
    <div className="ds-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ds-sheet" role="dialog" aria-modal="true">
        <div><div className="ds-eyebrow">{CLIENT_LABEL[st][0]}</div><h2 className="ds-h2" style={{ marginTop: 6 }}>{ukWhen(b.start)}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--fg2)' }}>{Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60000)} minutes{b.location ? ` · ${b.location}` : ''}</p></div>
        {mode === 'view' && (<>
          {st === 'awaiting_client' && <button className="ds-btn primary" disabled={busy} onClick={() => run(() => acceptSession(b.id), 'Confirmed. See you then.')}>Confirm this session</button>}
          {st === 'change_requested' && <p style={{ margin: 0, color: 'var(--fg2)' }}>You&apos;ve asked to move this one. Kyle will reply in your messages.</p>}
          {st !== 'change_requested' && <button className="ds-btn secondary" onClick={() => setMode('move')}>Ask for a different time</button>}
          <button className="ds-textbtn" style={{ color: 'var(--coral)' }} onClick={() => setMode('cancel')}>Cancel this session</button>
        </>)}
        {mode === 'move' && (<>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="ds-input" type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Day" />
            <input className="ds-input" type="time" step={900} value={time} onChange={e => setTime(e.target.value)} aria-label="Time" /></div>
          <input className="ds-input" value={text} maxLength={300} onChange={e => setText(e.target.value)} placeholder="Note for Kyle (optional)" />
          <button className="ds-btn primary" disabled={busy} onClick={() => run(() => requestChange(b.id, date, time, text), 'Sent. Kyle will reply in your messages.')}>Ask Kyle</button>
          <button className="ds-textbtn" onClick={() => setMode('view')}>Back</button>
        </>)}
        {mode === 'cancel' && (<>
          <p style={{ margin: 0, color: late ? 'var(--coral)' : 'var(--fg2)' }}>{late ? 'It’s less than 24 hours away, so this session will count as used.' : 'That’s fine: with more than 24 hours’ notice it doesn’t count against your sessions.'}</p>
          <button className="ds-btn secondary" style={{ color: 'var(--coral)' }} disabled={busy} onClick={() => run(async () => (await cancelMine(b.id)).error, 'Cancelled. Kyle has been told.')}>Yes, cancel it</button>
          <button className="ds-textbtn" onClick={() => setMode('view')}>Keep it</button>
        </>)}
        {err && <p className="ds-err" role="alert">{err}</p>}
      </div>
    </div>
  );
}
