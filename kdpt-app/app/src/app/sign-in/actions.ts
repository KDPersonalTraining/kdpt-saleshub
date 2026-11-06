'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_COOKIE, isDemo, isPersona, type DemoPersona } from '@/lib/demo';
import { createClient } from '@/lib/supabase/server';
import { homeFor, type Role } from '@/lib/auth/roles';

export type SignInState = { step: 'email' | 'code'; email: string; error?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Step 1: email a 6-digit code. Only invited people have accounts, so no
// account is created here. The reply is the same whether or not the email is
// known, so the form can't be used to find out who is a client.
export async function sendCode(_: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL.test(email)) return { step: 'email', email, error: 'Enter the email your invite came to.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) {
    // An unknown email is answered like a known one. Anything else (the email
    // service refusing, too many emails) is a real failure the person should
    // hear about, and Kyle can find the details in the Vercel logs.
    const unknown = error.code === 'otp_disabled' || /signups? not allowed|user not found/i.test(error.message);
    if (!unknown) {
      console.error('sign-in: code email failed', { status: error.status, code: error.code, message: error.message });
      const busy = error.status === 429 || error.code === 'over_email_send_rate_limit';
      return { step: 'email', email, error: busy ? 'Too many codes sent just now. Wait a minute and try again.' : "We couldn't send your code just now. Try again in a minute; if it keeps happening, tell Kyle." };
    }
  }
  return { step: 'code', email };
}

// Step 2: check the code, then send people to their own area.
export async function verifyCode(prev: SignInState, form: FormData): Promise<SignInState> {
  const token = String(form.get('code') ?? '').replace(/\D/g, '');
  if (token.length !== 6) return { ...prev, step: 'code', error: 'The code is 6 digits.' };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email: prev.email, token, type: 'email' });
  if (error || !data.user) return { ...prev, step: 'code', error: "That code didn't work. Check the latest email, or send a new one." };
  const { data: profile, error: pe } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (pe) {
    console.error('sign-in: profile read failed', { code: pe.code, message: pe.message });
    await supabase.auth.signOut();
    return { step: 'email', email: prev.email, error: "Signed in, but your account couldn't be read. Tell Kyle (database access)." };
  }
  if (!profile) {
    await supabase.auth.signOut();
    return { step: 'email', email: prev.email, error: 'Your account isn\'t set up yet. Ask your coach to resend your invite.' };
  }
  redirect(homeFor(profile.role as Role));
}

// Demo mode only: remember who the visitor is trying out.
export async function enterDemo(persona: DemoPersona) {
  if (!isDemo() || !isPersona(persona)) redirect('/sign-in');
  (await cookies()).set(DEMO_COOKIE, persona, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  redirect(persona === 'coach' ? '/coach' : persona === 'new_client' ? '/welcome' : '/home');
}
