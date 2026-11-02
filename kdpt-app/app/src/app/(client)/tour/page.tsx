'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Icon } from '@/components/icon';

// Kyle's video walkthrough, plus a short step-by-step tour. Clients can come
// back to it from their profile. The video plays once Kyle adds the file
// (public/media/kdpt-tour.mp4); until then the page says so.
const VIDEO = '/media/kdpt-tour.mp4';
const STEPS: [string, string, string][] = [
  ['home', 'Home', 'Your next workout, your next session with Kyle, and anything that needs you. Start here every day.'],
  ['train', 'Training', 'Tap your workout to start. Log each set, rest, and move on. Your weights are suggested from last time.'],
  ['fuel', 'Fuel', 'Log meals in seconds. Tap + on a meal, pick a food, choose how much. Kyle reviews your week.'],
  ['progress', 'Progress', 'See your lifts climb, your records, and how consistent you’ve been.'],
  ['chat', 'Help', 'Message Kyle any time. KAI answers quick questions about your plan, and passes anything else to Kyle.'],
];

export default function TourPage() { return <Suspense><Tour /></Suspense>; }

function Tour() {
  const router = useRouter(), then = useSearchParams().get('then');
  const [i, setI] = useState(0);
  const [hasVideo, setHasVideo] = useState<boolean | null>(null);
  useEffect(() => { fetch(VIDEO, { method: 'HEAD' }).then(r => setHasVideo(r.ok)).catch(() => setHasVideo(false)); }, []);
  const done = () => router.replace(then === 'home' ? '/home' : '/profile');
  const [icon, title, body] = STEPS[i];
  return (
    <div className="tour fade">
      <div className="tour-top"><span className="eyebrow">App tour</span><button className="tour-skip" onClick={done}>Close</button></div>
      <div className="tour-video">
        {hasVideo ? <video src={VIDEO} controls playsInline preload="metadata" aria-label="Kyle's video walkthrough" />
          : <div className="tour-soon"><Icon name="film" /><b>Video walkthrough</b><span>{hasVideo === null ? 'Loading…' : 'Kyle is recording this. It will appear here.'}</span></div>}
      </div>
      <div className="tour-step" key={i}>
        <span className="tour-icon"><Icon name={icon} /></span>
        <h2>{title}</h2><p>{body}</p>
      </div>
      <div className="tour-dots" aria-label={`Step ${i + 1} of ${STEPS.length}`}>{STEPS.map((_, n) => <i key={n} className={n === i ? 'on' : ''} />)}</div>
      <div className="tour-nav">
        <button className="pill-btn dark" disabled={i === 0} style={i === 0 ? { opacity: .35 } : undefined} onClick={() => setI(i - 1)}>Back</button>
        <button className="pill-btn mint" onClick={() => (i < STEPS.length - 1 ? setI(i + 1) : done())}>{i < STEPS.length - 1 ? 'Next' : 'Done'}</button>
      </div>
    </div>
  );
}
