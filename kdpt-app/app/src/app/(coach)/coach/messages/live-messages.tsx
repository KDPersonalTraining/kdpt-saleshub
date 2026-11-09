'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { Head } from '@/components/coach/ui';
import { useToast } from '@/components/coach/shell';
import { browserClient } from '@/lib/supabase/browser';
import { byDay, dayLabel, MAX_MESSAGE, timeOf, type Msg } from '@/lib/messages';

const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

// Kyle's inbox: every client, newest conversation first, unread marked.
// New messages arrive straight away, with a 20-second check as a fallback.
export function LiveMessages({ coachId, orgId, clients, initial }: { coachId: string; orgId: string; clients: { id: string; name: string }[]; initial: string | null }) {
  const toast = useToast();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [cur, setCur] = useState<string | null>(initial && clients.some(c => c.id === initial) ? initial : null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const sb = browserClient(); if (!sb) return;
    const { data } = await sb.from('messages').select('id, client_id, sender_kind, body, created_at, read_by_coach_at').order('created_at', { ascending: false }).limit(1000);
    if (data) setMsgs(data as Msg[]);
  }, []);
  useEffect(() => {
    void load();
    const sb = browserClient(); if (!sb) return;
    const ch = sb.channel('coach-inbox').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { void load(); }).subscribe();
    const t = setInterval(() => { void load(); }, 20000);
    return () => { void sb.removeChannel(ch); clearInterval(t); };
  }, [load]);

  // Opening a conversation marks the client's messages as read.
  useEffect(() => {
    if (!cur || !msgs.some(m => m.client_id === cur && m.sender_kind === 'client' && !m.read_by_coach_at)) return;
    const sb = browserClient(); if (!sb) return;
    void sb.from('messages').update({ read_by_coach_at: new Date().toISOString() }).eq('client_id', cur).eq('sender_kind', 'client').is('read_by_coach_at', null).then(() => load());
  }, [cur, msgs, load]);

  const thread = useMemo(() => msgs.filter(m => m.client_id === cur), [msgs, cur]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [thread.length, cur]);

  const convs = useMemo(() => clients.map(c => {
    const mine = msgs.filter(m => m.client_id === c.id);
    return { ...c, last: mine[0] ?? null, unread: mine.filter(m => m.sender_kind === 'client' && !m.read_by_coach_at).length };
  }).sort((a, b) => (b.last?.created_at ?? '').localeCompare(a.last?.created_at ?? '') || a.name.localeCompare(b.name)), [clients, msgs]);
  const who = clients.find(c => c.id === cur);

  const send = async () => {
    const body = text.trim(); if (!body || !cur) return;
    const sb = browserClient(); if (!sb) return;
    setBusy(true);
    const { error } = await sb.from('messages').insert({ org_id: orgId, client_id: cur, sender_id: coachId, sender_kind: 'coach', body: body.slice(0, MAX_MESSAGE), read_by_coach_at: new Date().toISOString() });
    setBusy(false);
    if (error) { toast('Not sent. Check your connection and try again.'); return; }
    setText(''); void load();
  };

  return (
    <>
      <Head title="Messages" sub={convs.some(c => c.unread) ? `${convs.reduce((n, c) => n + c.unread, 0)} unread` : undefined} />
      <div className={`card msgs-wrap live ${cur ? 'picked' : ''}`}>
        <div className="list">{convs.map(c => (
          <button key={c.id} className={`conv ${cur === c.id ? 'on' : ''}`} onClick={() => setCur(c.id)}>
            <span className="av" style={{ background: 'var(--s3)', color: 'var(--fg2)' }}>{initials(c.name)}</span>
            <span><b>{c.name}</b><small>{c.last ? `${c.last.sender_kind === 'coach' ? 'You: ' : ''}${c.last.body}` : 'No messages yet'}</small></span>
            {c.last && <small style={{ flex: 'none' }}>{dayLabel(c.last.created_at) === 'Today' ? timeOf(c.last.created_at) : dayLabel(c.last.created_at)}</small>}
            {c.unread > 0 && <i className="dot" aria-label={`${c.unread} unread`} />}
          </button>
        ))}
          {!clients.length && <p style={{ padding: 16, color: 'var(--fg3)' }}>No clients yet.</p>}</div>
        <div className="thread">
          {who ? (<>
            <div className="sec" style={{ padding: '14px 16px', margin: 0, borderBottom: '1px solid var(--hair)' }}>
              <h2><button className="iconbtn back-mobile" onClick={() => setCur(null)} aria-label="All conversations"><Icon name="back" className="sm" /></button>{who.name}</h2></div>
            <div className="body">
              {!thread.length && <p className="muted" style={{ textAlign: 'center' }}>No messages with {who.name.split(' ')[0]} yet.</p>}
              {byDay(thread).map(([day, list]) => (
                <div key={day} style={{ display: 'grid', gap: 8 }}><div className="muted" style={{ textAlign: 'center', fontSize: 12 }}>{day}</div>
                  {list.map(m => <div key={m.id} className={`bub ${m.sender_kind === 'coach' ? 'me' : 'them'}`} title={timeOf(m.created_at)} style={{ whiteSpace: 'pre-line' }}>{m.body}</div>)}</div>
              ))}
              <div ref={end} />
            </div>
            <div className="comp">
              <input value={text} maxLength={MAX_MESSAGE} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={`Message ${who.name.split(' ')[0]}`} aria-label="Message" />
              <button className="btn mint" onClick={send} disabled={busy || !text.trim()} aria-label="Send"><Icon name="send" className="sm" /></button></div>
          </>) : <p className="muted" style={{ margin: 'auto', padding: 20 }}>Choose a client to see your messages.</p>}
        </div>
      </div>
    </>
  );
}
