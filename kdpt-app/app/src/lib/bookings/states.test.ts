import { describe, expect, it } from 'vitest';
import { isUpcoming, shownState } from './states';

describe('booking states', () => {
  it('reads held as waiting for the client, and a pending change over anything live', () => {
    expect(shownState({ status: 'held' }, false)).toBe('awaiting_client');
    expect(shownState({ status: 'held' }, true)).toBe('change_requested');
    expect(shownState({ status: 'confirmed' }, true)).toBe('change_requested');
    expect(shownState({ status: 'confirmed' }, false)).toBe('confirmed');
    expect(shownState({ status: 'late_cancelled' }, false)).toBe('late_cancelled');
  });
  it('knows what is still coming up', () => {
    expect(isUpcoming('confirmed')).toBe(true);
    expect(isUpcoming('cancelled')).toBe(false);
  });
});
