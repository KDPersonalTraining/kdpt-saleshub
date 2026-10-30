import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canAccess, homeFor, type Area, type Role } from './roles';

export type Me = { id: string; role: Role; name: string };

// The signed-in user's profile, or null. Claims are verified, not just read
// from the cookie.
export async function getMe(): Promise<Me | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, preferred_name, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (!profile || profile.archived_at) return null;
  return { id, role: profile.role as Role, name: profile.preferred_name || profile.full_name };
}

// Use at the top of each area's layout. Sends people to sign in, or to their
// own area if they're in the wrong one.
export async function requireArea(area: Area): Promise<Me> {
  const me = await getMe();
  if (!me) redirect('/sign-in');
  if (!canAccess(me.role, area)) redirect(homeFor(me.role));
  return me;
}
