// What a booking means to people, from its status and any open change request.
export type BookingRow = { id: string; client_id: string; starts_at: string; ends_at: string; status: string; location_id: string; counts_against_allowance?: boolean };
export type ChangeRow = { id: string; booking_id: string; requested_starts_at: string; client_note: string | null; status: string };
export type Shown = 'awaiting_client' | 'change_requested' | 'confirmed' | 'cancelled' | 'late_cancelled' | 'completed' | 'no_show';

export function shownState(b: Pick<BookingRow, 'status'>, pending: boolean): Shown {
  if (b.status === 'held') return pending ? 'change_requested' : 'awaiting_client';
  if (b.status === 'confirmed') return pending ? 'change_requested' : 'confirmed';
  return b.status as Shown;
}
// [label, colour] for the coach and the client.
export const COACH_LABEL: Record<Shown, [string, 'amber' | 'mint' | 'violet' | 'grey' | 'coral']> = {
  awaiting_client: ['Waiting for them', 'amber'], change_requested: ['Change asked for', 'violet'], confirmed: ['Confirmed', 'mint'],
  cancelled: ['Cancelled', 'grey'], late_cancelled: ['Late cancel (counts)', 'coral'], completed: ['Done', 'grey'], no_show: ['No-show', 'coral'],
};
export const CLIENT_LABEL: Record<Shown, [string, 'ok' | 'wait' | 'bad' | '']> = {
  awaiting_client: ['Please confirm', 'wait'], change_requested: ['Waiting for Kyle', 'wait'], confirmed: ['Confirmed', 'ok'],
  cancelled: ['Cancelled', ''], late_cancelled: ['Cancelled late', 'bad'], completed: ['Done', ''], no_show: ['Missed', 'bad'],
};
export const isUpcoming = (s: Shown) => s === 'awaiting_client' || s === 'change_requested' || s === 'confirmed';
