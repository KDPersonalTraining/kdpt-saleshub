'use server';

import { getMe } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export type OnboardingAnswers = {
  parq: (boolean | null)[]; injuries: string; goal: string; days: number; freq: string; day: string;
  consent: Record<string, boolean>;
};

const CONSENT_KINDS: Record<string, string> = { terms: 'terms', health: 'health_data', photos: 'progress_photos', kai: 'ai_assistant', email: 'marketing_email' };
const DOCS = 'kdpt-2026-11';

// Saves a new client's sign-up: health answers (the coach reads them before
// the first session) and a consent record for each choice. Demo mode keeps
// everything on the phone instead.
export async function submitOnboarding(a: OnboardingAnswers): Promise<{ ok: boolean; error?: string }> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'client' || !me.orgId) return { ok: true };
  if (a.parq.length < 7 || a.parq.some(x => x === null || x === undefined)) return { ok: false, error: 'Please answer every health question.' };
  if (!a.consent.terms || !a.consent.health) return { ok: false, error: 'The terms and health information are needed to coach you.' };
  const supabase = await createClient();
  const { error: e1 } = await supabase.from('onboarding_responses').insert({
    org_id: me.orgId, client_id: me.id, questionnaire_version: 'parq-2026-11',
    answers: { parq: a.parq, injuries: a.injuries.slice(0, 2000), goal: a.goal, days: a.days, check_in: { freq: a.freq, day: a.day } },
  });
  if (e1) return { ok: false, error: 'Couldn’t save your answers. Check your signal and try again.' };
  const rows = Object.entries(CONSENT_KINDS).map(([k, kind]) => ({ org_id: me.orgId, client_id: me.id, kind, granted: !!a.consent[k], document_version: DOCS }));
  rows.push({ org_id: me.orgId, client_id: me.id, kind: 'privacy_notice', granted: true, document_version: DOCS });
  const { error: e2 } = await supabase.from('consents').insert(rows);
  if (e2) return { ok: false, error: 'Couldn’t save your choices. Check your signal and try again.' };
  return { ok: true };
}
