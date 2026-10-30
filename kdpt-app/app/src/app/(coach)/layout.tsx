import { requireArea } from '@/lib/auth/session';

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  await requireArea('coach');
  return children;
}
