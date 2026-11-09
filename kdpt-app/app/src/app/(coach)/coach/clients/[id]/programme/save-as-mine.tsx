'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/coach/shell';
import { Modal } from '@/components/coach/ui';
import { saveAsTemplate } from '../../../programmes/actions';

// Keep a client's programme as one of Kyle's own, to give to others.
export function SaveAsMine({ programmeId, name }: { programmeId: string; name: string }) {
  const toast = useToast(), router = useRouter();
  const [open, setOpen] = useState(false), [n, setN] = useState(name), [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button className="btn line" onClick={() => setOpen(true)}>Save to my programmes</button>
      {open && <Modal title="Save to my programmes" onClose={() => setOpen(false)}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>Saves the version you last saved here, so you can give it to other clients.</p>
        <div className="fields"><label className="full">Name<input value={n} onChange={e => setN(e.target.value)} /></label></div>
        {err && <p role="alert" style={{ margin: 0, color: 'var(--coral)' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn line" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn mint" onClick={async () => { const r = await saveAsTemplate(programmeId, n); if (r.error) setErr(r.error); else { toast('Saved to your programmes'); setOpen(false); router.refresh(); } }}>Save</button></div></Modal>}
    </>
  );
}
