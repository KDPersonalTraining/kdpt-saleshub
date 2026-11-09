'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { useUI } from '@/components/client/shell';
import { useLive } from '@/lib/client/live';
import { browserClient } from '@/lib/supabase/browser';
import { byDay, MAX_MESSAGE, timeOf, type Msg } from '@/lib/messages';

// Real messages with Kyle. New ones arrive straight away; if the live
// connection drops, the screen still checks every 20 seconds.
export function LiveChat() {
  const { me, toast } = useUI(), live = useLive()!;
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const sb = browserClient(); if (!sb) return;
    const { data } = await sb.from('messages').select('id, client_id, sender_kind, body, created_at').eq('client_id', me.id).order('created_at', { ascending: false }).limit(300);
    if (data) setMsgs(prev => [...(data as Msg[]), ...(prev ?? []).filter(m => m.failed)]);
    await sb.rpc('mark_messages_read');
  }, [me.id]);

  useEffect(() => {
    void load();
    const sb = browserClient(); if (!sb) return;
    const ch = sb.channel(`chat-${me.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${me.id}` }, () => { void load(); }).subscribe();
    const t = setInterval(() => { void load(); }, 20000);
    return () => { void sb.removeChannel(ch); clearInterval(t); };
  }, [load, me.id]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs?.length]);

  const send = async (body = text.trim(), retryId?: string) => {
    if (!body) return;
    const sb = browserClient(); if (!sb) return;
    const tmp: Msg = { id: retryId ?? `tmp-${Date.now()}`, client_id: me.id, sender_kind: 'client', body, created_at: new Date().toISOString() };
    setMsgs(prev => [tmp, ...(prev ?? []).filter(m => m.id !== tmp.id)]);
    if (!retryId) setText('');
    const { error } = await sb.from('messages').insert({ org_id: live.orgId, client_id: me.id, sender_id: me.id, sender_kind: 'client', body: body.slice(0, MAX_MESSAGE) });
    if (error) { setMsgs(prev => (prev ?? []).map(m => (m.id === tmp.id ? { ...m, failed: true } : m))); toast('Not sent. Tap the message to try again.'); return; }
    setMsgs(prev => (prev ?? []).filter(m => m.id !== tmp.id));
    void load();
  };

  return (
    <>
      <div className="page fade" style={{ paddingBottom: 110 }}>
        <div className="convo-head"><Link className="round" style={{ background: 'var(--s2)', width: 40, height: 40 }} href="/home" aria-label="Back"><Icon name="back" /></Link>
          <span className="kd-av" style={{ width: 44, height: 44 }}><img src="/kd-mark.png" alt="" /></span>
          <span className="t"><b>Kyle</b><small>Your coach · replies within a few hours</small></span></div>
        <div className="msgs" aria-live="polite">
          {msgs === null && <div className="stamp">Loading messages…</div>}
          {msgs?.length === 0 && <div className="stamp">No messages yet. Say hello, ask a question, or tell Kyle how training’s going.</div>}
          {msgs && byDay(msgs).map(([day, list]) => (
            <div key={day} style={{ display: 'grid', gap: 8 }}><div className="stamp">{day}</div>
              {list.map(m => m.sender_kind === 'client'
                ? <button key={m.id} className="msg me" style={{ textAlign: 'left', opacity: m.failed ? 0.6 : m.id.startsWith('tmp') ? 0.8 : 1 }} disabled={!m.failed} onClick={() => send(m.body, m.id)}
                    title={timeOf(m.created_at)}>{m.body}{m.failed && <small style={{ display: 'block', fontSize: 12 }}>Not sent · tap to retry</small>}</button>
                : <div key={m.id} className="msg them" title={timeOf(m.created_at)} style={{ whiteSpace: 'pre-line' }}>{m.body}</div>)}
            </div>
          ))}
          <div ref={end} />
        </div>
      </div>
      <div className="dock" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 10 }}>
        <div className="composer"><label><input value={text} maxLength={MAX_MESSAGE} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message Kyle" aria-label="Message Kyle" /></label>
          <button className="round" onClick={() => send()} aria-label="Send" disabled={!text.trim()}><Icon name="send" /></button></div>
      </div>
    </>
  );
}
