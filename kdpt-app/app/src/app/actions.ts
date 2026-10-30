'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DEMO_COOKIE, isDemo } from '@/lib/demo';

// Ends the session. The caller then does a full page load of /sign-in, so the
// client app's and coach portal's stylesheets never end up loaded together.
export async function signOut() {
  if (isDemo()) (await cookies()).delete(DEMO_COOKIE);
  else await (await createClient()).auth.signOut();
}
