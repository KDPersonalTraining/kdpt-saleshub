'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { useToast } from '@/components/coach/shell';
import { Head, Modal, Sec, Tag } from '@/components/coach/ui';
import { describeAnswer, TYPE_LABEL, type Answer, type CheckInQuestion, type QuestionType } from '@/lib/checkins/questions';
import { prettyDate, shortDate, WEEKDAYS } from '@/lib/programmes/plan';
import { reviewCheckIn, saveRoundQuestions, saveUsualQuestions, setSchedule } from './actions';

export type ClientRound = { id: string; name: string; freq: 'weekly' | 'fortnightly' | 'monthly'; weekday: number | null; round: string; custom: CheckInQuestion[] | null };
export type Received = { id: string; clientId: string; name: string; due: string; submittedAt: string; reviewed: boolean; reply: string | null; questions: CheckInQuestion[]; answers: Record<string, Answer> };

const FREQ = { weekly: 'Weekly', fortnightly: 'Every 2 weeks', monthly: 'Monthly' } as const;
const when = (f: ClientRound['freq'], wd: number | null) => (f === 'monthly' ? 'Monthly · the 1st' : `${FREQ[f]} · ${WEEKDAYS[(wd ?? 7) - 1]}`);

// Check-ins: answers to read, each client's next one (changeable for that
// round alone), and the usual questions everyone gets.
export function LiveCheckins({ usual, clients, received }: { usual: CheckInQuestion[]; clients: ClientRound[]; received: Received[] }) {
  const toast = useToast(), router = useRouter();
  const [editing, setEditing] = useState<{ kind: 'usual' } | { kind: 'round'; c: ClientRound } | null>(null);
  const [sched, setSched] = useState<ClientRound | null>(null);
  const [reading, setReading] = useState<Received | null>(null);
  const toRead = received.filter(r => !r.reviewed);
  const ok = (msg: string) => { toast(msg); router.refresh(); };
  return (
    <>
      <Head title="Check-ins" sub="Everyone gets your usual questions. Change any client’s next check-in for that round only." >
        <button className="btn line" onClick={() => setEditing({ kind: 'usual' })}><Icon name="clip" className="sm" />Usual questions ({usual.length})</button></Head>

      <section>
        <Sec title="To read" right={toRead.length ? `${toRead.length} new` : 'All read'} />
        <div className="card">{toRead.length ? toRead.map(r => <ReceivedRow key={r.id} r={r} onOpen={() => setReading(r)} />)
          : <p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>Nothing new. Check-ins show here as soon as clients send them.</p>}</div>
      </section>

      <section>
        <Sec title="Next check-ins" right={`${clients.length} clients`} />
        <div className="card">{clients.map(c => (
          <div key={c.id} className="crow" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr) auto', minWidth: 0 }}>
            <span><b>{c.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>{when(c.freq, c.weekday)} · <button style={{ textDecoration: 'underline', color: 'var(--fg3)', fontSize: 12 }} onClick={() => setSched(c)}>change</button></small></span>
            <span style={{ color: 'var(--fg2)', fontSize: 13 }}>{prettyDate(c.round)}{c.custom ? <> · <Tag c="violet">Changed for this one</Tag></> : ''}</span>
            <button className="btn ghost" onClick={() => setEditing({ kind: 'round', c })}>{c.custom ? 'Edit questions' : 'Change questions'}</button>
          </div>
        ))}
          {!clients.length && <p style={{ padding: 20, margin: 0, color: 'var(--fg3)' }}>No clients yet.</p>}</div>
      </section>

      {received.some(r => r.reviewed) && (
        <section>
          <Sec title="Read" />
          <div className="card">{received.filter(r => r.reviewed).slice(0, 20).map(r => <ReceivedRow key={r.id} r={r} onOpen={() => setReading(r)} />)}</div>
        </section>
      )}

      {editing && (
        <QuestionEditor
          title={editing.kind === 'usual' ? 'Usual questions' : `${editing.c.name.split(' ')[0]}’s check-in, ${prettyDate(editing.c.round)}`}
          note={editing.kind === 'usual' ? 'Used for every check-in you haven’t changed. Changes apply from each client’s next one.' : 'Only this round changes. Their check-ins after it go back to your usual questions.'}
          start={editing.kind === 'usual' ? usual : editing.c.custom ?? usual}
          onReset={editing.kind === 'round' && editing.c.custom ? async () => { const c = editing.c; const e = await saveRoundQuestions(c.id, c.round, null); if (e) return e; ok('Back to your usual questions'); setEditing(null); return null; } : undefined}
          onSave={async qs => {
            const e = editing.kind === 'usual' ? await saveUsualQuestions(qs) : await saveRoundQuestions(editing.c.id, editing.c.round, qs);
            if (e) return e;
            ok(editing.kind === 'usual' ? 'Usual questions saved' : `Saved for ${editing.c.name.split(' ')[0]}’s next check-in`); setEditing(null); return null;
          }}
          onClose={() => setEditing(null)} />
      )}
      {sched && <ScheduleModal c={sched} onClose={() => setSched(null)} onSaved={() => { setSched(null); ok('Check-in day saved'); }} />}
      {reading && <ReadModal r={reading} onClose={() => setReading(null)} onDone={msg => { setReading(null); ok(msg); }} />}
    </>
  );
}

function ReceivedRow({ r, onOpen }: { r: Received; onOpen: () => void }) {
  const mood = r.questions.find(q => q.type === 'mood');
  return (
    <button className="crow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto auto 20px', minWidth: 0 }} onClick={onOpen}>
      <span><b>{r.name}</b><small style={{ display: 'block', color: 'var(--fg3)', fontSize: 12 }}>Sent {shortDate(r.submittedAt)}</small></span>
      <span style={{ color: 'var(--fg2)', fontSize: 13 }}>{mood ? `Feeling ${describeAnswer(mood, r.answers[mood.id]).toLowerCase()}` : ''}</span>
      {r.reply ? <Tag c="mint">Replied</Tag> : r.reviewed ? <Tag c="grey">Read</Tag> : <Tag c="amber">New</Tag>}
      <Icon name="right" className="sm" />
    </button>
  );
}

function ReadModal({ r, onClose, onDone }: { r: Received; onClose: () => void; onDone: (msg: string) => void }) {
  const [reply, setReply] = useState(r.reply ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const go = async (text: string) => {
    setBusy(true); setErr(null);
    const e = await reviewCheckIn(r.id, text);
    setBusy(false);
    if (e) { setErr(e); return; }
    onDone(text.trim() ? `Reply sent to ${r.name.split(' ')[0]}` : 'Marked as read');
  };
  return (
    <Modal title={`${r.name} · ${prettyDate(r.due)}`} onClose={onClose} wide>
      <div style={{ display: 'grid', gap: 10 }}>{r.questions.map(q => (
        <div key={q.id} className="kv" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)' }}><span>{q.q}</span><b style={{ fontWeight: 500, whiteSpace: 'pre-line' }}>{describeAnswer(q, r.answers[q.id] ?? null)}</b></div>
      ))}</div>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--fg3)' }}>{r.reply ? 'Your reply (sent)' : 'Reply (optional). It also goes to their messages.'}
        <textarea value={reply} onChange={e => setReply(e.target.value)} disabled={!!r.reply} rows={4} style={{ background: 'var(--s1)', border: '1px solid var(--hair)', borderRadius: 8, padding: 10, color: 'var(--fg)', font: 'inherit', fontSize: 14 }} /></label>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {!r.reviewed && <button className="btn line" disabled={busy} onClick={() => go('')}>Mark as read</button>}
        {!r.reply && <button className="btn mint" disabled={busy || !reply.trim()} onClick={() => go(reply)}>{busy ? 'Sending…' : 'Send reply'}</button>}
        {r.reply && <button className="btn line" onClick={onClose}>Close</button>}
      </div>
    </Modal>
  );
}

function ScheduleModal({ c, onClose, onSaved }: { c: ClientRound; onClose: () => void; onSaved: () => void }) {
  const [freq, setFreq] = useState<ClientRound['freq']>(c.freq);
  const [wd, setWd] = useState(c.weekday ?? 7);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title={`${c.name.split(' ')[0]}’s check-ins`} onClose={onClose}>
      <div className="fields">
        <label>How often<select value={freq} onChange={e => setFreq(e.target.value as ClientRound['freq'])}>{Object.entries(FREQ).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        {freq !== 'monthly' && <label>Day<select value={wd} onChange={e => setWd(+e.target.value)}>{WEEKDAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></label>}
      </div>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn line" onClick={onClose}>Cancel</button>
        <button className="btn mint" onClick={async () => { const e = await setSchedule(c.id, freq, freq === 'monthly' ? null : wd); if (e) setErr(e); else onSaved(); }}>Save</button></div>
    </Modal>
  );
}

const blank = (type: QuestionType): CheckInQuestion => ({ id: `q${Date.now().toString(36)}`, type, q: '', req: false,
  ...(type === 'pick' ? { opts: ['', ''] } : {}), ...(type === 'scale' ? { ends: ['Low', 'High'] as [string, string] } : {}) });

// Add, remove, reword and reorder questions.
function QuestionEditor({ title, note, start, onSave, onReset, onClose }: {
  title: string; note: string; start: CheckInQuestion[]; onSave: (q: CheckInQuestion[]) => Promise<string | null>; onReset?: () => Promise<string | null>; onClose: () => void;
}) {
  const [qs, setQs] = useState<CheckInQuestion[]>(() => JSON.parse(JSON.stringify(start)));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (i: number, patch: Partial<CheckInQuestion>) => setQs(qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= qs.length) return; const n = qs.slice(); [n[i], n[j]] = [n[j], n[i]]; setQs(n); };
  const run = async (f: () => Promise<string | null>) => { setBusy(true); setErr(null); const e = await f(); setBusy(false); if (e) setErr(e); };
  const input = { background: 'var(--s1)', border: '1px solid var(--hair)', borderRadius: 8, padding: '8px 10px', color: 'var(--fg)', font: 'inherit', fontSize: 14, width: '100%' } as const;
  return (
    <Modal title={title} onClose={onClose} wide>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{note}</p>
      <div style={{ display: 'grid', gap: 10 }}>{qs.map((q, i) => (
        <div key={q.id} style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 10, background: 'var(--s1)', border: '1px solid var(--hair)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="num muted" style={{ width: 20 }}>{i + 1}</span>
            <input style={input} value={q.q} placeholder="Question" onChange={e => set(i, { q: e.target.value })} aria-label={`Question ${i + 1}`} />
            <button className="iconbtn" onClick={() => move(i, -1)} aria-label="Move up"><Icon name="up" className="sm" /></button>
            <button className="iconbtn" onClick={() => move(i, 1)} aria-label="Move down"><Icon name="down" className="sm" /></button>
            <button className="iconbtn" onClick={() => setQs(qs.filter((_, j) => j !== i))} aria-label="Remove"><Icon name="trash" className="sm" /></button>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingLeft: 28, fontSize: 13, color: 'var(--fg2)' }}>
            <span>{TYPE_LABEL[q.type][0]}</span>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={q.req} onChange={e => set(i, { req: e.target.checked })} />Required</label>
            {q.type === 'scale' && <>1 = <input style={{ ...input, width: 110 }} value={q.ends?.[0] ?? ''} onChange={e => set(i, { ends: [e.target.value, q.ends?.[1] ?? ''] })} aria-label="Word for 1" />
              5 = <input style={{ ...input, width: 110 }} value={q.ends?.[1] ?? ''} onChange={e => set(i, { ends: [q.ends?.[0] ?? '', e.target.value] })} aria-label="Word for 5" /></>}
            {q.type === 'number' && <>Unit <input style={{ ...input, width: 80 }} value={q.unit ?? ''} onChange={e => set(i, { unit: e.target.value })} aria-label="Unit" /></>}
          </div>
          {q.type === 'pick' && <label style={{ paddingLeft: 28, display: 'grid', gap: 4, fontSize: 12, color: 'var(--fg3)' }}>Choices, one per line
            <textarea style={input} rows={Math.max(3, (q.opts ?? []).length)} value={(q.opts ?? []).join('\n')} onChange={e => set(i, { opts: e.target.value.split('\n') })} /></label>}
        </div>
      ))}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><span className="muted" style={{ fontSize: 13 }}>Add:</span>
        {(Object.keys(TYPE_LABEL) as QuestionType[]).map(t => <button key={t} className="btn ghost" title={TYPE_LABEL[t][1]} onClick={() => setQs([...qs, blank(t)])}><Icon name="plus" className="sm" />{TYPE_LABEL[t][0]}</button>)}</div>
      {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {onReset && <button className="btn line" disabled={busy} onClick={() => run(onReset)}>Use usual questions</button>}
        <button className="btn line" onClick={onClose}>Cancel</button>
        <button className="btn mint" disabled={busy} onClick={() => run(() => onSave(qs.map(q => (q.type === 'pick' ? { ...q, opts: (q.opts ?? []).map(o => o.trim()).filter(Boolean) } : q))))}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </Modal>
  );
}
