'use server';

import Anthropic from '@anthropic-ai/sdk';
import { getMe } from '@/lib/auth/session';
import { loadLive } from '@/lib/client/load-live';
import { KAI_SYSTEM, clientContext } from '@/lib/kai/prompt';
import { HANDOFF_TEXT, triage } from '@/lib/kai/triage';
import { createClient } from '@/lib/supabase/server';

export type KaiReply = { to: 'kai' | 'coach' | 'urgent' | 'off'; answer: string };
// The cheapest current model: plenty for short training and food questions.
const MODEL = 'claude-haiku-5-5';
// In memory per server instance: a guard against runaway use, not billing.
const recent = new Map<string, number[]>();
const LIMIT_PER_HOUR = 20;

// A client asks KAI something. The safety check runs first; anything about
// pain, health or changing the plan goes to Kyle and never reaches the AI.
export async function askKai(question: string, history: { q: string; a: string }[]): Promise<KaiReply> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'client' || !me.orgId) return { to: 'off', answer: 'KAI isn’t available here.' };
  const q = question.trim().slice(0, 500);
  if (!q) return { to: 'off', answer: 'Ask me something first.' };
  const sb = await createClient();

  const r = triage(q);
  if (r.to !== 'kai') {
    await sb.from('messages').insert({ org_id: me.orgId, client_id: me.id, sender_id: me.id, sender_kind: 'client',
      body: `${r.to === 'urgent' ? 'URGENT. ' : ''}I asked KAI: “${q}”. It passed this to you.` });
    return { to: r.to, answer: r.to === 'urgent' ? HANDOFF_TEXT.urgent : HANDOFF_TEXT[r.reason] };
  }

  if (!process.env.ANTHROPIC_API_KEY) return { to: 'off', answer: 'KAI isn’t switched on yet. Kyle can see this question, or message him directly.' };
  const times = (recent.get(me.id) ?? []).filter(t => Date.now() - t < 3600000);
  if (times.length >= LIMIT_PER_HOUR) return { to: 'off', answer: 'That’s a lot of questions for one hour. Have a break and try again soon, or message Kyle.' };
  recent.set(me.id, [...times, Date.now()]);

  // Their plan and logs only with their permission; never health answers.
  const { data: consent } = await sb.from('current_consents').select('granted').eq('client_id', me.id).eq('kind', 'ai_assistant').maybeSingle();
  const allowed = !!consent?.granted;
  const live = allowed ? await loadLive(sb, { id: me.id, orgId: me.orgId }) : null;
  const first = me.name.split(' ')[0];

  const messages: Anthropic.MessageParam[] = [];
  for (const h of history.slice(-6)) messages.push({ role: 'user', content: h.q.slice(0, 500) }, { role: 'assistant', content: h.a.slice(0, 2000) });
  messages.push({ role: 'user', content: q });

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: KAI_SYSTEM, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: clientContext(first, live, allowed) },
      ],
      messages,
    });
    if (res.stop_reason === 'refusal') return { to: 'kai', answer: 'I can’t help with that one. Kyle can, so message him.' };
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('\n').trim();
    return { to: 'kai', answer: text || 'Sorry, I didn’t get an answer for that. Try asking another way, or message Kyle.' };
  } catch (e) {
    console.error('kai: request failed', e instanceof Anthropic.APIError ? { status: e.status, message: e.message } : e);
    if (e instanceof Anthropic.RateLimitError) return { to: 'off', answer: 'KAI is busy right now. Try again in a minute.' };
    if (e instanceof Anthropic.AuthenticationError) return { to: 'off', answer: 'KAI isn’t set up properly yet. Kyle has been told.' };
    return { to: 'off', answer: 'KAI couldn’t answer just now. Try again in a minute, or message Kyle.' };
  }
}

// The client lets KAI use their plan and logs (or stops it).
export async function setKaiConsent(granted: boolean): Promise<string | null> {
  const me = await getMe();
  if (!me || me.demo || me.role !== 'client' || !me.orgId) return null;
  const { error } = await (await createClient()).from('consents').insert({ org_id: me.orgId, client_id: me.id, kind: 'ai_assistant', granted, document_version: 'kdpt-2026-11' });
  return error ? 'Couldn’t save that. Try again.' : null;
}
