import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Sign in · KDPT' };

export default function SignIn() {
  return (
    <main className="page" style={{ minHeight: '100dvh', alignContent: 'center' }}>
      <img src="/kd-mark.png" alt="KD Personal Training" style={{ height: 28, width: 'auto', justifySelf: 'start' }} />
      <SignInForm />
    </main>
  );
}
