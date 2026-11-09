'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/coach/ui';
import { deleteTemplate } from '../../actions';

// Delete one of Kyle's own programmes. Clients already on it keep their copy.
export function TemplateTools({ id }: { id: string }) {
  const router = useRouter();
  const [sure, setSure] = useState(false);
  return (
    <>
      <button className="btn line" style={{ color: 'var(--coral)' }} onClick={() => setSure(true)}>Delete</button>
      {sure && <Modal title="Delete this programme?" onClose={() => setSure(false)}>
        <p style={{ margin: 0 }}>Clients already on it keep their own copy. This can’t be undone.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn line" onClick={() => setSure(false)}>Cancel</button>
          <button className="btn line" style={{ color: 'var(--coral)' }} onClick={async () => { if (!(await deleteTemplate(id))) router.push('/coach/programmes'); }}>Delete</button></div></Modal>}
    </>
  );
}
