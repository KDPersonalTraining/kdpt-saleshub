// Matches the user_role enum in the database.
export type Role = 'client' | 'coach' | 'assistant_coach';
export type Area = 'client' | 'coach';

export const isStaff = (role: Role) => role === 'coach' || role === 'assistant_coach';

export const homeFor = (role: Role) => (isStaff(role) ? '/coach' : '/home');

export const canAccess = (role: Role, area: Area) => (area === 'coach' ? isStaff(role) : role === 'client');

// Paths anyone can open without signing in.
export const PUBLIC_PATHS = ['/sign-in'];
export const isPublicPath = (path: string) => PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
