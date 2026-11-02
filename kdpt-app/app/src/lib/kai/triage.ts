// The first thing that happens to every question for KAI, before any AI sees
// it. Anything about pain, injury, medical matters or changing the plan goes
// to the coach; KAI never diagnoses or changes a programme.

export type Route =
  | { to: 'urgent'; reason: string }   // possible emergency: tell them to get help now
  | { to: 'coach'; reason: 'pain' | 'medical' | 'plan' }
  | { to: 'kai' };

const URGENT = /\b(chest (pain|tight)|can'?t breathe|struggling to breathe|faint(ed|ing)?|passed out|collapse[d]?|numb(ness)? (in|down) (my )?(arm|face))\b/i;
const MEDICAL = /\b(dizz(y|iness)|heart|blood pressure|pregnan(t|cy)|medication|meds|tablets|diabet(es|ic)|asthma|surgery|operation|doctor|gp|physio|concussion|eating disorder|period)\b/i;
const PAIN = /\b(pain(ful)?|hurts?|hurting|injur(y|ed|ies)|ache?s?|aching|swollen|swelling|sprain(ed)?|strain(ed)?|tweak(ed)?|pulled|twinge|niggle|clicking|popped|throbbing)\b/i;
const PLAN = /\b(change|swap|replace|drop|stop|skip|cut|reduce|increase|add) (my |the )?(programme|program|plan|workouts?|sessions?|targets?|calories|macros)\b|\b(new|different) (programme|program|plan)\b|\bcancel\b/i;

export function triage(text: string): Route {
  if (URGENT.test(text)) return { to: 'urgent', reason: 'Possible emergency' };
  if (MEDICAL.test(text)) return { to: 'coach', reason: 'medical' };
  if (PAIN.test(text)) return { to: 'coach', reason: 'pain' };
  if (PLAN.test(text)) return { to: 'coach', reason: 'plan' };
  return { to: 'kai' };
}

// What KAI may read to answer. Without the client's consent it only gives
// general guidance and never sees their plan, logs or health answers.
export function kaiContext(consented: boolean) {
  return consented
    ? { plan: true, logs: true, approvedSwaps: true, nutritionTargets: true, healthAnswers: false, photos: false }
    : { plan: false, logs: false, approvedSwaps: false, nutritionTargets: false, healthAnswers: false, photos: false };
}

export const HANDOFF_TEXT = {
  urgent: 'This could be serious. Stop exercising now. If you have chest pain, trouble breathing or you\'ve fainted, call 999. I\'ve also told your coach.',
  pain: 'Pain is something your coach needs to look at, so I\'ve passed this on instead of guessing. Until they reply, skip anything that hurts and use "I have pain" in your workout if it flares up.',
  medical: 'That\'s a medical question, so I\'ve passed it to your coach rather than guess. For anything urgent, contact your GP or call 111.',
  plan: 'Changes to your plan are your coach\'s call, so I\'ve passed this on. They\'ll reply in your messages.',
};
