import { describe, expect, it } from 'vitest';
import { liftedLike } from './lifted';

describe('lifted like', () => {
  it('picks the biggest animal there are at least 2 of', () => {
    expect(liftedLike(3120)?.words).toBe('2 hippos');
    expect(liftedLike(500)?.words).toBe('5 giant pandas');
    expect(liftedLike(8420)?.words).toBe('5½ hippos');
    expect(liftedLike(14000)?.words).toBe('2 African elephants');
    expect(liftedLike(250000)?.words).toBe('2½ blue whales');
  });
  it('rounds down to a half below 10, to a whole number above', () => {
    expect(liftedLike(1199)?.words).toBe('2½ polar bears'); // 2.66
    expect(liftedLike(19)?.words).toBe('4 cats'); // 4.2
    expect(liftedLike(5)?.words).toBe('5 hedgehogs');
  });
  it('says nothing for a bodyweight-only session', () => {
    expect(liftedLike(0)).toBeNull();
    expect(liftedLike(NaN)).toBeNull();
  });
});
