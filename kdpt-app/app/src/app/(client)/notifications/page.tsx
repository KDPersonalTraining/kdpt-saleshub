'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from '@/components/icon';
import { useUI, type SheetName } from '@/components/client/shell';
import { SubTop } from '@/components/client/ui';
import { NOTES, type Note } from '@/lib/client/sample-data';
import { setState, useClient } from '@/lib/client/store';

export default function Notifications() {
  const s = useClient(), { openSheet } = useUI(), router = useRouter();
  const wasRead = s.read;
  // Opening the list marks everything read (shown as unread this visit).
  useEffect(() => { if (!s.read) setState({ read: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const row = (n: Note) => {
    const done = (n.id === 'pay' && s.paid) || (n.id === 'book' && s.book.done);
    return (
      <div key={n.id} className={`nrow ${n.unread && !wasRead ? 'unread' : ''}`}><span className="li" style={{ background: n.bg, color: n.c }}><Icon name={n.icon} /></span>
        <span><b>{n.t}</b><p>{n.id === 'pay' && s.paid ? 'Paid · thank you' : n.b}</p><time>{n.when}</time>
          {n.cta && !done && <button className="cta" style={{ background: n.bg, color: n.c }} onClick={() => (n.cta![1].startsWith('sheet:') ? openSheet(n.cta![1].slice(6) as SheetName) : router.push(n.cta![1]))}>{n.cta[0]}</button>}</span></div>
    );
  };
  return (
    <div className="page fade">
      <SubTop title="Notifications" back="/home" right={<button className="ib" onClick={() => openSheet('notifset')} aria-label="Notification settings"><Icon name="gear" /></button>} />
      {(['Today', 'Earlier'] as const).map(g => <div className="ngroup" key={g}><div className="eyebrow">{g}</div><div className="group">{NOTES.filter(n => n.group === g).map(row)}</div></div>)}
    </div>
  );
}
