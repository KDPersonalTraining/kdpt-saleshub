'use client';

import { useActionState } from 'react';
import { sendCode, verifyCode, type SignInState } from './actions';

const start: SignInState = { step: 'email', email: '' };

export function SignInForm() {
  const [state, action, pending] = useActionState(
    (prev: SignInState, form: FormData) => (form.get('intent') === 'resend' || prev.step === 'email' ? sendCode(prev, form) : verifyCode(prev, form)),
    start,
  );

  if (state.step === 'email') {
    return (
      <form action={action} style={{ display: 'grid', gap: 16 }}>
        <div>
          <h1>Sign in</h1>
          <p className="muted">We&apos;ll email you a 6-digit code. No password needed.</p>
        </div>
        <label className="field">
          Email
          <input name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.email} required autoFocus />
        </label>
        {state.error && <p className="error" role="alert">{state.error}</p>}
        <button className="btn mint" disabled={pending}>{pending ? 'Sending…' : 'Email me a code'}</button>
      </form>
    );
  }

  return (
    <form action={action} style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1>Check your email</h1>
        <p className="muted">If {state.email} has an invite, a code is on its way. It lasts 10 minutes.</p>
      </div>
      <label className="field code">
        Code
        <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required autoFocus />
      </label>
      <input type="hidden" name="email" value={state.email} />
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn mint" disabled={pending}>{pending ? 'Checking…' : 'Sign in'}</button>
      <button className="btn dark" name="intent" value="resend" formNoValidate disabled={pending}>Send a new code</button>
    </form>
  );
}
