import { redirect } from 'next/navigation';
import { isDemo } from '@/lib/demo';
import { getMe } from '@/lib/auth/session';
import { homeFor } from '@/lib/auth/roles';
import { SignInForm } from './sign-in-form';
import { enterDemo } from './actions';

export const metadata = { title: 'Sign in · KDPT' };

const PEOPLE = [
  ['client', 'SM', 'var(--mint)', 'Sarah, a current client', 'Six weeks in: workouts, food, progress, bookings'],
  ['new_client', 'HP', 'var(--violet)', 'Hannah, a brand-new client', 'Starts with the welcome and health questions'],
  ['coach', 'KD', 'var(--sky)', 'Kyle, the coach', 'The coach portal: clients, programmes, schedule, payments'],
] as const;

export default async function SignIn() {
  const me = await getMe();
  if (me) redirect(homeFor(me.role));
  return (
    <main className="si">
      <img className="si-logo" src="/kd-mark.png" alt="KD Personal Training" />
      {isDemo() ? (
        <>
          <div>
            <h1>Try the app</h1>
            <p className="si-muted">This is a demo with sample data. Pick who to be.</p>
          </div>
          <div className="si-demo">
            {PEOPLE.map(([id, ini, c, t, d]) => (
              <form key={id} action={enterDemo.bind(null, id)}>
                <button>
                  <span className="tile" style={{ color: c, borderColor: c, background: `color-mix(in srgb, ${c} 13%, transparent)` }}>{ini}</span>
                  <span><b>{t}</b><small>{d}</small></span>
                </button>
              </form>
            ))}
          </div>
          <p className="si-note">Nothing you do here is saved to a server. Once the database is connected, this page becomes the real sign-in with a 6-digit email code.</p>
        </>
      ) : (
        <SignInForm />
      )}
    </main>
  );
}
