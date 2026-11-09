import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { ensureLibrary } from '@/lib/coach/library';
import { loadForEditing } from '@/lib/coach/programme-load';
import { createClient } from '@/lib/supabase/server';
import { ProgrammeEditor } from './editor';
import { SaveAsMine } from './save-as-mine';

// Kyle edits one client's own programme.
export default async function EditProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemo()) notFound();
  const me = await requireArea('coach');
  const sb = await createClient();
  const [{ data: person }, { data: prog }, library] = await Promise.all([
    sb.from('profiles').select('full_name').eq('id', id).eq('role', 'client').maybeSingle(),
    sb.from('programmes').select('id, name, weeks, starts_on').eq('client_id', id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ensureLibrary(sb, me.orgId!),
  ]);
  if (!person || !prog) notFound();
  const programme = await loadForEditing(sb, prog.id);
  if (!programme) notFound();
  return <ProgrammeEditor clientId={id} clientName={person.full_name} start={programme} library={library ?? []} extra={<SaveAsMine programmeId={prog.id} name={prog.name} />} />;
}
