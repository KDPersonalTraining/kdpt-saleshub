'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEMO_COOKIE, isDemo } from '@/lib/demo';

export async function signOut() {
  if (isDemo()) (await cookies()).delete(DEMO_COOKIE);
  else await (await createClient()).auth.signOut();
  redirect('/sign-in');
}
