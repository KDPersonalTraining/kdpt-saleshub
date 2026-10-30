import { getMe } from '@/lib/auth/session';
import { signOut } from '@/app/actions';

const greeting = (h: number) => (h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening');

export default async function Home() {
  const me = (await getMe())!;
  const now = new Date();
  const hour = Number(now.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' }));
  return (
    <main className="page">
      <div className="top">
        <img src="/kd-mark.png" alt="KD Personal Training" />
        <form action={signOut}><button className="muted">Sign out</button></form>
      </div>
      <div>
        <div className="eyebrow">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' })}</div>
        <h1>{greeting(hour)}, {me.name.split(' ')[0]}</h1>
      </div>
      {[
        ['Train', 'Your coach is building your programme.', 'var(--mint)'],
        ['Fuel', 'Your targets appear once your coach sets them.', 'var(--amber)'],
        ['Check-in', 'Your first check-in opens on the day you chose.', 'var(--violet)'],
      ].map(([t, d, c]) => (
        <div className="card row" key={t}>
          <span className="tile" style={{ color: c, borderColor: c, background: `color-mix(in srgb, ${c} 13%, transparent)` }}>{t[0]}</span>
          <span><b>{t}</b><br /><small>{d}</small></span>
        </div>
      ))}
    </main>
  );
}
