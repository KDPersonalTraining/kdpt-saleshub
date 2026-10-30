import { redirect } from 'next/navigation';
import { getMe } from '@/lib/auth/session';
import { homeFor } from '@/lib/auth/roles';

export default async function Index() {
  const me = await getMe();
  redirect(me ? homeFor(me.role) : '/sign-in');
}
