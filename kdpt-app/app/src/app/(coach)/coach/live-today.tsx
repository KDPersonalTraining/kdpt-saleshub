'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Head, Modal, Sec, Tag } from '@/components/coach/ui';
import { coveredLike, liftedLike } from '@/lib/client/fun';
import type { TodayData } from '@/lib/coach/today';
import { shortDate } from '@/lib/programmes/plan';
import { isoToUk } from '@/lib/time';
import { reviewPain } from './actions';

const ACTION: Record<string, string> = { continued: 'carried on', swapped: 'swapped the exercise', skipped_exercise: 'skipped the exercise', stopped_session: 'stopped the workout' };
const row = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '14px 18px', borderTop: '1px solid var(--hair)', width: '100%', textAlign: 'left' } as const;

// Kyle's Today: what needs him, then how everyone's training is going.
export function LiveToday({ name, data }: { name: string; data: TodayData }) {
  const [pain, setPain] = useState<TodayData['pain'][number] | null>(null);
  const needs = data.pain.length + data.unread.length + data.checkins.length + data.noProgramme.length + (data.moves ? 1 : 0);
  const watch = data.quiet.length + data.ending.length;
  return (
    <>
      <Head eyebrow={shortDate(Date.now())} title={`Hi, ${name.split(' ')[0]}`} sub={needs ? `${needs} thing${needs === 1 ? '' : 's'} need${needs === 1 ? 's' : ''} you.` : 'Nothing needs you right now.'} />

      <section>
        <Sec title="Sessions today" right={<Link className="btn line" href="/coach/schedule">Schedule</Link>} />
        <div className="card">{data.sessions.length ? data.sessions.map(b => (
          <Link key={b.id} style={row} href={`/coach/clients/${b.clientId}`}><span><b className="num">{isoToUk(b.start).time}</b> · {b.name}</span>{b.status === 'held' ? <Tag c="amber">Not confirmed</Tag> : <Tag c="mint">Confirmed</Tag>}</Link>
        )) : <p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>No sessions today.</p>}</div>
      </section>

      <section>
        <Sec title="Needs you" />
        <div className="card">
          {data.moves > 0 && <Link style={row} href="/coach/schedule"><span><b>{data.moves} request{data.moves === 1 ? '' : 's'} to move a session</b></span><Tag c="violet" icon="schedule">Answer</Tag></Link>}
          {data.pain.map(p => (
            <button key={p.id} style={row} onClick={() => setPain(p)}>
              <span><b>{p.name}: {p.area}, {p.severity}/10</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{p.exercise ? `During ${p.exercise}. ` : ''}They {ACTION[p.action] ?? p.action} · {shortDate(p.at)}</small></span>
              <Tag c="coral" icon="pain">Pain</Tag></button>
          ))}
          {data.unread.map(u => (
            <Link key={u.clientId} style={row} href={`/coach/messages?c=${u.clientId}`}>
              <span><b>{u.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{u.n} unread message{u.n === 1 ? '' : 's'} · {shortDate(u.last)}</small></span><Tag c="mint" icon="messages">Reply</Tag></Link>
          ))}
          {data.checkins.map(c => (
            <Link key={c.clientId} style={row} href="/coach/checkins">
              <span><b>{c.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{c.n === 1 ? 'Sent a check-in' : `${c.n} check-ins`} to read</small></span><Tag c="violet" icon="checkins">Read</Tag></Link>
          ))}
          {data.noProgramme.map(c => (
            <Link key={c.clientId} style={row} href={`/coach/clients/${c.clientId}`}>
              <span><b>{c.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>Signed up, waiting for a programme</small></span><Tag c="amber" icon="programmes">Give one</Tag></Link>
          ))}
          {!needs && <p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>All clear. Pain reports, messages, check-ins and new sign-ups show up here.</p>}
        </div>
      </section>

      {watch > 0 && (
        <section>
          <Sec title="Keep an eye on" />
          <div className="card">
            {data.quiet.map(c => (
              <Link key={c.clientId} style={row} href={`/coach/messages?c=${c.clientId}`}>
                <span><b>{c.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{c.days === null ? 'Hasn’t logged a workout yet' : `No workout logged for ${c.days} days`} · {c.programme}</small></span><Tag c="amber">Check in</Tag></Link>
            ))}
            {data.ending.map(c => (
              <Link key={c.clientId} style={row} href={`/coach/clients/${c.clientId}/programme`}>
                <span><b>{c.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>Final week of {c.programme}. Plan what’s next</small></span><Tag c="sky">Next block</Tag></Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <Sec title="Recent workouts" />
        <div className="card">
          {data.recent.map(r => {
            const fun = [liftedLike(r.volume, r.id)?.words, coveredLike(r.distance, r.id)?.words].filter(Boolean).join(' and ');
            return (
              <Link key={r.id} style={row} href={`/coach/clients/${r.clientId}`}>
                <span><b>{r.name} · {r.workout}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{shortDate(r.at)} · {r.sets} sets{r.volume ? ` · ${r.volume.toLocaleString('en-GB')} kg` : ''}{r.distance ? ` · ${Math.round(r.distance / 100) / 10} km` : ''}{fun ? ` · ${fun}` : ''}</small></span>
                <Icon name="right" className="sm" /></Link>
            );
          })}
          {!data.recent.length && <p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>Finished workouts show here as clients log them.</p>}
        </div>
      </section>
      {pain && <PainModal p={pain} onClose={() => setPain(null)} />}
    </>
  );
}

function PainModal({ p, onClose }: { p: TodayData['pain'][number]; onClose: () => void }) {
  const toast = useToast(), router = useRouter();
  const [reply, setReply] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const go = async (text: string) => {
    setBusy(true); setErr(null);
    const e = await reviewPain(p.id, text);
    setBusy(false);
    if (e) { setErr(e); return; }
    toast(text ? `Reply sent to ${p.name.split(' ')[0]}` : 'Marked as seen'); router.refresh(); onClose();
  };
  return (
    <Modal title={`${p.name}: ${p.area}`} onClose={onClose}>
      <div className="kv"><span>How bad</span><b>{p.severity} out of 10</b><span>When</span><b>{shortDate(p.at)}{p.exercise ? `, during ${p.exercise}` : ''}</b><span>What they did</span><b>{ACTION[p.action] ?? p.action}</b></div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>If it sounds serious, call them. Anything sharp, sudden or with swelling should be checked by a professional.</p>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--fg3)' }}>Reply (optional). It goes to their messages.
        <textarea rows={4} value={reply} onChange={e => setReply(e.target.value)} style={{ background: 'var(--s1)', border: '1px solid var(--hair)', borderRadius: 8, padding: 10, color: 'var(--fg)', font: 'inherit', fontSize: 14 }} /></label>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button className="btn line" disabled={busy} onClick={() => go('')}>Mark as seen</button>
        <button className="btn mint" disabled={busy || !reply.trim()} onClick={() => go(reply)}>{busy ? 'Sending…' : 'Send reply'}</button></div>
    </Modal>
  );
}
