// Messages between Kyle and one client, as both apps show them.
export type Msg = { id: string; client_id: string; sender_kind: 'client' | 'coach' | 'assistant' | 'system'; body: string; created_at: string; read_by_coach_at?: string | null; read_by_client_at?: string | null; failed?: boolean };
export const MAX_MESSAGE = 4000;

// "Today", "Yesterday" or a date, for the stamp above each day's messages.
export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso), a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((b - a) / 86400000);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
// Messages grouped under day stamps, oldest first.
export function byDay(msgs: Msg[]): [string, Msg[]][] {
  const out: [string, Msg[]][] = [];
  for (const m of [...msgs].sort((x, y) => x.created_at.localeCompare(y.created_at))) {
    const k = dayLabel(m.created_at);
    if (out.length && out[out.length - 1][0] === k) out[out.length - 1][1].push(m); else out.push([k, [m]]);
  }
  return out;
}
