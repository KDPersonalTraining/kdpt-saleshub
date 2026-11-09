import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Sec, Tag } from '@/components/coach/ui';
import { PARQ } from '@/lib/client/sample-data';
import { Training, type CoachSession } from './training';
import { RecordExtras, type Extras } from './record-extras';
import type { MyProgramme } from '@/components/coach/assign';

const TYPE: Record<string, string> = { in_person: 'In-person', hybrid: 'Hybrid', online: 'Online' };
const GOAL: Record<string, string> = { strength: 'Get stronger', fat: 'Lose fat', fit: 'Feel fitter', pain: 'Move pain-free' };
const CONSENT: Record<string, string> = { terms: 'Terms and cancellation policy', health_data: 'Health information', progress_photos: 'Progress photos', ai_assistant: 'KAI can use their plan', marketing_email: 'Tips by email', privacy_notice: 'Privacy notice' };
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '–');

// A real client's record: their sign-up answers (health first), consents and
// recent activity. More tabs arrive as each part moves into the database.
export function LiveProfile({ mine, extras, id, programme, sessions, name, added, type, lastActive, state, answers, submitted, consents }: {
  mine: MyProgramme[]; extras: Extras; id: string; programme: { name: string; week: number; weeks: number | null; startsOn: string | null } | null; sessions: CoachSession[];
  name: string; added: string; type: string | null; lastActive: string | null; state: Record<string, unknown> | null;
  answers: Record<string, unknown> | null; submitted: string | null; consents: { kind: string; granted: boolean }[];
}) {
  const parq = (answers?.parq as (boolean | null)[] | undefined) ?? [];
  const yes = PARQ.filter((_, i) => parq[i] === true);
  const injuries = String(answers?.injuries ?? '').trim();
  const checkIn = answers?.check_in as { freq?: string; day?: string } | undefined;
  const log = state?.log as Record<string, unknown[]> | undefined;
  const foods = log ? Object.values(log).reduce((n, l) => n + (l?.length ?? 0), 0) : 0;
  return (
    <>
      <div className="prof"><span className="av" style={{ background: 'var(--s3)', color: 'var(--fg2)' }}>{name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
        <div className="grow"><h1>{name}</h1>
          <div className="meta"><Tag c="grey">{type ? TYPE[type] : 'Coaching type not set'}</Tag><Tag c={submitted ? 'mint' : 'amber'} icon={submitted ? 'check' : 'clock'}>{submitted ? `Signed up ${date(submitted)}` : 'Hasn’t signed up yet'}</Tag></div></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link className="btn ghost" href={`/coach/messages?c=${id}`}><Icon name="messages" className="sm" />Message</Link>
          <Link className="btn line" href="/coach/clients"><Icon name="back" className="sm" />All clients</Link></div></div>

      {!submitted && <div className="flag" style={{ borderColor: 'rgba(255,180,94,.3)', background: 'rgba(255,180,94,.06)' }}><span style={{ color: 'var(--amber)' }}><Icon name="info" /></span>
        <span>Added {date(added)}. They got an email with a sign-in code; once they sign in and answer the health questions, it all shows here.</span></div>}

      {submitted && (
        <div className="grid2">
          <div className="card pad"><Sec title="Health" right="Only you can see this" />
            {yes.length ? <div style={{ display: 'grid', gap: 8 }}>{yes.map(q => <div key={q} className="flag"><Icon name="pain" /><span><b>Yes:</b> {q}</span></div>)}</div>
              : <p style={{ margin: 0, color: 'var(--fg2)' }}><Icon name="check" className="sm" /> No to all {PARQ.length} health questions.</p>}
            <div className="kv" style={{ marginTop: 16 }}><span>Injuries or notes</span><b>{injuries || 'None given'}</b></div></div>
          <div className="card pad"><Sec title="Their choices" />
            <div className="kv"><span>Goal</span><b>{GOAL[String(answers?.goal)] ?? '–'}</b><span>Training days</span><b>{String(answers?.days ?? '–')} a week</b>
              <span>Check-ins</span><b>{checkIn?.freq === 'monthly' ? 'Monthly' : checkIn?.freq === 'fortnightly' ? `Every 2 weeks · ${checkIn.day}` : `Weekly · ${checkIn?.day ?? '–'}`}</b></div>
            <div style={{ marginTop: 16, display: 'grid', gap: 6 }}>{consents.map(c => <span key={c.kind} style={{ fontSize: 13, color: c.granted ? 'var(--fg)' : 'var(--fg3)' }}>{c.granted ? '✓' : '–'} {CONSENT[c.kind] ?? c.kind}</span>)}</div></div>
        </div>
      )}

      <Training mine={mine} clientId={id} name={name} programme={programme} sessions={sessions} />
      <RecordExtras clientId={id} x={extras} />

      <div className="statrow">
        <div className="card"><b>{date(lastActive)}</b><small>Last active in the app</small></div>
        <div className="card"><b className="num">{foods}</b><small>Foods in their current log</small></div>
        <div className="card"><b className="num">{Number(state?.checkinsSent ?? 0)}</b><small>Check-ins sent</small></div>
      </div>
      <p className="muted" style={{ margin: 0 }}>Payments come once Stripe is set up.</p>
    </>
  );
}
