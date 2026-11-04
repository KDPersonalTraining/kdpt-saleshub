'use server';

import { createClient as createPlainClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { supabaseEnv } from '@/lib/supabase/env';

const TYPES: Record<string, string> = { 'In-person': 'in_person', Hybrid: 'hybrid', Online: 'online' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Kyle adds a client: creates their account, their profile and coaching
// details, then emails them a sign-in code. Returns an error message, or null.
export async function addClient(v: { first: string; last: string; email: string; type: string; pkg: string }): Promise<string | null> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'coach' || !me.orgId) return 'Only the coach can add clients.';
  const email = v.email.trim().toLowerCase(), name = `${v.first} ${v.last}`.trim();
  if (!v.first.trim() || !EMAIL.test(email)) return 'Add a first name and a valid email.';
  if (!TYPES[v.type]) return 'Choose in-person, hybrid or online.';

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: name } });
  if (error || !data.user) return /already|registered|exists/i.test(error?.message ?? '') ? 'That email already has an account.' : 'Couldn’t create the account. Try again.';
  const id = data.user.id;

  const { error: e1 } = await admin.from('profiles').insert({ id, org_id: me.orgId, role: 'client', full_name: name, preferred_name: v.first.trim() });
  const { error: e2 } = e1 ? { error: e1 } : await admin.from('client_details').insert({ client_id: id, org_id: me.orgId, coaching_type: TYPES[v.type], started_on: new Date().toISOString().slice(0, 10) });
  if (e1 || e2) {
    // Don't leave a half-made account behind.
    await admin.from('profiles').delete().eq('id', id);
    await admin.auth.admin.deleteUser(id);
    return 'Couldn’t save the client. Nothing was created; try again.';
  }

  // Email them a sign-in code, from a connection with no session of its own so
  // Kyle stays signed in.
  const { url, key } = supabaseEnv();
  const { error: e3 } = await createPlainClient(url, key, { auth: { persistSession: false } }).auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  revalidatePath('/coach/clients');
  return e3 ? `${v.first} is added, but the code email didn’t send (${e3.message}). Ask them to open the app and tap “Email me a code”.` : null;
}
