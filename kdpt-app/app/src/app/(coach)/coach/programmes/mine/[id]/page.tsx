import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/demo';
import { requireArea } from '@/lib/auth/session';
import { ensureLibrary } from '@/lib/coach/library';
import { loadForEditing } from '@/lib/coach/programme-load';
import { createClient } from '@/lib/supabase/server';
import { ProgrammeEditor } from '../../../clients/[id]/programme/editor';
import { TemplateTools } from './tools';

// One of Kyle's own programmes, to edit and give out.
export default async function MyProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemo()) notFound();
  const me = await requireArea('coach');
  const sb = await createClient();
  const [{ data: prog }, library] = await Promise.all([
    sb.from('programmes').select('id').eq('id', id).is('client_id', null).maybeSingle(),
    ensureLibrary(sb, me.orgId!),
  ]);
  if (!prog) notFound();
  const start = await loadForEditing(sb, id);
  if (!start) notFound();
  return <ProgrammeEditor clientId={null} clientName="Programmes" backHref="/coach/programmes" start={start} library={library ?? []} extra={<TemplateTools id={id} />} />;
}
