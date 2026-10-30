'use server';

import { redirect } from 'next/navigation';
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
  await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  return { step: 'code', email };
}

// Step 2: check the code, then send people to their own area.
export async function verifyCode(prev: SignInState, form: FormData): Promise<SignInState> {
  const token = String(form.get('code') ?? '').replace(/\D/g, '');
  if (token.length !== 6) return { ...prev, step: 'code', error: 'The code is 6 digits.' };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email: prev.email, token, type: 'email' });
  if (error || !data.user) return { ...prev, step: 'code', error: "That code didn't work. Check the latest email, or send a new one." };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return { step: 'email', email: prev.email, error: 'Your account isn\'t set up yet. Ask your coach to resend your invite.' };
  }
  redirect(homeFor(profile.role as Role));
}
