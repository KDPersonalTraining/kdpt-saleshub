'use client';

import { Check, ChevronLeft, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { submitCheckIn } from '@/app/(client)/checkin/actions';
import { MOOD_WORDS, type CheckInQuestion } from '@/lib/checkins/questions';
import { useLive } from '@/lib/client/live';
import { prettyDate } from '@/lib/programmes/plan';
import { setState, useClient } from '@/lib/client/store';

const I = { size: 22, strokeWidth: 1.75 } as const;
const answered = (q: CheckInQuestion, v: unknown) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length);

// A real check-in: Kyle's questions for this round, one per screen. Answers
// are kept on the phone until sent, so leaving halfway loses nothing.
export function LiveCheckIn() {
  const s = useClient(), live = useLive()!, ci = live.checkin, router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  if (!ci) return <div className="ds ds-page fade"><h1 className="ds-title">Check-in</h1><p>Check-ins aren’t set up yet.</p><Link className="ds-btn secondary" href="/home">Back</Link></div>;

  if (ci.submittedAt || sent) return (
    <div className="ds ds-page fade">
      <div><div className="ds-eyebrow" style={{ color: 'var(--mint)' }}>Sent</div><h1 className="ds-title">Check-in done</h1>
        <p style={{ color: 'var(--fg2)', margin: '8px 0 0' }}>Kyle reads every one. Your next check-in is {prettyDate(ci.nextRound)}.</p></div>
      {ci.reply && <section className="ds-card"><div className="ds-eyebrow">Kyle replied</div><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{ci.reply}</p></section>}
      <Link className="ds-btn primary" href="/home" onClick={() => router.refresh()}>Done</Link>
    </div>
  );

  const d = s.ciDraft?.round === ci.round ? s.ciDraft : { round: ci.round, i: 0, answers: {} };
  const qs = ci.questions, i = Math.min(d.i, qs.length), q = qs[i], v = q ? d.answers[q.id] : undefined;
  const save = (patch: Partial<typeof d>) => setState({ ciDraft: { ...d, ...patch } });
  const answer = (val: unknown) => save({ answers: { ...d.answers, [q.id]: val } });
  const send = async () => {
    setBusy(true); setErr(null);
    const e = await submitCheckIn(d.answers);
    setBusy(false);
    if (e) { setErr(e); return; }
    setState({ ciDraft: null }); setSent(true);
  };

  return (
    <div className="ds ds-ci fade">
      <div className="ds-ci-top">
        <button className="ds-iconbtn" aria-label={i === 0 ? 'Close' : 'Back'} onClick={() => (i === 0 ? router.push('/home') : save({ i: i - 1 }))}>{i === 0 ? <X {...I} /> : <ChevronLeft {...I} />}</button>
        <div className="ds-ci-bar" aria-hidden="true"><i style={{ width: `${(i / qs.length) * 100}%` }} /></div>
        <span className="num" style={{ color: 'var(--fg3)', fontSize: 14 }}>{Math.min(i + 1, qs.length)}/{qs.length}</span>
      </div>

      {q ? (
        <div className="ds-ci-q">
          <div><div className="ds-eyebrow">Check-in · due {prettyDate(ci.round)}</div><h1 style={{ marginTop: 8 }}>{q.q}</h1>{!q.req && <p style={{ color: 'var(--fg3)', margin: '6px 0 0', fontSize: 14 }}>Optional</p>}</div>
          {q.type === 'mood' && <div className="ds-choices">{MOOD_WORDS.map((w, k) => <button key={w} className="ds-choice" aria-pressed={v === k} onClick={() => save({ answers: { ...d.answers, [q.id]: k }, i: i + 1 })}>{w}</button>)}</div>}
          {q.type === 'scale' && <div style={{ display: 'grid', gap: 10 }}>
            <div className="ds-choices row">{[1, 2, 3, 4, 5].map(n => <button key={n} className="ds-choice num" aria-pressed={v === n} onClick={() => save({ answers: { ...d.answers, [q.id]: n }, i: i + 1 })}>{n}</button>)}</div>
            {q.ends && <div className="ds-ends"><span>1 · {q.ends[0]}</span><span>5 · {q.ends[1]}</span></div>}</div>}
          {q.type === 'pick' && <div className="ds-choices">{(q.opts ?? []).map(o => { const on = Array.isArray(v) && v.includes(o); return (
            <button key={o} className="ds-choice" aria-pressed={on} onClick={() => answer(on ? (v as string[]).filter(x => x !== o) : [...(Array.isArray(v) ? v : []), o])}>{on && <Check size={16} strokeWidth={2} style={{ marginRight: 8, verticalAlign: -2 }} />}{o}</button>); })}</div>}
          {q.type === 'text' && <textarea className="ds-textarea" value={String(v ?? '')} maxLength={2000} onChange={e => answer(e.target.value)} placeholder="Type here" />}
          {q.type === 'number' && <label style={{ display: 'flex', gap: 12, alignItems: 'center' }}><input className="ds-input num" inputMode="decimal" value={String(v ?? '')} onChange={e => answer(e.target.value.replace(/[^\d.,]/g, '').slice(0, 8))} placeholder="–" />{q.unit && <span style={{ color: 'var(--fg2)' }}>{q.unit}</span>}</label>}
        </div>
      ) : (
        <div className="ds-ci-q">
          <div><div className="ds-eyebrow">All done</div><h1 style={{ marginTop: 8 }}>Send your check-in to Kyle?</h1>
            <p style={{ color: 'var(--fg2)', margin: '8px 0 0' }}>You answered {qs.filter(x => answered(x, d.answers[x.id])).length} of {qs.length} questions. Go back to change anything.</p></div>
        </div>
      )}

      <div className="ds-ci-foot">
        {err && <p className="ds-err" role="alert">{err}</p>}
        {q ? (<>
          <button className="ds-btn primary" disabled={q.req && !answered(q, v)} style={q.req && !answered(q, v) ? { opacity: 0.4 } : undefined} onClick={() => save({ i: i + 1 })}>Continue</button>
          {!q.req && !answered(q, v) && <button className="ds-textbtn" onClick={() => save({ i: i + 1 })}>Skip</button>}
        </>) : <button className="ds-btn primary" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send to Kyle'}</button>}
      </div>
    </div>
  );
}
