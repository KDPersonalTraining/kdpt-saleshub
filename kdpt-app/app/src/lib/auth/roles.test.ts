import { describe, expect, it } from 'vitest';
import { canAccess, homeFor, isPublicPath } from './roles';

describe('roles', () => {
  it('sends each role to its own area', () => {
    expect(homeFor('client')).toBe('/home');
    expect(homeFor('coach')).toBe('/coach');
    expect(homeFor('assistant_coach')).toBe('/coach');
  });
  it('keeps clients out of the coach area and staff out of the client area', () => {
    expect(canAccess('client', 'coach')).toBe(false);
    expect(canAccess('client', 'client')).toBe(true);
    expect(canAccess('coach', 'coach')).toBe(true);
    expect(canAccess('assistant_coach', 'coach')).toBe(true);
    expect(canAccess('coach', 'client')).toBe(false);
  });
  it('only lets signed-out people reach sign-in', () => {
    expect(isPublicPath('/sign-in')).toBe(true);
    expect(isPublicPath('/sign-in/help')).toBe(true);
    expect(isPublicPath('/sign-inx')).toBe(false);
    expect(isPublicPath('/coach')).toBe(false);
  });
});
