import { describe, expect, it, vi } from 'vitest';

// The store talks to the browser; only the merge rule is tested here.
vi.mock('./sync', () => ({ queueSave: () => {} }));
const { pickNewest } = await import('./store');

describe('pickNewest', () => {
  it('uses the database copy when it was changed later (e.g. on another phone)', () => {
    expect(pickNewest({ savedAt: 1, v: 'phone' }, { savedAt: 2, v: 'db' })).toMatchObject({ v: 'db' });
  });
  it('keeps the phone copy when it is newer (logged offline, not sent yet)', () => {
    expect(pickNewest({ savedAt: 3, v: 'phone' }, { savedAt: 2, v: 'db' })).toMatchObject({ v: 'phone' });
  });
  it('handles a missing copy on either side', () => {
    expect(pickNewest(null, { savedAt: 1 })).toEqual({ savedAt: 1 });
    expect(pickNewest({ savedAt: 1 }, null)).toEqual({ savedAt: 1 });
    expect(pickNewest(null, null)).toBeNull();
  });
  it('prefers the phone on a tie', () => {
    expect(pickNewest({ savedAt: 5, v: 'phone' }, { savedAt: 5, v: 'db' })).toMatchObject({ v: 'phone' });
  });
});
